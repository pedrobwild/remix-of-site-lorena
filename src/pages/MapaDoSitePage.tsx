// Página /mapa-do-site — índice HTML de todas as páginas públicas e dos projetos
// do portfólio. Objetivo de SEO: dar ao Google (e a pessoas) um caminho de links
// internos rastreáveis até cada /portfolio/<slug>, complementando o sitemap.xml.
import { useMemo } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { PUBLIC_PAGES } from "@/lib/publicPages";
import { projectFriendlyName } from "@/lib/projectSeo";
import { useBewildProjects, type BewildProject } from "@/lib/useBewildProjects";
import { breadcrumbJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { routes } from "@/lib/useHashRoute";
import "./mapa-do-site.css";

const SEM_BAIRRO = "Outros projetos em São Paulo";

export default function MapaDoSitePage({ initialProjects }: { initialProjects?: BewildProject[] | null } = {}) {
  const { settings } = useSiteSettings();
  const { projects, loading, error } = useBewildProjects(initialProjects);

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
    title: "Mapa do site: páginas e projetos de reforma | Bewild",
    description:
      "Índice com todas as páginas da Bewild e os projetos de reforma de apartamentos e studios em São Paulo, organizados por bairro.",
    canonicalPath: "/mapa-do-site",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Mapa do site", path: "/mapa-do-site" },
          ]),
        ]
      : undefined,
  });

  return (
    <div className="bwa-msite-page">
      <BwaNav />
      <main id="main" tabIndex={-1}>
        <section className="bwa-msite-intro">
          <div className="bwa-shell">
            <p className="bwa-label">Mapa do site</p>
            <h1>Todas as páginas e projetos da Bewild.</h1>
            <p className="bwa-msite-lead">
              Um índice para você chegar direto ao que procura: páginas do site e{" "}
              {loading ? "os projetos" : `${projects.length} projetos`} de reforma, por bairro.
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
      </main>
      <BwaFooter />
    </div>
  );
}
