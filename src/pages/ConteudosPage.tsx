/**
 * ConteudosPage — /conteudos
 * Hub de conteúdos Be Wild.
 * Cards que navegam para páginas individuais (/conteudos/[slug]).
 * SEO: JSON-LD ItemList para Google Discover + GEO 2026.
 */
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import { Reveal } from "../components/landing/MotionPrimitives";
import { MobileBottomCTA } from "../components/landing/MobileBottomCTA";
import { StickyDiagnosticPanel } from "../components/landing/StickyDiagnosticPanel";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import {
  ArrowRight,
  Building2,
  BarChart3,
  Wrench,
  MapPin,
  Shield,
  Clock,
  Calendar,
  BookOpen,
} from "lucide-react";
import { listConteudos, CATEGORIA_COLOR_MAP } from "../lib/conteudoData";

/* ─── Categorias ─────────────────────────────────────────── */
const CATEGORIAS = [
  {
    Icon: Building2,
    label: "Short Stay",
    desc: "Como funciona, o que esperar e como preparar seu imóvel para locação por temporada.",
  },
  {
    Icon: Wrench,
    label: "Preparação do ativo",
    desc: "Reforma, mobiliário, decisões de projeto e o que diferencia preparação de obra simples.",
  },
  {
    Icon: BarChart3,
    label: "Performance",
    desc: "Ocupação, precificação, canais, sazonalidade e como avaliar se seu imóvel está competitivo.",
  },
  {
    Icon: MapPin,
    label: "Bairros de SP",
    desc: "Análise de bairros com potencial para short stay em São Paulo.",
  },
  {
    Icon: Shield,
    label: "Riscos e comparativos",
    desc: "Gestão própria vs. profissional. Erros comuns, custos ocultos e como reduzir atrito.",
  },
];

/* ─── Página principal ───────────────────────────────────── */
export default function ConteudosPage() {
  const artigos = listConteudos();

  useSeo({
    title: "Conteúdos — Short stay, preparação de ativo e gestão | Be Wild",
    description:
      "Guias, análises e comparativos sobre short stay, reforma para locação por temporada e gestão profissional de imóveis em São Paulo. Conteúdo sem promessa de renda garantida.",
    canonicalPath: "/conteudos",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Conteúdos Be Wild — Short stay e gestão de imóveis",
      url: "https://bwild.com.br/conteudos",
      numberOfItems: artigos.length,
      itemListElement: artigos.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://bwild.com.br/conteudos/${a.slug}`,
        name: a.titulo,
      })),
    },
  });

  return (
    <div className="bwild-light min-h-screen bg-bewild-cream font-body text-bewild-text-body antialiased">
      <Header />
      <main>
        {/* ── Hero ────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 bg-bewild-ink">
          <div className="absolute inset-0 bg-gradient-to-br from-bewild-gold/5 via-transparent to-transparent" />
          <div className="relative mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="max-w-3xl">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-bewild-gold">
                Conteúdos Be Wild
              </p>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl" style={{ letterSpacing: "-0.025em" }}>
                Guias e análises sobre short stay — sem promessa de renda garantida.
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-white/55">
                Conteúdo baseado em dados de mercado para quem quer entender o ciclo completo de reforma, preparação e gestão de imóveis em São Paulo.
              </p>
              <a
                href={whatsappHref("Olá, quero receber os materiais da Be Wild sobre short stay.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
              >
                Receber materiais <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ── Categorias ──────────────────────────────────── */}
        <section className="border-t border-bewild-cream-200 py-14 sm:py-18 bg-white">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {CATEGORIAS.map((cat) => (
                <div
                  key={cat.label}
                  className="rounded-2xl border border-bewild-cream-200 bg-bewild-cream p-5"
                >
                  <cat.Icon className="mb-3 h-5 w-5 text-bewild-gold" />
                  <p className="mb-1 font-semibold text-bewild-ink text-sm">{cat.label}</p>
                  <p className="text-xs text-bewild-text-muted leading-relaxed">{cat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Artigos ─────────────────────────────────────── */}
        <section className="border-t border-bewild-cream-200 py-16 sm:py-24" style={{ background: "var(--bw-cream)" }}>
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-12">
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                {artigos.length} artigos publicados
              </p>
              <h2 className="text-2xl font-bold text-bewild-ink sm:text-3xl" style={{ letterSpacing: "-0.02em" }}>
                Guias e análises
              </h2>
              <p className="mt-3 text-bewild-text-muted text-sm max-w-xl">
                Cada artigo abre em página própria, com SEO completo e conteúdo aprofundado. Clique para ler.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {artigos.map((artigo, i) => {
                const catClass =
                  CATEGORIA_COLOR_MAP[artigo.categoriaColor] ??
                  "text-bewild-gold border-bewild-gold/30 bg-bewild-gold/8";
                return (
                  <Reveal key={artigo.slug} delay={i * 55} threshold={0.05}>
                    <button
                      onClick={() => navigate(`/conteudos/${artigo.slug}`)}
                      className="w-full text-left bg-white rounded-2xl border border-bewild-cream-200 flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-bewild-card group"
                    >
                      {/* Topo colorido sutil */}
                      <div className="h-1.5 w-full rounded-t-2xl" style={{ background: "var(--bw-gold)", opacity: 0.3 }} />

                      <div className="p-6 flex flex-col flex-1">
                        {/* Categoria */}
                        <span
                          className={`mb-4 inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${catClass}`}
                        >
                          {artigo.categoria}
                        </span>

                        {/* Título */}
                        <h3 className="mb-3 font-semibold text-bewild-ink leading-snug flex-1 text-base group-hover:text-bewild-gold transition-colors duration-200">
                          {artigo.titulo}
                        </h3>

                        {/* Resumo */}
                        <p className="mb-5 text-sm text-bewild-text-muted leading-relaxed line-clamp-3">
                          {artigo.resumo}
                        </p>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-bewild-text-muted mb-5">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {artigo.tempoLeitura}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {artigo.dataPublicacao}
                          </span>
                        </div>

                        {/* CTA link */}
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-bewild-gold group-hover:gap-2.5 transition-all duration-200">
                          <BookOpen className="h-4 w-4" />
                          {artigo.cta}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </button>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Newsletter / WhatsApp ────────────────────────── */}
        <section className="border-t border-bewild-cream-200 py-16 sm:py-20 bg-white">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="rounded-2xl border border-bewild-cream-200 bg-bewild-cream p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center gap-8">
              <div className="flex-1">
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                  Novos conteúdos
                </p>
                <h3 className="text-xl font-bold text-bewild-ink sm:text-2xl mb-3">
                  Receba análises direto no WhatsApp.
                </h3>
                <p className="text-bewild-text-muted text-sm leading-relaxed max-w-md">
                  Quando publicamos novos guias ou análises de mercado, enviamos um resumo. Sem spam, sem lista de e-mail.
                </p>
              </div>
              <a
                href={whatsappHref("Olá, quero receber análises e conteúdos da Be Wild sobre short stay em SP.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-2 rounded-full bg-bewild-blue px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
              >
                Entrar na lista <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* ── CTA diagnóstico ──────────────────────────────── */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-28" style={{ background: "var(--bw-ink)" }}>
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8 text-center">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-bewild-gold mb-5">
                Próximo passo
              </p>
              <h2
                className="text-white font-bold mb-5"
                style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.75rem)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
              >
                Prefere uma conversa direta?
              </h2>
              <p className="text-white/55 mb-10 max-w-md mx-auto leading-relaxed">
                O diagnóstico Be Wild avalia o potencial do seu imóvel específico — não uma média de bairro.
              </p>
              <button
                onClick={() => navigate("/diagnostico")}
                className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
              >
                Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
              </button>
            </Reveal>
          </div>
        </section>
      </main>
      <MobileBottomCTA />
      <StickyDiagnosticPanel />
      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
}
