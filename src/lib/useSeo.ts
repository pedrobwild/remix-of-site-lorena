import { useEffect, useMemo } from "react";
import {
  fetchSiteSettings,
  getCachedSiteSettings,
  invalidateSiteSettings,
  type SiteSettings,
} from "./useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { isConsentAccepted, onConsentChange } from "./cookieConsent";
import { GA4_MEASUREMENT_ID } from "./ga4";
import { devWarn } from "./devLog";
import { pageSeoOverride } from "./publicPages";

export const SEO_REFRESH_EVENT = "seo:refresh";
/** Disparado sempre que uma página aplica o próprio <head> (ver `isSeoAppliedFor`). */
export const SEO_APPLIED_EVENT = "seo:applied";

export type SeoInput = {
  title?: string;
  description?: string;
  canonicalPath?: string; // ex: "/portfolio" ou "/projeto/casa-paineira"
  ogImage?: string;
  /** Título só do Open Graph/Twitter (senão usa `title`). */
  ogTitle?: string;
  /** Descrição só do Open Graph/Twitter (senão usa `description`). */
  ogDescription?: string;
  /** Dimensões reais da `ogImage`, quando conhecidas (senão og:image:width/height não saem). */
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogType?: "website" | "article";
  noindex?: boolean;
  /** Palavras-chave da rota. Sobrepõe `settings.seo_keywords` (global). */
  keywords?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

const MANAGED_ATTR = "data-seo-managed";
const INJECTED_ATTR = "data-seo-injected";
/** JSON-LD gravado no HTML pelo prerender (scripts/prerenderPosts.ts e prerenderGuia.ts). */
const PRERENDER_JSONLD_SELECTOR = 'script[type="application/ld+json"][data-prerender]';

/** Selectors de verificação que jamais podem ser removidos do <head>. */
const PROTECTED_META_SELECTORS = [
  'meta[name="google-site-verification"]',
  'meta[name="facebook-domain-verification"]',
];

/** Domínio oficial da Bewild. Nunca deve ser sobrescrito por outro host. */
export const BEWILD_CANONICAL_BASE = "https://bewild.com.br";
const ALLOWED_CANONICAL_HOSTS = ["bewild.com.br", "www.bewild.com.br"];
let warnedCanonicalHost = false;

/**
 * Base canônica: SEMPRE o domínio oficial da Bewild. `seo_canonical_base`
 * do banco não muda o resultado — só gera um aviso (uma vez) quando aponta
 * para outro host, para o admin perceber a configuração errada.
 */
export function getCanonicalBase(settings?: { seo_canonical_base?: string | null } | null): string {
  const raw = settings?.seo_canonical_base?.trim();
  if (raw && !warnedCanonicalHost) {
    let host = "";
    try {
      host = new URL(raw.includes("://") ? raw : `https://${raw}`).hostname.toLowerCase();
    } catch {
      /* valor inválido: cai no aviso abaixo */
    }
    if (!ALLOWED_CANONICAL_HOSTS.includes(host)) {
      warnedCanonicalHost = true;
      console.warn(`[seo] seo_canonical_base ignorado ("${raw}" nao e bewild.com.br).`);
    }
  }
  return BEWILD_CANONICAL_BASE;
}

/**
 * Imagem OG padrão do site (a mesma do index.html). É a única com dimensões
 * conhecidas; rota sem imagem própria volta para ela (antes a imagem da rota
 * anterior ficava no <head>).
 */
export const DEFAULT_OG_IMAGE = {
  url: `${BEWILD_CANONICAL_BASE}/og_final_v2.jpg`,
  width: 1200,
  height: 630,
  alt: "Bewild — reformas de apartamentos em São Paulo",
} as const;

/** Diretivas de pré-visualização do index.html, preservadas em páginas indexáveis. */
const PREVIEW_DIRECTIVES = "max-image-preview:large, max-snippet:-1, max-video-preview:-1";

export function robotsContent(noindex: boolean | undefined, settingsRobots?: string | null): string {
  if (noindex) return "noindex, nofollow";
  const base = (settingsRobots || "index, follow").trim();
  if (/\b(noindex|none)\b/i.test(base) || /max-image-preview/i.test(base)) return base;
  return `${base}, ${PREVIEW_DIRECTIVES}`;
}

function setMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!el) {
    const tag = selector.startsWith("link") ? "link" : "meta";
    el = document.createElement(tag) as HTMLMetaElement | HTMLLinkElement;
    document.head.appendChild(el);
  }
  // Marca toda tag tocada (criada OU pré-existente do index.html) como
  // managed. Sem isso, os metas estáticos do index.html ficavam órfãos
  // do ciclo de aplicação — `clearJsonLd` e checagens equivalentes não
  // os enxergavam e o "estado" do <head> divergia entre route swaps. (M4)
  el.setAttribute(MANAGED_ATTR, "true");
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
}

/** Remove a tag (estática do index.html ou criada aqui), se existir. */
function removeMeta(selector: string) {
  document.head.querySelectorAll(selector).forEach((n) => n.remove());
}

/** Página em que o documento foi carregado (onde vale o JSON-LD do prerender). */
const BOOT_PATHNAME = typeof window !== "undefined" ? window.location.pathname : "";

/** `@type` de primeiro nível (item, array ou `@graph`) de um bloco JSON-LD. */
function jsonLdTypes(data: unknown): Set<string> {
  const out = new Set<string>();
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (Array.isArray(n["@graph"])) return (n["@graph"] as unknown[]).forEach(visit);
    const t = n["@type"];
    for (const v of Array.isArray(t) ? t : [t]) if (typeof v === "string") out.add(v);
  };
  visit(data);
  return out;
}

function clearJsonLd(spaJsonLd: SeoInput["jsonLd"]) {
  document.head
    .querySelectorAll<HTMLScriptElement>(`script[type="application/ld+json"][${MANAGED_ATTR}]`)
    .forEach((n) => n.remove());
  // O JSON-LD do prerender só vale para a URL de entrada e só até a SPA
  // publicar o equivalente (mesmos @type) — antes ficava para sempre
  // (Article/FAQPage duplicados e vazando para as rotas seguintes). Enquanto
  // a SPA só tem o breadcrumb de carregamento, o Article do prerender fica.
  const leftBootPage = window.location.pathname !== BOOT_PATHNAME;
  const spaTypes = jsonLdTypes(spaJsonLd);
  document.head.querySelectorAll<HTMLScriptElement>(PRERENDER_JSONLD_SELECTOR).forEach((n) => {
    if (leftBootPage) return n.remove();
    let types = new Set<string>();
    try {
      types = jsonLdTypes(JSON.parse(n.text || "null"));
    } catch {
      /* bloco ilegível: sai assim que a SPA publicar qualquer coisa */
    }
    const covered = types.size > 0 ? [...types].every((t) => spaTypes.has(t)) : spaTypes.size > 0;
    if (covered) n.remove();
  });
}

function addJsonLd(data: Record<string, unknown> | Array<Record<string, unknown>>) {
  const arr = Array.isArray(data) ? data : [data];
  for (const item of arr) {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.setAttribute(MANAGED_ATTR, "true");
    s.text = JSON.stringify(item);
    document.head.appendChild(s);
  }
}

/** Injeta uma tag <meta name=X content=Y> apenas se value for truthy */
function setMetaIf(selector: string, attrs: Record<string, string>, value?: string | null) {
  if (!value) {
    // Nunca remover as verificações de propriedade que já existem estáticas
    // no index.html — elas sustentam Search Console / Meta Business.
    if (PROTECTED_META_SELECTORS.includes(selector)) return;
    const existing = document.head.querySelector(selector);
    if (existing?.getAttribute(MANAGED_ATTR)) existing.remove();
    return;
  }
  setMeta(selector, attrs);
}

/** URL absoluta (og:image exige). Relativa vira `base + caminho`. */
function absoluteUrl(url: string, base: string): string {
  const u = url.trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  return `${base}${u.startsWith("/") ? "" : "/"}${u}`;
}

/** MIME pela extensão do caminho (ignora querystring); `null` se desconhecido. */
export function imageMimeFromUrl(url: string): string | null {
  let path = url;
  try {
    path = new URL(url).pathname;
  } catch {
    path = url.split(/[?#]/)[0];
  }
  const ext = path.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    default:
      return null;
  }
}

// =============================================================
//  Trackers de terceiros (LGPD: só depois do aceite)
// =============================================================

/**
 * Formato de cada ID vindo de `site_settings`. Os IDs são interpolados em
 * scripts inline — um valor fora do padrão (ex.: `1;alert(1)` no Hotjar, que
 * entrava sem aspas) viraria execução de código. ID inválido = não injeta.
 */
const TRACKER_ID_RULES = {
  ga4: { re: /^G-[A-Z0-9]{4,}$/, normalize: (v: string) => v.toUpperCase() },
  gtm: { re: /^GTM-[A-Z0-9]{4,}$/, normalize: (v: string) => v.toUpperCase() },
  metaPixel: { re: /^\d{5,20}$/, normalize: (v: string) => v },
  clarity: { re: /^[a-z0-9]{6,20}$/, normalize: (v: string) => v.toLowerCase() },
  hotjar: { re: /^\d{4,10}$/, normalize: (v: string) => v },
  /** Validado para quem vier a usar; hoje nenhum script do Google Ads é injetado. */
  googleAds: { re: /^AW-\d+$/, normalize: (v: string) => v.toUpperCase() },
} as const;

export type TrackerKind = keyof typeof TRACKER_ID_RULES;

const warnedInvalidIds = new Set<string>();

/** ID normalizado e válido, ou `null` (ausente/malformado). */
export function validTrackerId(kind: TrackerKind, raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const rule = TRACKER_ID_RULES[kind];
  const id = rule.normalize(trimmed);
  if (rule.re.test(id)) return id;
  if (!warnedInvalidIds.has(`${kind}:${trimmed}`)) {
    warnedInvalidIds.add(`${kind}:${trimmed}`);
    devWarn(`[seo] ${kind} id inválido em site_settings — tracker não injetado:`, raw);
  }
  return null;
}

/** Carrega script externo uma única vez (idempotente via id). */
function ensureScript(id: string, src: string, inline?: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.setAttribute(INJECTED_ATTR, "true");
  if (src) {
    s.src = src;
    s.async = true;
  }
  if (inline) s.text = inline;
  document.head.appendChild(s);
}

/**
 * GA4 extra configurado no admin. O GA4 principal (`GA4_MEASUREMENT_ID`) é de
 * `src/lib/ga4.ts`: repetir o mesmo ID aqui fazia um segundo `config` com
 * page_view automático. Para outro ID, `send_page_view:false` — os page_views
 * manuais de ga4.ts (sem `send_to`) já vão para todos os destinos.
 */
function injectGA4(id: string) {
  if (id === GA4_MEASUREMENT_ID) return;
  ensureScript("ga4-loader", `https://www.googletagmanager.com/gtag/js?id=${id}`);
  ensureScript(
    "ga4-config",
    "",
    `window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){dataLayer.push(arguments);};
gtag('js', new Date());
gtag('config', '${id}', { send_page_view: false });`
  );
}

/** Injeta Google Tag Manager */
function injectGTM(id: string) {
  // (O <noscript> do GTM foi removido: criado via JS ele nunca é usado.)
  ensureScript(
    "gtm-loader",
    "",
    `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`
  );
}

/**
 * Injeta Meta Pixel (Facebook). `disablePushState` antes do `init`: sem ele o
 * fbevents rastreia sozinho cada pushState da SPA e o PageView saía em dobro
 * com o de src/components/MetaPixel.tsx.
 */
function injectMetaPixel(id: string) {
  ensureScript(
    "meta-pixel",
    "",
    `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq.disablePushState=true;fbq('init','${id}');fbq('track','PageView');`
  );
}

/** Microsoft Clarity */
function injectClarity(id: string) {
  ensureScript(
    "clarity-loader",
    "",
    `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${id}");`
  );
}

/** Hotjar */
function injectHotjar(id: string) {
  ensureScript(
    "hotjar-loader",
    "",
    `(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${id},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-',".js?sv=");`
  );
}

function isAdminLocation(): boolean {
  const p = window.location.pathname;
  return p === "/admin" || p.startsWith("/admin/");
}

function injectTrackers(settings: SiteSettings) {
  // LGPD: nenhum tracker de terceiros entra no DOM sem aceite explícito.
  // `applySeo` chama isto a cada mudança de rota; quem aceita depois
  // dispara `cookie:consent-change`, e o listener em `setupTrackersConsentGate`
  // refaz a injeção com as settings em cache. /admin nunca recebe tracker;
  // iframe (auditoria de SEO do admin) já cai no gate de consentimento.
  if (!isConsentAccepted()) return;
  if (isAdminLocation()) return;
  const gtm = validTrackerId("gtm", settings.google_tag_manager_id);
  if (gtm) injectGTM(gtm);
  const ga4 = validTrackerId("ga4", settings.google_analytics_id);
  if (ga4) injectGA4(ga4);
  const pixel = validTrackerId("metaPixel", settings.meta_pixel_id);
  if (pixel) injectMetaPixel(pixel);
  const clarity = validTrackerId("clarity", settings.clarity_id);
  if (clarity) injectClarity(clarity);
  const hotjar = validTrackerId("hotjar", settings.hotjar_id);
  if (hotjar) injectHotjar(hotjar);
}

/**
 * Há script de terceiros (GTM/GA4/Pixel/Clarity/Hotjar) rodando na página?
 * Usado pelo Root para recarregar ao entrar no /admin: Clarity e Hotjar
 * gravam a tela, e o painel mostra dados de leads.
 */
export function hasThirdPartyTrackers(): boolean {
  if (typeof document === "undefined") return false;
  const w = window as Window & { __bewildGa4Inited?: boolean };
  return !!w.__bewildGa4Inited || !!document.querySelector(`[${INJECTED_ATTR}]`);
}

/**
 * Quando o usuário aceita o banner DEPOIS que a página já está montada, os
 * `useSeo` montados não vão re-rodar `applySeo` espontaneamente. Esta função,
 * idempotente, registra um listener global que dispara o evento de refresh
 * de SEO assim que o consentimento vira "accepted" — fazendo os trackers
 * entrarem no DOM sem exigir reload.
 */
let trackersConsentGateAttached = false;
function setupTrackersConsentGate() {
  if (trackersConsentGateAttached) return;
  if (typeof window === "undefined") return;
  trackersConsentGateAttached = true;
  onConsentChange((v) => {
    if (v !== "accepted") return;
    window.dispatchEvent(new CustomEvent(SEO_REFRESH_EVENT));
  });
}

// =============================================================
//  Aplicação do <head>
// =============================================================

function applySeo(settings: SiteSettings, seoInput: SeoInput) {
  // Base canônica blindada: sempre o domínio oficial da Bewild.
  // Ver `getCanonicalBase` — hosts estranhos vindos do banco são ignorados.
  const base = getCanonicalBase(settings);

  // Canonical: ignora âncoras (#faq) e querystring para evitar duplicidade
  // Ex.: /#faq → canonical da home (/), /faq → canonical próprio
  const rawPath = seoInput.canonicalPath || "/";
  const cleanPath = rawPath.split("#")[0].split("?")[0] || "/";

  // Textos editados em /admin/seo (aba "Páginas") vencem os da rota.
  const ov = pageSeoOverride(settings.pages_seo, cleanPath);
  const seo: SeoInput = {
    ...seoInput,
    title: ov.title || seoInput.title,
    description: ov.description || seoInput.description,
    ogTitle: ov.og_title || seoInput.ogTitle,
    ogDescription: ov.og_description || seoInput.ogDescription,
    ogImage: ov.og_image || seoInput.ogImage,
    ...(ov.og_image ? { ogImageWidth: undefined, ogImageHeight: undefined } : null),
  };

  const title = seo.title || settings.seo_default_title || settings.site_title || "Bewild";
  const description =
    seo.description || settings.seo_default_description || settings.site_description || "";
  const canonical = `${base}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`.replace(
    /(.+)\/$/,
    "$1"
  ) || `${base}/`;
  // Garante barra final apenas para a raiz
  const canonicalUrl = cleanPath === "/" ? `${base}/` : canonical;

  const robots = robotsContent(seo.noindex, settings.seo_robots);
  const ogType = seo.ogType || "website";

  document.title = title;

  setMeta('meta[name="description"]', { name: "description", content: description });
  setMeta('meta[name="robots"]', { name: "robots", content: robots });
  setMeta('link[rel="canonical"]', { rel: "canonical", href: canonicalUrl });
  // DC.title estático do index.html: acompanha o título em vez de ficar com o da home.
  document.head.querySelector('meta[name="DC.title"]')?.setAttribute("content", title);

  // hreflang — pt-BR + x-default apontando para o canonical da rota atual.
  // Remove duplicatas estáticas do index.html (que apontam só para a home)
  // e injeta as corretas conforme a página.
  document.head
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((n) => n.remove());
  const hrefPt = document.createElement("link");
  hrefPt.setAttribute("rel", "alternate");
  hrefPt.setAttribute("hreflang", "pt-BR");
  hrefPt.setAttribute("href", canonicalUrl);
  hrefPt.setAttribute(MANAGED_ATTR, "true");
  document.head.appendChild(hrefPt);
  const hrefDefault = document.createElement("link");
  hrefDefault.setAttribute("rel", "alternate");
  hrefDefault.setAttribute("hreflang", "x-default");
  hrefDefault.setAttribute("href", canonicalUrl);
  hrefDefault.setAttribute(MANAGED_ATTR, "true");
  document.head.appendChild(hrefDefault);

  // SEO extras (autor, keywords, geo). Keywords são por rota: sem valor
  // próprio nem global, a tag sai (antes ficava a da rota anterior).
  const keywords = seo.keywords || settings.seo_keywords;
  if (keywords) setMeta('meta[name="keywords"]', { name: "keywords", content: keywords });
  else removeMeta('meta[name="keywords"]');
  if (settings.seo_author)
    setMeta('meta[name="author"]', { name: "author", content: settings.seo_author });
  if (settings.seo_geo_region)
    setMeta('meta[name="geo.region"]', { name: "geo.region", content: settings.seo_geo_region });
  if (settings.seo_geo_placename)
    setMeta('meta[name="geo.placename"]', {
      name: "geo.placename",
      content: settings.seo_geo_placename,
    });
  if (settings.seo_geo_position)
    setMeta('meta[name="geo.position"]', {
      name: "geo.position",
      content: settings.seo_geo_position,
    });

  // Open Graph
  setMeta('meta[property="og:title"]', { property: "og:title", content: seo.ogTitle || title });
  setMeta('meta[property="og:description"]', { property: "og:description", content: seo.ogDescription || description });
  setMeta('meta[property="og:type"]', { property: "og:type", content: ogType });
  setMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
  setMeta('meta[property="og:locale"]', { property: "og:locale", content: "pt_BR" });
  setMeta('meta[property="og:site_name"]', {
    property: "og:site_name",
    content: "Bewild",
  });

  // Imagem: sempre há uma (a da rota, a global do admin ou a padrão), e todas
  // as tags derivadas são reescritas juntas — nada sobra da rota anterior.
  const routeImage = absoluteUrl(
    seo.ogImage || settings.seo_og_image || settings.default_og_image || "",
    base
  );
  const ogImage = routeImage || DEFAULT_OG_IMAGE.url;
  const isDefaultImage = ogImage === DEFAULT_OG_IMAGE.url;
  const width = seo.ogImage ? seo.ogImageWidth : isDefaultImage ? DEFAULT_OG_IMAGE.width : undefined;
  const height = seo.ogImage ? seo.ogImageHeight : isDefaultImage ? DEFAULT_OG_IMAGE.height : undefined;
  const imageAlt = isDefaultImage ? DEFAULT_OG_IMAGE.alt : title;
  const imageType = imageMimeFromUrl(ogImage);

  setMeta('meta[property="og:image"]', { property: "og:image", content: ogImage });
  if (ogImage.startsWith("https://")) {
    setMeta('meta[property="og:image:secure_url"]', {
      property: "og:image:secure_url",
      content: ogImage,
    });
  } else {
    removeMeta('meta[property="og:image:secure_url"]');
  }
  if (imageType) {
    setMeta('meta[property="og:image:type"]', { property: "og:image:type", content: imageType });
  } else {
    removeMeta('meta[property="og:image:type"]');
  }
  // Dimensões só quando conhecidas: 1200×630 fixo para qualquer imagem
  // mentia para os crawlers sociais (crop/preview errado).
  if (width && height) {
    setMeta('meta[property="og:image:width"]', { property: "og:image:width", content: String(width) });
    setMeta('meta[property="og:image:height"]', {
      property: "og:image:height",
      content: String(height),
    });
  } else {
    removeMeta('meta[property="og:image:width"]');
    removeMeta('meta[property="og:image:height"]');
  }
  setMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: imageAlt });

  // Twitter
  setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: seo.ogTitle || title });
  setMeta('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: seo.ogDescription || description,
  });
  setMeta('meta[name="twitter:image"]', { name: "twitter:image", content: ogImage });
  setMeta('meta[name="twitter:image:alt"]', { name: "twitter:image:alt", content: imageAlt });
  if (settings.seo_twitter_handle) {
    setMeta('meta[name="twitter:site"]', {
      name: "twitter:site",
      content: settings.seo_twitter_handle,
    });
  }

  // Verificações de proprietário (Search Console, Bing, Yandex, Facebook, Pinterest)
  setMetaIf(
    'meta[name="google-site-verification"]',
    { name: "google-site-verification", content: settings.google_site_verification || "" },
    settings.google_site_verification
  );
  setMetaIf(
    'meta[name="msvalidate.01"]',
    { name: "msvalidate.01", content: settings.bing_site_verification || "" },
    settings.bing_site_verification
  );
  setMetaIf(
    'meta[name="yandex-verification"]',
    { name: "yandex-verification", content: settings.yandex_verification || "" },
    settings.yandex_verification
  );
  setMetaIf(
    'meta[name="facebook-domain-verification"]',
    {
      name: "facebook-domain-verification",
      content: settings.facebook_domain_verification || "",
    },
    settings.facebook_domain_verification
  );
  setMetaIf(
    'meta[name="p:domain_verify"]',
    { name: "p:domain_verify", content: settings.pinterest_site_verification || "" },
    settings.pinterest_site_verification
  );

  // Trackers (Analytics / GTM / Pixel)
  injectTrackers(settings);

  clearJsonLd(seo.jsonLd);
  if (seo.jsonLd) addJsonLd(seo.jsonLd);
}

/** Último pathname cujo <head> foi aplicado por uma página (via `useSeo`). */
let lastSeoAppliedPathname: string | null = null;

/**
 * A página exibida em `pathname` já aplicou o próprio título/metas? O Root
 * espera isso para mandar o page_view do GA4 com o título certo (páginas
 * lazy montam depois do swap de rota).
 */
export function isSeoAppliedFor(pathname: string): boolean {
  return lastSeoAppliedPathname === pathname;
}

function markSeoApplied() {
  lastSeoAppliedPathname = window.location.pathname;
  try {
    window.dispatchEvent(new CustomEvent(SEO_APPLIED_EVENT));
  } catch {
    /* CustomEvent indisponível */
  }
}

/**
 * useSeo — aplica meta tags + canonical + OG/Twitter + JSON-LD por rota.
 * Usa o DOM diretamente (sem react-helmet-async para evitar nova dependência).
 */
export function useSeo(seo: SeoInput) {
  // Deps granulares: cada campo primitivo é uma dep, e o jsonLd é
  // serializado uma vez por render (apenas se presente) em vez de
  // `JSON.stringify(seo)` no corpo do hook. Mais honesto sobre o que
  // dispara o re-apply, e barra a regressão silenciosa do "ESLint não
  // sabia que dependíamos de X porque tudo passava por uma string única".
  const {
    title,
    description,
    canonicalPath,
    ogImage,
    ogTitle,
    ogDescription,
    ogImageWidth,
    ogImageHeight,
    ogType,
    noindex,
    jsonLd,
    keywords,
  } = seo;
  const jsonLdKey = useMemo(() => (jsonLd ? JSON.stringify(jsonLd) : ""), [jsonLd]);

  useEffect(() => {
    setupTrackersConsentGate();
    let cancelled = false;
    const input: SeoInput = {
      title,
      description,
      canonicalPath,
      ogImage,
      ogTitle,
      ogDescription,
      ogImageWidth,
      ogImageHeight,
      ogType,
      noindex,
      jsonLd,
      keywords,
    };
    // 1) Síncrono: title/canonical/robots da rota entram no <head> AGORA, com
    //    as settings em cache (ou defaults). Sem isso, enquanto `site_settings`
    //    não respondia, toda rota ficava com o canonical da home e a 404 sem
    //    noindex — o snapshot que um crawler pode capturar.
    applySeo(getCachedSiteSettings(), input);
    markSeoApplied();
    // 2) Assíncrono: refina com as settings do banco (og:image, verificações,
    //    trackers) assim que chegarem.
    const apply = (force = false) =>
      fetchSiteSettings(force)
        .then((settings) => {
          if (cancelled) return;
          applySeo(settings, input);
        })
        .catch(() => {
          /* backend indisponível: já aplicamos os defaults acima */
        });
    apply();
    const onRefresh = () => apply(true);
    window.addEventListener(SEO_REFRESH_EVENT, onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener(SEO_REFRESH_EVENT, onRefresh);
    };
    // jsonLd entra na dep via `jsonLdKey` (hash estável da serialização);
    // a função `applySeo` é importada estaticamente, sem captura instável.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    description,
    canonicalPath,
    ogImage,
    ogTitle,
    ogDescription,
    ogImageWidth,
    ogImageHeight,
    ogType,
    noindex,
    jsonLdKey,
    keywords,
  ]);
}

/**
 * refreshSeoEverywhere — força reaplicação de meta tags + JSON-LD em todos os
 * componentes que usam `useSeo`, além de invalidar o cache de site_settings
 * e (opcionalmente) pingar buscadores com o sitemap atualizado.
 */
export async function refreshSeoEverywhere(opts?: { pingSearchEngines?: boolean }): Promise<{
  ok: boolean;
  ping?: { ok: boolean; results?: Array<{ name: string; ok: boolean; status?: number }> };
}> {
  invalidateSiteSettings();
  // dispara reaplicação em todos os useSeo montados
  window.dispatchEvent(new CustomEvent(SEO_REFRESH_EVENT));

  if (!opts?.pingSearchEngines) return { ok: true };

  try {
    // `functions.invoke` envia o JWT do admin logado — a edge function
    // `ping-sitemap` exige admin (antes era um fetch anônimo, sem auth).
    const { data, error } = await supabase.functions.invoke("ping-sitemap", { body: {} });
    return { ok: true, ping: error ? { ok: false } : data };
  } catch {
    return { ok: true, ping: { ok: false } };
  }
}

// =============================================================
//  JSON-LD helpers
// =============================================================

export function projectJsonLd(
  s: SiteSettings,
  project: {
    slug: string;
    title: string;
    em?: string;
    summary?: string;
    cover?: string;
    location?: string;
    year?: string;
    tag?: string;
  }
) {
  const base = getCanonicalBase(s);
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${project.title} ${project.em ?? ""}`.trim(),
    description: project.summary,
    image: project.cover,
    url: `${base}/portfolio/${project.slug}`,
    creator: {
      "@type": "Organization",
      name: "Bewild",
      url: base,
    },
    about: project.tag,
    keywords: [
      "reforma de apartamento",
      "reformas de apartamentos",
      "apartamento pronto",
      "arquitetura em São Paulo",
      project.tag,
    ].filter(Boolean).join(", "),
    contentLocation: project.location
      ? {
          "@type": "Place",
          name: project.location,
          address: {
            "@type": "PostalAddress",
            addressLocality: "São Paulo",
            addressRegion: "SP",
            addressCountry: "BR",
          },
        }
      : {
          "@type": "Place",
          name: "São Paulo-SP",
          address: {
            "@type": "PostalAddress",
            addressLocality: "São Paulo",
            addressRegion: "SP",
            addressCountry: "BR",
          },
        },
    dateCreated: project.year,
  };
}

/** BreadcrumbList JSON-LD para melhorar exibição em SERP. */
export function breadcrumbJsonLd(
  s: SiteSettings,
  trail: Array<{ name: string; path: string }>
) {
  const base = getCanonicalBase(s);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${base}${t.path.startsWith("/") ? t.path : `/${t.path}`}`,
    })),
  };
}

/** ItemList JSON-LD para coleções (ex.: portfólio). */
export function itemListJsonLd(
  s: SiteSettings,
  items: Array<{ name: string; path: string; image?: string }>
) {
  const base = getCanonicalBase(s);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${base}${it.path.startsWith("/") ? it.path : `/${it.path}`}`,
      name: it.name,
      image: it.image,
    })),
  };
}

/** FAQPage JSON-LD — habilita rich result de FAQ no Google (perguntas expansíveis na SERP). */
export function faqJsonLd(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.a,
      },
    })),
  };
}

/** Logo oficial — o mesmo do nó Organization estático do index.html. */
export const ORG_LOGO_URL = `${BEWILD_CANONICAL_BASE}/brand/bewild-logo.png`;
/** `@id` único da Organization (index.html, páginas de serviço, posts). */
export const ORG_ID = `${BEWILD_CANONICAL_BASE}/#org`;

/**
 * Organization JSON-LD — reforça entidade para o Knowledge Graph.
 *
 * Mesmo `@id` (`#org`) do nó estático do index.html e dos `provider` das
 * páginas de serviço: é UMA entidade, enriquecida aqui com CNPJ/CAU/contato.
 * (Antes era `#organization`, com `subOrganization` apontando para um
 * `#business` que nenhuma página publicava — duas Organizations e um nó órfão.)
 */
export function organizationJsonLd(s: SiteSettings) {
  const base = getCanonicalBase(s);

  const absUrl = (u: string | null | undefined) => {
    if (!u) return undefined;
    if (/^https?:\/\//i.test(u)) return u;
    return `${base}${u.startsWith("/") ? "" : "/"}${u}`;
  };
  const imageUrl = absUrl(s.seo_og_image || s.default_og_image);

  const sameAs = Array.from(
    new Set(
      [
        s.instagram_url,
        s.linkedin_url,
        s.pinterest_url,
        s.google_business_profile_url,
        s.google_maps_url,
      ]
        .filter((x): x is string => Boolean(x))
        .map((x) => x.trim())
    )
  );

  const address =
    s.address_street || s.address_city
      ? {
          "@type": "PostalAddress",
          streetAddress: s.address_street || undefined,
          addressLocality: s.address_city || undefined,
          addressRegion: s.address_region || undefined,
          postalCode: s.business_postal_code || undefined,
          addressCountry: "BR",
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Bewild",
    legalName: "Bewild",
    url: `${base}/`,
    logo: {
      "@type": "ImageObject",
      url: ORG_LOGO_URL,
      caption: "Bewild",
    },
    image: imageUrl,
    email: s.contact_email || undefined,
    telephone: s.contact_phone || undefined,
    foundingDate: s.business_founding_year || undefined,
    taxID: s.cnpj || undefined,
    vatID: s.cnpj || undefined,
    iso6523Code: s.cnpj ? `0007:${s.cnpj.replace(/\D/g, "")}` : undefined,
    identifier: [
      s.cnpj
        ? { "@type": "PropertyValue", propertyID: "CNPJ", value: s.cnpj }
        : null,
      s.cau
        ? { "@type": "PropertyValue", propertyID: "CAU", value: s.cau }
        : null,
    ].filter(Boolean),
    address,
    contactPoint: s.contact_phone
      ? {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: s.contact_phone,
          email: s.contact_email || undefined,
          areaServed: "BR",
          availableLanguage: ["Portuguese", "pt-BR"],
        }
      : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
}
