import { formatAreaM2 } from "@/lib/formatArea";
/**
 * BairroPage — /reforma/<bairro>. Lista os projetos reais entregues num
 * bairro de São Paulo (só bairros com MIN_PROJECTS_PER_NEIGHBORHOOD+).
 * Bairro abaixo do mínimo ou inexistente → 404 (evita página rala).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { optimizedImageUrl, optimizedSrcSet } from "@/lib/imageUrl";
import { projectFriendlyName } from "@/lib/projectSeo";
import { useImageAlts } from "@/lib/useImageAlts";
import { useSeo } from "@/lib/useSeo";
import { projectListJsonLd } from "@/lib/contentJsonLd";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import NotFoundPage from "./NotFoundPage";
import BairroLeadForm from "@/components/BairroLeadForm";
import { useBewildProjects, bewildTypeLabel, type BewildProject } from "@/lib/useBewildProjects";
import { neighborhoodPages, neighborhoodSlug } from "@/lib/portfolioFilter";
import { reportProjectClick } from "@/lib/conversions";
import "@/styles/bwh-tokens.css";
import "@/styles/bwh-overlays.css";
import "@/styles/bwh-sol-fusion.css";

const PAGE_SIZE = 24;
const GRID_SIZES = "(max-width: 640px) 100vw, (max-width: 980px) 50vw, 33vw";
const pad = (n: number) => String(n).padStart(2, "0");

export default function BairroPage({
  slug,
  initialProjects,
}: {
  slug: string;
  initialProjects?: BewildProject[] | null;
}) {
  const { projects, loading, error } = useBewildProjects(initialProjects);

  const pages = useMemo(() => neighborhoodPages(projects), [projects]);
  const page = pages.find((p) => p.slug === slug);
  const list = useMemo(
    () =>
      projects.filter(
        (p) => p.cover_url && p.neighborhood && neighborhoodSlug(p.neighborhood) === slug,
      ),
    [projects, slug],
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => setVisibleCount(PAGE_SIZE), [slug]);
  const visible = useMemo(() => list.slice(0, visibleCount), [list, visibleCount]);
  const coverAlts = useImageAlts(useMemo(() => visible.map((p) => p.cover_url), [visible]));
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = visible.length < list.length;
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, list.length));
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, list.length, visibleCount]);
  const label = page?.label ?? "";
  const areas = list.map((p) => p.area_m2).filter((n): n is number => !!n);
  // Metragem sempre por formatAreaM2 (pt-BR, vírgula decimal): "24,5 a 35,12 m²".
  const areaNum = (n: number) => (formatAreaM2(n) ?? "").replace(/\s*m²$/, "");
  const faixa = areas.length
    ? Math.min(...areas) === Math.max(...areas)
      ? formatAreaM2(areas[0])
      : `${areaNum(Math.min(...areas))} a ${areaNum(Math.max(...areas))} m²`
    : null;

  useSeo({
    title: `Reforma de apartamento em ${label || "São Paulo"}: projetos e orçamento | Bewild`,
    description: `${list.length} apartamentos reformados pela Bewild em ${label}, São Paulo${
      faixa ? ` (${faixa})` : ""
    }: fotos reais de cada obra e orçamento sem custo para o seu imóvel no bairro.`,
    canonicalPath: `/reforma/${slug}`,
    ogType: "website",
    ogImage: list[0]?.cover_url ?? undefined,
    noindex: !loading && !page,
    // ItemList sai no head() da rota; aqui só se o loader falhou.
    jsonLd: !initialProjects && page ? projectListJsonLd(list) : undefined,
  });

  if (!loading && !error && !page) return <NotFoundPage />;
  const remaining = Math.max(0, list.length - visible.length);
  const loadMore = () => setVisibleCount((c) => Math.min(c + PAGE_SIZE, list.length));

  const others = pages.filter((p) => p.slug !== slug);

  return (
    <div className="bwh">
      <BwaNav />
      <main id="main" tabIndex={-1}>
        <section className="bwh-sec" style={{ paddingBottom: 0 }}>
          <div className="bwh-wrap">
            <nav aria-label="Você está em" className="bwh-mono" style={{ marginBottom: 16 }}>
              <a href="/portfolio">Portfólio</a> / <span>{label || "…"}</span>
            </nav>
            <div className="bwh-srlabel" style={{ borderTop: 0, paddingTop: 0 }}>
              <span className="bwh-mono bwh-label bwh-label--accent">Reformas no bairro</span>
              <span className="bwh-mono">{label ? `${label} · São Paulo` : "São Paulo"}</span>
            </div>
            <h1 className="bwh-h2" style={{ marginBottom: 24 }}>
              Reforma de apartamento em <em>{label || "São Paulo"}.</em>
            </h1>
            {page && (
              <p className="bwh-lead" style={{ margin: "0 0 32px" }}>
                {pad(list.length)} apartamentos entregues pela Bewild em {label}
                {faixa ? `, de ${faixa}` : ""}. Cada um com projeto próprio de layout, marcenaria,
                iluminação e acabamento — veja as fotos reais e abra a página de cada obra.{" "}
                <a href="#orcamento" style={{ textDecoration: "underline" }}>Pedir orçamento em {label}</a>.
              </p>
            )}
          </div>
        </section>

        <section className="bwh-sec">
          <div className="bwh-wrap">
            {loading && (
              <div className="bwh-projects" aria-busy="true" aria-live="polite">
                <div className="bwh-pf-skel" />
                <div className="bwh-pf-skel" />
                <div className="bwh-pf-skel" />
              </div>
            )}
            {!loading && error && (
              <p style={{ color: "var(--ink2)", fontSize: 15 }}>
                Não conseguimos carregar os projetos agora.{" "}
                <a href="/portfolio" style={{ textDecoration: "underline" }}>
                  Ver o portfólio completo
                </a>
                .
              </p>
            )}
            {!loading && !error && list.length > 0 && (
              <>
              <div className="bwh-projects">
                {visible.map((p, i) => (
                  <a
                    key={p.id}
                    href={`/portfolio/${p.slug}`}
                    className="bwh-proj"
                    aria-label={`Ver projeto ${projectFriendlyName(p) || p.title}`}
                    onClick={() => reportProjectClick(p.slug, p.title, i + 1)}
                  >
                    <div className="bwh-proj__media">
                      <img
                        src={optimizedImageUrl(p.cover_url!, 640, 70)}
                        srcSet={optimizedSrcSet(p.cover_url!)}
                        sizes={GRID_SIZES}
                        width={640}
                        height={480}
                        alt={
                          coverAlts[p.cover_url!] ||
                          `${projectFriendlyName(p) || p.title} — ${bewildTypeLabel(p.project_type)} em ${label}`
                        }
                        loading={i < 3 ? "eager" : "lazy"}
                        fetchPriority={i < 3 ? "high" : undefined}
                        decoding="async"
                      />
                      <span className="bwh-proj__count">
                        {pad(i + 1)} / {pad(list.length)}
                      </span>
                      <span className="bwh-proj__go">Ver projeto →</span>
                    </div>
                    <div className="bwh-proj__t">
                      {projectFriendlyName(p) || p.title}
                      {formatAreaM2(p.area_m2) ? <em> · {formatAreaM2(p.area_m2)}</em> : null}
                    </div>
                    <div className="bwh-proj__meta">
                      {[label, bewildTypeLabel(p.project_type), p.duration].filter(Boolean).join(" · ")}
                    </div>
                  </a>
                ))}
              </div>
              {remaining > 0 && (
                <>
                  <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
                    <button type="button" className="bwh-btn" onClick={loadMore}>
                      Ver mais projetos ({remaining})
                    </button>
                  </div>
                </>
              )}
              </>
            )}

            {others.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <h2 className="bwh-mono bwh-label" style={{ marginBottom: 16 }}>
                  Reformas em outros bairros
                </h2>
                <ul style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", listStyle: "none", padding: 0 }}>
                  {others.map((o) => (
                    <li key={o.slug}>
                      <a href={`/reforma/${o.slug}`} style={{ textDecoration: "underline" }}>
                        {o.label} ({o.count})
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="bwh-sec bwh-sec--dark" id="orcamento">
          <div className="bwh-wrap" style={{ maxWidth: 900, textAlign: "center" }}>
            <h2 className="bwh-h2" style={{ margin: "0 auto 24px", color: "#fff" }}>
              Tem um apartamento em {label || "São Paulo"}? <em>A gente reforma.</em>
            </h2>
            <p className="bwh-lead" style={{ margin: "0 auto 32px" }}>
              Conte a metragem e o que você precisa: a gente devolve escopo, prazo e próximos passos, sem custo.
            </p>
            {page && <BairroLeadForm bairro={label} />}
          </div>
        </section>
      </main>
      <BwaFooter />
    </div>
  );
}
