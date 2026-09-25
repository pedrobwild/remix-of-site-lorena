/**
 * Dados estruturados (JSON-LD) dos 6 posts dos Bastidores da home.
 *
 * Os posts não têm URL própria no site (ficam na home, em #bastidores), então
 * cada um vira um SocialMediaPosting dentro de um ItemList ligado à home.
 * Título e descrição são lidos do próprio HTML da seção — a mesma fonte do
 * texto visível — para nunca divergir nem inventar dados (sem data, sem
 * miniatura: o Instagram não nos fornece esses campos de forma confiável).
 */
import { HOME_BWA_HTML } from "@/pages/home-bwa-body";

const BASE_URL = "https://bewild.com.br";
const IG_PROFILE = "https://www.instagram.com/bewild.oficial/";

export type BastidoresPost = { code: string; name: string; description: string; tag: string };

const decode = (s: string) =>
  s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

export function parseBastidoresPosts(html: string = HOME_BWA_HTML): BastidoresPost[] {
  const start = html.indexOf('id="bastidores"');
  if (start < 0) return [];
  const section = html.slice(start, html.indexOf("</section>", start));
  return section
    .split("data-bst-card")
    .slice(1)
    .map((card) => {
      const code = card.match(/data-ig-post="([^"]+)"/)?.[1] ?? "";
      const tag = decode(card.match(/bwa-bastidores-tag">([\s\S]*?)<\/p>/)?.[1] ?? "");
      const name = decode(card.match(/bwa-bastidores-name">([\s\S]*?)<\/h3>/)?.[1] ?? "");
      const description = decode(card.match(/bwa-bastidores-text">([\s\S]*?)<\/p>/)?.[1] ?? "");
      return { code, tag, name, description };
    })
    .filter((p) => p.code && p.name);
}

/** Título/descrição editados no painel, por código do post. Vazio = texto do card. */
export type BastidoresSeoOverrides = Record<string, { title?: string; description?: string }>;

export function bastidoresJsonLd(
  posts: BastidoresPost[] = parseBastidoresPosts(),
  overrides: BastidoresSeoOverrides = {},
): Record<string, unknown> {
  const org = { "@type": "Organization", name: "Bewild", url: `${BASE_URL}/`, sameAs: [IG_PROFILE] };
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${BASE_URL}/#bastidores`,
    name: "Bastidores Bewild: o time em obra",
    description:
      "Arquitetas, engenheiros e equipe de execução da Bewild em campo, em posts do Instagram @bewild.oficial.",
    url: `${BASE_URL}/#bastidores`,
    numberOfItems: posts.length,
    itemListElement: posts.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SocialMediaPosting",
        "@id": `${BASE_URL}/#bastidores-${p.code}`,
        headline: overrides[p.code]?.title?.trim() || `${p.name} | Bastidores Bewild`,
        description: overrides[p.code]?.description?.trim() || p.description,
        ...(p.tag ? { keywords: p.tag.replace(/^\d+\s*·\s*/, "") } : {}),
        url: `https://www.instagram.com/p/${p.code}/`,
        sharedContent: { "@type": "WebPage", url: `https://www.instagram.com/p/${p.code}/` },
        isPartOf: { "@type": "WebPage", "@id": `${BASE_URL}/`, url: `${BASE_URL}/` },
        author: org,
        publisher: org,
        inLanguage: "pt-BR",
      },
    })),
  };
}
