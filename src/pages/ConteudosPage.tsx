/**
 * ConteudosPage — /conteudos (índice editorial)
 * Hero claro · filtros · destaque · grid · CTA.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { MobileBottomCTA } from "../components/landing/MobileBottomCTA";
import { StickyDiagnosticPanel } from "../components/landing/StickyDiagnosticPanel";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import { listConteudos, type Conteudo } from "../lib/conteudoData";
import { ImagePlaceholder } from "../components/landing/ImagePlaceholder";
import "../styles/conteudos.css";

function useReveals(root: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const node = root.current; if (!node) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { (e.target as HTMLElement).classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    node.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [root]);
}

export default function ConteudosPage() {
  const artigos = listConteudos();
  const destaque = artigos[0];
  const restantes = artigos.slice(1);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    artigos.forEach((a) => set.add(a.categoria));
    return ["Todos", ...Array.from(set)];
  }, [artigos]);

  const [filtro, setFiltro] = useState<string>("Todos");
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  useReveals(rootRef);

  useEffect(() => {
    const t = setTimeout(() => heroRef.current?.classList.add("is-ready"), 80);
    return () => clearTimeout(t);
  }, []);

  // Crossfade ao trocar de filtro
  function handleFiltro(cat: string) {
    if (cat === filtro) return;
    const grid = gridRef.current;
    if (grid) {
      grid.classList.add("is-fading");
      setTimeout(() => {
        setFiltro(cat);
        requestAnimationFrame(() => grid.classList.remove("is-fading"));
      }, 200);
    } else {
      setFiltro(cat);
    }
  }

  const visiveis = filtro === "Todos" ? restantes : restantes.filter((a) => a.categoria === filtro);
  const totalCount = filtro === "Todos" ? artigos.length : artigos.filter((a) => a.categoria === filtro).length;

  useSeo({
    title: "Conteúdos para decidir com menos achismo | Be Wild",
    description:
      "Análises e guias sobre preparar e operar studios no short stay em São Paulo. Sem promessa de renda garantida.",
    canonicalPath: "/conteudos",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Conteúdos Be Wild",
      url: "https://bwild.com.br/conteudos",
      numberOfItems: artigos.length,
      itemListElement: artigos.map((a, i) => ({
        "@type": "ListItem", position: i + 1,
        url: `https://bwild.com.br/conteudos/${a.slug}`, name: a.titulo,
      })),
    },
  });

  return (
    <div ref={rootRef} className="bewild-conteudos min-h-screen antialiased">
      <Header forceSolid />
      <main>
        {/* HERO */}
        <section ref={heroRef} className="hero">
          <div className="container">
            <p className="eyebrow">Conteúdos Be Wild</p>
            <h1 className="hero__title">
              <span className="hero__line"><span>Conteúdos para decidir</span></span>
              <span className="hero__line"><span className="italic">com menos achismo.</span></span>
            </h1>
            <p className="hero__sub">
              Análises e guias sobre preparar e operar studios no short stay em São Paulo.
              Sem promessa de renda garantida.
            </p>

            <div className="filters" role="tablist" aria-label="Filtros de categoria">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={filtro === cat}
                  className={`filter-pill ${filtro === cat ? "is-active" : ""}`}
                  onClick={() => handleFiltro(cat)}
                >
                  {cat}
                </button>
              ))}
              <span className="filter-count">{totalCount} conteúdo{totalCount === 1 ? "" : "s"}</span>
            </div>
          </div>
        </section>

        {/* DESTAQUE */}
        {destaque && (filtro === "Todos" || destaque.categoria === filtro) && (
          <section className="destaque-section">
            <div className="container">
              <article
                className="destaque"
                data-reveal
                onClick={() => navigate(`/conteudos/${destaque.slug}`)}
                role="link" tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") navigate(`/conteudos/${destaque.slug}`); }}
              >
                <div className="destaque__body">
                  <span className="selo">{destaque.categoria}</span>
                  <span className="destaque__meta">
                    {destaque.dataPublicacao} · {destaque.tempoLeitura} de leitura
                  </span>
                  <h2 className="destaque__title">{destaque.titulo}</h2>
                  <p className="destaque__resumo">{destaque.resumo}</p>
                  <button className="link-arrow" onClick={(e) => { e.stopPropagation(); navigate(`/conteudos/${destaque.slug}`); }}>
                    {destaque.cta} <span className="arr">→</span>
                  </button>
                </div>
                <div className="destaque__media">
                  <ImagePlaceholder assetId="hero-studio" showReveal={false} className="w-full h-full" />
                </div>
              </article>
            </div>
          </section>
        )}

        {/* GRID */}
        <section className="grid-section">
          <div className="container">
            <header className="grid-section__header" data-reveal>
              <h2 style={{ fontSize: "1.6rem" }}>Mais leituras</h2>
            </header>
            <div ref={gridRef} className="cards-grid">
              {visiveis.map((a, i) => (
                <button
                  key={a.slug}
                  className="card-art"
                  data-reveal
                  style={{ transitionDelay: `${i * 60}ms` }}
                  onClick={() => navigate(`/conteudos/${a.slug}`)}
                >
                  <span className="selo">{a.categoria}</span>
                  <h3 className="card-art__title">{a.titulo}</h3>
                  <p className="card-art__resumo">{a.resumo}</p>
                  <div className="card-art__footer">
                    <span>{a.dataPublicacao} · {a.tempoLeitura}</span>
                    <span className="link-arrow" style={{ fontSize: ".62rem" }}>
                      {a.cta} <span className="arr">→</span>
                    </span>
                  </div>
                </button>
              ))}
              {visiveis.length === 0 && (
                <p style={{ color: "var(--muted)", gridColumn: "1 / -1" }}>
                  Nenhum conteúdo nesta categoria ainda.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="cta-final">
          <div className="inner">
            <p className="eyebrow" data-reveal>Próximo passo</p>
            <h2 data-reveal>
              Quer avaliar o potencial <span className="italic">do seu imóvel?</span>
            </h2>
            <p className="lead" data-reveal>
              Diagnóstico gratuito. Sem compromisso. Avaliamos o seu ativo antes de qualquer recomendação.
            </p>
            <div className="ctas" data-reveal>
              <button onClick={() => navigate("/diagnostico")} className="btn-primary">
                Diagnosticar meu imóvel <span className="arr">→</span>
              </button>
              <a
                href={whatsappHref("Olá, vim pelos conteúdos da Be Wild.")}
                target="_blank" rel="noopener noreferrer"
                className="btn-ghost"
              >
                Falar pelo WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileBottomCTA />
      <StickyDiagnosticPanel />
      <FloatingWhatsAppButton />
    </div>
  );
}
