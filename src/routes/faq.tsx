import { createFileRoute } from "@tanstack/react-router";
import { serverMemo } from "@/lib/serverMemo";
import FaqPage from "@/pages/FaqPage";
import { seoHead , rootPagesSeo } from "@/lib/routeHead";
import { getSupabase } from "@/integrations/supabase/lazyClient";
import type { KbItem } from "@/lib/assistant/assistantEngine";

/**
 * Perguntas reais da Bewild (tabela `assistant_kb`, leitura pública das ativas)
 * lidas no servidor, para o HTML inicial — o que o Google lê — já trazer a
 * lista completa e o FAQPage em JSON-LD. Falha ou demora (2,5 s) devolve
 * `null`: a página mostra a lista fixa e tenta de novo no cliente.
 */
async function loadFaqKb(): Promise<KbItem[] | null> {
  try {
    const query = getSupabase().then((supabase) =>
      supabase
        .from("assistant_kb")
        .select("id, tema, pergunta, resposta, acoes, ordem")
        .eq("ativo", true)
        .order("ordem", { ascending: true })
        .then(({ data, error }) => (!error && data && data.length > 0 ? (data as unknown as KbItem[]) : null)),
    );
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    return await Promise.race([query, timeout]);
  } catch {
    return null;
  }
}

function FaqRoute() {
  const kb = Route.useLoaderData()?.kb ?? null;
  return <FaqPage initialKb={kb} />;
}

const FAQ_KEYWORDS = "dúvidas sobre arquitetura e engenharia, projeto de arquitetura em São Paulo, dúvidas sobre reforma de apartamento em SP, reforma de apartamento em SP, custo de reforma, prazo de reforma, contrato fechado de reforma, garantia de reforma, comissão de indicação de imóvel, autorização de reforma condomínio, Bewild";

export const Route = createFileRoute("/faq")({
  // Memo de 60 s no servidor (src/lib/serverMemo.ts): a lista vinha do banco a cada visita.
  // Título, descrição e FAQPage (src/content/faqPage.ts, ~12 kB) vêm por import
  // dinâmico: o head() entra no pacote inicial de toda página.
  loader: async () => {
    const [kb, { FAQ_SEO_TITLE, FAQ_SEO_DESCRIPTION, faqPageJsonLd }] = await Promise.all([
      serverMemo("faq:kb", loadFaqKb, { keep: (v) => v !== null }),
      import("@/content/faqPage"),
    ]);
    // Mesmas constantes do useSeo da FaqPage (seoQuatroPaginas.test.ts).
    return { kb, title: FAQ_SEO_TITLE, description: FAQ_SEO_DESCRIPTION, jsonLd: [faqPageJsonLd(kb)] };
  },
  component: FaqRoute,
  head: ({ loaderData, matches }) => seoHead({ pagesSeo: rootPagesSeo(matches), jsonLd: loaderData?.jsonLd ?? null, title: loaderData?.title ?? "FAQ: reforma de studio, etapas e contrato em SP | Bewild", description: loaderData?.description ?? "Dúvidas sobre reforma de studio em São Paulo: as seis fases, projeto, autorização do condomínio e entrega.", path: "/faq", keywords: FAQ_KEYWORDS }),
});
