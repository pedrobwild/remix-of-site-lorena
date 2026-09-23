// Auditoria SEO on-page: inspeciona o DOM de uma página e detecta problemas
// comuns que o Google usa para ranquear conteúdos.
//
// Antes a auditoria lia o `document` ATUAL — ou seja, a própria tela
// /admin/seo (noindex, sem JSON-LD…) — e gravava esse score como se fosse o
// do site. Agora `runSeoAudit` recebe o Document a auditar e
// `auditPublicPage` carrega a página pública num iframe oculto de mesma
// origem, espera o SPA renderizar e audita o documento dela.

import type { SiteSettings } from "./useSiteSettings";

export type SeoIssueLevel = "error" | "warning" | "info" | "ok";

export type SeoIssue = {
  id: string;
  level: SeoIssueLevel;
  area: string;
  message: string;
  hint?: string;
};

export type SeoAuditResult = {
  score: number; // 0-100
  issues: SeoIssue[];
  stats: {
    titleLen: number;
    descLen: number;
    h1Count: number;
    h2Count: number;
    imagesTotal: number;
    imagesWithoutAlt: number;
    linksTotal: number;
    linksWithoutText: number;
    hasCanonical: boolean;
    hasOgImage: boolean;
    hasJsonLd: boolean;
  };
};

function has(doc: Document, sel: string) {
  return !!doc.head?.querySelector(sel);
}
function getMeta(doc: Document, name: string) {
  const el = doc.head?.querySelector<HTMLMetaElement>(
    `meta[name="${name}"], meta[property="${name}"]`
  );
  return el?.getAttribute("content") || "";
}

type AuditSettings = Pick<
  SiteSettings,
  "google_site_verification" | "google_analytics_id" | "google_tag_manager_id"
>;

/**
 * Audita `doc` (padrão: o documento atual). Para auditar o SITE, use
 * `auditPublicPage`, que passa o documento da página pública.
 */
export function runSeoAudit(settings: AuditSettings, doc: Document = document): SeoAuditResult {
  const issues: SeoIssue[] = [];

  // --- Title
  const title = (doc.title || "").trim();
  if (!title) {
    issues.push({
      id: "title-missing",
      level: "error",
      area: "Título",
      message: "A página não tem <title>.",
      hint: "Defina um título único e descritivo, 40–60 caracteres.",
    });
  } else if (title.length < 30) {
    issues.push({
      id: "title-short",
      level: "warning",
      area: "Título",
      message: `Título muito curto (${title.length} caracteres).`,
      hint: "Ideal: 40 a 60 caracteres.",
    });
  } else if (title.length > 65) {
    issues.push({
      id: "title-long",
      level: "warning",
      area: "Título",
      message: `Título longo (${title.length} caracteres) — pode ser cortado no Google.`,
      hint: "Mantenha entre 40 e 60 caracteres.",
    });
  } else {
    issues.push({
      id: "title-ok",
      level: "ok",
      area: "Título",
      message: `Título em bom tamanho (${title.length} caracteres).`,
    });
  }

  // --- Description
  const desc = getMeta(doc, "description");
  if (!desc) {
    issues.push({
      id: "desc-missing",
      level: "error",
      area: "Descrição",
      message: "Meta description ausente.",
      hint: "Escreva uma descrição persuasiva de 120–160 caracteres.",
    });
  } else if (desc.length < 80) {
    issues.push({
      id: "desc-short",
      level: "warning",
      area: "Descrição",
      message: `Descrição curta (${desc.length} caracteres).`,
      hint: "Ideal: 120 a 160 caracteres.",
    });
  } else if (desc.length > 170) {
    issues.push({
      id: "desc-long",
      level: "warning",
      area: "Descrição",
      message: `Descrição longa (${desc.length} caracteres) — pode ser cortada.`,
    });
  } else {
    issues.push({
      id: "desc-ok",
      level: "ok",
      area: "Descrição",
      message: `Descrição em bom tamanho (${desc.length} caracteres).`,
    });
  }

  // --- Robots
  const robots = getMeta(doc, "robots") || "index, follow";
  if (robots.toLowerCase().includes("noindex")) {
    issues.push({
      id: "robots-noindex",
      level: "error",
      area: "Robots",
      message: "A página está com noindex — não aparecerá no Google.",
      hint: "Em Admin › SEO › Global, coloque em 'index, follow'.",
    });
  }

  // --- Canonical
  const canonical = doc.head?.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const hasCanonical = !!canonical?.href;
  if (!hasCanonical) {
    issues.push({
      id: "canonical-missing",
      level: "warning",
      area: "Canonical",
      message: "Sem URL canônica definida.",
      hint: "Evita duplicação de conteúdo para o Google.",
    });
  }

  // --- H1 / H2
  const h1s = doc.querySelectorAll("h1");
  const h2s = doc.querySelectorAll("h2");
  if (h1s.length === 0) {
    issues.push({
      id: "h1-missing",
      level: "error",
      area: "Hierarquia",
      message: "A página não tem <h1>.",
      hint: "Toda página precisa de um título principal único (h1).",
    });
  } else if (h1s.length > 1) {
    issues.push({
      id: "h1-multiple",
      level: "warning",
      area: "Hierarquia",
      message: `Existem ${h1s.length} h1 na página.`,
      hint: "Prefira um único h1 por página.",
    });
  }
  if (h2s.length === 0) {
    issues.push({
      id: "h2-missing",
      level: "info",
      area: "Hierarquia",
      message: "Nenhum <h2> na página.",
      hint: "Use h2/h3 para seccionar o conteúdo e ajudar a leitura.",
    });
  }

  // --- Imagens com alt
  const imgs = Array.from(doc.querySelectorAll("img"));
  const imgsNoAlt = imgs.filter((i) => !(i.getAttribute("alt") || "").trim());
  if (imgs.length > 0 && imgsNoAlt.length > 0) {
    issues.push({
      id: "img-alt",
      level: imgsNoAlt.length > imgs.length / 3 ? "error" : "warning",
      area: "Imagens",
      message: `${imgsNoAlt.length} de ${imgs.length} imagens sem atributo alt.`,
      hint: "Texto alt é essencial para acessibilidade e SEO de imagens.",
    });
  } else if (imgs.length > 0) {
    issues.push({
      id: "img-alt-ok",
      level: "ok",
      area: "Imagens",
      message: `Todas as ${imgs.length} imagens têm alt.`,
    });
  }

  // --- Links sem texto
  const links = Array.from(doc.querySelectorAll("a"));
  const linksNoText = links.filter((a) => {
    const text = (a.textContent || "").trim();
    const aria = a.getAttribute("aria-label");
    return !text && !aria;
  });
  if (linksNoText.length > 0) {
    issues.push({
      id: "link-text",
      level: "warning",
      area: "Links",
      message: `${linksNoText.length} links sem texto ou aria-label.`,
      hint: "Todo link precisa de texto descritivo (ou aria-label).",
    });
  }

  // --- Open Graph
  const ogImage = getMeta(doc, "og:image");
  if (!ogImage) {
    issues.push({
      id: "og-image-missing",
      level: "warning",
      area: "Social",
      message: "Sem imagem de compartilhamento (og:image).",
      hint: "Faça upload em SEO › Imagem padrão. Ideal: 1200×630px.",
    });
  }

  // --- Schema / JSON-LD
  const jsonLd = doc.querySelectorAll('script[type="application/ld+json"]');
  if (jsonLd.length === 0) {
    issues.push({
      id: "jsonld-missing",
      level: "warning",
      area: "Schema",
      message: "Sem dados estruturados (JSON-LD).",
      hint: "Presença de Schema.org melhora rich results no Google.",
    });
  } else {
    issues.push({
      id: "jsonld-ok",
      level: "ok",
      area: "Schema",
      message: `${jsonLd.length} bloco(s) de JSON-LD detectado(s).`,
    });
  }

  // --- Viewport & idioma
  if (!has(doc, 'meta[name="viewport"]')) {
    issues.push({
      id: "viewport-missing",
      level: "error",
      area: "Mobile",
      message: "Meta viewport ausente — o site não é mobile-friendly.",
    });
  }
  const lang = doc.documentElement.getAttribute("lang");
  if (!lang) {
    issues.push({
      id: "lang-missing",
      level: "warning",
      area: "Idioma",
      message: "Atributo lang do <html> ausente.",
      hint: "Defina lang='pt-BR'.",
    });
  }

  // --- HTTPS
  const loc = doc.location ?? (typeof location !== "undefined" ? location : null);
  if (loc && loc.protocol !== "https:" && loc.hostname !== "localhost") {
    issues.push({
      id: "https-missing",
      level: "error",
      area: "Segurança",
      message: "Site não está em HTTPS.",
      hint: "Ative HTTPS no host. O Google penaliza sites sem SSL.",
    });
  }

  // --- Settings críticos
  if (!settings.google_site_verification) {
    issues.push({
      id: "gsc-missing",
      level: "info",
      area: "Google Search Console",
      message: "Código de verificação do Search Console não foi preenchido.",
      hint: "Em Admin › SEO › Verificações, cole o código de verificação.",
    });
  }
  if (!settings.google_analytics_id && !settings.google_tag_manager_id) {
    issues.push({
      id: "ga-missing",
      level: "info",
      area: "Google Analytics",
      message: "Nenhum ID de GA4 ou GTM configurado.",
      hint: "Recomendado para acompanhar tráfego e conversões.",
    });
  }

  // --- Score
  const weights = { error: 20, warning: 8, info: 2, ok: 0 };
  const penalty = issues.reduce((s, i) => s + (weights as Record<string, number>)[i.level], 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    score,
    issues,
    stats: {
      titleLen: title.length,
      descLen: desc.length,
      h1Count: h1s.length,
      h2Count: h2s.length,
      imagesTotal: imgs.length,
      imagesWithoutAlt: imgsNoAlt.length,
      linksTotal: links.length,
      linksWithoutText: linksNoText.length,
      hasCanonical,
      hasOgImage: !!ogImage,
      hasJsonLd: jsonLd.length > 0,
    },
  };
}

// =============================================================
//  Auditoria da página pública (iframe oculto de mesma origem)
// =============================================================

/** Caminho público auditável: interno ("/x"), fora de /admin. */
export function normalizeAuditPath(input: string): string | null {
  let p = (input || "").trim();
  if (!p) return "/";
  if (/^https?:\/\//i.test(p)) {
    try {
      const u = new URL(p);
      if (typeof window !== "undefined" && u.origin !== window.location.origin) return null;
      p = u.pathname + u.search;
    } catch {
      return null;
    }
  }
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.startsWith("//") || /\s/.test(p)) return null;
  const pathOnly = p.split(/[?#]/)[0];
  if (pathOnly === "/admin" || pathOnly.startsWith("/admin/")) return null;
  return p;
}

type WaitOptions = {
  /** Tempo máximo esperando o SPA renderizar. */
  timeoutMs?: number;
  /** Intervalo entre as leituras do DOM. */
  pollMs?: number;
  /** Leituras idênticas seguidas para considerar a página estável. */
  stablePolls?: number;
};

/** Assinatura do que a auditoria lê; estável = SPA terminou de aplicar SEO e conteúdo. */
function renderSignature(doc: Document): string {
  const root = doc.getElementById("root");
  const canonical = doc.head?.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "";
  const desc = getMeta(doc, "description");
  return [
    doc.title,
    canonical,
    desc.length,
    root?.childElementCount ?? 0,
    doc.querySelectorAll("h1").length,
    doc.querySelectorAll("img").length,
    doc.querySelectorAll('script[type="application/ld+json"]').length,
  ].join("|");
}

/**
 * Carrega `path` num iframe oculto (mesma origem), espera o SPA renderizar
 * (título/canonical/conteúdo estáveis por algumas leituras, ou o tempo
 * limite) e chama `fn` com o Document dele. O iframe é removido no fim,
 * com sucesso ou erro.
 */
export async function withPublicPageDocument<T>(
  path: string,
  fn: (doc: Document, info: { timedOut: boolean }) => T,
  { timeoutMs = 15_000, pollMs = 250, stablePolls = 4 }: WaitOptions = {},
): Promise<T> {
  const target = normalizeAuditPath(path);
  if (!target) throw new Error("Caminho inválido para auditoria. Use um caminho do site, como / ou /portfolio.");

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.title = "Auditoria SEO (oculto)";
  // Largura de desktop para o layout real; fora da tela e sem interação.
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:1280px;height:900px;border:0;opacity:0;pointer-events:none;";
  iframe.src = target;

  try {
    document.body.appendChild(iframe);

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("A página não carregou a tempo para a auditoria.")),
        timeoutMs,
      );
      iframe.addEventListener(
        "load",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
      iframe.addEventListener(
        "error",
        () => {
          clearTimeout(timer);
          reject(new Error("Não foi possível carregar a página para a auditoria."));
        },
        { once: true },
      );
    });

    const started = Date.now();
    let last = "";
    let stable = 0;
    let timedOut = false;
    for (;;) {
      const doc = iframe.contentDocument;
      if (!doc) throw new Error("A página auditada não é da mesma origem do painel.");
      const sig = renderSignature(doc);
      const rendered = (doc.getElementById("root")?.childElementCount ?? 0) > 0;
      stable = rendered && sig === last ? stable + 1 : 0;
      last = sig;
      if (stable >= stablePolls) break;
      if (Date.now() - started > timeoutMs) {
        timedOut = true;
        break;
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }

    const doc = iframe.contentDocument;
    if (!doc) throw new Error("A página auditada não é da mesma origem do painel.");
    return fn(doc, { timedOut });
  } finally {
    iframe.remove();
  }
}

export type PublicPageAudit = SeoAuditResult & {
  /** Caminho auditado (normalizado). */
  path: string;
  /** `true` quando o SPA não estabilizou dentro do tempo limite (resultado pode estar incompleto). */
  timedOut: boolean;
};

/** Audita uma página pública do site (padrão: a home). */
export async function auditPublicPage(
  settings: AuditSettings,
  path = "/",
  options?: WaitOptions,
): Promise<PublicPageAudit> {
  const target = normalizeAuditPath(path);
  if (!target) throw new Error("Caminho inválido para auditoria. Use um caminho do site, como / ou /portfolio.");
  return withPublicPageDocument(
    target,
    (doc, { timedOut }) => ({ ...runSeoAudit(settings, doc), path: target, timedOut }),
    options,
  );
}
