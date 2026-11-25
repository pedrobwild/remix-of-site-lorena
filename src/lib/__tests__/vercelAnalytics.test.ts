/**
 * Contador completo de visitas (src/lib/vercelAnalytics.ts, 25/11/2026): o
 * script do Vercel Web Analytics entra em toda página pública de
 * bewild.com.br COM OU SEM aceite de cookies (ele não grava cookie), nunca no
 * /admin, em aparelho do time, em automação, em iframe nem fora do domínio de
 * produção. Antes de cada envio a URL perde tudo que não é `utm_*`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { INTERNAL_TRAFFIC_KEY } from "@/lib/internalTraffic";
import {
  VERCEL_ANALYTICS_DEFAULT_SRC,
  VERCEL_ANALYTICS_HOST,
  canCountVisit,
  installVercelAnalytics,
  vercelAnalyticsBeforeSend,
  vercelAnalyticsConfig,
} from "@/lib/vercelAnalytics";

type FilaVa = { va?: (...args: unknown[]) => void; vaq?: unknown[][] };
const fila = () => window as unknown as FilaVa;
const scripts = () => [...document.head.querySelectorAll<HTMLScriptElement>("script[data-bw-contador]")];
const PROD = { hostname: VERCEL_ANALYTICS_HOST };
const CAMINHO_UNICO = JSON.stringify({
  analytics: { scriptSrc: "/a1b2c3/script.js", viewEndpoint: "/a1b2c3/view", eventEndpoint: "/a1b2c3/event" },
});

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/portfolio");
  for (const s of scripts()) s.remove();
  delete fila().va;
  delete fila().vaq;
});

afterEach(() => {
  for (const s of scripts()) s.remove();
  delete fila().va;
  delete fila().vaq;
});

describe("canCountVisit", () => {
  it("conta em página pública do domínio de produção, sem depender do aceite de cookies", () => {
    expect(window.localStorage.getItem("bewild_cookie_consent_v2")).toBeNull();
    expect(canCountVisit(VERCEL_ANALYTICS_HOST)).toBe(true);
  });

  it("não conta fora do domínio de produção (localhost, prévia da Vercel, Lovable, www)", () => {
    expect(canCountVisit()).toBe(false); // jsdom roda em localhost
    for (const host of ["localhost", "site-git-teste.vercel.app", "bewild.lovable.app", "www.bewild.com.br"]) {
      expect(canCountVisit(host)).toBe(false);
    }
  });

  it("não conta no /admin nem em aparelho marcado como do time", () => {
    window.history.replaceState(null, "", "/admin/orcamentos");
    expect(canCountVisit(VERCEL_ANALYTICS_HOST)).toBe(false);
    window.history.replaceState(null, "", "/portfolio");
    window.localStorage.setItem(INTERNAL_TRAFFIC_KEY, "1");
    expect(canCountVisit(VERCEL_ANALYTICS_HOST)).toBe(false);
  });

  it("não conta em automação (navigator.webdriver) nem dentro de iframe", () => {
    const wd = Object.getOwnPropertyDescriptor(Navigator.prototype, "webdriver");
    Object.defineProperty(navigator, "webdriver", { value: true, configurable: true });
    try {
      expect(canCountVisit(VERCEL_ANALYTICS_HOST)).toBe(false);
    } finally {
      delete (navigator as unknown as Record<string, unknown>).webdriver;
      if (wd) Object.defineProperty(Navigator.prototype, "webdriver", wd);
    }
    const top = Object.getOwnPropertyDescriptor(window, "top")!;
    Object.defineProperty(window, "top", { value: {}, configurable: true });
    try {
      expect(canCountVisit(VERCEL_ANALYTICS_HOST)).toBe(false);
    } finally {
      Object.defineProperty(window, "top", top);
    }
  });
});

describe("vercelAnalyticsConfig", () => {
  it("sem configuração da Vercel usa o caminho fixo", () => {
    expect(vercelAnalyticsConfig(undefined)).toEqual({ scriptSrc: VERCEL_ANALYTICS_DEFAULT_SRC });
    expect(vercelAnalyticsConfig("")).toEqual({ scriptSrc: VERCEL_ANALYTICS_DEFAULT_SRC });
    expect(vercelAnalyticsConfig("{quebrado")).toEqual({ scriptSrc: VERCEL_ANALYTICS_DEFAULT_SRC });
  });

  it("usa o caminho único que a Vercel entrega no build", () => {
    expect(vercelAnalyticsConfig(CAMINHO_UNICO)).toEqual({
      scriptSrc: "/a1b2c3/script.js",
      viewEndpoint: "/a1b2c3/view",
      eventEndpoint: "/a1b2c3/event",
    });
  });

  it("só aceita caminho do próprio site: endereço de outro domínio é ignorado", () => {
    for (const scriptSrc of ["https://outro.example/script.js", "//outro.example/script.js", "script.js", 42]) {
      const conf = JSON.stringify({ analytics: { scriptSrc, viewEndpoint: "https://outro.example/view" } });
      expect(vercelAnalyticsConfig(conf)).toEqual({ scriptSrc: VERCEL_ANALYTICS_DEFAULT_SRC });
    }
  });
});

describe("vercelAnalyticsBeforeSend", () => {
  it("mantém só os parâmetros utm_* e tira identificador de clique, dado pessoal e âncora", () => {
    const enviado = vercelAnalyticsBeforeSend({
      type: "pageview",
      url: "https://bewild.com.br/orcamento?utm_source=google&utm_campaign=studio&gclid=abc&fbclid=def&email=a@b.com&token=x#form",
    });
    expect(enviado).toEqual({
      type: "pageview",
      url: "https://bewild.com.br/orcamento?utm_source=google&utm_campaign=studio",
    });
  });

  it("URL sem parâmetros segue igual", () => {
    const evento = { type: "pageview" as const, url: "https://bewild.com.br/portfolio" };
    expect(vercelAnalyticsBeforeSend(evento)).toEqual(evento);
  });

  it("descarta o evento no /admin (navegação interna depois do script carregado)", () => {
    expect(vercelAnalyticsBeforeSend({ type: "pageview", url: "https://bewild.com.br/admin/orcamentos" })).toBeNull();
    expect(vercelAnalyticsBeforeSend({ type: "pageview", url: "https://bewild.com.br/admin" })).toBeNull();
  });

  it("descarta o evento quando o aparelho foi marcado como do time depois do carregamento", () => {
    window.localStorage.setItem(INTERNAL_TRAFFIC_KEY, "1");
    expect(vercelAnalyticsBeforeSend({ type: "pageview", url: "https://bewild.com.br/portfolio" })).toBeNull();
  });
});

describe("installVercelAnalytics", () => {
  it("fora do domínio de produção não cria fila nem script", () => {
    expect(installVercelAnalytics()).toBe("blocked");
    expect(scripts()).toHaveLength(0);
    expect(fila().va).toBeUndefined();
  });

  it("em produção cria a fila, registra o filtro de URL e carrega o script uma única vez", () => {
    expect(installVercelAnalytics(PROD)).toBe("installed");
    const [script, ...resto] = scripts();
    expect(resto).toHaveLength(0);
    expect(script.getAttribute("src")).toBe(VERCEL_ANALYTICS_DEFAULT_SRC);
    expect(script.defer).toBe(true);
    expect(typeof fila().va).toBe("function");
    expect(fila().vaq).toEqual([["beforeSend", vercelAnalyticsBeforeSend]]);

    expect(installVercelAnalytics(PROD)).toBe("already");
    expect(scripts()).toHaveLength(1);
    expect(fila().vaq).toHaveLength(1);
  });

  it("com o caminho único da Vercel, o script e os destinos saem dele", () => {
    expect(installVercelAnalytics({ ...PROD, confString: CAMINHO_UNICO })).toBe("installed");
    const [script] = scripts();
    expect(script.getAttribute("src")).toBe("/a1b2c3/script.js");
    expect(script.dataset.viewEndpoint).toBe("/a1b2c3/view");
    expect(script.dataset.eventEndpoint).toBe("/a1b2c3/event");
  });

  it("não instala no /admin nem em aparelho do time", () => {
    window.history.replaceState(null, "", "/admin");
    expect(installVercelAnalytics(PROD)).toBe("blocked");
    window.history.replaceState(null, "", "/portfolio");
    window.localStorage.setItem(INTERNAL_TRAFFIC_KEY, "1");
    expect(installVercelAnalytics(PROD)).toBe("blocked");
    expect(scripts()).toHaveLength(0);
    expect(fila().va).toBeUndefined();
  });
});

describe("ligação e transparência", () => {
  const root = path.resolve(__dirname, "../../..");
  const ler = (arquivo: string) => readFileSync(path.join(root, arquivo), "utf8");

  it('o layout raiz chama installVercelAnalytics ("sideEffects": false exige a chamada)', () => {
    expect(ler("src/routes/__root.tsx")).toMatch(/installVercelAnalytics\(\)/);
  });

  it("as políticas de privacidade e de cookies descrevem a contagem sem cookies da Vercel", () => {
    for (const arquivo of [
      "src/pages/PrivacidadePage.tsx",
      "src/pages/PoliticaCookiesPage.tsx",
      "src/pages/PreferenciasCookiesPage.tsx",
    ]) {
      const texto = ler(arquivo).replace(/\s+/g, " ");
      expect(texto, arquivo).toMatch(/Vercel/);
      expect(texto, arquivo).toMatch(/sem (gravar )?cookies/);
    }
  });
});
