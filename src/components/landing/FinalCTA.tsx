import { ArrowRight, MessageCircle } from "lucide-react";
import { Container, CTAButton } from "./primitives";
import { whatsappHref } from "./content";

export default function FinalCTA() {
  return (
    <section id="diagnostico" className="scroll-mt-20 bg-[#F2EEE5] py-20 sm:py-28">
      <Container>
        <div className="mx-auto flex max-w-[760px] flex-col items-center gap-6 text-center">
          <h2 className="font-display text-3xl font-semibold leading-[1.08] tracking-tight text-bewild-ink sm:text-4xl md:text-[2.75rem]">
            Quer transformar seu studio em{" "}
            <span className="italic text-bewild-blue">um ativo pronto para operar?</span>
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-bewild-steel sm:text-lg">
            Envie os dados do seu imóvel e receba uma análise inicial de escopo, projeto e próximos
            passos. Sem compromisso.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CTAButton href="/diagnostico" variant="primary" className="group">
              Solicitar orçamento
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </CTAButton>
            <CTAButton href={whatsappHref()} variant="ghost-ink" external>
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </CTAButton>
          </div>
        </div>
      </Container>
    </section>
  );
}
