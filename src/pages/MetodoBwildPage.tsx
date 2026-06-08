/**
 * MetodoBwildPage — /metodo-bwild
 * O método Bwild: do diagnóstico ao acompanhamento contínuo.
 */
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import { Search, PencilRuler, Megaphone, Settings2, BarChart3, ArrowRight } from "lucide-react";

const ETAPAS = [
  {
    n: "01",
    title: "Diagnóstico",
    icon: Search,
    descricao:
      "Entendemos imóvel, bairro, estágio, potencial e objetivo. A conversa é consultiva: não tentamos vender antes de entender se a Bwild faz sentido para o seu caso.",
    detalhe: [
      "Avaliação de metragem, localização e padrão do imóvel",
      "Identificação do estágio atual: cru, em reforma, pronto ou já alugando",
      "Objetivo do proprietário: preparar, operar ou jornada completa",
      "Indicação do caminho: Be Wild, Be Stay ou os dois",
    ],
  },
  {
    n: "02",
    title: "Be Wild — Preparação do ativo",
    icon: PencilRuler,
    descricao:
      "Projeto, obra, marcenaria, mobiliário, compras, decoração e setup em um fluxo único. Cada decisão é pensada para o uso real de temporada: foto, diária, limpeza e manutenção.",
    detalhe: [
      "Projeto de arquitetura personalizado para short stay",
      "Execução da obra com gestão técnica e relatórios",
      "Marcenaria, mobiliário, decoração e curadoria de itens",
      "Setup operacional: enxoval, fechadura digital e compatibilidade com check-in remoto",
      "Entrega com documentação de escopo",
    ],
  },
  {
    n: "03",
    title: "Lançamento",
    icon: Megaphone,
    descricao:
      "Fotos profissionais, criação dos anúncios, cadastro nas plataformas e precificação inicial. O imóvel entra no mercado posicionado, não improvisado.",
    detalhe: [
      "Fotos profissionais pensadas para conversão no anúncio",
      "Criação e otimização do perfil no Airbnb, Booking e demais canais",
      "Definição de precificação inicial com base em mercado e sazonalidade",
      "30 dias de tráfego pago para ajudar na tração inicial",
    ],
  },
  {
    n: "04",
    title: "Be Stay — Operação contínua",
    icon: Settings2,
    descricao:
      "Gestão da operação do dia a dia: hóspedes, limpeza, manutenção, canais e repasse. O proprietário acompanha via relatório — sem precisar operar.",
    detalhe: [
      "Atendimento 24h ao hóspede: check-in, suporte e check-out",
      "Limpeza profissional e troca de enxoval entre reservas",
      "Manutenção preventiva e emergencial",
      "Ajuste dinâmico de preços e canais",
      "Repasse mensal com demonstrativo",
    ],
  },
  {
    n: "05",
    title: "Aprendizado contínuo",
    icon: BarChart3,
    descricao:
      "Acompanhamos dados, avaliações de hóspedes, feedbacks e oportunidades de melhoria. O ativo melhora com o tempo — não fica estático após o lançamento.",
    detalhe: [
      "Relatório mensal com ocupação, receita e avaliações",
      "Identificação de oportunidades de ajuste de preço ou produto",
      "Feedbacks de hóspedes incorporados à operação",
      "Revisão periódica de performance do ativo",
    ],
  },
];

export default function MetodoBwildPage() {
  useSeo({
    title: "Método Bwild — Do diagnóstico ao repasse | Bwild",
    description:
      "Conheça o método Bwild: diagnóstico, preparação do ativo com Be Wild, lançamento, operação com Be Stay e aprendizado contínuo. Uma jornada completa para o investidor que não quer operar sozinho.",
    canonicalPath: "/metodo-bwild",
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
                Jornada Bwild
              </p>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Da obra à diária: o método Bwild.
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-white/70 sm:text-xl">
                O imóvel não vira renda quando a escritura sai. Ele vira renda quando está preparado,
                anunciado, precificado, limpo, mantido e operado. A Bwild cuida de todo esse ciclo.
              </p>
              <button
                onClick={() => navigate("/diagnostico")}
                className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
              >
                Iniciar diagnóstico <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Etapas */}
        <section className="border-t border-white/10 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-16 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                As 5 etapas
              </p>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Cada etapa conecta com a próxima.
              </h2>
            </div>

            <div className="space-y-8">
              {ETAPAS.map((etapa, i) => (
                <div
                  key={etapa.n}
                  className="grid gap-8 lg:grid-cols-[auto_1fr_1fr] lg:gap-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"
                >
                  {/* Número e ícone */}
                  <div className="flex lg:flex-col items-center lg:items-start gap-4">
                    <p className="font-mono text-4xl font-bold text-bewild-blue/40">{etapa.n}</p>
                    <etapa.icon className="h-8 w-8 text-bewild-blue-400" />
                  </div>

                  {/* Título e descrição */}
                  <div>
                    <h3 className="mb-3 text-xl font-bold text-white">{etapa.title}</h3>
                    <p className="text-white/65 leading-relaxed">{etapa.descricao}</p>
                    {i < ETAPAS.length - 1 && (
                      <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-bewild-blue-400">
                        <span>Próximo →</span>
                        <span className="font-medium">{ETAPAS[i + 1].title}</span>
                      </div>
                    )}
                  </div>

                  {/* Detalhe */}
                  <ul className="space-y-2.5">
                    {etapa.detalhe.map((d) => (
                      <li key={d} className="flex gap-2 text-sm text-white/60">
                        <span className="text-bewild-blue mt-0.5 shrink-0">→</span>{d}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Por que o ciclo inteiro */}
        <section className="border-t border-white/10 py-20 sm:py-24 bg-bewild-blue/5">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                Por que o ciclo inteiro importa
              </p>
              <h2 className="mb-5 text-3xl font-bold text-white sm:text-4xl">
                Não é reforma + gestão. É continuidade entre criação e operação do ativo.
              </h2>
              <p className="mb-8 text-white/65 leading-relaxed">
                O problema de contratar tudo separado é que ninguém é dono do ciclo inteiro.
                O arquiteto entrega o projeto. O reformeiro entrega a obra. A gestora tenta operar
                o que recebeu. E o investidor fica no meio, costurando decisões, prazos, compras,
                ajustes, anúncios e hóspedes.
              </p>
              <p className="text-white/65 leading-relaxed">
                A Bwild foi criada para reduzir essa fragmentação: o Be Wild prepara o imóvel
                pensando na operação; o Be Stay assume a rotina sem o proprietário precisar integrar nada.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/10 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Descubra em qual etapa seu imóvel está.
            </h2>
            <p className="mb-8 text-white/65 max-w-xl mx-auto">
              O diagnóstico Bwild identifica o estágio do seu imóvel e indica o caminho certo: Be Wild, Be Stay ou jornada completa.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => navigate("/diagnostico")}
                className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
              >
                Avaliar meu imóvel <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={whatsappHref("Olá, quero entender como o método Bwild funciona para o meu imóvel.")}
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
