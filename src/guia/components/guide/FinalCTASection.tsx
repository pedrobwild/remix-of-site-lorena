import { ArrowRight } from "lucide-react";

import SectionBlock from "@/guia/components/guide/SectionBlock";
import { Button } from "@/guia/components/ui/button";
import { Card, CardContent } from "@/guia/components/ui/card";

/**
 * CTA final da página.
 *
 * No app original havia cadastro com gravação de lead no banco próprio.
 * Aqui a captação acontece em /orcamento, então mantemos só o convite,
 * no mesmo visual da seção.
 */
export default function FinalCTASection() {
  return (
    <SectionBlock
      id="cta-final"
      title="Quer avaliar o seu studio?"
      takeaway="Projeto, reforma, marcenaria e mobiliário em um contrato só."
      className="[&_h2]:text-primary-foreground [&_>div>p:first-of-type]:text-primary-foreground/80"
    >
      <Card className="border-border/30 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <p className="text-base md:text-lg text-foreground font-body max-w-2xl mx-auto mb-6">
            A Bewild faz projeto, reforma, marcenaria e mobiliário do studio em um contrato só, com
            escopo, preço e prazo fechados antes do início da obra.
          </p>
          <Button asChild size="lg" className="font-body min-h-[48px]">
            <a href="/orcamento">
              Solicitar orçamento
              <ArrowRight size={18} className="ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </SectionBlock>
  );
}
