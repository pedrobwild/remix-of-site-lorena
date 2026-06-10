/**
 * CasesPage — /cases
 * Re-skin completo: cases reais Antes → Pronto → Operando.
 */
import { useEffect, useRef } from "react";
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { MobileBottomCTA } from "../components/landing/MobileBottomCTA";
import { StickyDiagnosticPanel } from "../components/landing/StickyDiagnosticPanel";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import { ArrowRight, MapPin } from "lucide-react";
import { ImagePlaceholder } from "../components/landing/ImagePlaceholder";
import { CaseLaminas, type CaseLaminaData } from "../components/landing/CaseLaminas";
import "../styles/cases.css";

/* ─── Dados dos cases ─────────────────────────────────────────── */
interface CaseDef {
  id: string;
  bairro: string;
  selos: string[];
  bgVariant: "cream" | "cold";
  antes: { pillLabel: string; pillVariant: "neutral"; title: string; descricao: string; photoId: string };
  pronto: { title: string; decisoes: string[]; photoId: string };
  operando: {
    title: string; descricao: string;
    metricas: { label: string; value: string }[];
    photoId: string;
  };
  depoimento: { texto: string; autor: string; perfil: string };
}

const CASES: CaseDef[] = [
  {
    id: "pinheiros",
    bairro: "Pinheiros, São Paulo",
    selos: ["Be Wild Reformas", "BeWild Host Care", "Jornada completa"],
    bgVariant: "cream",
    antes: {
      pillLabel: "Ativo cru",
      pillVariant: "neutral",
      title: "Imóvel entregue pela construtora",
      descricao: "Recém-entregue, sem mobília, sem personalização. Proprietário sem tempo para gerenciar obra e fornecedores. Imóvel parado perdendo para a inflação.",
      photoId: "pinheiros-antes",
    },
    pronto: {
      title: "Pronto para hospedar",
      decisoes: [
        "Layout otimizado para foto, circulação e limpeza rápida",
        "Marcenaria sob medida com armazenamento inteligente",
        "Iluminação indireta LED, diferencial visual no anúncio",
        "Persiana blackout + enxoval 200 fios",
        "Setup completo: eletros, decoração e fechadura digital",
      ],
      photoId: "pinheiros-pronto",
    },
    operando: {
      title: "Em operação no BeWild Host Care",
      descricao: "Anúncio ativo no Airbnb e Booking 8 dias após a entrega da obra. Precificação dinâmica desde o lançamento.",
      metricas: [
        { label: "Tempo até 1ª reserva", value: "8 dias" },
        { label: "Ocupação 1º mês", value: "Acima da média" },
        { label: "Canais ativos", value: "Airbnb + Booking" },
      ],
      photoId: "pinheiros-operando",
    },
    depoimento: {
      texto: "Não precisei me preocupar com nada. Recebi a chave da construtora, passei para a Be Wild e em dois meses já tinha o imóvel gerando reservas.",
      autor: "C. M.",
      perfil: "Studio 28m² · Pinheiros · Jornada completa",
    },
  },
  {
    id: "vila-madalena",
    bairro: "Vila Madalena, São Paulo",
    selos: ["Be Wild Reformas", "BeWild Host Care", "Imóvel antigo"],
    bgVariant: "cold",
    antes: {
      pillLabel: "Em preparo",
      pillVariant: "neutral",
      title: "Imóvel reformado para moradia há 8 anos",
      descricao: "Proprietário queria aproveitar o ativo para gerar renda mas não sabia por onde começar. Imóvel com bom estado mas inadequado para short stay.",
      photoId: "vilamadalena-antes",
    },
    pronto: {
      title: "Readequado para curta temporada",
      decisoes: [
        "Readequação do layout para uso de temporada",
        "Troca de revestimentos focada em durabilidade e foto",
        "Iluminação replanejada para valorizar o ambiente",
        "Curadoria de mobiliário e itens operacionais",
        "Decoração com identidade para o perfil de hóspede do bairro",
      ],
      photoId: "vilamadalena-pronto",
    },
    operando: {
      title: "Operação BeWild Host Care ativa",
      descricao: "Lançamento com anúncio otimizado e precificação calibrada para a demanda de lazer e cultura da Vila Madalena.",
      metricas: [
        { label: "Ocupação 1º mês", value: "Acima da média" },
        { label: "Tipo de hóspede", value: "Lazer" },
        { label: "Gestão", value: "BeWild Host Care" },
      ],
      photoId: "vilamadalena-operando",
    },
    depoimento: {
      texto: "Sempre achei que reformar ia ser uma dor de cabeça. A Be Wild fez tudo e ainda explicou cada decisão. O imóvel ficou bem melhor do que eu esperava.",
      autor: "L. R.",
      perfil: "1 dorm 42m² · Vila Madalena · Imóvel antigo",
    },
  },
  {
    id: "consolacao",
    bairro: "Consolação, São Paulo",
    selos: ["BeWild Host Care", "Diagnóstico", "Otimização sem obra completa"],
    bgVariant: "cream",
    antes: {
      pillLabel: "Em preparo",
      pillVariant: "neutral",
      title: "Imóvel mobiliado com performance baixa",
      descricao: "Já mobiliado mas sem identidade visual, fotos ruins e anúncio com baixa ocupação há meses. Proprietário cansado de operar sozinho.",
      photoId: "consolacao-antes",
    },
    pronto: {
      title: "Otimizado sem obra completa",
      decisoes: [
        "Diagnóstico de performance: gargalos identificados",
        "Ajustes de layout e decoração sem reforma estrutural",
        "Refoto profissional com iluminação e composição estratégica",
        "Revisão de textos e posicionamento do anúncio",
        "Transferência da operação para o BeWild Host Care",
      ],
      photoId: "consolacao-pronto",
    },
    operando: {
      title: "Novo anúncio + operação profissional",
      descricao: "Sem necessidade de obra completa. Imóvel relançado com novo anúncio e operação BeWild Host Care ativa em menos de 15 dias.",
      metricas: [
        { label: "Tempo para relançar", value: "< 15 dias" },
        { label: "Obra necessária", value: "Nenhuma" },
        { label: "Resultado", value: "Retomada de ocupação" },
      ],
      photoId: "consolacao-operando",
    },
    depoimento: {
      texto: "O imóvel era o mesmo. O que mudou foi quem cuidava dele.",
      autor: "Proprietário",
      perfil: "Consolação · Otimização",
    },
  },
];

/* ─── Hook simples de reveal ───────────────────────────────── */
function useReveals(root: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const els = Array.from(node.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [root]);
}

/* ─── Bloco de Case ───────────────────────────────────────── */
function CaseBlock({ c }: { c: CaseDef }) {
  const laminas: CaseLaminaData[] = [
    {
      key: "antes",
      pillVariant: c.antes.pillVariant,
      pillLabel: c.antes.pillLabel,
      label: "Antes",
      title: c.antes.title,
      media: <ImagePlaceholder assetId={c.antes.photoId as any} showReveal={false} className="w-full h-full absolute inset-0" />,
      content: <p className="lamina__body">{c.antes.descricao}</p>,
    },
    {
      key: "pronto",
      pillVariant: "gold",
      pillLabel: "Pronto para hospedar",
      label: "Pronto para hospedar",
      title: c.pronto.title,
      media: <ImagePlaceholder assetId={c.pronto.photoId as any} showReveal={false} className="w-full h-full absolute inset-0" />,
      content: (
        <ul className="checklist">
          {c.pronto.decisoes.map((d) => <li key={d}>{d}</li>)}
        </ul>
      ),
    },
    {
      key: "operando",
      pillVariant: "blue",
      pillLabel: "Em operação",
      label: "Operando",
      title: c.operando.title,
      media: <ImagePlaceholder assetId={c.operando.photoId as any} showReveal={false} className="w-full h-full absolute inset-0" />,
      content: (
        <>
          <p className="lamina__body">{c.operando.descricao}</p>
          <div className="metric-table">
            {c.operando.metricas.map((m) => (
              <div key={m.label} className="row">
                <span className="label">{m.label}</span>
                <span className="value">{m.value}</span>
              </div>
            ))}
          </div>
        </>
      ),
    },
  ];

  return (
    <section className={`case-block case-block--${c.bgVariant}`}>
      <div className="container">
        <header className="case-header" data-reveal>
          <div className="case-header__local">
            <MapPin />
            <span>{c.bairro}</span>
          </div>
          <div className="case-header__tags">
            {c.selos.map((s) => <span key={s} className="selo">{s}</span>)}
          </div>
        </header>

        <div data-reveal>
          <CaseLaminas laminas={laminas} defaultActive={1} />
        </div>

        <div className="depoimento" data-reveal>
          <div>
            <p className="depoimento__quote">"{c.depoimento.texto}"</p>
            <p className="depoimento__cite">— {c.depoimento.autor} · {c.depoimento.perfil}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Página ─────────────────────────────────────────────── */
export default function CasesPage() {
  useSeo({
    title: "Cases reais, do cru à operação | Be Wild",
    description:
      "Três fases de cada imóvel: estado inicial, decisões da Be Wild e a operação em andamento. Sem filtro de marketing. Com dados reais quando disponíveis.",
    canonicalPath: "/cases",
    ogType: "website",
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  useReveals(rootRef);

  // Entrada do hero
  useEffect(() => {
    const t = setTimeout(() => heroRef.current?.classList.add("is-ready"), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div ref={rootRef} className="bewild-cases min-h-screen antialiased">
      <Header />
      <main>
        {/* HERO */}
        <section ref={heroRef} className="hero">
          <div className="hero__media">
            <ImagePlaceholder assetId="hero-studio" showReveal={false} className="w-full h-full" />
          </div>
          <div className="hero__overlay" />
          <div className="hero__grain" />
          <div className="container hero__inner">
            <p className="eyebrow eyebrow--gold" style={{ marginBottom: "1rem" }}>Cases reais</p>
            <h1 className="hero__title">
              <span className="hero__line"><span>Cases reais,</span></span>
              <span className="hero__line"><span className="italic">do cru à operação.</span></span>
            </h1>
            <p className="hero__lead">
              Três fases de cada imóvel: estado inicial, decisões da Be Wild e a operação em andamento.
              Sem filtro de marketing. Com dados reais quando disponíveis.
            </p>
            <div className="hero__flow">
              <span className="status-pill"><span className="dot" />Ativo cru</span>
              <span className="arrow">→</span>
              <span className="status-pill status-pill--gold"><span className="dot" />Pronto para hospedar</span>
              <span className="arrow">→</span>
              <span className="status-pill status-pill--blue"><span className="dot" />Em operação</span>
            </div>
          </div>
        </section>

        {/* DISCLAIMER BAR */}
        <div className="disclaimer-bar">
          <p>
            Métricas são indicativas do período inicial de operação de cada case ·
            Resultado passado não garante resultado futuro ·
            Ocupação e receita dependem de imóvel, bairro, período e gestão
          </p>
        </div>

        {/* CASES */}
        {CASES.map((c) => <CaseBlock key={c.id} c={c} />)}

        {/* CTA FINAL */}
        <section className="cta-final">
          <div className="inner">
            <p className="eyebrow" data-reveal>Seu imóvel pode ser o próximo</p>
            <h2 data-reveal>
              O diagnóstico é <span className="italic">o primeiro passo.</span>
            </h2>
            <p className="lead" data-reveal>
              Avaliamos o potencial real do seu ativo (bairro, metragem, estado e objetivo) antes de qualquer recomendação.
            </p>
            <div className="ctas" data-reveal>
              <button onClick={() => navigate("/diagnostico")} className="btn-primary">
                Diagnosticar meu imóvel <span className="arr">→</span>
              </button>
              <a
                href={whatsappHref("Olá, quero entender o potencial do meu imóvel para short stay.")}
                target="_blank" rel="noopener noreferrer"
                className="btn-ghost btn-ghost--ink"
              >
                Falar com a equipe <ArrowRight className="h-4 w-4" />
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
