/**
 * Monta o `head()` das rotas TanStack Start com a mesma semântica do
 * `useSeo` legado (que continua gerenciando o <head> no cliente após a
 * hidratação). Aqui sai o HTML BRUTO que o Google lê antes do JavaScript:
 * título, descrição, robots, canonical + hreflang e Open Graph por página.
 */

export const SITE_BASE = "https://bewild.com.br";

export const DEFAULT_OG_IMAGE_URL = `${SITE_BASE}/og_final_v2.jpg`;
export const DEFAULT_OG_IMAGE_ALT = "Bewild — reformas de apartamentos em São Paulo";

const PREVIEW_DIRECTIVES = "max-image-preview:large, max-snippet:-1, max-video-preview:-1";

export type SeoHeadInput = {
  title: string;
  description: string;
  /** Caminho canônico, ex.: "/servicos". */
  path: string;
  noindex?: boolean;
  keywords?: string;
  ogImage?: string | null;
  ogType?: "website" | "article";
};

function absoluteUrl(url: string): string {
  const u = url.trim();
  if (!u) return DEFAULT_OG_IMAGE_URL;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  return `${SITE_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
}

const ORG_ID = `${SITE_BASE}/#org`;
const WEBSITE_ID = `${SITE_BASE}/#website`;

/** Tipo schema.org mais específico para páginas que não são "WebPage" genérica. */
function pageTypeFor(path: string): string {
  if (path === "/contato" || path === "/mapa") return "ContactPage";
  if (path === "/como-funciona" || path === "/marcas-e-parcerias") return "AboutPage";
  if (path === "/faq") return "FAQPage";
  if (
    path === "/portfolio" ||
    path === "/conteudos" ||
    path === "/mapa-do-site" ||
    path === "/onde-atuamos" ||
    path.startsWith("/reforma/")
  )
    return "CollectionPage";
  return "WebPage";
}

/** Nome curto da página (título sem o sufixo da marca). */
function shortName(title: string): string {
  return title.replace(/\s*[|·—–-]\s*Bewild\s*$/i, "").trim() || title;
}

/** Trilha de navegação da página (a mesma lógica das páginas no cliente). */
function trailFor(path: string, name: string): Array<{ name: string; path: string }> {
  const trail = [{ name: "Início", path: "/" }];
  if (path.startsWith("/portfolio/") || path.startsWith("/reforma/"))
    trail.push({ name: "Portfólio", path: "/portfolio" });
  else if (path.startsWith("/conteudos/")) trail.push({ name: "Conteúdos", path: "/conteudos" });
  else if (path.startsWith("/parceiros/")) trail.push({ name: "Parceiros", path: "/parceiros" });
  trail.push({ name, path });
  return trail;
}

/**
 * JSON-LD da página no HTML do servidor: WebPage (ou subtipo) com o mesmo
 * endereço do canonical, ligada ao WebSite/Organization do root, e a trilha
 * de navegação aninhada em `breadcrumb` (sem BreadcrumbList solta, para não
 * duplicar a que a própria página publica no cliente).
 */
function pageJsonLd(input: SeoHeadInput, path: string, canonical: string, image: string) {
  const name = shortName(input.title);
  return {
    "@context": "https://schema.org",
    "@type": pageTypeFor(path),
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: input.title,
    description: input.description,
    inLanguage: "pt-BR",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    primaryImageOfPage: { "@type": "ImageObject", url: image },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: trailFor(path, name).map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: t.name,
        item: t.path === "/" ? `${SITE_BASE}/` : `${SITE_BASE}${t.path}`,
      })),
    },
  };
}

export function seoHead(input: SeoHeadInput) {
  const cleanPath = (input.path.split("#")[0].split("?")[0] || "/").replace(/\/+$/, "") || "/";
  const canonical = cleanPath === "/" ? `${SITE_BASE}/` : `${SITE_BASE}${cleanPath}`;
  const og = absoluteUrl(input.ogImage || DEFAULT_OG_IMAGE_URL);

  const meta: Array<Record<string, string>> = [
    { title: input.title },
    { name: "description", content: input.description },
    {
      name: "robots",
      content: input.noindex ? "noindex, nofollow" : `index, follow, ${PREVIEW_DIRECTIVES}`,
    },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:url", content: canonical },
    { property: "og:type", content: input.ogType ?? "website" },
    { property: "og:image", content: og },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: og },
    { name: "DC.title", content: input.title },
  ];
  if (input.keywords) meta.push({ name: "keywords", content: input.keywords });

  // Canonical + hreflang só em páginas indexáveis (o __root não emite
  // canonical: <link> não deduplica entre root e rota).
  const links = input.noindex
    ? []
    : [
        { rel: "canonical", href: canonical },
        { rel: "alternate", hrefLang: "pt-BR", href: canonical },
        { rel: "alternate", hrefLang: "x-default", href: canonical },
      ];

  // Home: o JSON-LD completo (Organization/WebSite) já vem do __root.
  const scripts =
    input.noindex || cleanPath === "/"
      ? []
      : [
          {
            type: "application/ld+json",
            children: JSON.stringify(pageJsonLd(input, cleanPath, canonical, og)),
          },
        ];

  return { meta, links, scripts };
}
