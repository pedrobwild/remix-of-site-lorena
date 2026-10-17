import { useEffect } from "react";
import { trackNeighborhoodInterest } from "@/lib/analytics";
import { onConsentChange } from "@/lib/cookieConsent";

/** Mede a escolha atual, sem guardar respostas anteriores ao consentimento. */
export function useNeighborhoodInterest(bairro: string | null, enabled = true): void {
  useEffect(() => {
    if (!enabled || !bairro) return;
    const record = () => trackNeighborhoodInterest(bairro);
    record();
    return onConsentChange((value) => {
      if (value === "accepted") record();
    });
  }, [bairro, enabled]);
}