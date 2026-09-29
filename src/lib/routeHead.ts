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

  return { meta, links };
}
