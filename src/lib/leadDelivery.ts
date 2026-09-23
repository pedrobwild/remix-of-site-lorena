/**
 * Interpretação do resultado da edge function `notify-lead`.
 *
 * A função responde HTTP 200 com `{ ok: true, lead_insert, slack, crm, email }`
 * mesmo quando TODAS as etapas falharam (ela nunca lança para o cliente).
 * "Sucesso na interface" não pode significar "lead entregue": só
 * consideramos entregue quando pelo menos um destino real confirmou —
 * gravação no banco (`lead_insert.status === "sent"`), Slack, CRM ou e-mail.
 */
export type NotifyLeadResponse = {
  ok?: boolean;
  lead_insert?: { status?: string; id?: string; error?: string } | null;
  slack?: string | null;
  crm?: string | null;
  email?: string | null;
};

export function isLeadDelivered(
  result: { data?: unknown; error?: unknown } | null | undefined,
): boolean {
  if (!result || result.error) return false;
  const data = result.data as NotifyLeadResponse | null | undefined;
  if (!data || typeof data !== "object") return false;
  return (
    data.lead_insert?.status === "sent" ||
    data.slack === "sent" ||
    data.crm === "sent" ||
    data.email === "sent"
  );
}

/** Promise que resolve `null` após `ms` — usada como corrida contra o invoke. */
export function timeoutAfter(ms: number): Promise<null> {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

/** Formulário que originou o lead. Gravado em `leads.form_path`. */
export type LeadFormPath =
  | "/diagnostico"
  | "/contato"
  | "/orcamento"
  | "/parceiros"
  | "/indique-um-amigo"
  | "/o"
  | "/p";

/**
 * Contrato do corpo enviado a `notify-lead`. `landing_path` é atribuição
 * (página de entrada da sessão); `form_path` é qual formulário foi enviado.
 * Misturar os dois fazia o admin perder leads de /diagnostico cuja sessão
 * começou em outra página.
 */
export type LeadPayload = {
  name: string;
  whatsapp: string;
  email: string | null;
  location: string | null;
  area_m2: number | null;
  objetivo: string | null;
  chaves: string | null;
  planta: string | null;
  message: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_path: string | null;
  user_agent: string | null;
  lead_source?: string | null;
  lives_in_sp?: boolean | null;
  form_path: LeadFormPath;
};

/**
 * Limites do schema de `notify-lead`. A função valida com zod e REJEITA o
 * lead inteiro quando um campo passa do limite — então o cliente corta antes
 * de enviar. Manter em sincronia com `leadSchema` da função.
 */
export const LEAD_FIELD_LIMITS = {
  name: 120,
  whatsapp: 20,
  location: 200,
  objetivo: 80,
  chaves: 80,
  planta: 80,
  message: 4000,
  utm_source: 200,
  utm_medium: 200,
  utm_campaign: 200,
  referrer: 500,
  landing_path: 500,
  user_agent: 500,
  lead_source: 80,
} as const;

// Mesma regra de e-mail do zod 3 (usada pela função). Um e-mail que o
// servidor recusaria derrubaria o lead inteiro.
const ZOD_EMAIL_RE =
  /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;

export function isServerAcceptedEmail(email: string): boolean {
  return email.length <= 254 && ZOD_EMAIL_RE.test(email);
}

/**
 * Ajusta o payload aos limites do servidor sem perder informação útil:
 * textos longos são cortados; um e-mail fora do padrão vai para a mensagem
 * (o time ainda vê o que a pessoa digitou) em vez de derrubar o envio.
 */
export function fitLeadPayload(payload: LeadPayload): LeadPayload {
  const out: LeadPayload = { ...payload };
  const cut = (v: string | null | undefined, max: number): string | null => {
    if (v == null) return null;
    const t = String(v).trim();
    return t ? t.slice(0, max) : null;
  };

  let extraNote: string | null = null;
  const email = cut(payload.email, 254);
  if (email && !isServerAcceptedEmail(email)) {
    extraNote = `E-mail informado: ${email}`;
    out.email = null;
  } else {
    out.email = email;
  }

  const message = [cut(payload.message, LEAD_FIELD_LIMITS.message), extraNote]
    .filter(Boolean)
    .join("\n\n");
  out.message = message ? message.slice(0, LEAD_FIELD_LIMITS.message) : null;

  out.name = cut(payload.name, LEAD_FIELD_LIMITS.name) ?? "";
  out.whatsapp = cut(payload.whatsapp, LEAD_FIELD_LIMITS.whatsapp) ?? "";
  out.location = cut(payload.location, LEAD_FIELD_LIMITS.location);
  out.objetivo = cut(payload.objetivo, LEAD_FIELD_LIMITS.objetivo);
  out.chaves = cut(payload.chaves, LEAD_FIELD_LIMITS.chaves);
  out.planta = cut(payload.planta, LEAD_FIELD_LIMITS.planta);
  out.utm_source = cut(payload.utm_source, LEAD_FIELD_LIMITS.utm_source);
  out.utm_medium = cut(payload.utm_medium, LEAD_FIELD_LIMITS.utm_medium);
  out.utm_campaign = cut(payload.utm_campaign, LEAD_FIELD_LIMITS.utm_campaign);
  out.referrer = cut(payload.referrer, LEAD_FIELD_LIMITS.referrer);
  out.landing_path = cut(payload.landing_path, LEAD_FIELD_LIMITS.landing_path);
  out.user_agent = cut(payload.user_agent, LEAD_FIELD_LIMITS.user_agent);
  if ("lead_source" in payload) {
    out.lead_source = cut(payload.lead_source, LEAD_FIELD_LIMITS.lead_source);
  }
  // `leads.area_m2` é INTEGER: 32,5 m² vira 33 em vez de derrubar o insert.
  if (out.area_m2 != null) {
    out.area_m2 =
      Number.isFinite(out.area_m2) && out.area_m2 >= 0 && out.area_m2 <= 100000
        ? Math.round(out.area_m2)
        : null;
  }
  return out;
}
