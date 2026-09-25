/**
 * Páginas públicas editáveis na aba "Páginas" de /admin/seo.
 *
 * A home fica de fora: tem aba própria (campos `home_seo_*`). Rotas
 * dinâmicas (artigos, projetos) também ficam de fora — cada registro já
 * tem os próprios campos de SEO no editor do conteúdo.
 *
 * Toda rota listada aqui existe em `useHashRoute.ts` e em `STATIC_ROUTES`
 * (ver docs/ROUTING.md).
 */
export type PublicPage = { path: string; label: string };

export const PUBLIC_PAGES: PublicPage[] = [
  { path: "/portfolio", label: "Portfólio" },
  { path: "/conteudos", label: "Conteúdos (blog)" },
  { path: "/como-funciona", label: "Como funciona" },
  { path: "/escopo", label: "Escopo" },
  { path: "/orcamento", label: "Orçamento" },
  { path: "/contato", label: "Contato" },
  { path: "/faq", label: "Perguntas frequentes" },
  { path: "/onde-atuamos", label: "Onde atuamos" },
  { path: "/reforma-de-apartamento-sao-paulo", label: "Reforma de apartamento em SP" },
  { path: "/reforma-de-studio-sao-paulo", label: "Reforma de studio em SP" },
  { path: "/reforma-de-cobertura-sao-paulo", label: "Reforma de cobertura em SP" },
  { path: "/marcenaria", label: "Marcenaria" },
  { path: "/guia-do-investidor", label: "Guia do investidor" },
  { path: "/parceiros", label: "Clientes e corretores" },
  { path: "/parceiros/incorporadoras", label: "Incorporadoras" },
  { path: "/indique-um-amigo", label: "Indique um amigo" },
  { path: "/marcas-e-parcerias", label: "Marcas e parcerias" },
  { path: "/autorizacao-condominio", label: "Autorização de condomínio" },
  { path: "/acessibilidade", label: "Acessibilidade" },
  { path: "/privacidade", label: "Privacidade" },
];

export type PageSeoOverride = {
  title?: string;
  description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
};

export type PagesSeoMap = Record<string, PageSeoOverride>;

/** Normaliza um caminho para chave do mapa: sem query/hash e sem barra final. */
export function normalizePagePath(path: string): string {
  const clean = (path || "/").split("#")[0].split("?")[0] || "/";
  const withSlash = clean.startsWith("/") ? clean : `/${clean}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : "/";
}

/** Override salvo no painel para um caminho (só valores preenchidos). */
export function pageSeoOverride(
  map: PagesSeoMap | null | undefined,
  path: string,
): PageSeoOverride {
  const entry = map?.[normalizePagePath(path)];
  if (!entry || typeof entry !== "object") return {};
  const out: PageSeoOverride = {};
  for (const k of ["title", "description", "og_title", "og_description", "og_image"] as const) {
    const v = typeof entry[k] === "string" ? entry[k]!.trim() : "";
    if (v) out[k] = v;
  }
  return out;
}
