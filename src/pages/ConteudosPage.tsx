/**
 * ConteudosPage — /conteudos
 * Guias e conteúdos sobre short stay, reforma e gestão de imóveis.
 * Redireciona para o Blog existente e adiciona conteúdo editorial estratégico.
 */
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import { ArrowRight, BookOpen, Building2, BarChart3, Wrench, MapPin, Shield } from "lucide-react";

const CATEGORIAS = [
  {
    icon: Building2,
    label: "Short Stay",
    desc: "Tudo sobre locação por temporada: como funciona, o que esperar e como preparar seu imóvel.",
  },
  {
    icon: Wrench,
    label: "Preparação do ativo",
    desc: "Guias sobre reforma, mobiliário, decisões de projeto e o que diferencia preparação de obra simples.",
  },
  {
    icon: BarChart3,
    label: "Performance",
    desc: "Ocupação, precificação, canais, sazonalidade e como avaliar se seu imóvel está competitivo.",
  },
  {
    icon: MapPin,
    label: "Bairros de SP",
    desc: "Análise de bairros com potencial para short stay em São Paulo.",
  },
  {
    icon: Shield,
    label: "Riscos e comparativos",
    desc: "Fazer sozinho vs. ter gestão profissional. Erros comuns, custos ocultos e como reduzir atrito.",
  },
];

const GUIAS = [
  {
    titulo: "Como preparar um studio para short stay: o que muda no projeto?",
    categoria: "Preparação do ativo",
    resumo:
      "Reformar para morar e preparar para a diária são duas coisas diferentes. Entenda quais decisões de projeto fazem o imóvel performar melhor — e quais são desperdício.",
    cta: "Ler guia",
  },
  {
    titulo: "Short stay ainda vale a pena em São Paulo? Uma análise sem promessa de renda garantida.",
    categoria: "Short Stay",
    resumo:
      "Com premissas reais, contexto de mercado e sem prometer renda passiva mágica. O que os dados dizem sobre curta temporada na capital.",
    cta: "Ler análise",
  },
  {
    titulo: "Airbnb ou Booking? Como os canais de distribuição impactam sua taxa de ocupação.",
    categoria: "Performance",
    resumo:
      "Cada plataforma tem perfil de hóspede, algoritmo e taxa diferente. Entenda como a estratégia de canais afeta receita e ocupação.",
    cta: "Ler guia",
  },
  {
    titulo: "Gestão própria vs. gestora profissional: o custo real de cada caminho.",
    categoria: "Riscos e comparativos",
    resumo:
      "Além do percentual de administração, existem custos de tempo, erro, manutenção e oportunidade que raramente aparecem na planilha. Veja a comparação completa.",
    cta: "Ver comparativo",
  },
  {
    titulo: "Os 7 erros mais comuns de quem prepara imóvel para short stay.",
    categoria: "Preparação do ativo",
    resumo:
      "De material inadequado a layout que dificulta a limpeza. Erros que parecem pequenos e custam caro na operação — identificados a partir de cases reais.",
    cta: "Ler guia",
  },
  {
    titulo: "Pinheiros, Vila Madalena e Consolação: qual bairro tem mais potencial para short stay?",
    categoria: "Bairros de SP",
    resumo:
      "Análise comparativa com dados de demanda, perfil de hóspede, concorrência e sazonalidade nos bairros mais buscados de São Paulo.",
    cta: "Ver análise",
  },
];

export default function ConteudosPage() {
  useSeo({
    title: "Conteúdos — Short stay, preparação de ativo e gestão | Bwild",
    description:
      "Guias, análises e comparativos sobre short stay, reforma para locação por temporada e gestão profissional de imóveis em São Paulo. Conteúdo sem promessa de renda garantida.",
    canonicalPath: "/conteudos",
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
                Conteúdos Bwild
              </p>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Conteúdo para quem quer entender o ciclo inteiro — sem promessa de renda garantida.
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-white/70">
                Guias, análises e comparativos sobre short stay, preparação de ativo e gestão
                profissional de imóveis em São Paulo.
              </p>
              <a
                href={whatsappHref("Olá, quero receber os materiais da Bwild sobre short stay.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
              >
                Receber materiais <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Categorias */}
        <section className="border-t border-white/10 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {CATEGORIAS.map((cat) => (
                <div
                  key={cat.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <cat.icon className="mb-3 h-6 w-6 text-bewild-blue-400" />
                  <p className="mb-1.5 font-semibold text-white text-sm">{cat.label}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{cat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Guias */}
        <section className="border-t border-white/10 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-12 flex items-center justify-between">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                  Em breve
                </p>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">Guias e análises</h2>
              </div>
              <button
                onClick={() => navigate("/blog")}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-bewild-blue-400 hover:text-white transition-colors"
              >
                Ver blog completo <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {GUIAS.map((guia) => (
                <article
                  key={guia.titulo}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col"
                >
                  <span className="mb-4 inline-block rounded-full border border-bewild-blue/30 bg-bewild-blue/10 px-2.5 py-1 text-xs font-medium text-bewild-blue-400">
                    {guia.categoria}
                  </span>
                  <h3 className="mb-3 font-semibold text-white leading-snug flex-1">{guia.titulo}</h3>
                  <p className="mb-5 text-sm text-white/55 leading-relaxed">{guia.resumo}</p>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-bewild-blue-400">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-white/30">{guia.cta} · Em breve</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 sm:hidden">
              <button
                onClick={() => navigate("/blog")}
                className="inline-flex items-center gap-1.5 text-sm text-bewild-blue-400 hover:text-white transition-colors"
              >
                Ver blog completo <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/10 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Prefere uma conversa direta?
            </h2>
            <p className="mb-8 text-white/65 max-w-xl mx-auto">
              O diagnóstico Bwild responde dúvidas sobre preparação e operação considerando o seu imóvel específico.
            </p>
            <button
              onClick={() => navigate("/diagnostico")}
              className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
            >
              Avaliar meu imóvel <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
}
