/**
 * App.tsx — Home da Bwild.
 *
 * Arquitetura de blocos conforme documento estratégico (junho 2026):
 * 1. Hero — Da obra à diária
 * 2. Problema — O imóvel não vira renda sozinho
 * 3. Jornada Bwild — 5 etapas
 * 4. Be Wild — Preparação do ativo
 * 5. Ponte — O fim da obra é o início da operação
 * 6. Be Stay — Gestão profissional
 * 7. Prova — Cases Antes → Pronto → Operando
 * 8. Comparativo — Por que os dois juntos são mais fortes
 * 9. Diagnóstico — CTA de conversão qualificada
 */
import { useEffect } from "react";
import { useSeo } from "./lib/useSeo";
import { navigate } from "./lib/useHashRoute";
import Header from "./components/landing/Header";
import Footer from "./components/landing/Footer";
import FloatingWhatsAppButton from "./components/landing/FloatingWhatsAppButton";
import { whatsappHref, FAQS } from "./components/landing/content";
import {
  ArrowRight,
  Search,
  PencilRuler,
  Megaphone,
  Settings2,
  BarChart3,
  CheckCircle,
  MapPin,
} from "lucide-react";

const SITE_URL = "https://bwild.com.br"; // TODO: confirmar domínio oficial

// ─── Dados inline da home ───────────────────────────────────────────────────

const PROBLEMA_BULLETS = [
  "Obra atrasando, fornecedores dispersos e compras sem coordenação.",
  "Imóvel bonito, mas funcional para diária? Nem sempre.",
  "Anúncio fraco, precificação improvisada, reservas abaixo do potencial.",
  "Hóspedes, limpeza e manutenção virando rotina do proprietário.",
  "Capital parado entre a entrega da chave e a primeira reserva.",
];

const JORNADA = [
  { n: "01", title: "Diagnóstico", text: "Entendemos imóvel, bairro, estágio, potencial e objetivo.", icon: Search },
  { n: "02", title: "Be Wild", text: "Preparamos o ativo: projeto, obra, mobiliário e setup.", icon: PencilRuler },
  { n: "03", title: "Lançamento", text: "Fotos, anúncio, canais e precificação inicial.", icon: Megaphone },
  { n: "04", title: "Be Stay", text: "Operamos hóspedes, limpeza, manutenção, relatórios e repasse.", icon: Settings2 },
  { n: "05", title: "Aprendizado", text: "Acompanhamos dados, avarias, feedbacks e oportunidades.", icon: BarChart3 },
];

const BEWILD_BULLETS = [
  "Projeto pensado para diária, foto, limpeza, manutenção e experiência do hóspede.",
  "Obra, marcenaria, mobiliário e compras integradas para reduzir interfaces.",
  "Materiais e soluções para uso intensivo — não apenas estética.",
  "Entrega com lógica de operação: pronto para anunciar e gerir.",
];

const BESTAY_BULLETS = [
  "Criação e otimização do anúncio nas plataformas.",
  "Precificação dinâmica e ajuste de tarifas.",
  "Atendimento 24h ao hóspede: check-in, suporte e check-out.",
  "Limpeza profissional, enxoval e vistoria entre reservas.",
  "Manutenção preventiva e emergencial.",
  "Relatórios mensais e repasse transparente.",
];

const BESTAY_TAGS = ["Sem fidelidade", "30 dias de tráfego grátis", "Suporte 24h"];

const CASES_PREVIEW = [
  {
    bairro: "Pinheiros, SP",
    tipo: "Studio 28m²",
    antes: "Recém-entregue pela construtora, sem mobília ou personalização.",
    depois: "Projeto, reforma e setup. Imóvel em operação no Be Stay 8 dias após a entrega.",
    tags: ["Be Wild", "Be Stay"],
  },
  {
    bairro: "Vila Madalena, SP",
    tipo: "Apartamento 1 dorm 42m²",
    antes: "Imóvel antigo reformado para moradia. Proprietário queria gerar renda.",
    depois: "Readequação para short stay. Operação Be Stay com ocupação acima da média do bairro.",
    tags: ["Be Wild", "Be Stay"],
  },
  {
    bairro: "Consolação, SP",
    tipo: "Studio 22m²",
    antes: "Já mobiliado, fotos ruins, anúncio parado há meses. Proprietário cansado de operar.",
    depois: "Ajustes, nova foto e transferência da operação para o Be Stay. Ativo em 15 dias.",
    tags: ["Be Stay", "Otimização"],
  },
];

const COMPARATIVO = [
  { caminho: "Arquiteto + reformeiro + gestora", risco: "Muitas interfaces, retrabalho, decisões de projeto sem visão de operação.", narrativa: "Quando preparação e operação não conversam, o investidor vira integrador." },
  { caminho: "Gestora sem preparo do imóvel", risco: "O imóvel entra nas plataformas com limitações de foto, uso e manutenção.", narrativa: "Gestão boa não salva produto ruim." },
  { caminho: "Be Wild + Be Stay (Bwild)", risco: "Menos interfaces, continuidade entre projeto, entrega e operação.", narrativa: "A Bwild prepara o ativo já pensando em como ele será operado.", highlight: true },
];

const DIAGNOSTICO_OPTIONS = [
  "Tenho um imóvel cru ou recém-entregue.",
  "Tenho um imóvel mobiliado, mas ainda não opero.",
  "Já alugo por temporada, mas quero profissionalizar.",
  "Estou pensando em comprar um imóvel para short stay.",
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function App() {
  useSeo({
    title: "Bwild — Da obra à diária: preparação e gestão de imóveis para short stay",
    description:
      "Com Be Wild, a Bwild projeta, reforma, mobilia e prepara seu imóvel. Com Be Stay, cuidamos do anúncio, preço, hóspedes, limpeza, manutenção, relatórios e repasse. Avalie seu imóvel.",
    canonicalPath: "/",
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Bwild",
        alternateName: ["BWild", "Be Wild", "Be Stay"],
        url: SITE_URL,
        description:
          "Preparação e gestão de imóveis para short stay em São Paulo. Be Wild: projeto, obra e setup. Be Stay: anúncio, hóspedes, limpeza, manutenção e repasse.",
        areaServed: "São Paulo, Brasil",
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  });

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = prev; };
  }, []);

  return (
    <div className="bewild min-h-screen bg-bewild-ink font-body text-bewild-ink antialiased">
      <Header />
      <main>

        {/* ── Bloco 1: Hero ───────────────────────────────────────── */}
        <section id="topo" className="relative overflow-hidden pt-28 pb-24 sm:pt-40 sm:pb-32">
          <div className="absolute inset-0 bg-gradient-to-br from-bewild-blue/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="max-w-4xl">
              <p className="mb-5 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                Bwild · Be Wild · Be Stay
              </p>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                Da obra à diária: a Bwild prepara e opera seu imóvel para o short stay.
              </h1>
              <p className="mb-8 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
                Com Be Wild, projetamos, reformamos, mobiliamos e preparamos seu imóvel para operar.
                Com Be Stay, cuidamos do anúncio, preço, hóspedes, limpeza, manutenção, relatórios e repasse.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/diagnostico")}
                  className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
                >
                  Avaliar meu imóvel <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate("/metodo-bwild")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/40"
                >
                  Ver a jornada completa
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bloco 2: Problema ───────────────────────────────────── */}
        <section id="problema" className="border-t border-white/10 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="grid gap-14 lg:grid-cols-2 lg:gap-20 lg:items-start">
              <div className="max-w-xl">
                <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                  O problema real
                </p>
                <h2 className="mb-5 text-3xl font-bold text-white sm:text-4xl">
                  Comprar ou ter um imóvel é só o começo.
                </h2>
                <p className="text-white/65 leading-relaxed">
                  Para virar renda no short stay, o imóvel precisa ser preparado, fotografado,
                  anunciado, precificado, limpo, mantido e acompanhado. Quando essas etapas ficam
                  soltas, o investidor vira o ponto de integração — e a renda passiva vira trabalho ativo.
                </p>
              </div>
              <ul className="space-y-4">
                {PROBLEMA_BULLETS.map((b) => (
                  <li key={b} className="flex gap-3 text-white/65">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-bewild-blue" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Bloco 3: Jornada Bwild ──────────────────────────────── */}
        <section id="jornada" className="border-t border-white/10 py-20 sm:py-28 bg-white/[0.02]">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                Jornada Bwild
              </p>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Be Wild prepara. Be Stay opera. A Bwild conecta o ciclo inteiro.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {JORNADA.map((etapa) => (
                <div
                  key={etapa.n}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <p className="mb-3 font-mono text-2xl font-bold text-bewild-blue/40">{etapa.n}</p>
                  <etapa.icon className="mb-3 h-5 w-5 text-bewild-blue-400" />
                  <p className="mb-1.5 font-semibold text-white text-sm">{etapa.title}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{etapa.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <button
                onClick={() => navigate("/metodo-bwild")}
                className="inline-flex items-center gap-1.5 text-sm text-bewild-blue-400 hover:text-white transition-colors"
              >
                Conhecer o método completo <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ── Bloco 4: Be Wild ────────────────────────────────────── */}
        <section id="be-wild" className="border-t border-white/10 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="grid gap-14 lg:grid-cols-2 lg:gap-20 lg:items-center">
              <div>
                <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                  Be Wild · Etapa 1
                </p>
                <h2 className="mb-5 text-3xl font-bold text-white sm:text-4xl">
                  Prepare o imóvel antes de colocar para render.
                </h2>
                <p className="mb-6 text-white/65 leading-relaxed">
                  O Be Wild transforma studios e apartamentos em espaços prontos para competir no
                  short stay. Projeto, obra, marcenaria, mobiliário, decoração e setup em um fluxo
                  integrado, com decisões pensadas para foto, uso, limpeza e experiência do hóspede.
                </p>
                <ul className="space-y-3 mb-8">
                  {BEWILD_BULLETS.map((b) => (
                    <li key={b} className="flex gap-2.5 text-sm text-white/65">
                      <CheckCircle className="h-4 w-4 text-bewild-blue-400 shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/be-wild")}
                  className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
                >
                  Preparar meu imóvel <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                <p className="mb-6 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                  Ideal para
                </p>
                <ul className="space-y-3 text-sm text-white/65">
                  {[
                    "Studios recém-entregues pela construtora",
                    "Imóveis vazios ou sem mobília",
                    "Apartamentos reformados para moradia que precisam de readequação",
                    "Imóveis subaproveitados com potencial para short stay",
                  ].map((i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="text-bewild-blue mt-0.5 shrink-0">→</span>{i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bloco 5: Ponte ──────────────────────────────────────── */}
        <section className="border-t border-white/10 py-16 sm:py-20 bg-bewild-blue/5">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <p className="mb-5 text-lg font-medium text-white sm:text-xl leading-relaxed">
                A maioria das obras termina na entrega das chaves.{" "}
                <span className="text-bewild-blue-300">A nossa termina com o imóvel pronto para entrar no mercado.</span>
              </p>
              <p className="text-white/55 leading-relaxed">
                Cada decisão do Be Wild considera a operação que vem depois: foto, diária, limpeza,
                manutenção, check-in e experiência do hóspede. Quando a reforma acaba, o Be Stay
                já sabe como colocar o ativo para rodar.
              </p>
            </div>
          </div>
        </section>

        {/* ── Bloco 6: Be Stay ────────────────────────────────────── */}
        <section id="be-stay" className="border-t border-white/10 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="grid gap-14 lg:grid-cols-2 lg:gap-20 lg:items-center">
              <div className="order-2 lg:order-1 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                <p className="mb-6 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                  O que está incluso
                </p>
                <ul className="space-y-3 text-sm text-white/65">
                  {BESTAY_BULLETS.map((b) => (
                    <li key={b} className="flex gap-2.5">
                      <span className="text-bewild-blue mt-0.5 shrink-0">→</span>{b}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-2">
                  {BESTAY_TAGS.map((t) => (
                    <span key={t} className="rounded-full border border-bewild-blue/30 bg-bewild-blue/10 px-3 py-1 text-xs text-bewild-blue-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                  Be Stay · Etapa 2
                </p>
                <h2 className="mb-5 text-3xl font-bold text-white sm:text-4xl">
                  Depois de pronto, o imóvel precisa rodar.
                </h2>
                <p className="mb-8 text-white/65 leading-relaxed">
                  O Be Stay cuida da gestão profissional de locação por temporada. Você acompanha
                  a performance com relatório mensal enquanto a Bwild cuida da rotina que faz o
                  short stay acontecer.
                </p>
                <button
                  onClick={() => navigate("/be-stay")}
                  className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
                >
                  Operar meu imóvel <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bloco 7: Cases / Prova ──────────────────────────────── */}
        <section id="cases" className="border-t border-white/10 py-20 sm:py-28 bg-white/[0.02]">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-14 flex flex-wrap gap-4 items-end justify-between">
              <div>
                <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                  Prova · Antes → Pronto → Operando
                </p>
                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                  Imóveis transformados em operação.
                </h2>
              </div>
              <button
                onClick={() => navigate("/cases")}
                className="inline-flex items-center gap-1.5 text-sm text-bewild-blue-400 hover:text-white transition-colors"
              >
                Ver todos os cases <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CASES_PREVIEW.map((c, i) => (
                <article
                  key={i}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
                >
                  <div className="border-b border-white/10 p-5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin className="h-3.5 w-3.5 text-bewild-blue-400" />
                      <p className="text-xs font-medium text-bewild-blue-400">{c.bairro}</p>
                    </div>
                    <p className="text-xs text-white/45">{c.tipo}</p>
                  </div>
                  <div className="grid grid-rows-2 divide-y divide-white/10">
                    <div className="p-5">
                      <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-wider text-white/30">Antes</p>
                      <p className="text-sm text-white/60 leading-relaxed">{c.antes}</p>
                    </div>
                    <div className="p-5">
                      <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-wider text-bewild-blue-400">Pronto → Operando</p>
                      <p className="text-sm text-white/60 leading-relaxed">{c.depois}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-5 border-t border-white/10">
                    {c.tags.map((t) => (
                      <span key={t} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/50">
                        {t}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bloco 8: Comparativo ────────────────────────────────── */}
        <section id="comparativo" className="border-t border-white/10 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                Comparativo
              </p>
              <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
                Por que os dois juntos são mais fortes.
              </h2>
              <p className="text-white/60">
                Não é reforma + gestão. É continuidade entre criação do ativo e operação do ativo.
              </p>
            </div>
            <div className="space-y-4">
              {COMPARATIVO.map((row) => (
                <div
                  key={row.caminho}
                  className={`rounded-2xl border p-6 sm:p-8 grid sm:grid-cols-[auto_1fr_1fr] gap-4 sm:gap-8 items-start ${
                    row.highlight
                      ? "border-bewild-blue/40 bg-bewild-blue/5"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  <p className={`font-semibold text-sm ${row.highlight ? "text-white" : "text-white/60"}`}>
                    {row.caminho}
                  </p>
                  <p className="text-sm text-white/50 leading-relaxed">{row.risco}</p>
                  <p className={`text-sm leading-relaxed ${row.highlight ? "text-bewild-blue-300" : "text-white/50"}`}>
                    {row.narrativa}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bloco 9: Diagnóstico / CTA final ────────────────────── */}
        <section id="diagnostico" className="border-t border-white/10 py-20 sm:py-28 bg-white/[0.02]">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="grid gap-14 lg:grid-cols-2 lg:gap-20 lg:items-center">
              <div className="max-w-xl">
                <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                  Diagnóstico Bwild do Ativo
                </p>
                <h2 className="mb-5 text-3xl font-bold text-white sm:text-4xl">
                  Não sabe se precisa reformar, ajustar ou colocar para operar?
                </h2>
                <p className="mb-8 text-white/65 leading-relaxed">
                  Conte para a Bwild em que estágio está seu imóvel. A gente te mostra qual caminho
                  faz sentido: Be Wild, Be Stay ou jornada completa.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate("/diagnostico")}
                    className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
                  >
                    Avaliar meu imóvel <ArrowRight className="h-4 w-4" />
                  </button>
                  <a
                    href={whatsappHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/40"
                  >
                    Falar pelo WhatsApp
                  </a>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <p className="mb-5 text-sm font-medium text-white/70">Em que estágio você está?</p>
                <div className="space-y-3">
                  {DIAGNOSTICO_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => navigate("/diagnostico")}
                      className="w-full text-left rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white/70 hover:border-bewild-blue/40 hover:bg-bewild-blue/5 hover:text-white transition-all"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
}
