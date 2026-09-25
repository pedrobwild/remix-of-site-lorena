/**
 * useSeo — estado do <head> entre rotas e trackers de terceiros.
 *  - CORE-21: nada vaza da rota anterior (keywords, og:image e derivadas);
 *    width/height só quando conhecidos; robots mantém as diretivas de preview.
 *  - CORE-14: JSON-LD do prerender sai quando a SPA publica o dela.
 *  - CORE-25: IDs de tracker validados antes de irem para script inline.
 *  - CORE-18: Meta Pixel com `disablePushState` antes do `init`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";

const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => new Promise(() => {}) }) }) }),
    functions: { invoke: (...a: unknown[]) => invokeMock(...a) },
  },
}));

let remoteSettings: Record<string, unknown> = {};
vi.mock("@/lib/useSiteSettings", async () => {
  const actual = await vi.importActual<typeof import("@/lib/useSiteSettings")>("@/lib/useSiteSettings");
  return {
    ...actual,
    fetchSiteSettings: vi.fn(async () => ({ ...actual.getCachedSiteSettings(), ...remoteSettings })),
  };
});

import {
  DEFAULT_OG_IMAGE,
  hasThirdPartyTrackers,
  refreshSeoEverywhere,
  robotsContent,
  useSeo,
  validTrackerId,
  type SeoInput,
} from "../useSeo";
import { __resetGoogleAds, getGoogleAdsConfig } from "../googleAds";
import { __resetMetaPixelQueue, trackMetaEvent } from "../metaPixel";

const meta = (sel: string) => document.head.querySelector(sel)?.getAttribute("content") ?? null;

function Page(props: SeoInput) {
  useSeo(props);
  return null;
}

beforeEach(() => {
  remoteSettings = {};
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
  document.head.innerHTML = `
    <title>Home</title>
    <meta name="keywords" content="home, reforma" />
    <meta property="og:image" content="https://bewild.com.br/og_final_v2.jpg">
    <meta property="og:image:secure_url" content="https://bewild.com.br/og_final_v2.jpg" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  `;
});

afterEach(() => {
  cleanup();
});

describe("head entre rotas (CORE-21)", () => {
  it("imagem própria da rota: tags derivadas coerentes e sem dimensões inventadas", async () => {
    window.history.replaceState(null, "", "/conteudos/post-a");
    render(
      <Page
        title="Post A | Bewild"
        canonicalPath="/conteudos/post-a"
        ogImage="https://cdn.example.com/capa-a.webp?width=1200"
        keywords="post a"
      />,
    );
    await waitFor(() => expect(meta('meta[property="og:image"]')).toBe("https://cdn.example.com/capa-a.webp?width=1200"));
    expect(meta('meta[property="og:image:secure_url"]')).toBe("https://cdn.example.com/capa-a.webp?width=1200");
    expect(meta('meta[property="og:image:type"]')).toBe("image/webp");
    expect(meta('meta[property="og:image:width"]')).toBeNull();
    expect(meta('meta[property="og:image:height"]')).toBeNull();
    expect(meta('meta[name="twitter:image"]')).toBe("https://cdn.example.com/capa-a.webp?width=1200");
    expect(meta('meta[name="keywords"]')).toBe("post a");
  });

  it("rota seguinte sem imagem/keywords volta ao padrão (nada da rota anterior sobra)", async () => {
    const { rerender } = render(
      <Page title="Post A" canonicalPath="/conteudos/a" ogImage="/capas/a.png" keywords="post a" />,
    );
    // Relativa vira absoluta (og:image exige URL absoluta).
    await waitFor(() => expect(meta('meta[property="og:image"]')).toBe("https://bewild.com.br/capas/a.png"));

    rerender(<Page title="FAQ" canonicalPath="/faq" />);
    await waitFor(() => expect(meta('meta[property="og:image"]')).toBe(DEFAULT_OG_IMAGE.url));
    expect(meta('meta[name="twitter:image"]')).toBe(DEFAULT_OG_IMAGE.url);
    expect(meta('meta[property="og:image:type"]')).toBe("image/jpeg");
    expect(meta('meta[property="og:image:width"]')).toBe("1200");
    expect(meta('meta[property="og:image:height"]')).toBe("630");
    expect(meta('meta[name="keywords"]')).toBeNull();
  });

  it("keywords globais do admin valem quando a rota não traz as suas", async () => {
    remoteSettings = { seo_keywords: "reforma de apartamento" };
    render(<Page title="FAQ" canonicalPath="/faq" />);
    await waitFor(() => expect(meta('meta[name="keywords"]')).toBe("reforma de apartamento"));
  });

  it("robots mantém max-image-preview/max-snippet nas páginas indexáveis", async () => {
    render(<Page title="FAQ" canonicalPath="/faq" />);
    await waitFor(() => expect(meta('meta[name="robots"]')).toMatch(/max-image-preview:large/));
    expect(meta('meta[name="robots"]')).toMatch(/^index, follow/);
    expect(meta('meta[name="robots"]')).toMatch(/max-snippet:-1/);
  });

  it("robotsContent: noindex puro; valor do admin respeitado", () => {
    expect(robotsContent(true, "index, follow")).toBe("noindex, nofollow");
    expect(robotsContent(false, "noindex")).toBe("noindex");
    expect(robotsContent(false, null)).toBe(
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );
  });
});

describe("JSON-LD do prerender (CORE-14)", () => {
  const addPrerender = () => {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.setAttribute("data-prerender", "post");
    s.text = JSON.stringify([{ "@type": "Article" }]);
    document.head.appendChild(s);
  };
  const prerenderCount = () => document.head.querySelectorAll("script[data-prerender]").length;
  const ldTypes = () =>
    Array.from(document.head.querySelectorAll('script[type="application/ld+json"]')).map(
      (n) => (JSON.parse(n.textContent || "{}") as { "@type"?: string })["@type"],
    );

  it("sai quando a SPA publica o JSON-LD dela (sem Article duplicado)", async () => {
    addPrerender();
    render(<Page title="Post" canonicalPath="/" jsonLd={{ "@type": "Article" }} />);
    await waitFor(() => expect(prerenderCount()).toBe(0));
    expect(ldTypes()).toEqual(["Article"]);
  });

  it("com só o breadcrumb de carregamento da SPA, o Article do prerender fica", async () => {
    addPrerender();
    render(<Page title="Post" canonicalPath="/" jsonLd={[{ "@type": "BreadcrumbList" }]} />);
    await waitFor(() => expect(ldTypes()).toContain("BreadcrumbList"));
    expect(prerenderCount()).toBe(1);
  });

  it("não vaza para outra rota, mesmo que ela não tenha JSON-LD", async () => {
    addPrerender();
    window.history.replaceState(null, "", "/faq"); // saiu da URL de entrada
    render(<Page title="FAQ" canonicalPath="/faq" />);
    await waitFor(() => expect(prerenderCount()).toBe(0));
  });

  it("na URL de entrada, sem JSON-LD próprio da SPA, o do prerender fica", async () => {
    addPrerender();
    render(<Page title="Home" canonicalPath="/" />);
    await waitFor(() => expect(document.title).toBe("Home"));
    expect(prerenderCount()).toBe(1);
  });
});

describe("trackers de terceiros (CORE-25 / CORE-18)", () => {
  const script = (id: string) => document.getElementById(id) as HTMLScriptElement | null;

  it("validTrackerId aceita só o formato de cada fornecedor", () => {
    expect(validTrackerId("ga4", " g-ab12cd34 ")).toBe("G-AB12CD34");
    expect(validTrackerId("gtm", "GTM-ABC123")).toBe("GTM-ABC123");
    expect(validTrackerId("metaPixel", "123456789012345")).toBe("123456789012345");
    expect(validTrackerId("clarity", "AbC123xyz")).toBe("abc123xyz");
    expect(validTrackerId("hotjar", "3456789")).toBe("3456789");
    expect(validTrackerId("googleAds", "AW-123456789")).toBe("AW-123456789");

    expect(validTrackerId("hotjar", "1;alert(1)")).toBeNull();
    expect(validTrackerId("metaPixel", "123');alert(1);('")).toBeNull();
    expect(validTrackerId("ga4", "G-X")).toBeNull();
    expect(validTrackerId("gtm", "GTM-AB'+x+'")).toBeNull();
    expect(validTrackerId("clarity", "abc\"def")).toBeNull();
    expect(validTrackerId("ga4", null)).toBeNull();
  });

  it("com aceite: injeta os válidos, pula os malformados; Pixel com disablePushState antes do init", async () => {
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    remoteSettings = {
      meta_pixel_id: "123456789012",
      hotjar_id: "1;alert(document.cookie)",
      clarity_id: "abcdef1234",
      google_tag_manager_id: "GTM-XYZ'+alert(1)+'",
    };
    render(<Page title="FAQ" canonicalPath="/faq" />);
    await waitFor(() => expect(script("meta-pixel")).not.toBeNull());
    expect(script("clarity-loader")).not.toBeNull();
    expect(script("hotjar-loader")).toBeNull();
    expect(script("gtm-loader")).toBeNull();

    const pixel = script("meta-pixel")!.text;
    expect(pixel.indexOf("fbq.disablePushState=true")).toBeGreaterThan(-1);
    expect(pixel.indexOf("fbq.disablePushState=true")).toBeLessThan(pixel.indexOf("fbq('init'"));
    document.head.querySelectorAll("[data-seo-injected]").forEach((n) => n.remove());
  });

  it("GA4 do admin igual ao principal (ga4.ts) não gera segundo config", async () => {
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    remoteSettings = { google_analytics_id: "G-CE7GKKDG4L", clarity_id: "abcdef1234" };
    render(<Page title="FAQ" canonicalPath="/faq" />);
    await waitFor(() => expect(script("clarity-loader")).not.toBeNull());
    expect(script("ga4-config")).toBeNull();
    expect(script("ga4-loader")).toBeNull();
    document.head.querySelectorAll("[data-seo-injected]").forEach((n) => n.remove());
  });

  it("Google Ads: config da conta + rótulos para as conversões; ID inválido não entra", async () => {
    __resetGoogleAds();
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    remoteSettings = {
      google_ads_conversion_id: "aw-123456789",
      google_ads_lead_label: "LeadLabel1",
      google_ads_contact_label: "x",
    };
    render(<Page title="FAQ" canonicalPath="/faq" />);
    await waitFor(() => expect(script("gads-config")).not.toBeNull());
    expect(script("gads-config")!.text).toContain("gtag('config', 'AW-123456789')");
    expect(script("gads-loader")!.src).toBe("https://www.googletagmanager.com/gtag/js?id=AW-123456789");
    expect(getGoogleAdsConfig()).toEqual({ id: "AW-123456789", leadLabel: "LeadLabel1", contactLabel: null });
    expect(hasThirdPartyTrackers()).toBe(true);
    document.head.querySelectorAll("[data-seo-injected]").forEach((n) => n.remove());
    cleanup();

    __resetGoogleAds();
    remoteSettings = { google_ads_conversion_id: "AW-1'+alert(1)+'", clarity_id: "abcdef1234" };
    render(<Page title="FAQ" canonicalPath="/faq" />);
    await waitFor(() => expect(script("clarity-loader")).not.toBeNull());
    expect(script("gads-config")).toBeNull();
    expect(getGoogleAdsConfig()).toBeNull();
    document.head.querySelectorAll("[data-seo-injected]").forEach((n) => n.remove());
  });

  it("Google Ads reaproveita o gtag.js do GA4 quando ele já está na página", async () => {
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    const ga = document.createElement("script");
    ga.src = "https://www.googletagmanager.com/gtag/js?id=G-CE7GKKDG4L";
    document.head.appendChild(ga);
    remoteSettings = { google_ads_conversion_id: "AW-123456789" };
    render(<Page title="FAQ" canonicalPath="/faq" />);
    await waitFor(() => expect(script("gads-config")).not.toBeNull());
    expect(script("gads-loader")).toBeNull();
    document.head.querySelectorAll("[data-seo-injected]").forEach((n) => n.remove());
    ga.remove();
  });

  it("evento do Pixel pedido antes da injeção sai logo depois dela", async () => {
    __resetMetaPixelQueue();
    window.localStorage.setItem("lal_cookie_consent", "accepted");
    expect(trackMetaEvent("ViewContent", { content_ids: ["x"] })).toBe("queued");
    const fbq = vi.fn();
    (window as Window & { fbq?: unknown }).fbq = fbq;
    remoteSettings = { meta_pixel_id: "123456789012" };
    render(<Page title="FAQ" canonicalPath="/faq" />);
    await waitFor(() => expect(script("meta-pixel")).not.toBeNull());
    expect(fbq).toHaveBeenCalledWith("track", "ViewContent", { content_ids: ["x"] });
    delete (window as Window & { fbq?: unknown }).fbq;
    document.head.querySelectorAll("[data-seo-injected]").forEach((n) => n.remove());
  });

  it("sem aceite ou em /admin: nada é injetado", async () => {
    remoteSettings = { meta_pixel_id: "123456789012", clarity_id: "abcdef1234" };
    const { unmount } = render(<Page title="FAQ" canonicalPath="/faq" />);
    await waitFor(() => expect(document.title).toBe("FAQ"));
    await new Promise((r) => setTimeout(r, 0));
    expect(document.head.querySelector("[data-seo-injected]")).toBeNull();
    unmount();

    window.localStorage.setItem("lal_cookie_consent", "accepted");
    window.history.replaceState(null, "", "/admin/leads");
    render(<Page title="Admin" canonicalPath="/admin/leads" />);
    await waitFor(() => expect(document.title).toBe("Admin"));
    await new Promise((r) => setTimeout(r, 0));
    expect(document.head.querySelector("[data-seo-injected]")).toBeNull();
  });
});

describe("refreshSeoEverywhere — ping-sitemap autenticado", () => {
  beforeEach(() => invokeMock.mockReset());

  it("usa functions.invoke (JWT do admin), não fetch anônimo", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    invokeMock.mockResolvedValue({ data: { ok: true, results: [{ name: "google", ok: true }] }, error: null });
    const r = await refreshSeoEverywhere({ pingSearchEngines: true });
    expect(invokeMock).toHaveBeenCalledWith("ping-sitemap", { body: {} });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(r).toEqual({ ok: true, ping: { ok: true, results: [{ name: "google", ok: true }] } });
    fetchSpy.mockRestore();
  });

  it("erro da função (ex.: 401 sem admin) → ping.ok false", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: "unauthorized" } });
    await expect(refreshSeoEverywhere({ pingSearchEngines: true })).resolves.toEqual({
      ok: true,
      ping: { ok: false },
    });
  });

  it("sem pingSearchEngines não chama a função", async () => {
    await expect(refreshSeoEverywhere()).resolves.toEqual({ ok: true });
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
