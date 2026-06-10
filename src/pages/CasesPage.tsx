/**
 * CasesPage — /cases
 * Cases no formato Triptych: Antes → Pronto → Operando.
 * Sprint 2 — Componente proprietário Triptych Case Card.
 */
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { MobileBottomCTA } from "../components/landing/MobileBottomCTA";
import { StickyDiagnosticPanel } from "../components/landing/StickyDiagnosticPanel";
import { AssetStatusTag } from "../components/landing/AssetStatusTag";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import { ArrowRight, MapPin, CheckCircle, BarChart3, Quote } from "lucide-react";
import { ImagePlaceholder } from "../components/landing/ImagePlaceholder";
import { Reveal } from "../components/landing/MotionPrimitives";

/* ─── Dados dos cases ────────────────────────────────────────────────────────── */
interface Case {
  id: string;
  bairro: string;
  tipo: string;
  tags: string[];
  photoIds?: {
    antes?: string;
    pronto?: string;
    operando?: string;
  };
  antes: {
    titulo: string;
    descricao: string;
    status: "cru" | "preparo";
  };
  pronto: {
    titulo: string;
    decisoes: string[];
  };
  operando: {
    titulo: string;
    descricao: string;
    metricas?: { label: string; value: string }[];
  };
  depoimento?: { texto: string; autor: string; perfil: string };
}

const CASES: Case[] = [
  {
    id: "pinheiros-28",
    bairro: "Pinheiros, São Paulo",
    tipo: "Studio 28m²",
    tags: ["Be Wild Reformas", "BeWild Host Care", "Jornada completa"],
    photoIds: { antes: "pinheiros-antes", pronto: "pinheiros-pronto", operando: "pinheiros-operando" },
    antes: {
      titulo: "Imóvel entregue pela construtora",
      descricao: "Recém-entregue, sem mobília, sem personalização. Proprietário sem tempo para gerenciar obra e fornecedores. Imóvel parado perdendo para a inflação.",
      status: "cru",
    },
    pronto: {
      titulo: "Pronto para hospedar",
      decisoes: [
        "Layout otimizado para foto, circulação e limpeza rápida",
        "Marcenaria sob medida com armazenamento inteligente",
        "Iluminação indireta LED — diferencial visual no anúncio",
        "Persiana blackout + enxoval 200 fios",
        "Setup completo: eletros, decoração e fechadura digital",
      ],
    },
    operando: {
      titulo: "Em operação no BeWild Host Care",
      descricao: "Anúncio ativo no Airbnb e Booking 8 dias após a entrega da obra. Precificação dinâmica desde o lançamento.",
      metricas: [
        { label: "Tempo até 1ª reserva", value: "8 dias" },
        { label: "Ocupação 1º mês", value: "Acima da média" },
        { label: "Canais ativos", value: "Airbnb + Booking" },
      ],
    },
    depoimento: {
      texto: "Não precisei me preocupar com nada. Recebi a chave da construtora, passei para a Bwild e em dois meses já tinha o imóvel gerando reservas.",
      autor: "C. M.",
      perfil: "Studio 28m² · Pinheiros · Jornada completa",
    },
  },
  {
    id: "vila-madalena-42",
    bairro: "Vila Madalena, São Paulo",
    tipo: "Apartamento 1 dorm 42m²",
    tags: ["Be Wild Reformas", "BeWild Host Care", "Imóvel antigo"],
    photoIds: { antes: "vilamadalena-antes", pronto: "vilamadalena-pronto", operando: "vilamadalena-operando" },
    antes: {
      titulo: "Imóvel reformado para moradia há 8 anos",
      descricao: "Proprietário queria aproveitar o ativo para gerar renda mas não sabia por onde começar. Imóvel com bom estado mas inadequado para short stay.",
      status: "preparo",
    },
    pronto: {
      titulo: "Readequado para curta temporada",
      decisoes: [
        "Readequação do layout para uso de temporada",
        "Troca de revestimentos focada em durabilidade e foto",
        "Iluminação replanejada para valorizar o ambiente",
        "Curadoria de mobiliário e itens operacionais",
        "Decoração com identidade para o perfil de hóspede do bairro",
      ],
    },
    operando: {
      titulo: "Operação BeWild Host Care ativa",
      descricao: "Lançamento com anúncio otimizado e precificação calibrada para a demanda de lazer e cultura da Vila Madalena.",
      metricas: [
        { label: "Ocupação 1º mês", value: "Acima da média do bairro" },
        { label: "Tipo de hóspede", value: "Lazer + cultura" },
        { label: "Gestão", value: "BeWild Host Care" },
      ],
    },
    depoimento: {
      texto: "Sempre achei que reformar ia ser uma dor de cabeça. A Bwild fez tudo e ainda explicou cada decisão. O imóvel ficou bem melhor do que eu esperava.",
      autor: "L. R.",
      perfil: "1 dorm 42m² · Vila Madalena · Imóvel antigo",
    },
  },
  {
    id: "consolacao-22",
    bairro: "Consolação, São Paulo",
    tipo: "Studio 22m²",
    tags: ["BeWild Host Care", "Diagnóstico", "Otimização sem obra completa"],
    photoIds: { antes: "consolacao-antes", pronto: "consolacao-pronto" },
    antes: {
      titulo: "Imóvel mobiliado com performance baixa",
      descricao: "Já mobiliado mas sem identidade visual, fotos ruins e anúncio com baixa ocupação há meses. Proprietário cansado de operar sozinho.",
      status: "preparo",
    },
    pronto: {
      titulo: "Otimizado sem obra completa",
      decisoes: [
        "Diagnóstico de performance: gargalos identificados",
        "Ajustes de layout e decoração sem reforma estrutural",
        "Refoto profissional com iluminação e composição estratégica",
        "Revisão de textos e posicionamento do anúncio",
        "Transferência da operação para o BeWild Host Care",
      ],
    },
    operando: {
      titulo: "Novo anúncio + operação profissional",
      descricao: "Sem necessidade de obra completa. Imóvel relançado com novo anúncio e operação BeWild Host Care ativa em menos de 15 dias.",
      metricas: [
        { label: "Tempo para relançar", value: "< 15 dias" },
        { label: "Obra necessária", value: "Nenhuma" },
        { label: "Resultado", value: "Melhora de ocupação" },
      ],
    },
  },
];

/* ─── Triptych Case Card ─────────────────────────────────────────────────────── */
function TriptychCard({ c }: { c: Case }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-bewild-ink overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-bewild-premium">
      {/* Header do case */}
      <div className="px-6 py-5 border-b border-bewild-cream-200 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-white/60">
            <MapPin className="h-3.5 w-3.5" />
            {c.bairro}
          </div>
          <h3 className="text-base font-bold text-bewild-ink">{c.tipo}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {c.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/50"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Triptych: 3 colunas */}
      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-bewild-cream-200">
        {/* Coluna 1 — Antes */}
        <div className="p-5">
          {c.photoIds?.antes && (
            <div className="mb-4 -mx-5 -mt-5 overflow-hidden rounded-t-none">
              <ImagePlaceholder
                assetId={c.photoIds.antes as any}
                className="w-full"
                showReveal={false}
              />
            </div>
          )}
          <div className="mb-3">
            <AssetStatusTag status={c.antes.status} size="sm" />
          </div>
          <p className="text-[10px] font-mono text-white/55 uppercase tracking-widest mb-2">Antes</p>
          <p className="text-sm font-semibold text-bewild-text-body mb-2 leading-snug">{c.antes.titulo}</p>
          <p className="text-xs text-bewild-text-muted leading-relaxed">{c.antes.descricao}</p>
        </div>

        {/* Coluna 2 — Pronto */}
        <div className="p-5 bg-white/[0.015]">
          {c.photoIds?.pronto && (
            <div className="mb-4 -mx-5 -mt-5 overflow-hidden">
              <ImagePlaceholder
                assetId={c.photoIds.pronto as any}
                className="w-full"
                showReveal={false}
              />
            </div>
          )}
          <div className="mb-3">
            <AssetStatusTag status="pronto" size="sm" />
          </div>
          <p className="text-[10px] font-mono text-white/55 uppercase tracking-widest mb-2">Pronto para hospedar</p>
          <p className="text-sm font-semibold text-white mb-3 leading-snug">{c.pronto.titulo}</p>
          <ul className="space-y-1.5">
            {c.pronto.decisoes.map((d) => (
              <li key={d} className="flex items-start gap-2 text-xs text-white/50">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                {d}
              </li>
            ))}
          </ul>
        </div>

        {/* Coluna 3 — Operando */}
        <div className="p-5">
          {c.photoIds?.operando && (
            <div className="mb-4 -mx-5 -mt-5 overflow-hidden">
              <ImagePlaceholder
                assetId={c.photoIds.operando as any}
                className="w-full"
                showReveal={false}
              />
            </div>
          )}
          <div className="mb-3">
            <AssetStatusTag status="operando" size="sm" />
          </div>
          <p className="text-[10px] font-mono text-white/55 uppercase tracking-widest mb-2">Operando</p>
          <p className="text-sm font-semibold text-white mb-2 leading-snug">{c.operando.titulo}</p>
          <p className="text-xs text-bewild-text-muted leading-relaxed mb-4">{c.operando.descricao}</p>
          {c.operando.metricas && (
            <div className="space-y-2">
              {c.operando.metricas.map((m) => (
                <div key={m.label} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-white/55">{m.label}</span>
                  <span className="text-[10px] font-mono font-semibold text-bewild-gold">{m.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Depoimento */}
      {c.depoimento && (
        <div className="px-6 py-4 border-t border-bewild-cream-200 bg-white/[0.015] flex items-start gap-3">
          <Quote className="h-4 w-4 text-bewild-gold/40 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-bewild-text-muted leading-relaxed italic">"{c.depoimento.texto}"</p>
            <p className="mt-2 text-xs text-white/55">{c.depoimento.autor} · {c.depoimento.perfil}</p>
          </div>
        </div>
      )}
    </article>
  );
}

/* ─── Página ─────────────────────────────────────────────────────────────────── */
export default function CasesPage() {
  useSeo({
    title: "Cases — Antes, Pronto e Operando | Be Wild",
    description:
      "Cases da Be Wild no formato Antes → Pronto → Operando. Veja como studios e apartamentos foram transformados em operações de short stay em São Paulo.",
    canonicalPath: "/cases",
    ogType: "website",
  });

  return (
    <div className="bwild-light min-h-screen bg-bewild-cream font-body text-bewild-text-body antialiased">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 bg-bewild-ink">
          <div className="absolute inset-0 bg-gradient-to-br from-bewild-blue/8 via-transparent to-transparent" />
          <div className="relative mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="max-w-3xl">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                Cases reais
              </p>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Antes. Pronto. Operando.
              </h1>
              <p className="mb-6 text-lg leading-relaxed text-white/60">
                Três fases de cada imóvel — estado inicial, decisões da Be Wild e a operação em andamento.
                Sem filtro de marketing. Com dados reais quando disponíveis.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <AssetStatusTag status="cru" />
                <span className="text-white/40">→</span>
                <AssetStatusTag status="pronto" />
                <span className="text-white/40">→</span>
                <AssetStatusTag status="operando" />
              </div>
            </div>
          </div>
        </section>

        {/* Aviso de dados */}
        <div className="border-t border-bewild-cream-200 bg-white/[0.015]">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8 py-4">
            <div className="flex items-start gap-2.5">
              <BarChart3 className="h-4 w-4 text-bewild-gold/50 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-bewild-text-muted leading-relaxed">
                Métricas são indicativas do período inicial de operação de cada case. Resultado passado não garante resultado futuro. Ocupação e receita dependem de imóvel, bairro, período e gestão.
              </p>
            </div>
          </div>
        </div>

        {/* Cases Triptych */}
        <section className="border-t border-bewild-cream-200 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="space-y-8">
              {CASES.map((caseItem, i) => (
                <Reveal key={caseItem.id} delay={i * 100} threshold={0.05}>
                  <TriptychCard c={caseItem} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA diagnóstico */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8 text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
              Seu imóvel pode ser o próximo
            </p>
            <h2 className="mb-4 text-3xl font-bold text-bewild-ink sm:text-4xl">
              O diagnóstico é o primeiro passo.
            </h2>
            <p className="mb-8 text-bewild-text-muted max-w-lg mx-auto leading-relaxed">
              Avaliamos o potencial real do seu ativo — bairro, metragem, estado e objetivo — antes de qualquer recomendação.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/diagnostico")}
                className="inline-flex items-center gap-2 rounded-xl bg-bewild-blue px-7 py-3.5 text-sm font-bold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5 shadow-[0_8px_24px_rgba(0,76,127,0.18)]"
              >
                Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={whatsappHref("Olá, quero entender o potencial do meu imóvel para short stay.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-bewild-cream-200 px-7 py-3.5 text-sm font-semibold text-bewild-text-muted transition-all hover:border-white/40 hover:text-bewild-ink"
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
