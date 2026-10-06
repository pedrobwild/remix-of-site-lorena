// Página /mapa-do-site — índice HTML de todas as páginas públicas, das páginas de
// bairro (/reforma/<bairro>), dos projetos do portfólio e dos conteúdos. Objetivo
// de SEO: dar ao Google (e a pessoas) um caminho de links internos rastreáveis até
// cada /portfolio/<slug>, /reforma/<bairro> e /conteudos/<slug>, complementando o
// sitemap.xml. Os dados chegam do loader da rota (SSR); os hooks só buscam sem eles.
import { useMemo } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { PUBLIC_PAGES } from "@/lib/publicPages";
import { neighborhoodPages } from "@/lib/portfolioFilter";
import { projectFriendlyName } from "@/lib/projectSeo";
import { useBewildPosts, type BewildPost } from "@/lib/useBewildPosts";
import { useBewildProjects, type BewildProject } from "@/lib/useBewildProjects";
import { useSeo } from "@/lib/useSeo";
import { routes } from "@/lib/useHashRoute";
import "./mapa-do-site.css";

const SEM_BAIRRO = "Outros projetos em São Paulo";

export default function MapaDoSitePage({
  initialProjects,
  initialPosts,
}: { initialProjects?: BewildProject[] | null; initialPosts?: BewildPost[] | null } = {}) {
  const { projects, loading, error } = useBewildProjects(initialProjects);
  const { posts, loading: postsLoading, error: postsError } = useBewildPosts(initialPosts);

  // Mesma regra do sitemap e de /reforma/$slug: só bairros com projetos suficientes.
  const bairros = useMemo(() => neighborhoodPages(projects), [projects]);

  const groups = useMemo(() => {
    const map = new Map<string, { slug: string; name: string }[]>();
    for (const p of projects) {
      const place = (p.neighborhood || "").trim() || SEM_BAIRRO;
      const list = map.get(place) ?? [];
      list.push({ slug: p.slug, name: projectFriendlyName(p) || p.title });
      map.set(place, list);
    }
    return [...map.entries()]
      .map(([place, items]) => ({
        place,
        items: items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      }))
      .sort((a, b) => {
        if (a.place === SEM_BAIRRO) return 1;
        if (b.place === SEM_BAIRRO) return -1;
        return a.place.localeCompare(b.place, "pt-BR");
      });
  }, [projects]);

  useSeo({
    title: "Mapa do site: páginas, bairros, projetos e conteúdos | Bewild",
    description:
      "Índice com todas as páginas da Bewild, as páginas de reforma por bairro, os projetos de apartamentos e studios reformados em São Paulo e os guias de conteúdo.",
    canonicalPath: "/mapa-do-site",
    ogType: "website",
  });

  return (
    <div className="bwa-msite-page">
      <BwaNav />
      <main id="main" tabIndex={-1}>
        <section className="bwa-msite-intro">
          <div className="bwa-shell">
            <p className="bwa-label">Mapa do site</p>
            <h1>Todas as páginas, projetos e conteúdos da Bewild.</h1>
            <p className="bwa-msite-lead">
              Um índice para você chegar direto ao que procura: páginas do site, reforma por bairro,{" "}
              {loading ? "os projetos" : `${projects.length} projetos`} de reforma e{" "}
              {postsLoading ? "os guias" : `${posts.length} guias`} de conteúdo.
            </p>
          </div>
        </section>

        <section className="bwa-msite-section" aria-labelledby="msite-paginas">
          <div className="bwa-shell">
            <h2 id="msite-paginas">Páginas</h2>
            <ul className="bwa-msite-list">
              <li><a href={routes.home}>Início</a></li>
              {PUBLIC_PAGES.map((p) => (
                <li key={p.path}><a href={p.path}>{p.label}</a></li>
              ))}
            </ul>
          </div>
        </section>

        {bairros.length > 0 && (
          <section className="bwa-msite-section" aria-labelledby="msite-bairros">
            <div className="bwa-shell">
              <h2 id="msite-bairros">Reforma de apartamento por bairro</h2>
              <ul className="bwa-msite-list">
                {bairros.map((b) => (
                  <li key={b.slug}>
                    <a href={routes.bairro(b.slug)}>
                      Reforma de apartamento em {b.label}{" "}
                      <span className="bwa-msite-count">({b.count})</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="bwa-msite-section" aria-labelledby="msite-projetos">
          <div className="bwa-shell">
            <h2 id="msite-projetos">Projetos do portfólio</h2>
            {loading && <p className="bwa-msite-state" role="status">Carregando projetos…</p>}
            {!loading && error && (
              <p className="bwa-msite-state" role="alert">
                Não foi possível carregar os projetos agora. Veja todos em{" "}
                <a href={routes.portfolio}>Portfólio</a>.
              </p>
            )}
            {!loading && !error && groups.length === 0 && (
              <p className="bwa-msite-state">
                Nenhum projeto publicado no momento. Veja o <a href={routes.portfolio}>Portfólio</a>.
              </p>
            )}
            {groups.map((g) => (
              <div key={g.place} className="bwa-msite-group">
                <h3>
                  {g.place} <span className="bwa-msite-count">({g.items.length})</span>
                </h3>
                <ul className="bwa-msite-list">
                  {g.items.map((it) => (
                    <li key={it.slug}>
                      <a href={routes.bewildProject(it.slug)}>{it.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="bwa-msite-section" aria-labelledby="msite-conteudos">
          <div className="bwa-shell">
            <h2 id="msite-conteudos">Conteúdos e guias</h2>
            {postsLoading && <p className="bwa-msite-state" role="status">Carregando conteúdos…</p>}
            {!postsLoading && postsError && (
              <p className="bwa-msite-state" role="alert">
                Não foi possível carregar os conteúdos agora. Veja todos em{" "}
                <a href={routes.conteudos}>Conteúdos</a>.
              </p>
            )}
            {!postsLoading && !postsError && posts.length === 0 && (
              <p className="bwa-msite-state">
                Nenhum conteúdo publicado no momento. Veja <a href={routes.conteudos}>Conteúdos</a>.
              </p>
            )}
            {posts.length > 0 && (
              <ul className="bwa-msite-list">
                {posts.map((p) => (
                  <li key={p.slug}>
                    <a href={routes.conteudosPost(p.slug)}>{p.title}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <BwaFooter />
    </div>
  );
}
