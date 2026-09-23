import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/guia/components/ui/accordion";
import { GUIA_FAQ } from "@/guia/data/guiaMeta";
import SectionBlock from "./SectionBlock";

/**
 * FAQ do guia. O conteúdo vive em src/guia/data/guiaMeta.ts — o mesmo usado
 * no JSON-LD FAQPage da página e no HTML pré-renderizado.
 */
export default function FAQSection() {
  return (
    <SectionBlock id="faq" title="FAQ — Perguntas Frequentes" takeaway="Respostas diretas para as dúvidas mais comuns de investidores.">
      <Accordion type="multiple" className="font-body">
        {GUIA_FAQ.map((item, i) => (
          <AccordionItem key={item.q} value={String(i)}>
            <AccordionTrigger className="text-foreground font-semibold text-left">{item.q}</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionBlock>
  );
}
