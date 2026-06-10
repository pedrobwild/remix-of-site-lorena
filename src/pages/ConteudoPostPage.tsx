/**
 * ConteudoPostPage — /conteudos/[slug]
 * Template editorial: progress bar gold + corpo prose + próximo passo + continue lendo.
 */
import { useEffect, useRef } from "react";
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import { MobileBottomCTA } from "../components/landing/MobileBottomCTA";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import { ArrowLeft } from "lucide-react";
import { getConteudo, listConteudos } from "../lib/conteudoData";
import "../styles/conteudos.css";

type Props = { slug: string };

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

export default function ConteudoPostPage({ slug }: Props) {
  const artigo = getConteudo(slug);
  const todos = listConteudos();

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [slug]);

  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  useReveals(rootRef);

  // Entrada da máscara H1
  useEffect(() => {
    const t = setTimeout(() => headerRef.current?.classList.add("is-ready"), 80);
    return () => clearTimeout(t);
  }, [slug]);

  // Progress bar de leitura (scaleX 0 → 1 ao longo do corpo do artigo)
  useEffect(() => {
    const onScroll = () => {
      const fill = progressRef.current;
      const article = articleRef.current;
      if (!fill || !article) return;
      const rect = article.getBoundingClientRect();
      const start = rect.top + window.scrollY - 80;
      const end = start + rect.height - window.innerHeight * 0.6;
      const total = Math.max(1, end - start);
      const progress = Math.min(1, Math.max(0, (window.scrollY - start) / total));
      fill.style.transform = `scaleX(${progress})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [slug]);

  useSeo({
    title: artigo?.seo.title ?? "Conteúdos Be Wild",
    description: artigo?.seo.description ?? "Guias e análises sobre short stay em São Paulo.",
    canonicalPath: artigo ? `/conteudos/${artigo.slug}` : "/conteudos",
    ogType: "article",
    noindex: !artigo,
    jsonLd: artigo
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: artigo.titulo,
          description: artigo.resumo,
          datePublished: artigo.dataIso,
          author: { "@type": "Organization", name: "Be Wild", url: "https://bwild.com.br" },
          publisher: {
            "@type": "Organization", name: "Be Wild", url: "https://bwild.com.br",
            logo: { "@type": "ImageObject", url: "https://bwild.com.br/images/bewild-logo.png" },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": `https://bwild.com.br/conteudos/${slug}` },
          keywords: artigo.seo.keywords,
          inLanguage: "pt-BR",
        }
      : undefined,
  });

  if (!artigo) {
    return (
      <div ref={rootRef} className="bewild-conteudos min-h-screen antialiased">
        <Header forceSolid />
        <main style={{ padding: "9rem 1.5rem 6rem", textAlign: "center" }}>
          <p style={{ color: "var(--muted)", marginBottom: ".8rem" }}>Artigo não encontrado.</p>
          <button onClick={() => navigate("/conteudos")} className="link-arrow">
            <ArrowLeft className="h-4 w-4" /> Ver todos os conteúdos
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const relacionados = todos.filter((c) => c.slug !== slug).slice(0, 3);
  const tituloCurto = artigo.titulo.length > 28 ? artigo.titulo.slice(0, 28) + "…" : artigo.titulo;

  return (
    <div ref={rootRef} className="bewild-conteudos min-h-screen antialiased">
      <Header forceSolid />

      {/* Progress bar */}
      <div className="progress" aria-hidden="true">
        <div ref={progressRef} className="progress__fill" />
      </div>

      <main>
        {/* CABEÇALHO */}
        <header ref={headerRef} className="article-header">
          <div className="reading">
            <nav className="article-header__bc" aria-label="Breadcrumb">
              <button onClick={() => navigate("/")}>Início</button>
              <span className="article-header__sep">/</span>
              <button onClick={() => navigate("/conteudos")}>Conteúdos</button>
              <span className="article-header__sep">/</span>
              <span className="article-header__current" title={artigo.titulo}>{tituloCurto}</span>
            </nav>

            <span className="selo">{artigo.categoria}</span>

            <h1 className="article-header__title">
              <span className="hero__line"><span>{artigo.titulo}</span></span>
            </h1>

            <p className="article-header__sub">{artigo.resumo}</p>

            <p className="article-header__meta">
              {artigo.dataPublicacao} · {artigo.tempoLeitura} de leitura · Be Wild
            </p>
          </div>
        </header>

        {/* CORPO */}
        <section ref={articleRef} className="article-body">
          <div
            className="reading conteudo-prose"
            dangerouslySetInnerHTML={{ __html: artigo.corpoHtml }}
          />
        </section>

        {/* PRÓXIMO PASSO */}
        <section className="next-step">
          <div className="reading">
            <div className="next-step__card" data-reveal>
              <div>
                <p className="eyebrow">Próximo passo</p>
                <h2>Quer avaliar o potencial do seu imóvel?</h2>
                <p>Diagnóstico gratuito. Sem compromisso. Avaliamos o seu ativo antes de qualquer recomendação.</p>
              </div>
              <div className="next-step__ctas">
                <button onClick={() => navigate("/diagnostico")} className="btn-primary">
                  Diagnosticar meu imóvel <span className="arr">→</span>
                </button>
                <a
                  href={whatsappHref(`Olá, li o artigo "${artigo.titulo}" e quero conversar sobre meu imóvel.`)}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-ghost"
                >
                  Falar pelo WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CONTINUE LENDO */}
        {relacionados.length > 0 && (
          <section className="continue">
            <div className="container">
              <header className="grid-section__header" data-reveal>
                <div>
                  <p className="eyebrow">Continue lendo</p>
                  <h2 style={{ marginTop: ".4rem" }}>Mais conteúdos Be Wild</h2>
                </div>
              </header>
              <div className="cards-grid">
                {relacionados.map((rel, i) => (
                  <button
                    key={rel.slug}
                    className="card-art"
                    data-reveal
                    style={{ transitionDelay: `${i * 60}ms` }}
                    onClick={() => navigate(`/conteudos/${rel.slug}`)}
                  >
                    <span className="selo">{rel.categoria}</span>
                    <h3 className="card-art__title">{rel.titulo}</h3>
                    <p className="card-art__resumo">{rel.resumo}</p>
                    <div className="card-art__footer">
                      <span>{rel.dataPublicacao} · {rel.tempoLeitura}</span>
                      <span className="link-arrow" style={{ fontSize: ".62rem" }}>
                        {rel.cta} <span className="arr">→</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="continue__see-all">
                <button onClick={() => navigate("/conteudos")} className="link-arrow">
                  <ArrowLeft className="h-4 w-4" /> Ver todos os conteúdos
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <MobileBottomCTA />
      <FloatingWhatsAppButton />
    </div>
  );
}
