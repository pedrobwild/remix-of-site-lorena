/**
 * BeWildPage — /be-wild
 * Preparação do ativo para short stay: projeto, obra, mobiliário e setup.
 */
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { navigate } from "../lib/useHashRoute";
import JornadaBeWild from "../components/landing/JornadaBeWild";
import { whatsappHref } from "../components/landing/content";
import {
  PencilRuler,
  Hammer,
  Sofa,
  Camera,
  Wrench,
  CheckSquare,
  ArrowRight,
  Layers,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";

const METODO = [
  {
    n: "01",
    title: "Diagnóstico do imóvel",
    text: "Analisamos metragem, planta, localização, padrão do prédio e objetivo de uso para entender o potencial do ativo.",
    icon: CheckSquare,
  },
  {
    n: "02",
    title: "Projeto de arquitetura",
    text: "Layout, marcenaria, iluminação, acabamentos e soluções pensadas para foto, uso, limpeza e manutenção — não apenas para a entrega.",
    icon: PencilRuler,
  },
  {
    n: "03",
    title: "Obra e execução",
    text: "Cronograma, fornecedores, controle de etapas, fotos e relatórios. A obra avança com gestão técnica e comunicação centralizada.",
    icon: Hammer,
  },
  {
    n: "04",
    title: "Mobiliário e compras",
    text: "Curadoria de móveis, eletros, decoração, enxoval e itens operacionais para o imóvel sair pronto para anúncio e operação.",
    icon: Sofa,
  },
  {
    n: "05",
    title: "Setup e entrega",
    text: "Finalização, limpeza, montagem, ajustes finais e imóvel fotografável, funcional e pronto para entrar no mercado.",
    icon: Camera,
  },
];

const DECISOES = [
  {
    title: "Layout funcional",
    text: "Facilita limpeza, circulação, foto e experiência do hóspede desde o projeto.",
    icon: Layers,
  },
  {
    title: "Materiais duráveis",
    text: "Escolha que considera resistência, limpeza, reposição e custo total — não só estética.",
    icon: Wrench,
  },
  {
    title: "Iluminação estratégica",
    text: "A luz certa melhora a foto, a percepção de qualidade e a experiência do hóspede.",
    icon: Lightbulb,
  },
  {
    title: "Compatível com operação",
    text: "Fechadura digital, check-in remoto, documentação de escopo e fácil manutenção já previstos no projeto.",
    icon: ShieldCheck,
  },
];

const FAQS = [
  {
    q: "Qual a diferença entre reformar para morar e preparar para short stay?",
    a: "Uma reforma para moradia prioriza o gosto do proprietário. A preparação para short stay considera foto, diária, experiência do hóspede, limpeza rápida, manutenção preventiva e durabilidade de uso intenso. São decisões de projeto diferentes desde o início.",
  },
  {
    q: "O que está incluso no Be Wild?",
    a: "Projeto de arquitetura, obra civil, marcenaria sob medida, compra de mobiliário, decoração, enxoval e setup operacional. Tudo coordenado em um único processo.",
  },
  {
    q: "Quanto tempo leva o projeto e a obra?",
    a: "Depende do estado atual e da metragem do imóvel. Em média, studios compactos ficam prontos em 45 a 90 dias. Detalhamos o cronograma no diagnóstico.",
  },
  {
    q: "O imóvel já sai pronto para entrar no BeWild Host Care?",
    a: "Sim. Cada decisão do Be Wild considera a operação que vem depois: foto, anúncio, limpeza, manutenção e experiência do hóspede. Quando a obra acaba, o BeWild Host Care já pode colocar o ativo para rodar.",
  },
  {
    q: "Como funciona o acompanhamento durante a obra?",
    a: "Você recebe fotos, relatórios de etapas e cronograma atualizado. A gestão técnica é feita pela Bwild, sem você precisar ir ao imóvel para saber o que está acontecendo.",
  },
  {
    q: "Vocês atendem imóveis fora de São Paulo?",
    a: "No momento atuamos em São Paulo. Entre em contato para verificar a viabilidade da sua região.",
  },
];

export default function BeWildPage() {
  useSeo({
    title: "Be Wild Reformas — Preparação do ativo para short stay | Bwild",
    description:
      "Projeto, obra, mobiliário e setup integrados para transformar seu imóvel em um espaço pronto para competir no short stay. Cada decisão pensada para foto, uso, limpeza e operação.",
    canonicalPath: "/be-wild",
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
                Be Wild Reformas · Preparação do Ativo
              </p>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Prepare seu imóvel para competir no short stay.
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-white/70 sm:text-xl">
                Projeto, obra, marcenaria, mobiliário, compras, decoração e setup em um fluxo
                único. Cada decisão pensada para foto, uso, limpeza, manutenção e experiência do
                hóspede — não apenas para a entrega.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/diagnostico")}
                  className="inline-flex items-center gap-2 rounded-full bg-bewild-gold px-6 py-3 text-sm font-semibold text-bewild-ink transition-all hover:bg-bewild-gold-600 hover:-translate-y-0.5"
                >
                  Preparar meu imóvel <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href={whatsappHref("Olá, quero saber mais sobre o Be Wild para preparar meu imóvel para short stay.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-all hover:border-white/40"
                >
                  Falar com especialista
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Problema */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 lg:items-center">
              <div>
                <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                  O problema
                </p>
                <h2 className="mb-5 text-3xl font-bold text-white sm:text-4xl">
                  Reformar para morar é diferente de preparar para a diária.
                </h2>
                <p className="text-white/65 leading-relaxed">
                  Uma obra comum prioriza o gosto do proprietário. A preparação de um ativo para
                  short stay exige decisões diferentes desde o projeto: materiais para uso intenso,
                  layout que facilita limpeza, iluminação fotografável e setup compatível com operação
                  remota. Sem essa visão, o imóvel fica bonito — mas pouco competitivo.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                <p className="mb-4 text-sm font-semibold text-bewild-blue-400">
                  Não é sobre deixar bonito. É sobre preparar o ativo para operar melhor.
                </p>
                <ul className="space-y-3 text-sm text-white/65">
                  <li className="flex gap-2"><span className="text-bewild-blue mt-0.5">→</span>Projeto pensado para diária, foto, limpeza e manutenção</li>
                  <li className="flex gap-2"><span className="text-bewild-blue mt-0.5">→</span>Obra, marcenaria, mobiliário e compras integradas</li>
                  <li className="flex gap-2"><span className="text-bewild-blue mt-0.5">→</span>Materiais para uso intensivo, não apenas estética</li>
                  <li className="flex gap-2"><span className="text-bewild-blue mt-0.5">→</span>Entrega pronta para anunciar e operar</li>
                  <li className="flex gap-2"><span className="text-bewild-blue mt-0.5">→</span>Ideal para studios recém-entregues, imóveis vazios ou mal aproveitados</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Método */}
        <section className="border-t border-white/10 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                Método Be Wild
              </p>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Do diagnóstico à entrega pronta para operar.
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {METODO.map((step) => (
                <div
                  key={step.n}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <p className="mb-3 font-mono text-2xl font-bold text-bewild-blue/50">{step.n}</p>
                  <step.icon className="mb-3 h-6 w-6 text-bewild-blue-400" />
                  <p className="mb-2 font-semibold text-white">{step.title}</p>
                  <p className="text-sm text-white/55 leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Decisões operacionais */}
        <section className="border-t border-white/10 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                Decisões que vendem operação depois
              </p>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Cada escolha de projeto pensa na gestão que vem depois.
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {DECISOES.map((d) => (
                <div key={d.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <d.icon className="mb-4 h-7 w-7 text-bewild-blue-400" />
                  <p className="mb-2 font-semibold text-white">{d.title}</p>
                  <p className="text-sm text-white/55 leading-relaxed">{d.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ponte BeWild Host Care */}
        <section className="border-t border-white/10 py-20 sm:py-24 bg-bewild-blue/5">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                A jornada continua
              </p>
              <h2 className="mb-5 text-3xl font-bold text-white sm:text-4xl">
                A entrega da obra não é o fim. É o início da operação.
              </h2>
              <p className="mb-8 text-white/65 leading-relaxed">
                A maioria das obras termina na entrega das chaves. A nossa termina com o imóvel pronto
                para entrar no mercado. Por isso, cada decisão do Be Wild considera a operação que vem
                depois — foto, diária, limpeza, manutenção, check-in e experiência do hóspede. Quando
                a reforma acaba, o BeWild Host Care já sabe como colocar o ativo para rodar.
              </p>
              <div className="mb-7">
                <JornadaBeWild variant="mini" />
              </div>
              <button
                onClick={() => navigate("/bewild-host-care")}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20 border border-white/20"
              >
                Conhecer o BeWild Host Care <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-white/10 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                Perguntas frequentes
              </p>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">FAQ Be Wild</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {FAQS.map((f) => (
                <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="mb-3 font-semibold text-white">{f.q}</p>
                  <p className="text-sm text-white/60 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="border-t border-white/10 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Pronto para preparar seu imóvel?
            </h2>
            <p className="mb-8 text-white/65 max-w-xl mx-auto">
              Conte para a Bwild em que estágio está seu imóvel. A gente mostra qual caminho faz sentido.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => navigate("/diagnostico")}
                className="inline-flex items-center gap-2 rounded-full bg-bewild-gold px-7 py-3.5 text-sm font-semibold text-bewild-ink transition-all hover:bg-bewild-gold-600 hover:-translate-y-0.5"
              >
                Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={whatsappHref("Olá, quero um diagnóstico Be Wild para meu imóvel.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/40"
              >
                Receber diagnóstico Be Wild
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
