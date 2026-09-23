import { lazy, useCallback, useEffect, useRef } from "react";
import { MotionConfig, motion } from "framer-motion";
import { CheckSquare } from "lucide-react";

import BewildLogo from "@/components/BewildLogo";
import BwaFooter from "@/components/BwaFooter";
import "@/styles/bwa-footer-shared.css";
import { getCanonicalBase, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";

import { BairroProvider } from "@/guia/hooks/useBairroData";
import { GuideDecisionProvider } from "@/guia/hooks/useGuideDecision";
import { setGlobalSessionId, setGlobalTrack, useGuideAnalytics } from "@/guia/hooks/useGuideAnalytics";
import { useReadingProgress } from "@/guia/hooks/useReadingProgress";
import { useScrollspy } from "@/guia/hooks/useScrollspy";
import { PHASES, SECTION_IDS } from "@/guia/data/guide-data";
import {
  GUIA_DESCRIPTION, GUIA_KEYWORDS, GUIA_PATH, GUIA_TITLE, guiaJsonLd,
} from "@/guia/data/guiaMeta";

import LazyMapaBairrosEmbed from "@/guia/components/mapa/LazyMapaBairrosEmbed";
import BairrosTable from "@/guia/components/mapa/BairrosTable";
import AntiChecklistSection from "@/guia/components/guide/AntiChecklistSection";
import AnuncioPrecificacaoSection from "@/guia/components/guide/AnuncioPrecificacaoSection";
import CaseStudySection from "@/guia/components/guide/CaseStudySection";
import ChecklistSection from "@/guia/components/guide/ChecklistSection";
import DecoracaoSection from "@/guia/components/guide/DecoracaoSection";
import EscolhaAtivoSection from "@/guia/components/guide/EscolhaAtivoSection";
import FAQSection from "@/guia/components/guide/FAQSection";
import FinalCTASection from "@/guia/components/guide/FinalCTASection";
import HeroSection from "@/guia/components/guide/HeroSection";
import LazySection from "@/guia/components/guide/LazySection";
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

/** Seções pesadas (recharts + sliders / lista longa) carregam sob demanda. */
const TendenciasSection = lazy(() => import("@/guia/components/guide/TendenciasSection"));
const SimuladorSection = lazy(() => import("@/guia/components/guide/SimuladorSection"));

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
 * Título, descrição, datas, FAQ e JSON-LD vêm de src/guia/data/guiaMeta.ts —
 * o mesmo módulo do HTML pré-renderizado (scripts/prerenderGuia.ts).
 *
 * Desempenho: o estado que muda com a rolagem (seção ativa, progresso) vive
 * só em <GuiaChrome> (navegação). O conteúdo (<GuiaConteudo>) não tem
 * estado e não re-renderiza ao rolar — mapa, gráficos e animações ficam
 * quietos.
 * ============================================================ */

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/conteudos", label: "Conteúdos" },
  { href: "/faq", label: "FAQ" },
  { href: "/contato", label: "Contato" },
];

const SCROLL_MILESTONES = [25, 50, 75, 100] as const;

/** Cabeçalho próprio desta rota, no visual do guia (desktop; no mobile, MobileMenu). */
function GuiaHeader() {
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
      </div>
    </header>
  );
}

/**
 * Fontes do guia (e do rodapé oficial). Por <link>, não por @import no CSS:
 * se o Google Fonts falhar, a página segue com a fonte de fallback em vez de
 * o chunk de CSS inteiro dar erro e derrubar a rota.
 */
const GUIA_FONT_URLS = [
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@600;700;800&display=swap",
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap",
];

function ensureGuiaFonts(): void {
  if (typeof document === "undefined") return;
  for (const href of GUIA_FONT_URLS) {
    if (document.head.querySelector(`link[rel="stylesheet"][href="${href}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
}

export default function GuiaInvestidorPage() {
  useEffect(() => {
    ensureGuiaFonts();
  }, []);

  return (
    <div className="guia-root min-h-screen">
      {/* Respeita "reduzir movimento" do sistema em todas as animações do guia. */}
      <MotionConfig reducedMotion="user">
        <BairroProvider>
          <GuideDecisionProvider>
            <GuiaSeo />
            <GuiaChrome />
            <GuiaConteudo />
          </GuideDecisionProvider>
        </BairroProvider>
      </MotionConfig>
    </div>
  );
}

/** <head> da rota: título, descrição, canonical e JSON-LD (Article + Breadcrumb + FAQ). */
function GuiaSeo() {
  const { settings } = useSiteSettings();
  const base = getCanonicalBase(settings);
  const ogImage = settings?.seo_og_image || settings?.default_og_image || undefined;
  const absOg = ogImage
    ? /^https?:\/\//i.test(ogImage)
      ? ogImage
      : `${base}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`
    : undefined;

  useSeo({
    title: GUIA_TITLE,
    description: GUIA_DESCRIPTION,
    canonicalPath: GUIA_PATH,
    ogType: "article",
    keywords: GUIA_KEYWORDS,
    // Sempre presente (não espera o banco): o JSON-LD do pré-render é
    // substituído no primeiro apply, sem janela sem dados estruturados.
    jsonLd: guiaJsonLd({ image: absOg }),
  });

  return null;
}

/** Navegação e indicadores que dependem da rolagem. */
function GuiaChrome() {
  const activeId = useScrollspy(SECTION_IDS);
  const { trackEvent, sessionId } = useGuideAnalytics();
  const { visitedSections, sectionIndex, sectionCount, resumeData, dismissResume } =
    useReadingProgress(activeId);
  const scrollMilestones = useRef(new Set<number>());

  useEffect(() => {
    setGlobalTrack(trackEvent);
    setGlobalSessionId(sessionId);
    return () => {
      setGlobalTrack(null);
      setGlobalSessionId(null);
    };
  }, [trackEvent, sessionId]);

  // Marcos de leitura (25/50/75/100%) no mesmo frame da barra de progresso.
  const onProgress = useCallback(
    (pct: number) => {
      for (const m of SCROLL_MILESTONES) {
        if (pct >= m && !scrollMilestones.current.has(m)) {
          scrollMilestones.current.add(m);
          trackEvent(`scroll_${m}`, {});
        }
      }
    },
    [trackEvent],
  );

  return (
    <>
      <GuiaHeader />
      <ScrollProgressBar onProgress={onProgress} />
      <ResumeToast data={resumeData} onDismiss={dismissResume} />
      <TableOfContents activeId={activeId} visitedSections={visitedSections} />
      <MobileMenu activeId={activeId} sectionIndex={sectionIndex} sectionCount={sectionCount} />
      <MobileStickyBar />
    </>
  );
}

const phase = (n: number) => PHASES[n - 1];

/** Conteúdo do guia — sem estado próprio: não re-renderiza com a rolagem. */
function GuiaConteudo() {
  return (
    <>
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
            <section id="mapa-bairros" className="scroll-mt-24 py-16 md:py-20" aria-labelledby="mapa-bairros-titulo">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5 }}
              >
                <h2 id="mapa-bairros-titulo" className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Mapa de bairros rentáveis
                </h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Analise a demanda, compare bairros e simule cenários de receita para studios em São Paulo.
                </p>
                <LazyMapaBairrosEmbed />
                <BairrosTable />
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
            <LazySection nome="Simulador de Receita">
              <SimuladorSection />
            </LazySection>
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
            <LazySection nome="Tendências 2026">
              <TendenciasSection />
            </LazySection>
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
      </main>

      {/* Aviso legal do guia — obrigatório, sem promessa de resultados */}
      <div className="w-full">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
          <p className="py-8 max-w-3xl mx-auto text-center text-xs leading-relaxed text-muted-foreground font-body border-t border-border/60">
            Conteúdo informativo. As faixas de diária, ocupação e custo citadas são retratos de mercado do período
            analisado e não constituem promessa, garantia ou recomendação de investimento. Resultados variam por
            imóvel, condomínio, operação e sazonalidade.
          </p>
        </div>
      </div>

      {/* Rodapé oficial do site (BwaFooter) — estilos .bwa escopados em .guia-root */}
      <BwaFooter />
    </>
  );
}
