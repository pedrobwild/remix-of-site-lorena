/**
 * BewildHostCarePage — /bewild-host-care
 * Gestão profissional de locação por temporada.
 */
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import { ImagePlaceholder } from "../components/landing/ImagePlaceholder";
import { HostCareDashboard } from "../components/landing/HostCareDashboard";
import { MobileBottomCTA } from "../components/landing/MobileBottomCTA";
import { StickyDiagnosticPanel } from "../components/landing/StickyDiagnosticPanel";
import {
  Megaphone,
  SlidersHorizontal,
  Users,
  Sparkles,
  Wrench,
  BarChart3,
  Wallet,
  Clock,
  ShieldOff,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const SERVICOS = [
  {
    title: "Anúncio e canais",
    text: "Criação, otimização e gestão do imóvel no Airbnb, Booking e demais plataformas. Fotos, textos e posicionamento para maximizar visibilidade.",
    icon: Megaphone,
  },
  {
    title: "Precificação dinâmica",
    text: "Ajuste de tarifas conforme demanda, sazonalidade, eventos e concorrência. Gestão ativa de receita — não cadastro passivo.",
    icon: SlidersHorizontal,
  },
  {
    title: "Atendimento 24h ao hóspede",
    text: "Check-in, check-out, suporte durante a estadia e resolução de imprevistos. Você não vira central de atendimento.",
    icon: Users,
  },
  {
    title: "Limpeza e enxoval",
    text: "Limpeza profissional entre reservas, troca de enxoval e vistoria de condição após cada saída.",
    icon: Sparkles,
  },
  {
    title: "Manutenção preventiva e emergencial",
    text: "Acompanhamento do estado do imóvel, reparos preventivos e atendimento de emergências sem o proprietário precisar acionar ninguém.",
    icon: Wrench,
  },
  {
    title: "Relatórios mensais",
    text: "Dashboard com reservas, receita, ocupação, avaliações e repasse. Transparência total sem você precisar pedir atualização.",
    icon: BarChart3,
  },
  {
    title: "Repasse mensal",
    text: "Repasse líquido do período com demonstrativo detalhado. Você acompanha o resultado sem precisar acessar as plataformas.",
    icon: Wallet,
  },
];

const DIFERENCIAIS = [
  { title: "Sem fidelidade", text: "Saia com aviso de 30 dias. Você não fica preso em contrato longo.", icon: ShieldOff },
  { title: "30 dias de tráfego pago grátis", text: "A Bwild investe nos primeiros 30 dias para ajudar o imóvel a tracionar nas plataformas.", icon: Megaphone },
  { title: "Suporte 24h ao hóspede", text: "O proprietário não precisa responder mensagens às 2h da manhã.", icon: Clock },
  { title: "Operação verificável", text: "Relatório mensal com dados reais, reservas, receita e ocupação.", icon: BarChart3 },
];

const FAQS = [
  {
    q: "O que a Bwild faz na gestão?",
    a: "Cuidamos de tudo: criação e otimização do anúncio, gestão de plataformas, precificação dinâmica, atendimento ao hóspede 24h, limpeza, enxoval, vistoria, manutenção preventiva e emergencial, relatórios mensais e repasse.",
  },
  {
    q: "Como funcionam as taxas?",
    a: "Cobramos taxa de adesão para entrada na operação e percentual sobre as reservas realizadas. O modelo detalhado é apresentado na proposta comercial após o diagnóstico do imóvel.",
  },
  {
    q: "Existe fidelidade?",
    a: "Não. Você pode sair com aviso de 30 dias. Não existe multa ou contrato de longo prazo. Acreditamos que a continuidade da parceria deve vir do resultado, não de cláusula contratual.",
  },
  {
    q: "Como funciona o suporte ao hóspede?",
    a: "Nossa equipe atende os hóspedes 24 horas por dia, 7 dias por semana — desde o check-in até questões durante a estadia e o check-out. Você não recebe mensagem de hóspede.",
  },
  {
    q: "Quem cuida da limpeza e do enxoval?",
    a: "A Bwild coordena equipe especializada em limpeza de imóveis de temporada. O enxoval é gerido e reposto conforme necessidade operacional.",
  },
  {
    q: "Como funciona a manutenção?",
    a: "Fazemos vistorias regulares para identificar desgastes e reparos preventivos. Em caso de emergência, acionamos técnicos sem o proprietário precisar resolver nada.",
  },
  {
    q: "A Bwild garante faturamento?",
    a: "Não garantimos faturamento mínimo. Short stay tem sazonalidade e variáveis de mercado. Nossa promessa é gestão profissional, operação transparente e dados reais — não número fictício.",
  },
  {
    q: "Meu imóvel precisa ter sido reformado pela Bwild para entrar no BeWild Host Care?",
    a: "Não necessariamente. Fazemos uma vistoria para avaliar se o imóvel está pronto para operar. Se precisar de ajustes, indicamos o Be Wild Reformas. Se já estiver pronto, podemos começar diretamente.",
  },
];

export default function BewildHostCarePage() {
  useSeo({
    title: "BeWild Host Care — Gestão profissional de locação por temporada | Be Wild",
    description:
      "Anúncio, precificação, hóspedes, limpeza, manutenção, relatórios e repasse. Gestão profissional de short stay sem você virar anfitrião. Sem fidelidade, com suporte 24h.",
    canonicalPath: "/bewild-host-care",
    ogType: "website",
  });

  return (
    <div className="bwild-light min-h-screen bg-bewild-cream font-body text-bewild-text-body antialiased">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 bg-bewild-ink">
          <div className="absolute inset-0 bg-gradient-to-br from-bewild-gold/5 via-transparent to-transparent" />
          <div className="relative mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="max-w-3xl">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-bewild-gold">
                BeWild Host Care · Gestão de Temporada
              </p>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Seu imóvel em operação, sem você virar anfitrião.
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-white/60 sm:text-xl">
                Cuidamos do anúncio, canais, precificação, atendimento 24h ao hóspede, limpeza,
                enxoval, manutenção, relatórios e repasse. Você acompanha a performance sem
                precisar operar o dia a dia.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-wrap gap-3 mb-6">
                  {["Sem fidelidade", "Suporte 24h", "30 dias de tráfego grátis"].map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-bewild-blue/40 bg-bewild-gold/10 px-3 py-1 text-xs font-medium text-bewild-gold">
                      <CheckCircle className="h-3.5 w-3.5" /> {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/diagnostico")}
                  className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
                >
                  Operar meu imóvel <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href={whatsappHref("Olá, tenho um imóvel pronto e quero entender como funciona o BeWild Host Care.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-bewild-cream-200 px-6 py-3 text-sm font-semibold text-bewild-ink transition-all hover:bg-bewild-parchment hover:border-bewild-cream-200"
                >
                  Receber análise de gestão
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* O problema */}
        <section className="py-20 sm:py-24 border-t border-bewild-cream-200">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 lg:items-center">
              <div>
                <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                  O problema invisível
                </p>
                <h2 className="mb-5 text-3xl font-bold text-bewild-ink sm:text-4xl">
                  Short stay exige operação diária — e você não deveria fazer isso sozinho.
                </h2>
                <p className="text-bewild-text-muted leading-relaxed">
                  Anúncio, precificação, resposta a hóspedes, limpeza, lavanderia, manutenção,
                  vistoria, repasse, plataformas, avaliações... O que parece renda passiva vira
                  operação ativa quando o proprietário assume tudo. O BeWild Host Care existe para eliminar
                  essa fricção.
                </p>
              </div>
              <div className="rounded-2xl border border-bewild-cream-200 bg-white/5 p-8">
                <p className="mb-4 text-sm font-semibold text-bewild-ink">Tarefas invisíveis do short stay:</p>
                <ul className="space-y-2.5 text-sm text-bewild-text-muted">
                  {[
                    "Atualizar disponibilidade e preços nas plataformas",
                    "Responder dúvidas de hóspedes antes e durante a estadia",
                    "Coordenar limpeza entre reservas",
                    "Repor enxoval e itens de boas-vindas",
                    "Resolver manutenção de emergência",
                    "Lidar com avaliações e reclamações",
                    "Calcular repasse e declarar receita",
                  ].map((t) => (
                    <li key={t} className="flex gap-2">
                      <span className="text-bewild-blue mt-0.5 shrink-0">→</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard mock */}
        <section className="border-t border-bewild-cream-200 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-10 max-w-2xl">
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                Painel do proprietário
              </p>
              <h2 className="text-2xl font-bold text-bewild-ink sm:text-3xl">
                Você acompanha tudo — sem precisar gerenciar nada.
              </h2>
              <p className="mt-3 text-bewild-text-muted text-sm leading-relaxed">
                Reservas, limpeza, manutenção e repasse em um painel claro. Dados ilustrativos — resultado real varia por imóvel e período.
              </p>
            </div>
            <HostCareDashboard />
          </div>
        </section>

        {/* Foto editorial — operação invisível */}
        <section className="border-t border-bewild-cream-200 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">Studio em operação</p>
                <p className="mb-4 text-lg font-bold text-bewild-ink">
                  O imóvel trabalha.<br/>O proprietário descansa.
                </p>
                <ImagePlaceholder
                  assetId="hostcare-studio"
                  className="w-full"
                  showReveal={true}
                  overlay={true}
                />
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-2 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">Operação entre reservas</p>
                  <ImagePlaceholder
                    assetId="hostcare-limpeza"
                    className="w-full"
                    showReveal={true}
                    revealDelay={120}
                  />
                </div>
                <div>
                  <p className="mb-2 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">Transparência financeira</p>
                  <ImagePlaceholder
                    assetId="hostcare-relatorio"
                    className="w-full"
                    showReveal={true}
                    revealDelay={200}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Serviços */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                O que está incluso
              </p>
              <h2 className="text-3xl font-bold text-bewild-ink sm:text-4xl">
                Da criação do anúncio ao repasse mensal.
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {SERVICOS.map((s) => (
                <div key={s.title} className="rounded-2xl border border-bewild-cream-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-bewild-cream-200 hover:shadow-bewild-card">
                  <s.icon className="mb-4 h-7 w-7 text-bewild-gold" />
                  <p className="mb-2 font-semibold text-bewild-ink">{s.title}</p>
                  <p className="text-sm text-bewild-text-muted leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Diferenciais */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-24 bg-bewild-parchment">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                Por que o BeWild Host Care é diferente
              </p>
              <h2 className="text-3xl font-bold text-bewild-ink sm:text-4xl">
                Sem amarras. Com resultado verificável.
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {DIFERENCIAIS.map((d) => (
                <div key={d.title} className="rounded-2xl border border-bewild-blue/20 bg-bewild-parchment p-6">
                  <d.icon className="mb-4 h-7 w-7 text-bewild-gold" />
                  <p className="mb-2 font-semibold text-bewild-ink">{d.title}</p>
                  <p className="text-sm text-bewild-text-muted leading-relaxed">{d.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ponte Be Wild */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                Imóvel ainda não está pronto?
              </p>
              <h2 className="mb-5 text-3xl font-bold text-bewild-ink sm:text-4xl">
                Gestão boa não salva produto ruim.
              </h2>
              <p className="mb-8 text-bewild-text-muted leading-relaxed">
                Se o imóvel ainda não está preparado para competir no short stay — foto, funcionalidade,
                manutenção, setup — a gestão começa em desvantagem. O Be Wild Reformas prepara o ativo para o
                BeWild Host Care poder operar no nível certo.
              </p>
              <button
                onClick={() => navigate("/be-wild")}
                className="inline-flex items-center gap-2 rounded-full border border-bewild-cream-200 px-6 py-3 text-sm font-semibold text-bewild-ink transition-all hover:bg-bewild-parchment"
              >
                Conhecer o Be Wild Reformas <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                Perguntas frequentes
              </p>
              <h2 className="text-3xl font-bold text-bewild-ink sm:text-4xl">FAQ BeWild Host Care</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {FAQS.map((f) => (
                <div key={f.q} className="rounded-2xl border border-bewild-cream-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-bewild-cream-200 hover:shadow-bewild-card">
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
              Coloque seu imóvel para rodar.
            </h2>
            <p className="mb-8 text-bewild-text-muted max-w-xl mx-auto">
              Conte em que estágio está seu imóvel. A gente indica o caminho: Be Wild Reformas, BeWild Host Care ou jornada completa.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => navigate("/diagnostico")}
                className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
              >
                Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={whatsappHref("Olá, tenho um imóvel e quero entender como o BeWild Host Care funciona.")}
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
