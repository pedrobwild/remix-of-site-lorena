/**
 * SobrePage — /sobre
 * Humaniza a marca Be Wild: tese, equipe, bastidores e autoridade.
 * Seguindo o BrandSystem v2.0: confiança técnica + hospitalidade premium + operação transparente.
 */
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import { MobileBottomCTA } from "../components/landing/MobileBottomCTA";
import { StickyDiagnosticPanel } from "../components/landing/StickyDiagnosticPanel";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import JornadaBeWild from "../components/landing/JornadaBeWild";
import {
  ArrowRight,
  Lightbulb,
  ShieldCheck,
  Users,
  BarChart3,
  Hammer,
  CalendarCheck,
} from "lucide-react";

const VALORES = [
  {
    icon: Lightbulb,
    title: "Clareza antes da venda",
    text: "O diagnóstico é consultivo. Não recomendamos preparação ou gestão sem entender se faz sentido para o seu caso específico.",
  },
  {
    icon: ShieldCheck,
    title: "Sem promessas de renda",
    text: "Short stay tem sazonalidade e variáveis de mercado. Prometemos gestão profissional, operação transparente e dados reais — não número fictício.",
  },
  {
    icon: Users,
    title: "Continuidade entre fases",
    text: "Quem prepara o imóvel conhece cada detalhe da obra. Quem opera já sabe como o espaço foi pensado. Essa continuidade reduz fricção e retrabalho.",
  },
  {
    icon: BarChart3,
    title: "Transparência total",
    text: "Relatório mensal com reservas, receita, ocupação, custos e repasse. O proprietário acompanha sem precisar perguntar.",
  },
  {
    icon: Hammer,
    title: "Reforma pensada para operar",
    text: "Cada escolha de material, layout e mobiliário considera foto, diária, limpeza e manutenção. Não reformamos para portfólio — reformamos para operação.",
  },
  {
    icon: CalendarCheck,
    title: "Sem fidelidade forçada",
    text: "A continuidade da parceria deve vir do resultado, não de cláusula contratual. Saída com aviso de 30 dias, sem multa.",
  },
];

const NUMEROS = [
  { valor: "SP", label: "Cidade de operação", detalhe: "Foco em bairros premium de São Paulo" },
  { valor: "2", label: "Produtos integrados", detalhe: "Be Wild Reformas + BeWild Host Care" },
  { valor: "24h", label: "Suporte ao hóspede", detalhe: "Check-in, suporte e check-out" },
  { valor: "100%", label: "Relatórios mensais", detalhe: "Dados reais, sem arredondamento" },
];

const PERGUNTAS_FREQUENTES = [
  {
    q: "A Be Wild atende qualquer bairro de São Paulo?",
    a: "Nosso foco atual é em bairros com histórico de demanda para short stay em São Paulo: Pinheiros, Itaim Bibi, Vila Olímpia, Brooklin, Vila Madalena, Consolação, Bela Vista e Vila Mariana. Se seu imóvel está em outro bairro, o diagnóstico avalia a viabilidade.",
  },
  {
    q: "Posso contratar só a reforma ou só a gestão?",
    a: "Sim. O Be Wild Reformas e o BeWild Host Care podem ser contratados separadamente. Mas quando contratados juntos, a continuidade entre quem prepara e quem opera reduz fricção, retrabalho e tempo até a primeira reserva.",
  },
  {
    q: "A Be Wild garante rentabilidade?",
    a: "Não. Short stay tem sazonalidade e variáveis de mercado que nenhuma gestora controla completamente. Prometemos gestão profissional, operação transparente e dados reais. Quem promete número garantido está vendendo expectativa, não serviço.",
  },
  {
    q: "Como funciona o início?",
    a: "Começa pelo diagnóstico: uma conversa consultiva sobre imóvel, bairro, estágio e objetivo. Indicamos o caminho — Be Wild Reformas, BeWild Host Care ou os dois — e apresentamos proposta detalhada. Sem compromisso no diagnóstico.",
  },
  {
    q: "Quanto tempo leva para o imóvel estar operando?",
    a: "Depende do estágio. Imóvel pronto para fotografar pode entrar na operação em poucos dias após o onboarding do Host Care. Imóvel que precisa de reforma: prazo definido no escopo, com entregáveis por fase. O diagnóstico clarifica o caminho.",
  },
];

export default function SobrePage() {
  useSeo({
    title: "Sobre a Be Wild — Preparação e gestão de imóveis para short stay em São Paulo",
    description:
      "Conheça a Be Wild: a empresa que integra Be Wild Reformas e BeWild Host Care para investidores que querem renda imobiliária sem virar operadores. São Paulo.",
    canonicalPath: "/sobre",
    ogType: "website",
  });

  return (
    <div className="bwild-light min-h-screen bg-bewild-cream font-body text-bewild-text-body antialiased">
      <Header />
      <main>

        {/* Hero */}
        <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 bg-bewild-ink">
          <div className="absolute inset-0 bg-gradient-to-br from-bewild-gold/4 via-transparent to-transparent pointer-events-none" />
          <div className="relative mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="max-w-3xl">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                Sobre a Be Wild
              </p>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                A empresa que integra reforma e gestão para o investidor não virar operador.
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-white/60 sm:text-xl">
                A Be Wild nasceu de uma lacuna clara: o mercado tinha reformas de um lado e
                gestoras de Airbnb do outro — mas ninguém era dono do ciclo inteiro. O resultado
                era o investidor costurando fornecedores, prazos, compras, anúncios e hóspedes.
              </p>
              <button
                onClick={() => navigate("/diagnostico")}
                className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
              >
                Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Tese */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="grid gap-14 lg:grid-cols-2 lg:gap-20 lg:items-center">
              <div>
                <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                  A tese
                </p>
                <h2 className="mb-6 text-3xl font-bold text-bewild-ink sm:text-4xl">
                  O fim da reforma é o início da gestão.
                </h2>
                <p className="mb-5 text-white/60 leading-relaxed">
                  Um imóvel de short stay não deveria ser pensado em duas partes. A reforma precisa
                  nascer para a operação. E a gestão precisa conhecer o ativo desde a obra.
                </p>
                <p className="mb-5 text-white/60 leading-relaxed">
                  Quando preparação e operação são desconectadas, o investidor vira o ponto de
                  integração de tudo. A Be Wild assume esse ciclo inteiro — da obra à diária —
                  para que o proprietário acompanhe sem precisar operar.
                </p>
                <p className="text-bewild-text-muted leading-relaxed">
                  Não somos uma construtora. Não somos uma gestora comum de Airbnb. Somos uma
                  operadora integrada de ativo para short stay — uma categoria que o mercado
                  brasileiro ainda está aprendendo a nomear.
                </p>
              </div>

              {/* Números */}
              <div className="grid grid-cols-2 gap-4">
                {NUMEROS.map((n) => (
                  <div
                    key={n.label}
                    className="rounded-2xl border border-bewild-cream-200 bg-white p-6"
                  >
                    <p className="mb-1 text-3xl font-bold text-bewild-ink">{n.valor}</p>
                    <p className="mb-1 text-sm font-semibold text-bewild-text-muted">{n.label}</p>
                    <p className="text-xs text-bewild-text-muted leading-relaxed">{n.detalhe}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Jornada Be Wild — contexto de método */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-24 bg-white">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-12 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                Como operamos
              </p>
              <h2 className="mb-4 text-3xl font-bold text-bewild-ink sm:text-4xl">
                Uma jornada. Dois produtos. Zero fragmentação.
              </h2>
              <p className="text-bewild-text-muted leading-relaxed">
                Be Wild Reformas prepara o ativo. BeWild Host Care opera o ativo.
                A Be Wild conecta os dois — e o investidor não precisa coordenar nada entre eles.
              </p>
            </div>
            <JornadaBeWild variant="home" showCtas={false} />
            <div className="mt-8">
              <button
                onClick={() => navigate("/metodo-bwild")}
                className="inline-flex items-center gap-1.5 text-sm text-bewild-gold hover:text-bewild-ink transition-colors"
              >
                Ver o método completo <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Valores / princípios */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                Como a Be Wild pensa
              </p>
              <h2 className="text-3xl font-bold text-bewild-ink sm:text-4xl">
                Princípios que guiam cada decisão.
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {VALORES.map((v) => (
                <div
                  key={v.title}
                  className="rounded-2xl border border-bewild-cream-200 bg-white p-6"
                >
                  <v.icon className="mb-4 h-6 w-6 text-bewild-gold" />
                  <p className="mb-2 font-semibold text-bewild-ink">{v.title}</p>
                  <p className="text-sm text-bewild-text-muted leading-relaxed">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Onde atuamos */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-24 bg-bewild-parchment">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 lg:items-center">
              <div>
                <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                  Onde atuamos
                </p>
                <h2 className="mb-5 text-3xl font-bold text-bewild-ink sm:text-4xl">
                  São Paulo — com especialização em bairros de alta demanda.
                </h2>
                <p className="mb-6 text-bewild-text-muted leading-relaxed">
                  Nossa operação é focada em São Paulo, com profundo conhecimento dos bairros
                  que concentram demanda qualificada para short stay. Conhecemos a dinâmica de
                  cada região: sazonalidade, perfil de hóspede, concorrência e potencial de diária.
                </p>
              </div>
              <div className="rounded-2xl border border-bewild-cream-200 bg-white p-7">
                <p className="mb-5 text-sm font-semibold text-bewild-ink">Bairros com atuação:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Pinheiros", "Itaim Bibi", "Vila Olímpia", "Brooklin",
                    "Vila Madalena", "Consolação", "Bela Vista", "Vila Mariana",
                    "Jardins", "Moema", "Perdizes", "Butantã",
                  ].map((b) => (
                    <span
                      key={b}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-bewild-text-muted"
                    >
                      {b}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-xs text-bewild-text-muted leading-relaxed">
                  Outros bairros são avaliados caso a caso no diagnóstico.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Sobre */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                Perguntas frequentes
              </p>
              <h2 className="text-3xl font-bold text-bewild-ink sm:text-4xl">
                Sobre a Be Wild e como trabalhamos.
              </h2>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {PERGUNTAS_FREQUENTES.map((f) => (
                <div
                  key={f.q}
                  className="rounded-2xl border border-bewild-cream-200 bg-white p-6"
                >
                  <p className="mb-3 font-semibold text-bewild-ink">{f.q}</p>
                  <p className="text-sm text-bewild-text-muted leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-bewild-ink sm:text-4xl">
              Comece pelo diagnóstico.
            </h2>
            <p className="mb-8 text-bewild-text-muted max-w-xl mx-auto leading-relaxed">
              Uma conversa consultiva, sem compromisso. Entendemos o estágio do seu imóvel
              e indicamos o caminho certo — sem tentar vender antes de entender se faz sentido.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => navigate("/diagnostico")}
                className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
              >
                Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={whatsappHref("Olá, quero saber mais sobre a Be Wild e como vocês trabalham.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-bewild-cream-200 px-7 py-3.5 text-sm font-semibold text-bewild-ink transition-all hover:bg-bewild-parchment hover:border-bewild-cream-200"
              >
                Falar com especialista
              </a>
            </div>
          </div>
        </section>

      </main>
      <MobileBottomCTA />
      <StickyDiagnosticPanel />
      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
}
