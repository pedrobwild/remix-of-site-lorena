/**
 * ConteudoPostPage — /conteudos/[slug]
 * Página individual de artigo do hub de conteúdo Be Wild.
 *
 * SEO 2026:
 * - JSON-LD Article (Google/GEO)
 * - canonical path único por artigo
 * - breadcrumb estruturado
 * - og:type "article" + og:image padrão
 * - meta description por artigo
 *
 * Design: light mode editorial (be wild design system)
 * - Hero cream com eyebrow + título H1
 * - Corpo tipográfico legível, largura limitada (prose)
 * - CTA de diagnóstico fixo no final
 * - Artigos relacionados (outros 3 artigos)
 */
import { useEffect } from "react";
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import { MobileBottomCTA } from "../components/landing/MobileBottomCTA";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  Tag,
  BookOpen,
} from "lucide-react";
import {
  getConteudo,
  listConteudos,
  CATEGORIA_COLOR_MAP,
} from "../lib/conteudoData";

/* ─── Prop ───────────────────────────────────────────────── */
type Props = { slug: string };

/* ─── Componente ─────────────────────────────────────────── */
export default function ConteudoPostPage({ slug }: Props) {
  const artigo = getConteudo(slug);
  const todos = listConteudos();

  // Scroll to top ao entrar na página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  /* ── SEO ──────────────────────────────────────────────── */
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
          author: {
            "@type": "Organization",
            name: "Be Wild",
            url: "https://bwild.com.br",
          },
          publisher: {
            "@type": "Organization",
            name: "Be Wild",
            url: "https://bwild.com.br",
            logo: {
              "@type": "ImageObject",
              url: "https://bwild.com.br/images/bewild-logo.png",
            },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://bwild.com.br/conteudos/${slug}`,
          },
          keywords: artigo.seo.keywords,
          inLanguage: "pt-BR",
        }
      : undefined,
  });

  /* ── 404 inline ───────────────────────────────────────── */
  if (!artigo) {
    return (
      <div className="bwild-light min-h-screen bg-bewild-cream font-body antialiased">
        <Header forceSolid />
        <main className="pt-36 pb-24 px-5 text-center">
          <p className="text-bewild-text-muted mb-4">Artigo não encontrado.</p>
          <button
            onClick={() => navigate("/conteudos")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-bewild-gold-accessible"
          >
            <ArrowLeft className="h-4 w-4" /> Ver todos os conteúdos
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Artigos relacionados (todos exceto o atual, max 3) ── */
  const relacionados = todos
    .filter((c) => c.slug !== slug)
    .slice(0, 3);

  const categoriaClass =
    CATEGORIA_COLOR_MAP[artigo.categoriaColor] ??
    "text-bewild-gold border-bewild-gold/30 bg-bewild-gold/8";

  return (
    <div className="bwild-light min-h-screen bg-bewild-cream font-body text-bewild-text-body antialiased">
      <Header />

      <main>
        {/* ── Hero da página ─────────────────────────────── */}
        <section
          className="pt-28 pb-16 sm:pt-36 sm:pb-20"
          style={{ background: "var(--bw-cream)" }}
        >
          <div className="mx-auto max-w-[46rem] px-5 sm:px-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-bewild-text-muted mb-8">
              <button
                onClick={() => navigate("/")}
                className="hover:text-bewild-gold-accessible transition-colors"
              >
                Início
              </button>
              <span>/</span>
              <button
                onClick={() => navigate("/conteudos")}
                className="hover:text-bewild-gold-accessible transition-colors"
              >
                Conteúdos
              </button>
              <span>/</span>
              <span className="text-bewild-text-body line-clamp-1 max-w-[18ch]">
                {artigo.titulo}
              </span>
            </nav>

            {/* Categoria */}
            <span
              className={`inline-flex items-center gap-1.5 mb-5 rounded-full border px-3 py-1 text-xs font-medium ${categoriaClass}`}
            >
              <Tag className="h-3 w-3" />
              {artigo.categoria}
            </span>

            {/* Título H1 */}
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-bewild-ink leading-tight mb-5"
              style={{ letterSpacing: "-0.025em" }}
            >
              {artigo.titulo}
            </h1>

            {/* Resumo */}
            <p
              className="text-lg leading-relaxed mb-7"
              style={{
                fontFamily: "var(--bw-font-display)",
                fontStyle: "italic",
                color: "var(--bw-text-muted, #747474)",
              }}
            >
              {artigo.resumo}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-5 text-xs text-bewild-text-muted border-t border-bewild-cream-200 pt-5">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {artigo.dataPublicacao}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {artigo.tempoLeitura} de leitura
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Be Wild
              </span>
            </div>
          </div>
        </section>

        {/* ── Corpo do artigo ────────────────────────────── */}
        <section className="py-10 bg-white border-t border-bewild-cream-200">
          <div
            className="mx-auto max-w-[46rem] px-5 sm:px-8 conteudo-prose"
            dangerouslySetInnerHTML={{ __html: artigo.corpoHtml }}
          />
        </section>

        {/* ── CTA Diagnóstico ────────────────────────────── */}
        <section className="py-16 border-t border-bewild-cream-200 bg-white">
          <div className="mx-auto max-w-[46rem] px-5 sm:px-8">
            <div
              className="rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6"
              style={{ background: "var(--bw-cream)" }}
            >
              <div className="flex-1">
                <p
                  className="font-mono text-xs uppercase tracking-[0.14em] mb-2"
                  style={{ color: "var(--bw-gold-accessible)" }}
                >
                  Próximo passo
                </p>
                <h2 className="text-xl font-bold text-bewild-ink mb-2">
                  Quer avaliar o potencial do seu imóvel?
                </h2>
                <p className="text-sm text-bewild-text-muted leading-relaxed">
                  Diagnóstico gratuito. Sem compromisso. Avaliamos o seu ativo antes de qualquer recomendação.
                </p>
              </div>
              <div className="flex flex-col gap-3 flex-shrink-0">
                <button
                  onClick={() => navigate("/diagnostico")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all hover:shadow-[0_8px_24px_rgba(0,76,127,0.18)] hover:-translate-y-0.5"
                  style={{ background: "var(--bw-ink)", color: "#fff" }}
                >
                  Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href={whatsappHref(`Olá, li o artigo "${artigo.titulo}" e quero conversar sobre meu imóvel.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm border transition-all hover:-translate-y-0.5"
                  style={{
                    border: "1.5px solid var(--bw-cream-200, #e9e2d5)",
                    color: "var(--bw-text-body)",
                    background: "#fff",
                  }}
                >
                  Falar pelo WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Artigos relacionados ───────────────────────── */}
        {relacionados.length > 0 && (
          <section className="py-16 border-t border-bewild-cream-200" style={{ background: "var(--bw-cream)" }}>
            <div className="mx-auto max-w-[76rem] px-5 sm:px-8">
              <p
                className="font-mono text-xs uppercase tracking-[0.14em] mb-2"
                style={{ color: "var(--bw-gold-accessible)" }}
              >
                Continue lendo
              </p>
              <h2 className="text-2xl font-bold text-bewild-ink mb-8" style={{ letterSpacing: "-0.02em" }}>
                Mais conteúdos Be Wild
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {relacionados.map((rel) => {
                  const catClass =
                    CATEGORIA_COLOR_MAP[rel.categoriaColor] ??
                    "text-bewild-gold border-bewild-gold/30 bg-bewild-gold/8";
                  return (
                    <button
                      key={rel.slug}
                      onClick={() => navigate(`/conteudos/${rel.slug}`)}
                      className="text-left bg-white rounded-2xl border border-bewild-cream-200 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-bewild-card group"
                    >
                      <span
                        className={`inline-flex mb-4 rounded-full border px-2.5 py-1 text-xs font-medium ${catClass}`}
                      >
                        {rel.categoria}
                      </span>
                      <h3 className="font-semibold text-bewild-ink leading-snug mb-3 text-sm group-hover:text-bewild-gold transition-colors">
                        {rel.titulo}
                      </h3>
                      <p className="text-xs text-bewild-text-muted leading-relaxed mb-4 line-clamp-2">
                        {rel.resumo}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-bewild-gold-accessible">
                        {rel.cta} <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 text-center">
                <button
                  onClick={() => navigate("/conteudos")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-bewild-text-muted hover:text-bewild-ink transition-colors"
                >
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
