import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { useSeo, breadcrumbJsonLd, organizationJsonLd } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { Container, CTAButton, Selo } from "../components/landing/primitives";
import { whatsappHref } from "../components/landing/content";

/* ============================================================
 * PortfolioPage — Reformas reais, do cru ao pronto para operar
 * Porte fiel do código de referência aprovado.
 * ============================================================ */

interface CaseItem {
  n: string;
  title: string;
  tags: string[];
  before: { label: string; text: string };
  ready: { label: string; items: string[] };
  result: string;
}

const CASES: CaseItem[] = [
  {
    n: "01",
    title: "Studio compacto para short stay",
    tags: ["Short stay", "Studio compacto"],
    before: {
      label: "Slot · foto real do estado inicial",
      text: "Planta pequena, sem mobília adequada e difícil de operar. O desafio: transformar o espaço em um imóvel funcional, bonito e fácil de operar.",
    },
    ready: {
      label: "Slot · mesmo ângulo, entregue",
      items: [
        "Marcenaria inteligente",
        "Bancada compacta",
        "Iluminação estratégica",
        "Eletros adequados",
        "Acabamento resistente",
      ],
    },
    result: "Unidade pronta para fotos, anúncio e operação.",
  },
  {
    n: "02",
    title: "Studio recém-entregue na planta",
    tags: ["Turn-key", "Direto da construtora"],
    before: {
      label: "Slot · apartamento cru",
      text: "Apartamento cru, direto da construtora. O desafio: chegar a uma unidade mobiliada sem o cliente precisar coordenar múltiplos fornecedores.",
    },
    ready: {
      label: "Slot · mesmo ângulo, entregue",
      items: [
        "Projeto personalizado",
        "Obra turn-key",
        "Compras planejadas",
        "Montagem final",
      ],
    },
    result: "Imóvel entregue com visual consistente, layout otimizado e pronto para uso.",
  },
  {
    n: "03",
    title: "Imóvel para investidor remoto",
    tags: ["Investidor remoto", "Portal"],
    before: {
      label: "Slot · bastidor da obra",
      text: "Cliente fora da cidade precisava acompanhar a obra sem visitas constantes.",
    },
    ready: {
      label: "Slot · entrega final",
      items: [
        "Portal de acompanhamento",
        "Fotos e relatórios",
        "Cronograma atualizado",
        "Comunicação centralizada",
      ],
    },
    result: "Obra acompanhada à distância com mais clareza e menos ansiedade.",
  },
  {
    n: "04",
    title: "Studio com foco em percepção de valor",
    tags: ["Percepção de valor", "Foto e anúncio"],
    before: {
      label: "Slot · estado inicial",
      text: "Imóvel em região com alta concorrência de anúncios. O desafio: destacar a unidade.",
    },
    ready: {
      label: "Slot · composição final para foto",
      items: [
        "Iluminação",
        "Marcenaria e painel",
        "Enxoval",
        "Composição visual para foto",
      ],
    },
    result: "Unidade mais competitiva visualmente para plataformas de locação.",
  },
];

export default function PortfolioPage() {
  const { settings } = useSiteSettings();

  useSeo({
    title: "Portfólio — BeWild · Reformas reais, do cru ao pronto para operar",
    description:
      "Cases reais de reforma turn-key de studios pela BeWild em São Paulo: desafio, decisões de projeto e resultado, com pares antes e depois sempre no mesmo ângulo.",
    canonicalPath: "/portfolio",
    ogType: "website",
    jsonLd: settings
      ? [
          organizationJsonLd(settings),
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Portfólio", path: "/portfolio" },
          ]),
        ]
      : undefined,
  });

  return (
    <>
      <Header />
      <main id="main" className="bg-[#FBFAF8] text-bewild-ink">
        <PortfolioHero />
        <Disclaimer />
        {CASES.map((c, i) => (
          <CaseBlock key={c.n} data={c} bg={i % 2 === 0 ? "#FBFAF8" : "#F5F7F9"} />
        ))}
        <PortfolioFinalCTA />
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </>
  );
}

/* ====================== HERO ====================== */
function PortfolioHero() {
  const [pillsIn, setPillsIn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setPillsIn(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section
      aria-label="Portfólio BeWild"
      className="relative overflow-hidden bg-bewild-ink text-white"
      style={{ minHeight: "max(78vh, 560px)" }}
    >
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src="/images/cases/studio-compacto-pronto-01.jpg"
          alt=""
          className="h-full w-full object-cover opacity-90"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(7,22,38,0.92) 0%, rgba(10,37,64,0.4) 50%, rgba(10,37,64,0.3) 100%), linear-gradient(100deg, rgba(10,37,64,0.5) 0%, transparent 55%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "3px 3px",
          }}
        />
      </div>

      <Container className="relative z-[2] flex h-full min-h-[78vh] flex-col justify-end pb-12 pt-32 sm:pb-16">
        <p
          className="font-mono text-[0.66rem] uppercase tracking-[0.28em] text-[#DCBE7A] animate-fade-in"
          style={{ animationDelay: "0.3s", animationFillMode: "backwards" }}
        >
          Portfólio BeWild
        </p>

        <h1
          className="mt-4 max-w-[15em] font-display text-[clamp(2.3rem,5vw,4.2rem)] font-semibold leading-[1.08] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.5)] animate-fade-in"
          style={{ animationDelay: "0.45s", animationFillMode: "backwards" }}
        >
          Reformas reais,
          <br />
          <span className="italic text-[#DCBE7A]">do cru ao pronto para operar.</span>
        </h1>

        <p
          className="mt-5 max-w-xl text-base leading-relaxed text-white/85 animate-fade-in"
          style={{ animationDelay: "0.9s", animationFillMode: "backwards" }}
        >
          Cada case em duas fases: o estado inicial e a entrega. Com o desafio, as decisões de
          projeto e o resultado, sem filtro de marketing.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <StatePill
            label="Antes"
            visible={pillsIn}
            delay="0s"
          />
          <span
            aria-hidden="true"
            className={`font-mono text-sm text-white/55 transition-opacity duration-500 ${pillsIn ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: "0.2s" }}
          >
            →
          </span>
          <StatePill label="Pronto para operar" gold visible={pillsIn} delay="0.4s" />
        </div>
      </Container>
    </section>
  );
}

function StatePill({
  label,
  gold = false,
  visible,
  delay,
}: {
  label: string;
  gold?: boolean;
  visible: boolean;
  delay: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/25 bg-bewild-ink/40 px-4 py-2 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/90 backdrop-blur transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
      style={{ transitionDelay: delay }}
    >
      <span
        aria-hidden="true"
        className={`h-[7px] w-[7px] rounded-full ${gold ? "bg-[#DCBE7A]" : "bg-white/50"}`}
      />
      {label}
    </span>
  );
}

/* ====================== DISCLAIMER ====================== */
function Disclaimer() {
  return (
    <div className="border-b border-bewild-ink/10 bg-[#FBFAF8] px-5 py-4 text-center">
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-bewild-ink/55">
        Cases ilustrativos até a publicação das fotos reais · pares antes/depois sempre no mesmo ângulo
      </p>
    </div>
  );
}

/* ====================== CASE BLOCK ====================== */
function CaseBlock({ data, bg }: { data: CaseItem; bg: string }) {
  return (
    <section className="py-[clamp(4rem,9vh,6rem)]" style={{ background: bg }}>
      <Container>
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="block font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#C9A24B]">
              Case {data.n}
            </span>
            <h2 className="mt-2 font-display text-[clamp(1.5rem,2.6vw,2.1rem)] font-semibold leading-[1.12] tracking-tight text-bewild-ink">
              {data.title}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.tags.map((t) => (
              <Selo key={t}>{t}</Selo>
            ))}
          </div>
        </header>

        {/* Galeria 2 lâminas */}
        <CaseGallery data={data} />

        {/* Resultado */}
        <div className="relative mt-4 flex flex-wrap items-baseline gap-4 rounded-xl bg-white px-5 py-4 shadow-[0_24px_60px_-24px_rgba(10,37,64,0.14)]">
          <span
            aria-hidden="true"
            className="absolute left-0 top-3 bottom-3 w-[2px] rounded-sm bg-[#C9A24B]"
          />
          <span className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-[#C9A24B]">
            Resultado
          </span>
          <span className="text-[0.92rem] text-bewild-ink/85">{data.result}</span>
        </div>
      </Container>
    </section>
  );
}

function CaseGallery({ data }: { data: CaseItem }) {
  // "Pronto" abre por padrão
  const [active, setActive] = useState<0 | 1>(1);
  const hoverCapable = useRef<boolean>(false);

  useEffect(() => {
    hoverCapable.current =
      typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  }, []);

  const onEnter = (i: 0 | 1) => {
    if (hoverCapable.current) setActive(i);
  };

  return (
    <div className="mt-7 flex flex-col gap-3 md:h-[440px] md:flex-row">
      <CaseSlat
        kind="before"
        open={active === 0}
        onActivate={() => setActive(0)}
        onEnter={() => onEnter(0)}
        label={data.before.label}
      >
        <p className="max-w-[32rem] text-[0.86rem] leading-relaxed text-white/85">
          {data.before.text}
        </p>
      </CaseSlat>

      <CaseSlat
        kind="ready"
        open={active === 1}
        onActivate={() => setActive(1)}
        onEnter={() => onEnter(1)}
        label={data.ready.label}
      >
        <ul className="grid max-w-[34rem] grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {data.ready.items.map((item) => (
            <li
              key={item}
              className="flex items-baseline gap-2 text-[0.82rem] font-normal text-white/90"
            >
              <Check
                className="h-3.5 w-3.5 shrink-0 translate-y-[2px] text-[#DCBE7A]"
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
      </CaseSlat>
    </div>
  );
}

function CaseSlat({
  kind,
  open,
  onActivate,
  onEnter,
  label,
  children,
}: {
  kind: "before" | "ready";
  open: boolean;
  onActivate: () => void;
  onEnter: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const isReady = kind === "ready";
  return (
    <button
      type="button"
      aria-pressed={open}
      onClick={onActivate}
      onMouseEnter={onEnter}
      className={`group relative min-w-0 cursor-pointer overflow-hidden rounded-2xl bg-bewild-ink text-left text-white shadow-[0_24px_60px_-24px_rgba(10,37,64,0.14)] transition-[flex] duration-1000 ease-out md:min-h-0 ${
        open ? "min-h-[330px] md:flex-[3]" : "min-h-[78px] md:flex-1"
      }`}
      style={{
        transitionTimingFunction: "cubic-bezier(.22,.61,.21,1)",
      }}
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-transform duration-[1300ms] ease-out"
        style={{
          background: "linear-gradient(160deg,#13406B,#0A2540)",
          transform: open ? "scale(1)" : "scale(1.08)",
        }}
      />
      {/* Shade */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(4,14,25,0.9) 0%, rgba(4,14,25,0.2) 55%, rgba(4,14,25,0.3) 100%)",
        }}
      />

      {/* State pill (Antes / Pronto) */}
      <span
        className={`absolute top-5 z-[3] inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/20 bg-bewild-ink/50 px-3.5 py-1.5 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-white/90 backdrop-blur transition-[left,transform] duration-600 ${
          open ? "left-5 translate-x-0" : "left-1/2 -translate-x-1/2"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(.22,.61,.21,1)" }}
      >
        <span
          aria-hidden="true"
          className={`h-[7px] w-[7px] rounded-full ${isReady ? "bg-[#DCBE7A]" : "bg-white/50"}`}
        />
        {isReady ? "Pronto para operar" : "Antes"}
      </span>

      {/* Slot note */}
      <span
        className={`absolute left-5 top-[3.6rem] z-[3] rounded-md bg-bewild-ink/55 px-2.5 py-1 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-white/80 backdrop-blur transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDelay: open ? "0.35s" : "0s" }}
      >
        {label}
      </span>

      {/* Body */}
      <div
        className={`absolute bottom-5 left-5 right-5 z-[2] transition-all duration-700 ease-out ${
          open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
        style={{ transitionDelay: open ? "0.3s" : "0s" }}
      >
        {children}
      </div>
    </button>
  );
}

/* ====================== CTA FINAL ====================== */
function PortfolioFinalCTA() {
  return (
    <section id="diagnostico" className="scroll-mt-20 bg-[#F2EEE5] py-[clamp(4rem,9vh,6rem)]">
      <Container className="mx-auto max-w-[780px] text-center">
        <span className="font-mono text-[0.66rem] uppercase tracking-[0.28em] text-bewild-blue">
          Seu studio pode ser o próximo
        </span>
        <h2 className="mt-4 font-display text-[clamp(2rem,3.6vw,3.1rem)] font-semibold leading-[1.08] tracking-tight text-bewild-ink">
          O diagnóstico é <span className="italic text-bewild-blue">o primeiro passo.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-bewild-steel sm:text-lg">
          Avaliamos metragem, planta, padrão do prédio, objetivo de uso e potencial do imóvel antes
          de qualquer recomendação.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <CTAButton href="/diagnostico" variant="primary" className="group">
            Solicitar diagnóstico
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </CTAButton>
          <CTAButton href={whatsappHref()} variant="ghost-ink" external>
            <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
          </CTAButton>
        </div>
      </Container>
    </section>
  );
}
