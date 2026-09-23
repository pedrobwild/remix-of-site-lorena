/**
 * Rastreamento de cliques em CTAs (/diagnostico, /contato, /orcamento e
 * /parceiros).
 *
 * Dispara dois destinos, ambos fire-and-forget e gated por consentimento:
 * - GA4 (`cta_click`), para todo CTA
 * - Analytics interno (`click_cta`), só para CTAs que NÃO são link de contato.
 *   WhatsApp/telefone/e-mail já são capturados por `src/lib/analytics.ts`
 *   (`click_whatsapp` / `click_contact`) em qualquer página — repetir aqui
 *   contava cada clique no WhatsApp duas vezes nessas quatro páginas.
 *
 * `useCtaClickTracking(page)` usa delegação no document: qualquer <a> com
 * href de WhatsApp / mailto / tel, qualquer botão de submit e qualquer
 * elemento com `data-cta` são capturados sem precisar de onClick em cada um.
 */
import { useEffect } from "react";
import { trackEvent } from "@/lib/ga4";
import { contactEventForHref, track } from "@/lib/analytics";
import { closestElementFrom } from "@/lib/useHashRoute";

export function trackCtaClick(
  page: string,
  cta: string,
  extra?: Record<string, unknown>,
  opts: { internal?: boolean } = {},
): void {
  try {
    trackEvent("cta_click", { page, cta, ...extra });
    if (opts.internal !== false) {
      track("click_cta", { value: { page, cta, ...extra } });
    }
  } catch {
    /* nunca quebra a UI */
  }
}

export function useCtaClickTracking(page: string): void {
  useEffect(() => {
    function onClick(ev: MouseEvent) {
      // Listener de captura no document: o target pode ser o próprio
      // `document` ou um nó de texto — `closest` direto lançava (FE-01).
      const el = closestElementFrom(ev.target)?.closest<HTMLElement>("a[href], button");
      if (!el) return;

      const href = el.getAttribute("href") ?? "";
      const contact = href ? contactEventForHref(href) : null;
      let cta = el.dataset.cta;
      if (!cta) {
        if (contact) cta = contact.channel === "phone" ? "telefone" : contact.channel;
        else if (el instanceof HTMLButtonElement && el.type === "submit")
          cta = "enviar-formulario";
        else return;
      }

      trackCtaClick(
        page,
        cta,
        { label: (el.textContent ?? "").trim().slice(0, 60) || undefined },
        // Link de contato ou `data-track`: o evento interno já sai de analytics.ts.
        { internal: !contact && !el.dataset.track },
      );
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [page]);
}
