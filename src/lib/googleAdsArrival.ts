import { isConsentAccepted } from "@/lib/cookieConsent";

export const ARRIVAL_DESTINATION = "AW-16893787587/d7AUCOmXt6kdEMP7yvc-";

/** Mede a página aberta agora após o aceite, nunca repõe uma visita bloqueada. */
export function reportGoogleAdsArrival(account: string): boolean {
  if (typeof window === "undefined" || !isConsentAccepted()) return false;
  if (account !== ARRIVAL_DESTINATION.split("/")[0] || /^\/admin(?:\/|$)/.test(window.location.pathname)) return false;
  const query = new URLSearchParams(window.location.search);
  const click = query.get("gclid") || query.get("wbraid") || query.get("gbraid");
  if (!click || !/^[A-Za-z0-9_-]{5,512}$/.test(click)) return false;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtag) return false;
  try {
    const key = `bewild_ads_arrival:${click}`;
    if (window.sessionStorage.getItem(key)) return false;
    const id = crypto.randomUUID();
    gtag("set", "user_data", null);
    gtag("event", "conversion", { send_to: ARRIVAL_DESTINATION, transaction_id: id });
    window.sessionStorage.setItem(key, id);
    return true;
  } catch { return false; }
}