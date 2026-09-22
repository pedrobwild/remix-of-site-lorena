import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Menu, X } from "lucide-react";

import BewildLogo from "@/components/BewildLogo";
import BwaFooter from "@/components/BwaFooter";
import "@/styles/bwa-footer-shared.css";
import { breadcrumbJsonLd, faqJsonLd, getCanonicalBase, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";

import { Card, CardContent } from "@/guia/components/ui/card";
import { BairroProvider, useBairroData } from "@/guia/hooks/useBairroData";
import { GuideDecisionProvider } from "@/guia/hooks/useGuideDecision";
import { setGlobalSessionId, setGlobalTrack, useGuideAnalytics } from "@/guia/hooks/useGuideAnalytics";
import { useReadingProgress } from "@/guia/hooks/useReadingProgress";
import { useScrollspy } from "@/guia/hooks/useScrollspy";
import { PHASES, SECTIONS, fmt } from "@/guia/data/guide-data";

import LazyMapaBairrosEmbed from "@/guia/components/mapa/LazyMapaBairrosEmbed";
import AntiChecklistSection from "@/guia/components/guide/AntiChecklistSection";
import AnuncioPrecificacaoSection from "@/guia/components/guide/AnuncioPrecificacaoSection";
import CaseStudySection from "@/guia/components/guide/CaseStudySection";
import ChecklistSection from "@/guia/components/guide/ChecklistSection";
import DecoracaoSection from "@/guia/components/guide/DecoracaoSection";
import EscolhaAtivoSection from "@/guia/components/guide/EscolhaAtivoSection";
import FAQSection, { FAQ_ITEMS } from "@/guia/components/guide/FAQSection";
import FinalCTASection from "@/guia/components/guide/FinalCTASection";
import HeroSection from "@/guia/components/guide/HeroSection";
import MercadoSection from "@/guia/components/guide/MercadoSection";
import MidPageCTA from "@/guia/components/guide/MidPageCTA";
import MobileMenu from "@/guia/components/guide/MobileMenu";
import MobileStickyBar from "@/guia/components/guide/MobileStickyBar";
import PhaseHeader from "@/guia/components/guide/PhaseHeader";
import ReformaSection from "@/guia/components/guide/ReformaSection";
import RentabilidadeSection from "@/guia/components/guide/RentabilidadeSection";
import ReservasSection from "@/guia/components/guide/ReservasSection";
import ResumeToast from "@/guia/components/guide/ResumeToast";
import ScrollProgressBar from "@/guia/components/guide/ScrollProgressBar";
import SectionIntro from "@/guia/components/guide/SectionIntro";
import TableOfContents from "@/guia/components/guide/TableOfContents";
import TrustSignals from "@/guia/components/guide/TrustSignals";

import "./guia-investidor.css";

const TendenciasSection = lazy(() => import("@/guia/components/guide/TendenciasSection"));

/* ============================================================
 * GuiaInvestidorPage — /guia-do-investidor
 *
 * Port do app "Guia do Investidor" (shortstay-guide) para o site
 * da Bewild: mesmo conteúdo, mesmo visual, com simulador,
 * checklists pontuados e mapa de bairros.
 *
 * Isolamento: todo o código portado vive em `src/guia/` e o tema
 * fica dentro de `.guia-root` (src/pages/guia-investidor.css).
 * Esta página NÃO usa BwaNav — ele injeta CSS global que conflita com o
 * tema do guia; o cabeçalho abaixo é próprio. O rodapé, porém, é o BwaFooter
 * oficial do site, com os estilos .bwa que ele precisa escopados em
 * .guia-root no fim de guia-investidor.css.
 *
 * Regra de conteúdo: nenhuma promessa de renda, ocupação ou
 * rentabilidade. Toda faixa numérica é retrato de mercado.
 *
 * Datas do JSON-LD são CONSTANTES (nunca new Date()).
 * ============================================================ */

const PUBLISHED = "2026-09-22";
const MODIFIED = "2026-10-06";
const H1 = "Guia do investidor em studios para short stay em São Paulo";
const CANONICAL = "/guia-do-investidor";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/conteudos", label: "Conteúdos" },
  { href: "/faq", label: "FAQ" },
  { href: "/contato", label: "Contato" },
];

/** Cabeçalho próprio desta rota, no visual do guia. */
function GuiaHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass-nav fixed top-0 left-0 right-0 z-40 hidden lg:block">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-10 h-16 flex items-center justify-between gap-6">
        <a href="/" className="flex items-center gap-3 shrink-0" aria-label="Bewild — página inicial">
          <BewildLogo className="h-7 w-auto" />
        </a>

        <nav aria-label="Navegação principal" className="flex items-center gap-6 font-body text-sm">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
          <a
            href="/orcamento"
            className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Solicitar orçamento
          </a>
        </nav>

        {/* fallback de acessibilidade em telas estreitas do desktop */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="sr-only"
          aria-expanded={open}
          aria-label="Abrir menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}

export default function GuiaInvestidorPage() {
  return (
    <div className="guia-root min-h-screen">
      <BairroProvider>
        <GuideDecisionProvider>
          <GuiaInvestidorInner />
        </GuideDecisionProvider>
      </BairroProvider>
    </div>
  );
}

function GuiaInvestidorInner() {
  const { settings } = useSiteSettings();
  const base = getCanonicalBase(settings);
  const ogImage = settings?.seo_og_image || settings?.default_og_image || undefined;
  const absOg = ogImage
    ? /^https?:\/\//i.test(ogImage)
      ? ogImage
      : `${base}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`
    : undefined;
  const org = { "@type": "Organization", name: "Bewild", url: `${base}/` };

  useSeo({
    title: "Guia do investidor: studio para short stay em SP — bairros, custo e prazo | Bewild",
    description:
      "Bairro a bairro em São Paulo — Pinheiros, Itaim Bibi, Jardim Paulista, Consolação, Vila Mariana, Moema, Brooklin e mais — com mapa, simulador, checklists e o que considerar em custo e prazo da reforma do studio.",
    canonicalPath: CANONICAL,
    ogType: "article",
    keywords:
      "guia do investidor short stay, studio para airbnb são paulo, custo de reforma de studio em sp, prazo de reforma de studio, quanto custa reformar studio são paulo, mapa de bairros short stay sp, short stay Pinheiros, short stay Itaim Bibi, short stay Jardim Paulista, short stay Consolação, short stay Bela Vista, short stay Moema, short stay Vila Mariana, short stay Barra Funda, short stay Campo Belo, short stay República, short stay Santana, short stay Brooklin, short stay Itaquera",
    jsonLd: settings
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: H1,
            inLanguage: "pt-BR",
            author: org,
            publisher: org,
            mainEntityOfPage: `${base}${CANONICAL}`,
            ...(absOg ? { image: absOg } : {}),
            datePublished: PUBLISHED,
            dateModified: MODIFIED,
          },
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Guia do investidor", path: CANONICAL },
          ]),
          faqJsonLd(FAQ_ITEMS),
        ]
      : undefined,
  });

  const sectionIds = SECTIONS.map((s) => s.id);
  const activeId = useScrollspy(sectionIds);
  const { trackEvent, sessionId } = useGuideAnalytics();
  const { bairros } = useBairroData();
  const scrollMilestones = useRef(new Set<string>());
  const { scrollPercent, visitedSections, sectionIndex, sectionCount, resumeData, dismissResume } =
    useReadingProgress(activeId);

  useEffect(() => {
    setGlobalTrack(trackEvent);
    setGlobalSessionId(sessionId);
    return () => {
      setGlobalTrack(null);
      setGlobalSessionId(null);
    };
  }, [trackEvent, sessionId]);

  useEffect(() => {
    const handler = () => {
      const pct = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      for (const m of [25, 50, 75, 100]) {
        if (pct >= m && !scrollMilestones.current.has(`scroll_${m}`)) {
          scrollMilestones.current.add(`scroll_${m}`);
          trackEvent(`scroll_${m}`, {});
        }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [trackEvent]);

  const phase = (n: number) => PHASES[n - 1];

  return (
    <>
      <GuiaHeader />
      <ScrollProgressBar percent={scrollPercent} />
      <ResumeToast data={resumeData} onDismiss={dismissResume} />
      <TableOfContents activeId={activeId} visitedSections={visitedSections} />
      <MobileMenu activeId={activeId} sectionIndex={sectionIndex} sectionCount={sectionCount} />
      <MobileStickyBar />

      <main className="lg:ml-[60px] w-full flex flex-col items-center pb-24 lg:pb-8 pt-16">
        {/* ═══ HERO ═══ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10 py-0 lg:py-10">
            <HeroSection />
          </div>
        </div>

        {/* ═══ BLOCO 1 — Onde investir ═══ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PhaseHeader {...phase(1)} />
          </div>
        </div>

        {/* Mapa de bairros */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <section id="mapa-bairros" className="scroll-mt-24 py-16 md:py-20">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Mapa de bairros rentáveis
                </h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Analise a demanda, compare bairros e simule cenários de receita para studios em São Paulo.
                </p>
                <LazyMapaBairrosEmbed />
                <Card className="border-border overflow-hidden mt-8">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm font-body">
                        <thead className="bg-secondary">
                          <tr>
                            {["Bairro", "Diária mín.", "Ocupação média", "20–25 m²", "26–35 m²", "36–50 m²"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bairros.map((b) => (
                            <tr key={b.name} className="border-t border-border hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{b.name}</td>
                              <td className="px-4 py-3 text-muted-foreground">R$ {fmt(b.dailyMin)}</td>
                              <td className="px-4 py-3 text-muted-foreground">{b.avgOccupancy}%</td>
                              <td className="px-4 py-3 text-muted-foreground">R$ {fmt(b.avgBySize["20–25 m²"])}</td>
                              <td className="px-4 py-3 text-muted-foreground">R$ {fmt(b.avgBySize["26–35 m²"])}</td>
                              <td className="px-4 py-3 font-semibold text-foreground">R$ {fmt(b.avgBySize["36–50 m²"])}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </section>
          </div>
        </div>

        {/* Mercado e precificação */}
        <div className="w-full bg-muted/20">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <MercadoSection />
          </div>
        </div>

        {/* ═══ BLOCO 2 — Como validar a conta ═══ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PhaseHeader {...phase(2)} />
          </div>
        </div>

        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <EscolhaAtivoSection />
          </div>
        </div>

        <div className="w-full bg-muted/20">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <RentabilidadeSection />
          </div>
        </div>

        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <SimuladorSectionLazy />
          </div>
        </div>

        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <MidPageCTA variant="slim" />
          </div>
        </div>

        {/* ═══ BLOCO 3 — O que faz um studio performar ═══ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PhaseHeader {...phase(3)} />
          </div>
        </div>

        <div className="w-full bg-muted/20">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <ReservasSection />
          </div>
        </div>

        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <ReformaSection />
          </div>
        </div>

        <div className="w-full bg-destructive/[0.02]">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <AntiChecklistSection />
          </div>
        </div>

        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <DecoracaoSection />
          </div>
        </div>

        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <Suspense
              fallback={
                <div className="py-16">
                  <div className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin mx-auto" />
                </div>
              }
            >
              <TendenciasSection />
            </Suspense>
          </div>
        </div>

        {/* ═══ BLOCO 4 — Como agir com confiança ═══ */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <PhaseHeader {...phase(4)} />
          </div>
        </div>

        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <AnuncioPrecificacaoSection />
          </div>
        </div>

        <div className="w-full bg-muted/20">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <CaseStudySection />
          </div>
        </div>

        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <SectionIntro icon={CheckSquare} text="Avalie se você está pronto para dar o próximo passo" />
            <ChecklistSection />
          </div>
        </div>

        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <TrustSignals />
            <FAQSection />
          </div>
        </div>

        <div className="w-full bg-hero-gradient">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <FinalCTASection />
          </div>
        </div>

        {/* Rodapé simples desta rota (sem BwaFooter, que injeta CSS global) */}
        <div className="w-full">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
            <footer className="py-10 text-sm text-muted-foreground font-body border-t border-border/60">
              <div className="flex flex-col items-center gap-4 text-center">
                <BewildLogo className="h-6 w-auto opacity-70" />
                <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                  {NAV_LINKS.map((l) => (
                    <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">
                      {l.label}
                    </a>
                  ))}
                  <a href="/orcamento" className="text-primary hover:underline">
                    Solicitar orçamento
                  </a>
                </nav>
                <p className="max-w-3xl text-xs leading-relaxed">
                  Conteúdo informativo. As faixas de diária, ocupação e custo citadas são retratos de mercado do período
                  analisado e não constituem promessa, garantia ou recomendação de investimento. Resultados variam por
                  imóvel, condomínio, operação e sazonalidade.
                </p>
                <p className="text-xs">© 2026 Bewild · Guia do investidor em studios para short stay</p>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </>
  );
}

/** Simulador é pesado (recharts + sliders); carrega sob demanda. */
const SimuladorSectionInner = lazy(() => import("@/guia/components/guide/SimuladorSection"));
function SimuladorSectionLazy() {
  return (
    <Suspense
      fallback={
        <div className="py-16">
          <div className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <SimuladorSectionInner />
    </Suspense>
  );
}
