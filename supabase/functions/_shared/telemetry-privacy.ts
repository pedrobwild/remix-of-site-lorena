/** Minimização de métricas; não usar no envio comercial de leads. */
export function telemetryText(value: string): string {
  return value.replace(/[^\s/]+@[^\s/]+\.[^\s/]+/g, "[e-mail]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[telefone]");
}

export function telemetryUrl(value: string, originOnly = false): string {
  if (/^(mailto|tel|whatsapp):/i.test(value)) return `${value.split(":")[0].toLowerCase()}:`;
  try {
    const absolute = /^(?:https?:)?\/\//i.test(value);
    const url = new URL(value, "https://bewild.com.br");
    if (!/^https?:$/.test(url.protocol)) return "";
    if (/^(wa\.me|(?:api|web)\.whatsapp\.com)$/i.test(url.hostname)) return "whatsapp:";
    const path = telemetryText(url.pathname);
    return originOnly ? url.origin : absolute ? `${url.origin}${path}` : path;
  } catch { return ""; }
}

const PRIVATE_KEYS = /^(email|e_mail|phone|whatsapp|name|full_name|message|text|password|token|access_token|authorization|gclid|fbclid|fbp|fbc)$/i;
const URL_KEYS = /^(href|url|link_url|page_location|page_referrer|path|page_path|landing_path|page|from|to|destination)$/i;
// `name` neste espelho é uma categoria de anúncio, nunca nome de pessoa.
const AD_EVENT_NAMES = new Set(["Lead", "SubmitApplication", "Contact", "ViewContent", "IniciouFormulario", "VisitanteEngajado", "CliqueProjeto"]);

export function telemetryValue(value: unknown, depth = 0): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > 3) return null;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "name" && typeof item === "string" && AD_EVENT_NAMES.has(item)) {
      result[key] = item;
      continue;
    }
    if (PRIVATE_KEYS.test(key) || ["__proto__", "constructor", "prototype"].includes(key)) continue;
    if (typeof item === "string") {
      result[key] = URL_KEYS.test(key) || /^(?:https?:\/\/|mailto:|tel:|whatsapp:)/i.test(item)
        ? telemetryUrl(item) : telemetryText(item).slice(0, 1024);
    } else if (typeof item === "boolean" || item === null || (typeof item === "number" && Number.isFinite(item))) {
      result[key] = item;
    } else if (typeof item === "object" && !Array.isArray(item)) {
      result[key] = telemetryValue(item, depth + 1);
    }
  }
  return result;
}