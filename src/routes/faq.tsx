import { createFileRoute } from "@tanstack/react-router";
import FaqPage from "@/pages/FaqPage";
import { seoHead } from "@/lib/routeHead";
import { supabase } from "@/integrations/supabase/client";
import type { KbItem } from "@/lib/assistant/assistantEngine";

/**
 * Perguntas reais da Bewild (tabela `assistant_kb`, leitura pública das ativas)
 * lidas no servidor, para o HTML inicial — o que o Google lê — já trazer a
 * lista completa e o FAQPage em JSON-LD. Falha ou demora (2,5 s) devolve
 * `null`: a página mostra a lista fixa e tenta de novo no cliente.
 */
async function loadFaqKb(): Promise<KbItem[] | null> {
  try {
    const query = supabase
      .from("assistant_kb")
      .select("id, tema, pergunta, resposta, acoes, ordem")
      .eq("ativo", true)
      .order("ordem", { ascending: true })
      .then(({ data, error }) => (!error && data && data.length > 0 ? (data as unknown as KbItem[]) : null));
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    return await Promise.race([query, timeout]);
  } catch {
    return null;
  }
}

function FaqRoute() {
  const kb = Route.useLoaderData();
  return <FaqPage initialKb={kb} />;
}

export const Route = createFileRoute("/faq")({
  loader: () => loadFaqKb(),
  component: FaqRoute,
  head: () => seoHead({ title: "Dúvidas sobre reforma e arquitetura em SP | Bewild", description: "Respostas sobre reforma de apartamento em SP: quanto custa, prazo, contrato fechado, garantia, autorização do condomínio, etapas da obra e indicações.", path: "/faq", keywords: "dúvidas sobre arquitetura e engenharia, projeto de arquitetura em São Paulo, dúvidas sobre reforma de apartamento em SP, reforma de apartamento em SP, custo de reforma, prazo de reforma, contrato fechado de reforma, garantia de reforma, comissão de indicação de imóvel, autorização de reforma condomínio, Bewild" }),
});
