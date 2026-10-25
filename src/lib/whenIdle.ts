import { isConsentAccepted } from "@/lib/cookieConsent";
/**
 * Roda `fn` depois do `load` da página e de um momento ocioso do navegador
 * (teto de 3 s), o mesmo critério do carregador do Pixel da Meta em useSeo.ts.
 *
 * Para scripts de terceiros que não precisam estar prontos na primeira
 * pintura: assim eles não disputam rede e linha principal com a imagem do
 * topo (LCP) e com o primeiro toque (INP).
 */
export function whenIdleAfterLoad(fn: () => void, timeoutMs = 3000): void {
  if (typeof window === "undefined") return;
  const run = () => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(fn, { timeout: timeoutMs });
    else window.setTimeout(fn, 1);
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
}

/** Um único download compartilhado pelo GA4 e pelo Ads, nas duas ordens de início. */
let googleTagPending = false;
export function ensureGoogleTagScript(id: string, account: string): void {
  if (typeof window === "undefined" || googleTagPending || document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]')) return;
  googleTagPending = true;
  whenIdleAfterLoad(() => {
    googleTagPending = false;
    if (!isConsentAccepted() || /^\/admin(?:\/|$)/.test(window.location.pathname)) return;
    if (document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]')) return;
    const script = document.createElement("script");
    script.id = id;
    script.setAttribute("data-seo-injected", "true");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${account}`;
    document.head.appendChild(script);
  });
}
