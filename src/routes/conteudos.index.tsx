import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import BewildConteudosPage from "@/pages/BewildConteudosPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
import { loadPageSeo } from "@/lib/pageSeo.functions";
import { resolvePageSeo } from "@/lib/pageSeo";
import { comCanonicalDaPagina, parsePagina, seoDaPagina } from "@/lib/conteudosPagination";
// Import tardio: o loader da rota entra no pacote de TODA página; assim os
// carregadores de conteúdo (posts, projetos, vídeos…) só baixam quando usados.
const contentLoaders = () => import("@/lib/contentLoaders");
// Os dados estruturados são montados no loader (import tardio): o head() roda
// no pacote de toda página, e o montador puxa vídeos, posts e projetos.

const KEYWORDS = "projeto de arquitetura, arquitetura e engenharia, engenharia civil, custo de reforma, quanto custa reformar um apartamento, custo de reforma de apartamento em SP, etapas de uma reforma, prazo de reforma de apartamento, reforma de apartamento em SP, Bewild";

export const Route = createFileRoute("/conteudos/")({
  validateSearch: (s: Record<string, unknown>): { q?: string; pagina?: number } => ({
    q: typeof s.q === "string" && s.q ? s.q.slice(0, 120) : undefined,
    pagina: parsePagina(s.pagina),
  }),
  // Só a página recarrega a lista: digitar na busca (`q`) não refaz o loader.
  loaderDeps: ({ search }) => ({ pagina: search.pagina ?? 1 }),
  loader: async ({ deps, location }) => {
    const search = location.search as { pagina?: unknown; q?: unknown };
    // A página 1 é /conteudos (sem ?pagina=1, que seria a mesma lista em outro endereço).
    if (parsePagina(search.pagina) === 1) {
      throw redirect({ to: "/conteudos", search: {}, statusCode: 301 });
    }
    const q = typeof search.q === "string" ? search.q : "";
    const [content, seo] = await Promise.all([
      contentLoaders().then((m) => m.loadPostListPage(deps.pagina, { busca: !!q.trim() })),
      loadPageSeo({ data: "/conteudos" }),
    ]);
    const page = content.pagina;
    const jsonLd = page
      ? (await import("@/lib/routeHeadData")).postListJsonLd(
          // Mesma ordem da tela: destaque (só na página 1) e o lote da página.
          [...(page.featured ? [page.featured] : []), ...page.posts].map((p) => ({ slug: p.slug, title: p.title, cover_image: p.cover_image })),
        )
      : null;
    return { ...content, numero: deps.pagina, seo, jsonLd };
  },
  component: RouteComponent,
  head: ({ loaderData, matches }) => {
    const numero = loaderData?.numero ?? 1;
    if (numero <= 1) {
      return seoHead({ pagesSeo: rootPagesSeo(matches), jsonLd: loaderData?.jsonLd ?? null, ...(loaderData?.seo ?? resolvePageSeo("/conteudos")), path: "/conteudos", keywords: KEYWORDS });
    }
    // Página N ≥ 2: título e descrição da página 1 (já com a aba Páginas do
    // /admin/seo, resolvida no loader) com o número; canonical para ela mesma.
    const seo = pagedSeo(loaderData?.seo, numero);
    return comCanonicalDaPagina(
      seoHead({ ...seo, jsonLd: loaderData?.jsonLd ?? null, path: "/conteudos", keywords: KEYWORDS }),
      numero,
    );
  },
});

/** Mesmo título, descrição e imagem no head() do servidor e no useSeo do navegador. */
function pagedSeo(seo: ReturnType<typeof resolvePageSeo> | undefined, numero: number) {
  const base = seo ?? resolvePageSeo("/conteudos");
  const { title, description } = seoDaPagina({ title: base.title, description: base.description }, numero);
  return { title, description, ogImage: base.ogImage };
}

function RouteComponent() {
  const data = Route.useLoaderData();
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/conteudos/" });
  const numero = data?.numero ?? 1;
  return (
    <BewildConteudosPage
      page={data?.pagina ?? null}
      initialIndex={data?.index ?? null}
      pagedSeo={numero > 1 ? { ...pagedSeo(data?.seo, numero), canonicalSearch: `?pagina=${numero}` } : null}
      query={q ?? ""}
      onQueryChange={(next) => navigate({ search: (prev) => ({ ...prev, q: next || undefined }), replace: true, resetScroll: false })}
    />
  );
}
