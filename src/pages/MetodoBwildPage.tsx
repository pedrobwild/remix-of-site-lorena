/**
 * MetodoBwildPage — /metodo-bwild
 * O método Bwild: do diagnóstico ao acompanhamento contínuo.
 */
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import { MobileBottomCTA } from "../components/landing/MobileBottomCTA";
import { StickyDiagnosticPanel } from "../components/landing/StickyDiagnosticPanel";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import { ArrowRight } from "lucide-react";
import JornadaBeWild, { ETAPAS_JORNADA } from "../components/landing/JornadaBeWild";

export default function MetodoBwildPage() {
  useSeo({
    title: "Método Bwild — Do diagnóstico ao repasse | Bwild",
    description:
      "Conheça o método Bwild: diagnóstico, preparação do ativo com BeWild, lançamento, operação com BeWild Host Care e aprendizado contínuo. Uma jornada completa para o investidor que não quer operar sozinho.",
    canonicalPath: "/metodo-bwild",
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
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-bewild-gold-400">
                Jornada Be Wild
              </p>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Do diagnóstico à gestão: o método Be Wild.
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-white/60 sm:text-xl">
                O imóvel não vira renda quando a escritura sai. Ele vira renda quando está preparado,
                anunciado, precificado, limpo, mantido e operado. A BeWild cuida de todo esse ciclo.
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

        {/* Etapas — componente proprietário JornadaBeWild */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-24">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                As 5 etapas
              </p>
              <h2 className="mb-3 text-3xl font-bold text-bewild-ink sm:text-4xl">
                Cada etapa conecta com a próxima.
              </h2>
              <p className="text-white/60 leading-relaxed">
                BeWild Reformas e BeWild Host Care são fases de uma mesma jornada —
                não serviços independentes que podem ser contratados de qualquer fornecedor.
              </p>
            </div>
            <JornadaBeWild variant="metodo" etapas={ETAPAS_JORNADA} />
          </div>
        </section>

        {/* Por que o ciclo inteiro */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-24 bg-bewild-parchment">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                Por que o ciclo inteiro importa
              </p>
              <h2 className="mb-5 text-3xl font-bold text-bewild-ink sm:text-4xl">
                Não é reforma + gestão. É continuidade entre criação e operação do ativo.
              </h2>
              <p className="mb-8 text-bewild-text-muted leading-relaxed">
                O problema de contratar tudo separado é que ninguém é dono do ciclo inteiro.
                O arquiteto entrega o projeto. O reformeiro entrega a obra. A gestora tenta operar
                o que recebeu. E o investidor fica no meio, costurando decisões, prazos, compras,
                ajustes, anúncios e hóspedes.
              </p>
              <p className="text-bewild-text-muted leading-relaxed">
                A Bwild foi criada para reduzir essa fragmentação: o BeWild Reformas prepara o imóvel
                pensando na operação; o BeWild Host Care assume a rotina sem o proprietário precisar integrar nada.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-bewild-ink sm:text-4xl">
              Descubra em qual etapa seu imóvel está.
            </h2>
            <p className="mb-8 text-bewild-text-muted max-w-xl mx-auto">
              O diagnóstico Bwild identifica o estágio do seu imóvel e indica o caminho certo: BeWild Reformas, BeWild Host Care ou jornada completa.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => navigate("/diagnostico")}
                className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
              >
                Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={whatsappHref("Olá, quero entender como o método Bwild funciona para o meu imóvel.")}
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
