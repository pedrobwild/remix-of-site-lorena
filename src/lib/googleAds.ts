/**
 * Google Ads — conversões pela tag do Google (gtag), com conversões
 * otimizadas (enhanced conversions).
 *
 * O ID da conta (AW-…) e os rótulos das conversões vêm do admin
 * (/admin/seo › Analytics & pixels → `site_settings`). Quem injeta a tag é
 * `injectTrackers` em src/lib/useSeo.ts — só depois do aceite de cookies e
 * fora do /admin — e ele chama `configureGoogleAds` com o que está salvo.
 *
 * Conversão de lead: `gtag('set','user_data',…)` com e-mail e telefone (a
 * própria tag normaliza e aplica o hash antes de enviar) e depois
 * `gtag('event','conversion',{send_to:'AW-…/rótulo', transaction_id})`. O
 * `transaction_id` é o mesmo id do lead usado no Meta: um reenvio do mesmo
 * formulário não vira conversão nova no Google Ads.
 *
 * Para as conversões otimizadas valerem, ative no Google Ads: Metas →
 * Configurações → Conversões otimizadas → "Tag do Google".
 *
 * Eventos de público (remarketing): `trackGoogleAdsAudienceEvent` manda à
 * tag AW- os mesmos sinais que o Meta Pixel recebe (ver conversions.ts) —
 * ViewContent vira `view_item`, formulário iniciado vira `form_start` etc.
 * Não precisam de rótulo: alimentam as fontes de público da tag, e os
 * públicos são montados no Google Ads a partir desses parâmetros.
 */
import { isConsentAccepted } from "@/lib/cookieConsent";
import { normalizeName } from "../../supabase/functions/_shared/meta-capi";

type Gtag = (...args: unknown[]) => void;

export type GoogleAdsConfig = {
  id: string;
  leadLabel: string | null;
  contactLabel: string | null;
};

/** Rótulo de conversão: letras, dígitos, "-" e "_" (ex.: AbC-D_efG-h12). */
const LABEL_RE = /^[A-Za-z0-9_-]{4,64}$/;
const ADS_ID_RE = /^AW-\d{6,15}$/;

export function validAdsLabel(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  return LABEL_RE.test(v) ? v : null;
}

let config: GoogleAdsConfig | null = null;

export function configureGoogleAds(input: {
  id: string;
  leadLabel?: string | null;
  contactLabel?: string | null;
}): void {
  const id = (input.id ?? "").trim().toUpperCase();
  if (!ADS_ID_RE.test(id)) {
    config = null;
    return;
  }
  config = {
    id,
    leadLabel: validAdsLabel(input.leadLabel),
    contactLabel: validAdsLabel(input.contactLabel),
  };
}

export function getGoogleAdsConfig(): GoogleAdsConfig | null {
  return config;
}

function isAdminPath(): boolean {
  try {
    const p = window.location.pathname;
    return p === "/admin" || p.startsWith("/admin/");
  } catch {
    return false;
  }
}

/** Telefone BR só com dígitos (sem DDI) → E.164 (+55…), como o Google pede. */
export function brPhoneToE164(digits: string | null | undefined): string | null {
  const d = (digits ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (d.length < 10 || d.length > 11) return null;
  return `+55${d}`;
}

/** Portões comuns: aceite de cookies, fora do /admin, tag e conta no ar. */
function googleReady(): { cfg: GoogleAdsConfig; gtag: Gtag } | null {
  if (typeof window === "undefined") return null;
  if (!isConsentAccepted() || isAdminPath()) return null;
  const cfg = config;
  if (!cfg) return null;
  const gtag = (window as Window & { gtag?: unknown }).gtag;
  if (typeof gtag !== "function") return null;
  return { cfg, gtag: gtag as Gtag };
}

/**
 * Registra uma conversão. `false` quando não saiu: sem aceite, no /admin,
 * sem a tag no ar, sem ID/rótulo configurado. `params` leva ao evento os
 * mesmos sinais do Lead do Meta (objetivo, faixa de m², etapa, mora em SP)
 * para os públicos do Google segmentarem igual.
 */
export function trackGoogleAdsConversion(
  kind: "lead" | "contact",
  opts: {
    transactionId?: string | null;
    email?: string | null;
    phoneDigits?: string | null;
    name?: string | null;
    params?: Record<string, unknown>;
  } = {},
): boolean {
  try {
    const ready = googleReady();
    if (!ready) return false;
    const { cfg, gtag } = ready;
    const label = kind === "lead" ? cfg.leadLabel : cfg.contactLabel;
    if (!label) return false;

    if (kind === "lead") {
      const email = (opts.email ?? "").trim().toLowerCase();
      const phone = brPhoneToE164(opts.phoneDigits);
      const userData: Record<string, unknown> = {};
      if (email.includes("@")) userData.email = email;
      if (phone) userData.phone_number = phone;
      // Nome de quem enviou, como na correspondência avançada do Meta.
      const parts = (normalizeName(opts.name) ?? "").split(" ").filter(Boolean);
      if (parts.length) {
        userData.address = [
          { first_name: parts[0], ...(parts.length > 1 ? { last_name: parts[parts.length - 1] } : {}), country: "br" },
        ];
      }
      if (Object.keys(userData).length) gtag("set", "user_data", userData);
    }
    gtag("event", "conversion", {
      send_to: `${cfg.id}/${label}`,
      ...(opts.transactionId ? { transaction_id: opts.transactionId } : {}),
      ...(opts.params ?? {}),
    });
    return true;
  } catch {
    return false;
  }
}

/** Eventos de público na tag AW- (espelho dos eventos do Meta Pixel). */
export type GoogleAudienceEvent = "view_item" | "form_start" | "visitante_engajado" | "submit_application" | "contact";

/**
 * Evento de remarketing/público: vai à tag AW- sem rótulo de conversão.
 * `false` nos mesmos bloqueios das conversões (sem aceite, /admin, sem tag).
 */
export function trackGoogleAdsAudienceEvent(name: GoogleAudienceEvent, params: Record<string, unknown> = {}): boolean {
  try {
    const ready = googleReady();
    if (!ready) return false;
    ready.gtag("event", name, { send_to: ready.cfg.id, ...params });
    return true;
  } catch {
    return false;
  }
}

/** Só para testes. */
export function __resetGoogleAds(): void {
  config = null;
}
