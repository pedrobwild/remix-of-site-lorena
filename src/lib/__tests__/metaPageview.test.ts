/**
 * Regras puras da edge function `meta-pageview`
 * (supabase/functions/_shared/meta-pageview.ts): validação estrita do corpo,
 * filtro de bots, chave de desligamento, CORS por origem, IP da borda e o
 * evento que vai à Meta com `allowIpUaOnly`.
 */
import { describe, expect, it, vi } from "vitest";
import {
  buildPageviewEvent,
  clientCountryFrom,
  clientIpFrom,
  corsHeadersFor,
  isAdminPath,
  isAllowedOrigin,
  isBotUserAgent,
  normalizeSiteUrl,
  pageviewCapiEnabled,
  parsePageviewRequest,
} from "../../../supabase/functions/_shared/meta-pageview";
import { buildEventPayload, sendMetaEvents } from "../../../supabase/functions/_shared/meta-capi";

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";

const valid = {
  event: "ViewContent",
  event_id: "6f1c2a0e-2d6b-4e0a-9f0c-0a1b2c3d4e5f",
  url: "https://bewild.com.br/portfolio/studio-a?utm_source=meta&utm_campaign=x&email=ana@ex.com#galeria",
  fbp: "fb.1.1700000000000.123456789",
  fbc: "fb.1.1700000000000.AbC_dEf",
  content_type: "product",
  content_ids: ["studio-a"],
  content_category: "projeto",
  content_name: "Studio A",
};

describe("parsePageviewRequest", () => {
  it("aceita o payload do site, limpa a URL (sem fragmento, só parâmetros de campanha) e mantém fbp/fbc válidos", () => {
    const r = parsePageviewRequest(valid);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toEqual({
      event: "ViewContent",
      eventId: valid.event_id,
      url: "https://bewild.com.br/portfolio/studio-a?utm_source=meta&utm_campaign=x",
      path: "/portfolio/studio-a",
      fbp: valid.fbp,
      fbc: valid.fbc,
      contentName: "Studio A",
      contentType: "product",
      contentCategory: "projeto",
      contentIds: ["studio-a"],
    });
  });

  it("PageView mínimo: só event, event_id e url", () => {
    const r = parsePageviewRequest({ event: "PageView", event_id: "ev-1", url: "https://www.bewild.com.br/" });
    expect(r).toMatchObject({ ok: true, value: { event: "PageView", url: "https://bewild.com.br/", path: "/", fbp: null, fbc: null, contentIds: null } });
  });

  it("rejeita evento fora da lista, event_id inválido e corpo que não é objeto", () => {
    expect(parsePageviewRequest({ ...valid, event: "Lead" })).toEqual({ ok: false, error: "invalid_event" });
    expect(parsePageviewRequest({ ...valid, event: "Purchase" })).toEqual({ ok: false, error: "invalid_event" });
    expect(parsePageviewRequest({ ...valid, event_id: "" })).toEqual({ ok: false, error: "invalid_event_id" });
    expect(parsePageviewRequest({ ...valid, event_id: "x".repeat(65) })).toEqual({ ok: false, error: "invalid_event_id" });
    expect(parsePageviewRequest({ ...valid, event_id: "tem espaço" })).toEqual({ ok: false, error: "invalid_event_id" });
    expect(parsePageviewRequest(null)).toEqual({ ok: false, error: "invalid_body" });
    expect(parsePageviewRequest([valid])).toEqual({ ok: false, error: "invalid_body" });
    expect(parsePageviewRequest("x")).toEqual({ ok: false, error: "invalid_body" });
  });

  it("rejeita URL de outro host, sem https ou relativa", () => {
    for (const url of [
      "https://evil.example/portfolio",
      "https://bewild.com.br.evil.example/",
      "http://bewild.com.br/",
      "/portfolio/studio-a",
      "javascript:alert(1)",
      "",
      42,
    ]) {
      expect(parsePageviewRequest({ ...valid, url })).toEqual({ ok: false, error: "invalid_url" });
    }
  });

  it("fbp/fbc fora do formato são ignorados (não invalidam a visita)", () => {
    const r = parsePageviewRequest({ ...valid, fbp: "lixo", fbc: 123 });
    expect(r).toMatchObject({ ok: true, value: { fbp: null, fbc: null } });
  });

  it("campos de conteúdo com teto e formato; fora disso é 400", () => {
    expect(parsePageviewRequest({ ...valid, content_name: "x".repeat(201) })).toEqual({ ok: false, error: "invalid_content" });
    expect(parsePageviewRequest({ ...valid, content_name: 5 })).toEqual({ ok: false, error: "invalid_content" });
    expect(parsePageviewRequest({ ...valid, content_type: "Pro duct" })).toEqual({ ok: false, error: "invalid_content" });
    expect(parsePageviewRequest({ ...valid, content_ids: Array(11).fill("a") })).toEqual({ ok: false, error: "invalid_content" });
    expect(parsePageviewRequest({ ...valid, content_ids: "studio-a" })).toEqual({ ok: false, error: "invalid_content" });
    expect(parsePageviewRequest({ ...valid, content_ids: ["ok", "<script>"] })).toEqual({ ok: false, error: "invalid_content" });
    expect(parsePageviewRequest({ ...valid, content_ids: [] })).toMatchObject({ ok: true, value: { contentIds: null } });
    expect(parsePageviewRequest({ ...valid, content_name: "", content_type: null })).toMatchObject({
      ok: true,
      value: { contentName: null, contentType: null },
    });
  });
});

describe("normalizeSiteUrl / isAdminPath", () => {
  it("normaliza www para a raiz e remove parâmetros privados", () => {
    expect(normalizeSiteUrl("https://www.bewild.com.br/orcamento?gclid=1&nome=Ana&fbclid=2")).toEqual({
      url: "https://bewild.com.br/orcamento?gclid=1&fbclid=2",
      path: "/orcamento",
    });
    expect(normalizeSiteUrl("https://bewild.com.br/x".padEnd(3000, "a"))).toBeNull();
  });
  it("/admin e /admin/* são do painel", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/leads")).toBe(true);
    expect(isAdminPath("/administracao")).toBe(false);
    expect(isAdminPath("/")).toBe(false);
  });
});

describe("isBotUserAgent", () => {
  it("pega robôs, previews de link, headless e ferramentas de teste; navegador real passa", () => {
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "WhatsApp/2.23.20.0",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0 Safari/537.36",
      "Mozilla/5.0 ... Chrome-Lighthouse",
      "curl/8.4.0",
      "python-requests/2.31",
      "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
      "",
      null,
    ]) {
      expect(isBotUserAgent(ua), String(ua)).toBe(true);
    }
    expect(isBotUserAgent(UA)).toBe(false);
    expect(isBotUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36")).toBe(false);
  });
});

describe("pageviewCapiEnabled (META_CAPI_PAGEVIEW_ENABLED)", () => {
  const env = (v: string | undefined) => () => v;
  it("ausente/true/1 = ligado; false/0 = desligado; valor estranho = ligado", () => {
    expect(pageviewCapiEnabled(env(undefined))).toBe(true);
    expect(pageviewCapiEnabled(env(""))).toBe(true);
    expect(pageviewCapiEnabled(env("true"))).toBe(true);
    expect(pageviewCapiEnabled(env("1"))).toBe(true);
    expect(pageviewCapiEnabled(env("false"))).toBe(false);
    expect(pageviewCapiEnabled(env("FALSE "))).toBe(false);
    expect(pageviewCapiEnabled(env("0"))).toBe(false);
    expect(pageviewCapiEnabled(env("off"))).toBe(false);
    expect(pageviewCapiEnabled(env("talvez"))).toBe(true);
  });
});

describe("CORS por origem", () => {
  it("site, site antigo, localhost e previews entram; o resto fica sem Allow-Origin", () => {
    for (const o of [
      "https://bewild.com.br",
      "https://www.bewild.com.br",
      "https://bwild.com.br",
      "http://localhost:3000",
      "http://127.0.0.1:8080",
      "https://bewild.lovable.app",
      "https://id-preview--abc.lovable.app",
      "https://remix-of-site-lorena-git-x.vercel.app",
    ]) {
      expect(isAllowedOrigin(o), o).toBe(true);
      expect(corsHeadersFor(o)["Access-Control-Allow-Origin"]).toBe(o);
    }
    for (const o of ["https://evil.example", "https://bewild.com.br.evil.example", "http://bewild.com.br", null, ""]) {
      expect(isAllowedOrigin(o), String(o)).toBe(false);
      const h = corsHeadersFor(o);
      expect(h).not.toHaveProperty("Access-Control-Allow-Origin");
      expect(h.Vary).toBe("Origin");
    }
  });
});

describe("IP e país da borda", () => {
  const headers = (h: Record<string, string>) => ({ get: (n: string) => h[n.toLowerCase()] ?? null });
  it("cf-connecting-ip > x-real-ip > primeiro do x-forwarded-for", () => {
    expect(clientIpFrom(headers({ "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "9.9.9.9, 2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIpFrom(headers({ "x-real-ip": " 3.3.3.3 " }))).toBe("3.3.3.3");
    expect(clientIpFrom(headers({ "x-forwarded-for": "9.9.9.9, 2.2.2.2" }))).toBe("9.9.9.9");
    expect(clientIpFrom(headers({}))).toBeNull();
  });
  it("país ISO-2 em minúsculas; fora disso null", () => {
    expect(clientCountryFrom(headers({ "cf-ipcountry": "BR" }))).toBe("br");
    expect(clientCountryFrom(headers({ "x-vercel-ip-country": "us" }))).toBe("us");
    expect(clientCountryFrom(headers({ "cf-ipcountry": "XX1" }))).toBeNull();
    expect(clientCountryFrom(headers({}))).toBeNull();
  });
});

describe("buildPageviewEvent + sendMetaEvents com allowIpUaOnly", () => {
  const parsed = parsePageviewRequest({ event: "PageView", event_id: "ev-page-1", url: "https://bewild.com.br/faq" });
  const request = parsed.ok ? parsed.value : (undefined as never);

  it("evento website com o event_id do navegador, URL limpa e só IP + UA no user_data", async () => {
    const ev = buildPageviewEvent(request, { ip: "200.1.2.3", userAgent: UA, country: null }, new Date("2026-10-27T12:00:00Z"));
    expect(ev).toMatchObject({
      eventName: "PageView",
      eventId: "ev-page-1",
      eventTime: 1793102400,
      actionSource: "website",
      eventSourceUrl: "https://bewild.com.br/faq",
    });
    const payload = await buildEventPayload(ev);
    expect(payload.user_data).toEqual({ client_ip_address: "200.1.2.3", client_user_agent: UA });
    expect(payload).not.toHaveProperty("custom_data");
  });

  it("ViewContent leva content_* em custom_data (content_ids como lista) e fbp/fbc quando vieram", async () => {
    const r = parsePageviewRequest(valid);
    if (!r.ok) throw new Error(r.error);
    const payload = await buildEventPayload(buildPageviewEvent(r.value, { ip: "200.1.2.3", userAgent: UA, country: "br" }));
    expect(payload.custom_data).toEqual({
      content_name: "Studio A",
      content_type: "product",
      content_category: "projeto",
      content_ids: ["studio-a"],
    });
    expect(payload.user_data).toMatchObject({ fbp: valid.fbp, fbc: valid.fbc, client_ip_address: "200.1.2.3" });
    expect(payload.user_data.country).toHaveLength(1);
  });

  it("sendMetaEvents envia com allowIpUaOnly e pula sem a opção (regra dos leads preservada)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ events_received: 1, fbtrace_id: "t1" }), { status: 200 }));
    const config = { pixelId: "644216424824915", accessToken: "EAAtoken", fetchImpl };
    const ev = buildPageviewEvent(request, { ip: "200.1.2.3", userAgent: UA });

    expect(await sendMetaEvents(config, [ev])).toEqual({ status: "skipped", reason: "no_user_data" });
    expect(fetchImpl).not.toHaveBeenCalled();

    const sent = await sendMetaEvents(config, [ev], { allowIpUaOnly: true });
    expect(sent).toEqual({ status: "sent", eventsReceived: 1, traceId: "t1", httpStatus: 200 });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://graph.facebook.com/v25.0/644216424824915/events");
    const body = JSON.parse(String(init.body)) as { data: Array<Record<string, unknown>> };
    expect(body.data[0]).toMatchObject({
      event_name: "PageView",
      event_id: "ev-page-1",
      action_source: "website",
      event_source_url: "https://bewild.com.br/faq",
      user_data: { client_ip_address: "200.1.2.3", client_user_agent: UA },
    });
  });

  it("sem IP válido ou sem UA, mesmo com allowIpUaOnly, não envia", async () => {
    const fetchImpl = vi.fn();
    const config = { pixelId: "644216424824915", accessToken: "EAAtoken", fetchImpl };
    const semIp = buildPageviewEvent(request, { ip: "unknown", userAgent: UA });
    expect(await sendMetaEvents(config, [semIp], { allowIpUaOnly: true })).toEqual({ status: "skipped", reason: "no_user_data" });
    const semUa = buildPageviewEvent(request, { ip: "200.1.2.3", userAgent: "" });
    expect(await sendMetaEvents(config, [semUa], { allowIpUaOnly: true })).toEqual({ status: "skipped", reason: "no_user_data" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
