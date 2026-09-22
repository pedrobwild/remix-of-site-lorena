import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/guia/components/ui/accordion";
import SectionBlock from "./SectionBlock";

/**
 * FAQ do guia. Regra Bewild: nenhuma promessa de renda, ocupação ou
 * rentabilidade — só faixas observadas, com origem e período.
 */
export const FAQ_ITEMS = [
  { q: "Quanto custa um studio para short stay em São Paulo?", a: "O investimento total costuma variar de R$ 250 mil a R$ 600 mil, dependendo do bairro, da metragem e do nível de acabamento. Studios de 25–35 m² em bairros como Pinheiros, Vila Mariana e Consolação são os mais procurados por quem busca equilíbrio entre preço de entrada e demanda." },
  { q: "Como estimar o retorno de um studio em Airbnb?", a: "Não existe retorno garantido. O caminho é montar a conta com dados do próprio bairro: diária praticada, ocupação observada, custos fixos, limpeza, taxas de plataforma e vacância. O simulador desta página serve para testar cenários — otimista, provável e conservador — e não para prever resultado." },
  { q: "Preciso de CNPJ para alugar no Airbnb?", a: "Não é obrigatório, mas costuma ser recomendado. Com CNPJ você emite nota fiscal, organiza a contabilidade e passa mais credibilidade. Vale conversar com um contador antes de decidir o regime." },
  { q: "Condomínio pode proibir Airbnb?", a: "Pode restringir. O STJ entendeu que a convenção do condomínio pode limitar a locação por temporada. Leia a convenção e a ata antes de comprar e priorize prédios que permitem ou são neutros quanto ao uso." },
  { q: "Qual a ocupação média de um studio em São Paulo?", a: "Nos bairros mais procurados, as bases públicas de mercado mostram ocupação entre 53% e 64% no período analisado. É um retrato do passado recente, não uma projeção do seu imóvel." },
  { q: "Vale a pena contratar uma administradora?", a: "Com 1–2 unidades e tempo disponível, a autogestão funciona. Acima disso, ou sem disponibilidade, uma administradora (que costuma cobrar entre 15% e 25% da receita) pode fazer sentido. Compare o custo com as horas que você realmente tem." },
  { q: "Quanto custa a reforma de um studio?", a: "Uma reforma bem dimensionada, sem demolições desnecessárias, costuma ficar entre R$ 15 mil e R$ 40 mil. Mobiliário e decoração somam outra faixa, de R$ 15 mil a R$ 60 mil, conforme o padrão escolhido." },
  { q: "Qual o melhor bairro para investir em short stay?", a: "Depende do orçamento e do apetite a risco. Pinheiros, Consolação e Bela Vista aparecem com boa relação entre preço de entrada e demanda; Itaim Bibi e Jardim Paulista registram diárias mais altas, mas exigem investimento maior." },
];

export default function FAQSection() {
  return (
    <SectionBlock id="faq" title="FAQ — Perguntas Frequentes" takeaway="Respostas diretas para as dúvidas mais comuns de investidores.">
      <Accordion type="multiple" className="font-body">
        {FAQ_ITEMS.map((item, i) => (
          <AccordionItem key={i} value={String(i)}>
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
