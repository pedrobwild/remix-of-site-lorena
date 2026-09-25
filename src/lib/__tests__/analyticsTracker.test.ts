/**
 * Tracker interno (src/lib/analytics.ts):
 *  - CORE-02: o registro de auditoria do consentimento é mínimo de verdade e
 *    não cria ids persistentes; recusar apaga o que o tracker gravou.
 *  - CORE-03: o flush de `engagement_time` respeita os mesmos gates de
 *    `track()` (DNT, consentimento, /admin) e os listeners saem na recusa.
 *  - CORE-06: âncora (#secao) não gera pageview.
 *  - CORE-17: um evento por clique; `tel:` é `click_phone`, não WhatsApp.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
vi.stubGlobal("fetch", fetchMock);
const beaconMock = vi.fn().mockReturnValue(true);
Object.defineProperty(navigator, "sendBeacon", { value: beaconMock, configurable: true, writable: true });

import { contactEventForHref, initAnalytics, logConsentAudit, readPersistedAttribution } from "@/lib/analytics";
import { setConsent } from "@/lib/cookieConsent";

type Row = Record<string, unknown> & { event_type: string; value?: Record<string, unknown> | null };

const fetchRows = (): Row[] =>
  fetchMock.mock.calls.map(([, init]) => JSON.parse(String((init as RequestInit).body)) as Row);

async function beaconRows(): Promise<Row[]> {
  return Promise.all(
    beaconMock.mock.calls.map(async ([, blob]) => JSON.parse(await (blob as Blob).text()) as Row),
  );
}

const storageKeys = () => ({
  local: Object.keys(window.localStorage),
  session: Object.keys(window.sessionStorage),
});

let cleanup: (() => void) | null = null;
// jsdom não navega: impede a ação padrão dos links clicados nos testes.
const noNavigation = (e: Event) => e.preventDefault();

beforeEach(() => {
  document.addEventListener("click", noNavigation);
  vi.useFakeTimers();
  window.localStorage.clear();
  window.sessionStorage.clear();
  fetchMock.mockClear();
  beaconMock.mockClear();
  document.body.innerHTML = "";
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  document.removeEventListener("click", noNavigation);
  cleanup?.();
  cleanup = null;
  vi.useRealTimers();
  Object.defineProperty(navigator, "doNotTrack", { value: null, configurable: true });
});

describe("logConsentAudit — payload mínimo, sem ids persistentes (CORE-02)", () => {
  it("recusa: só event_type, path e {action, source, ts}; nada gravado no storage", async () => {
    window.history.replaceState({}, "", "/faq?utm_source=google");
    logConsentAudit("declined", "banner");

    expect(fetchMock).not.toHaveBeenCalled();
    const [row] = await beaconRows();
    expect(Object.keys(row).sort()).toEqual(["event_type", "path", "value"]);
    expect(row.event_type).toBe("consent_decline");
    expect(row.path).toBe("/faq");
    expect(Object.keys(row.value ?? {}).sort()).toEqual(["action", "source", "ts"]);
    expect(storageKeys()).toEqual({ local: [], session: [] });
  });

  it("não registra no /admin", () => {
    window.history.replaceState({}, "", "/admin/dashboard");
    logConsentAudit("accepted");
    expect(beaconMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("initAnalytics — ciclo de consentimento", () => {
  it("sem aceite: nenhum evento e nenhum id gravado", () => {
    cleanup = initAnalytics();
    vi.advanceTimersByTime(1000);
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("pagehide"));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(beaconMock).not.toHaveBeenCalled();
    expect(storageKeys()).toEqual({ local: [], session: [] });
  });

  it("aceite → pageview; recusa depois → listeners desligados e storage do tracker apagado", async () => {
    setConsent("accepted");
    cleanup = initAnalytics();
    vi.advanceTimersByTime(300);
    expect(fetchRows().map((r) => r.event_type)).toEqual(["pageview"]);
    expect(window.localStorage.getItem("bewild_vid")).toBeTruthy();
    expect(window.sessionStorage.getItem("bewild_sid")).toBeTruthy();

    vi.advanceTimersByTime(5000); // tempo de engajamento acumulado
    setConsent("declined");
    fetchMock.mockClear();

    // Nada mais sai: nem clique, nem troca de página, nem o flush do pagehide.
    document.body.innerHTML = '<a href="https://wa.me/5511911906183">WhatsApp</a>';
    document.querySelector("a")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    window.history.pushState({}, "", "/portfolio");
    window.dispatchEvent(new Event("lovable:navigate"));
    vi.advanceTimersByTime(300);
    window.dispatchEvent(new Event("pagehide"));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(beaconMock).not.toHaveBeenCalled();
    // Só a chave do próprio consentimento sobrevive.
    expect(storageKeys()).toEqual({ local: ["lal_cookie_consent"], session: [] });
  });

  it("âncora (#secao) não gera pageview; troca de caminho gera", () => {
    setConsent("accepted");
    cleanup = initAnalytics();
    vi.advanceTimersByTime(300);

    window.history.pushState({}, "", "/#certeza");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    vi.advanceTimersByTime(300);
    expect(fetchRows().filter((r) => r.event_type === "pageview")).toHaveLength(1);

    window.history.pushState({}, "", "/faq");
    window.dispatchEvent(new Event("lovable:navigate"));
    vi.advanceTimersByTime(300);
    const views = fetchRows().filter((r) => r.event_type === "pageview");
    expect(views.map((r) => r.path)).toEqual(["/", "/faq"]);
  });
});

describe("clique de anúncio (gclid/fbclid) para atribuir o lead", () => {
  it("com aceite, guarda gclid/fbclid da URL e devolve com o instante do fbclid", () => {
    window.history.replaceState({}, "", "/?gclid=Cj0abc_1&fbclid=IwAR3xyz");
    setConsent("accepted");
    cleanup = initAnalytics();
    vi.advanceTimersByTime(300);
    const stored = JSON.parse(window.localStorage.getItem("bewild_click") ?? "{}");
    expect(stored).toMatchObject({ gclid: "Cj0abc_1", fbclid: "IwAR3xyz" });
    const click = readPersistedAttribution().clickIds;
    expect(click).toEqual({ gclid: "Cj0abc_1", fbclid: "IwAR3xyz", fbclidSeenAt: stored.fbclid_ts });

    // Navegação sem parâmetro não apaga; 90 dias depois, não vale mais.
    window.history.pushState({}, "", "/faq");
    window.dispatchEvent(new Event("lovable:navigate"));
    vi.advanceTimersByTime(300);
    expect(readPersistedAttribution().clickIds?.gclid).toBe("Cj0abc_1");
    expect(readPersistedAttribution(Date.now() + 91 * 86_400_000).clickIds).toBeNull();
  });

  it("sem aceite nada é guardado; recusa depois apaga", () => {
    window.history.replaceState({}, "", "/?gclid=Cj0abc");
    cleanup = initAnalytics();
    vi.advanceTimersByTime(300);
    expect(window.localStorage.getItem("bewild_click")).toBeNull();

    setConsent("accepted");
    vi.advanceTimersByTime(300);
    expect(window.localStorage.getItem("bewild_click")).not.toBeNull();
    setConsent("declined");
    expect(window.localStorage.getItem("bewild_click")).toBeNull();
  });
});

describe("engagement_time — mesmos gates de track() (CORE-03)", () => {
  it("com aceite, o pagehide envia o tempo engajado por beacon", async () => {
    setConsent("accepted");
    cleanup = initAnalytics();
    vi.advanceTimersByTime(300);
    vi.advanceTimersByTime(4000);
    window.dispatchEvent(new Event("pagehide"));
    const rows = await beaconRows();
    expect(rows.map((r) => r.event_type)).toEqual(["engagement_time"]);
  });

  it("com Do-Not-Track ligado depois do aceite, o flush não sai", () => {
    setConsent("accepted");
    cleanup = initAnalytics();
    vi.advanceTimersByTime(4300);
    Object.defineProperty(navigator, "doNotTrack", { value: "1", configurable: true });
    window.dispatchEvent(new Event("pagehide"));
    expect(beaconMock).not.toHaveBeenCalled();
  });

  it("tempo acumulado numa rota /admin não é enviado", () => {
    setConsent("accepted");
    window.history.replaceState({}, "", "/admin/leads");
    cleanup = initAnalytics();
    vi.advanceTimersByTime(4300);
    window.dispatchEvent(new Event("pagehide"));
    expect(beaconMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("cliques — um evento por clique (CORE-17)", () => {
  function clickRows(html: string): Row[] {
    document.body.innerHTML = html;
    fetchMock.mockClear();
    document.querySelector("a,button")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    return fetchRows();
  }

  beforeEach(() => {
    setConsent("accepted");
    cleanup = initAnalytics();
    vi.advanceTimersByTime(300);
  });

  it("wa.me → só click_whatsapp (não também outbound_click)", () => {
    const rows = clickRows('<a href="https://wa.me/5511911906183?text=oi" data-cta="hero">Fale</a>');
    expect(rows.map((r) => r.event_type)).toEqual(["click_whatsapp"]);
    expect(rows[0].value).toMatchObject({ channel: "whatsapp", cta: "hero" });
  });

  it("tel: → click_phone, não click_whatsapp", () => {
    const rows = clickRows('<a href="tel:+5511911906183">Ligar</a>');
    expect(rows.map((r) => r.event_type)).toEqual(["click_phone"]);
    expect(rows[0].value).toMatchObject({ channel: "phone" });
  });

  it("link externo comum → outbound_click", () => {
    const rows = clickRows('<a href="https://www.instagram.com/bewild.oficial/">IG</a>');
    expect(rows.map((r) => r.event_type)).toEqual(["outbound_click"]);
  });

  it("clique sintético no próprio document não lança (FE-01)", () => {
    expect(() => document.dispatchEvent(new MouseEvent("click", { bubbles: true }))).not.toThrow();
  });
});

describe("contactEventForHref", () => {
  it.each([
    ["https://wa.me/5511911906183", "click_whatsapp"],
    ["https://api.whatsapp.com/send?phone=55", "click_whatsapp"],
    ["whatsapp://send?phone=55", "click_whatsapp"],
    ["tel:+5511911906183", "click_phone"],
    ["mailto:contato@bewild.com.br", "click_contact"],
  ])("%s → %s", (href, type) => {
    expect(contactEventForHref(href)?.type).toBe(type);
  });

  it.each(["https://example.com/wa.me/x", "/contato", "https://instagram.com/bewild"])("%s → null", (href) => {
    expect(contactEventForHref(href)).toBeNull();
  });
});
