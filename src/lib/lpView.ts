import { useEffect } from "react";
import { trackEvent } from "@/lib/ga4";

/**
 * `view_lp` no GA4, uma vez por montagem da LP, com a variante do topo
 * (palavra-chave do anúncio). O `page_view` padrão já existe; este evento
 * só acrescenta a variante, para comparar a conversão de cada topo.
 *
 * Os outros eventos do handoff já existem no site e não são duplicados aqui:
 * `form_start` (primeiro foco num campo, via FORM_PAGES em conversions.ts),
 * `generate_lead` no sucesso (useLeadSubmit), `click_whatsapp`
 * (analytics.ts) e `scroll_depth` 25/50/75/100 (analytics.ts).
 */
export function useLpView(variante: string): void {
  useEffect(() => {
    trackEvent("view_lp", { variante });
  }, [variante]);
}
