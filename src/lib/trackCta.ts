/**
 * Rastreamento de cliques em CTAs (/diagnostico e /contato).
 *
 * Dispara dois destinos, ambos fire-and-forget e gated por consentimento:
 * - GA4 (`cta_click`)
 * - Analytics interno (`click_whatsapp` / `click_cta`), que alimenta o painel
 *
 * `useCtaClickTracking(page)` usa delegação no document: qualquer <a> com
 * href de WhatsApp / mailto / tel, qualquer botão de submit e qualquer
 * elemento com `data-cta` são capturados sem precisar de onClick em cada um.
 */
import { useEffect } from "react";
import { trackEvent } from "@/lib/ga4";
import { track } from "@/lib/analytics";

export function trackCtaClick(
  page: string,
  cta: string,
  extra?: Record<string, unknown>,
): void {
  try {
    trackEvent("cta_click", { page, cta, ...extra });
    track(/whats/i.test(cta) ? "click_whatsapp" : "click_cta", {
      value: { page, cta, ...extra },
    });
  } catch {
    /* nunca quebra a UI */
  }
}

export function useCtaClickTracking(page: string): void {
  useEffect(() => {
    function onClick(ev: MouseEvent) {
      const target = ev.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>("a[href], button");
      if (!el) return;

      const href = el.getAttribute("href") ?? "";
      let cta = el.dataset.cta;
      if (!cta) {
        if (/wa\.me|api\.whatsapp|whatsapp/i.test(href)) cta = "whatsapp";
        else if (href.startsWith("mailto:")) cta = "email";
        else if (href.startsWith("tel:")) cta = "telefone";
        else if (el instanceof HTMLButtonElement && el.type === "submit")
          cta = "enviar-formulario";
        else return;
      }

      trackCtaClick(page, cta, {
        label: (el.textContent ?? "").trim().slice(0, 60) || undefined,
      });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [page]);
}
