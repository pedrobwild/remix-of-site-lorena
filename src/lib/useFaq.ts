import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  order_index: number;
  visible: boolean;
};

/**
 * useFaq — busca os FAQs visíveis do banco.
 *
 * Estratégia de fallback: se a chamada falhar ou retornar vazio, devolve um
 * array mínimo para que o site nunca renderize sem conteúdo.
 *
 * Os 7 itens originais foram migrados para a tabela `faq_items` quando a
 * feature foi implantada. A partir daí, o admin é a fonte de verdade.
 */
const FALLBACK: FaqItem[] = [
  {
    id: "fallback-1",
    question: "O que é uma reforma turn-key de studio?",
    answer:
      "Turn-key significa receber o studio pronto para uso. A Bewild cuida de projeto de arquitetura, obra, marcenaria, mobiliário, decoração e a tecnologia de operação num processo único, de ponta a ponta. Você recebe o imóvel pronto para foto, anúncio e locação, sem coordenar fornecedores.",
    order_index: 1,
    visible: true,
  },
  {
    id: "fallback-2",
    question: "Quanto tempo leva a obra com a Bewild?",
    answer:
      "O prazo de obra é de 60 dias úteis, com acompanhamento do início à entrega. O cronograma é definido no projeto e você acompanha a evolução em cada etapa.",
    order_index: 2,
    visible: true,
  },
  {
    id: "fallback-3",
    question: "Quais garantias a Bewild oferece?",
    answer:
      "São 5 anos de garantia da mão de obra e mais de 10 anos de garantia da marcenaria. O studio é entregue com tudo funcionando e documentado.",
    order_index: 3,
    visible: true,
  },
  {
    id: "fallback-4",
    question: "Preciso acompanhar a obra ou contratar fornecedores?",
    answer:
      "Não. A proposta da Bewild é essa: você não vira gerente de obra. Um único responsável conduz projeto, obra e fornecedores, e você acompanha o resultado sem lidar com o dia a dia do canteiro.",
    order_index: 4,
    visible: true,
  },
  {
    id: "fallback-5",
    question: "Em qual região a Bewild atende?",
    answer:
      "A Bewild atua em São Paulo, com foco em studios para short stay, e já soma +160 reformas entregues · +200 projetos.",
    order_index: 5,
    visible: true,
  },
  {
    id: "fallback-6",
    question: "A Bewild também faz a gestão da locação?",
    answer:
      "A Bewild entrega o studio pronto para foto, anúncio e operação. A gestão do dia a dia da locação, como precificação, hóspedes e limpeza, é uma etapa separada e fica sob sua responsabilidade.",
    order_index: 6,
    visible: true,
  },
  {
    id: "fallback-7",
    question: "Quanto custa uma reforma com a Bewild?",
    answer:
      "O investimento depende do tamanho do imóvel, do estado atual e do padrão de acabamento. O ponto de partida é um diagnóstico do seu studio, em que avaliamos o escopo e apresentamos uma estimativa para o seu caso.",
    order_index: 7,
    visible: true,
  },
];

export function useFaq() {
  const [items, setItems] = useState<FaqItem[]>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("faq_items")
      .select("id, question, answer, order_index, visible")
      .eq("visible", true)
      .order("order_index", { ascending: true })
      // O builder do Supabase é um PromiseLike (sem `.catch`), então tratamos a
      // rejeição pelo segundo argumento de `.then(...)`.
      .then(
        ({ data, error }) => {
          if (!mounted) return;
          if (data && data.length > 0 && !error) {
            setItems(data as FaqItem[]);
          }
          setLoading(false);
        },
        () => {
          // Em falha de rede o FALLBACK já cobre o conteúdo; só encerramos o loading.
          if (mounted) setLoading(false);
        }
      );
    return () => {
      mounted = false;
    };
  }, []);

  return { items, loading };
}
