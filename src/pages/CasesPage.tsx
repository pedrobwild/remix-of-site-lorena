/**
 * CasesPage — /cases
 * Cases no formato Antes → Pronto → Operando.
 */
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import { ArrowRight, MapPin, Home } from "lucide-react";

// Template de case — será preenchido com cases reais
const CASES: Array<{
  bairro: string;
  tipo: string;
  situacaoInicial: string;
  decisoesBewild: string[];
  entrada: string;
  depoimento?: string;
  tags: string[];
}> = [
  {
    bairro: "Pinheiros, São Paulo",
    tipo: "Studio 28m²",
    situacaoInicial: "Imóvel recém-entregue pela construtora, sem nenhuma mobília ou personalização. Proprietário sem tempo para gerenciar obra e fornecedores.",
    decisoesBewild: [
      "Layout otimizado para foto, circulação e limpeza rápida",
      "Marcenaria sob medida com armazenamento inteligente",
      "Materiais de alta durabilidade para uso intensivo",
      "Setup completo: enxoval, eletros, decoração e fechadura digital",
    ],
    entrada: "Imóvel entrou no BeWild Host Care 8 dias após a entrega da obra, com anúncio ativo no Airbnb e Booking.",
    depoimento: "Não precisei me preocupar com nada. Recebi a chave da construtora, passei para a Bwild e em dois meses já tinha o imóvel gerando reservas.",
    tags: ["Be Wild", "BeWild Host Care", "Jornada completa"],
  },
  {
    bairro: "Vila Madalena, São Paulo",
    tipo: "Apartamento 1 dorm 42m²",
    situacaoInicial: "Imóvel antigo, reformado para moradia há 8 anos. Proprietário queria aproveitar o ativo para gerar renda mas não sabia por onde começar.",
    decisoesBewild: [
      "Readequação do layout para curta temporada",
      "Troca de revestimentos e marcenaria com foco em durabilidade",
      "Iluminação replanejada para valorizar o ambiente na foto",
      "Curadoria de mobiliário e itens operacionais",
    ],
    entrada: "Após a entrega do Be Wild, o imóvel entrou no BeWild Host Care com ocupação inicial acima da média do bairro no primeiro mês.",
    depoimento: "Sempre achei que reformar ia ser uma dor de cabeça. A Bwild fez tudo e ainda explicou cada decisão. O imóvel ficou bem melhor do que eu esperava.",
    tags: ["Be Wild", "BeWild Host Care", "Imóvel antigo"],
  },
  {
    bairro: "Consolação, São Paulo",
    tipo: "Studio 22m²",
    situacaoInicial: "Imóvel já mobiliado mas sem identidade visual, fotos ruins e anúncio parado há meses. Proprietário cansado de operar sozinho.",
    decisoesBewild: [
      "Diagnóstico de performance: identificação dos gargalos operacionais",
      "Ajustes de layout e decoração sem obra completa",
      "Refot para anúncio com iluminação e composição profissional",
      "Transferência da operação para o BeWild Host Care",
    ],
    entrada: "Sem necessidade de obra completa. O imóvel foi otimizado e entrou na operação BeWild Host Care com novo anúncio em menos de 15 dias.",
    tags: ["BeWild Host Care", "Diagnóstico", "Otimização"],
  },
];

export default function CasesPage() {
  useSeo({
    title: "Cases — Antes, Pronto e Operando | Bwild",
    description:
      "Cases reais da Bwild no formato Antes → Pronto → Operando. Veja como studios e apartamentos foram transformados em operações de short stay.",
    canonicalPath: "/cases",
    ogType: "website",
  });

  return (
    <div className="bewild min-h-screen bg-bewild-ink font-body text-bewild-ink antialiased">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
          <div className="absolute inset-0 bg-gradient-to-br from-bewild-blue/10 via-transparent to-transparent" />
          <div className="relative mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="max-w-3xl">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                Cases · Antes → Pronto → Operando
              </p>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Imóveis transformados em operação de short stay.
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-white/70">
                Cada case mostra a jornada real: a situação inicial, as decisões do Be Wild, a entrega
                e a entrada em operação com o BeWild Host Care. Prova de jornada, não portfólio bonito.
              </p>
            </div>
          </div>
        </section>

        {/* Cases */}
        <section className="border-t border-white/10 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="space-y-12">
              {CASES.map((c, i) => (
                <article
                  key={i}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
                >
                  {/* Header do case */}
                  <div className="border-b border-white/10 p-6 sm:p-8 flex flex-wrap gap-4 items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-bewild-blue-400" />
                        <p className="text-sm font-medium text-bewild-blue-400">{c.bairro}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-white/40" />
                        <p className="text-sm text-white/60">{c.tipo}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.tags.map((t) => (
                        <span key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/60">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Três momentos */}
                  <div className="grid gap-0 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
                    <div className="p-6 sm:p-8">
                      <p className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-white/35">
                        Antes
                      </p>
                      <p className="text-sm text-white/65 leading-relaxed">{c.situacaoInicial}</p>
                    </div>
                    <div className="p-6 sm:p-8">
                      <p className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-bewild-blue-400">
                        Pronto · Be Wild
                      </p>
                      <ul className="space-y-2">
                        {c.decisoesBewild.map((d) => (
                          <li key={d} className="flex gap-2 text-sm text-white/65">
                            <span className="text-bewild-blue mt-0.5 shrink-0">→</span>{d}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-6 sm:p-8">
                      <p className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-emerald-400">
                        Operando · BeWild Host Care
                      </p>
                      <p className="text-sm text-white/65 leading-relaxed mb-4">{c.entrada}</p>
                      {c.depoimento && (
                        <blockquote className="border-l-2 border-bewild-blue/40 pl-3 text-sm text-white/50 italic leading-relaxed">
                          "{c.depoimento}"
                        </blockquote>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/10 p-6 sm:p-8">
                    <button
                      onClick={() => navigate("/diagnostico")}
                      className="inline-flex items-center gap-2 text-sm font-medium text-bewild-blue-400 hover:text-white transition-colors"
                    >
                      Avaliar imóvel parecido com o meu <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Formato do case */}
        <section className="border-t border-white/10 py-20 sm:py-24 bg-white/[0.02]">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                Formato proprietário
              </p>
              <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl">
                Antes → Pronto → Operando
              </h2>
              <p className="mb-6 text-white/60 leading-relaxed">
                Todo case Bwild segue esse formato porque prova de jornada é mais forte que portfólio bonito.
                O investidor precisa ver a situação de partida, as decisões que fizeram diferença e o
                resultado de operação — não só a foto final.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Antes", desc: "Situação real do imóvel antes da Bwild entrar." },
                  { label: "Pronto", desc: "Decisões do Be Wild que prepararam o ativo para operar." },
                  { label: "Operando", desc: "Como o BeWild Host Care colocou o imóvel no mercado e os primeiros resultados." },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="mb-1.5 font-semibold text-white">{item.label}</p>
                    <p className="text-xs text-white/55 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/10 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Seu imóvel pode ser o próximo case.
            </h2>
            <p className="mb-8 text-white/65 max-w-xl mx-auto">
              Conte em que estágio está seu imóvel e qual é o seu objetivo. A gente te mostra o caminho.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => navigate("/diagnostico")}
                className="inline-flex items-center gap-2 rounded-full bg-bewild-gold px-7 py-3.5 text-sm font-semibold text-bewild-ink transition-all hover:bg-bewild-gold-600 hover:-translate-y-0.5"
              >
                Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={whatsappHref("Olá, vi os cases da Bwild e quero entender o que é possível com meu imóvel.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/40"
              >
                Falar com especialista
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
}
