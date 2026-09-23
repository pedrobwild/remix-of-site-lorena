/**
 * Regras compartilhadas pelas telas de leads do painel (/admin/leads,
 * /admin/qualificacao, /admin/mensagens, /admin/diagnostico).
 *
 * - `landing_path` é ATRIBUIÇÃO (primeira página da sessão). O formulário que
 *   gerou o lead fica em `form_path`. Filtrar tela por `landing_path` perdia
 *   leads de /diagnostico cuja sessão começou na home e escondia /orcamento.
 * - Linhas antigas têm `form_path` nulo; para elas só dá para ADIVINHAR o
 *   formulário pelo `landing_path` (que na época era a página do envio).
 * - Toda mudança de status passa por `updateLeadStatus`, que grava também o
 *   histórico em `lead_qualification_log`.
 */
import { supabase } from "@/integrations/supabase/client";

export type LeadStatus = "novo" | "contatado" | "qualificado" | "descartado";

export const LEAD_STATUSES: readonly LeadStatus[] = [
  "novo",
  "contatado",
  "qualificado",
  "descartado",
];

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Formulário de origem
// ---------------------------------------------------------------------------

/** Formulários do site que gravam `leads.form_path`. */
export const LEAD_FORM_PATHS = [
  // "/diagnostico" ficou: a página saiu do ar (virou /orcamento), mas leads
  // históricos gravados com esse form_path continuam no painel.
  "/diagnostico",
  "/orcamento",
  "/o",
  "/p",
  "/contato",
  "/parceiros",
  "/parceiros/incorporadoras",
  "/indique-um-amigo",
] as const;

export type LeadFormPath = (typeof LEAD_FORM_PATHS)[number];

/** Pedidos de orçamento/diagnóstico: tela /admin/diagnostico (e o alias /admin/orcamentos). */
export const DIAGNOSTICO_FORMS: readonly LeadFormPath[] = ["/diagnostico", "/orcamento", "/o", "/p"];
/** Mensagens livres: tela /admin/mensagens. */
export const MENSAGEM_FORMS: readonly LeadFormPath[] = ["/contato"];

export const LEAD_FORM_LABEL: Record<LeadFormPath, string> = {
  "/diagnostico": "Diagnóstico",
  "/orcamento": "Orçamento",
  "/o": "LP placa de obra (/o)",
  "/p": "LP panfleto (/p)",
  "/contato": "Contato",
  "/parceiros": "Parceiros",
  "/parceiros/incorporadoras": "Incorporadoras",
  "/indique-um-amigo": "Indique um amigo",
};

/** Agrupamento usado no filtro "Tipo" de /admin/leads. */
export type LeadOrigem = "orcamento" | "contato" | "parceiro" | "indicacao" | "outro";

export const LEAD_ORIGEM_LABEL: Record<LeadOrigem, string> = {
  orcamento: "Orçamento",
  contato: "Mensagem",
  parceiro: "Parceiro",
  indicacao: "Indicação",
  outro: "Outra",
};

function isLeadFormPath(value: string): value is LeadFormPath {
  return (LEAD_FORM_PATHS as readonly string[]).includes(value);
}

/** Caminho sem querystring/hash/barra final, minúsculo. */
function cleanPath(path: string | null | undefined): string {
  const p = (path ?? "").split(/[?#]/)[0].trim().toLowerCase().replace(/\/+$/, "");
  return p || "/";
}

export type LeadFormSource = {
  form_path?: string | null;
  landing_path?: string | null;
  objetivo?: string | null;
};

export type ResolvedLeadForm = {
  /** Formulário identificado (ou `null` quando não dá para saber). */
  form: LeadFormPath | null;
  /** `true` quando veio de `form_path`; `false` quando foi deduzido (lead antigo). */
  exact: boolean;
};

/**
 * Qual formulário gerou o lead. Usa `form_path` quando existe; para leads
 * antigos (form_path nulo) deduz pelo `landing_path` e, no caso de parceiros,
 * pelo objetivo "Parceria comercial — …" que só esse formulário grava.
 */
export function resolveLeadForm(lead: LeadFormSource): ResolvedLeadForm {
  const fp = lead.form_path ? cleanPath(lead.form_path) : "";
  if (fp && isLeadFormPath(fp)) return { form: fp, exact: true };

  const lp = cleanPath(lead.landing_path);
  if (!fp) {
    if (isLeadFormPath(lp)) return { form: lp, exact: false };
    if ((lead.objetivo ?? "").trim().toLowerCase().startsWith("parceria comercial")) {
      return { form: "/parceiros", exact: false };
    }
  }
  return { form: null, exact: false };
}

export function leadOrigem(lead: LeadFormSource): LeadOrigem {
  const { form } = resolveLeadForm(lead);
  if (!form) return "outro";
  if ((DIAGNOSTICO_FORMS as readonly string[]).includes(form)) return "orcamento";
  if ((MENSAGEM_FORMS as readonly string[]).includes(form)) return "contato";
  if (form === "/parceiros" || form === "/parceiros/incorporadoras") return "parceiro";
  if (form === "/indique-um-amigo") return "indicacao";
  return "outro";
}

/** Texto curto para mostrar o formulário (ex.: "Orçamento" ou "Diagnóstico (provável)"). */
export function leadFormLabel(lead: LeadFormSource): string {
  const { form, exact } = resolveLeadForm(lead);
  if (!form) return "Não identificado";
  return exact ? LEAD_FORM_LABEL[form] : `${LEAD_FORM_LABEL[form]} (provável)`;
}

function quoteList(values: readonly string[]): string {
  return values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(",");
}

/**
 * Filtro PostgREST (`.or(...)`) que seleciona os leads de um conjunto de
 * formulários: pelo `form_path` e, nas linhas antigas sem `form_path`, pelo
 * `landing_path`.
 */
export function leadFormOrFilter(forms: readonly string[]): string {
  const list = quoteList(forms);
  return `form_path.in.(${list}),and(form_path.is.null,landing_path.in.(${list}))`;
}

// ---------------------------------------------------------------------------
// Links de contato
// ---------------------------------------------------------------------------

/**
 * Link wa.me para números brasileiros.
 * - 10 dígitos (DDD + fixo) ou 11 (DDD + celular) → prefixa 55.
 * - 12/13 dígitos começando com 55 → usa como está.
 * - Qualquer outra coisa → null (link omitido).
 */
export function waLink(whatsapp: string | null | undefined): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `https://wa.me/55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return `https://wa.me/${digits}`;
  }
  return null;
}

// Endereço simples: sem aspas, espaços, "?", "&", "%", vírgula ou "<>". Um
// e-mail como "x@y.com?bcc=spy@evil.com" viraria um mailto com cópia oculta.
const PLAIN_EMAIL_RE = /^[A-Za-z0-9._+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

/** `mailto:` só para endereços simples e válidos; qualquer outra coisa → null. */
export function mailtoHref(email: string | null | undefined): string | null {
  const e = (email ?? "").trim();
  if (!e || e.length > 254 || !PLAIN_EMAIL_RE.test(e)) return null;
  return `mailto:${e}`;
}

// ---------------------------------------------------------------------------
// Contagens
// ---------------------------------------------------------------------------

export type LeadStatusCounts = Record<LeadStatus, number>;

export const ZERO_STATUS_COUNTS: LeadStatusCounts = {
  novo: 0,
  contatado: 0,
  qualificado: 0,
  descartado: 0,
};

/**
 * Contagem exata por status (uma consulta `head` por status). `select("status")`
 * trazia as linhas e o PostgREST corta em 1000 sem avisar.
 */
export async function fetchLeadStatusCounts(
  orFilter?: string,
): Promise<{ counts: LeadStatusCounts; error: string | null }> {
  const results = await Promise.all(
    LEAD_STATUSES.map((status) => {
      let q = supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      if (orFilter) q = q.or(orFilter);
      return q;
    }),
  );
  const counts: LeadStatusCounts = { ...ZERO_STATUS_COUNTS };
  let error: string | null = null;
  results.forEach((res, i) => {
    if (res.error) error = error ?? res.error.message;
    else counts[LEAD_STATUSES[i]] = res.count ?? 0;
  });
  return { counts, error };
}

/** Ajuste otimista das contagens quando um lead muda de status. */
export function moveStatusCount(
  counts: LeadStatusCounts,
  from: LeadStatus,
  to: LeadStatus,
): LeadStatusCounts {
  if (from === to) return counts;
  return { ...counts, [from]: Math.max(0, counts[from] - 1), [to]: counts[to] + 1 };
}

// ---------------------------------------------------------------------------
// Mudança de status + histórico
// ---------------------------------------------------------------------------

export type LeadLogRow = {
  id: string;
  lead_id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  changed_by_email: string | null;
  created_at: string;
};

export const LEAD_LOG_COLUMNS =
  "id, lead_id, from_status, to_status, note, changed_by_email, created_at";

export type UpdateLeadStatusResult =
  /** Status salvo e histórico gravado. */
  | { ok: true; log: LeadLogRow; logError: null }
  /** Status salvo, mas o histórico falhou — a tela deve avisar e manter a observação. */
  | { ok: true; log: null; logError: string }
  /** Nada foi salvo. */
  | { ok: false; error: string };

/**
 * Muda o status de um lead e registra a mudança em `lead_qualification_log`
 * (com observação opcional e o autor da sessão). Com `from === to` e uma
 * observação, só registra a observação no histórico.
 *
 * supabase-js não lança em erro de API: os dois `{ error }` são conferidos. O
 * update pede `.select("id")` porque, com RLS, um update sem permissão volta
 * sem erro e sem linhas — antes isso aparecia como "salvo".
 */
export async function updateLeadStatus(
  leadId: string,
  from: LeadStatus | null,
  to: LeadStatus,
  note?: string | null,
): Promise<UpdateLeadStatusResult> {
  const observacao = (note ?? "").trim() || null;

  if (from !== to) {
    const { data, error } = await supabase
      .from("leads")
      .update({ status: to })
      .eq("id", leadId)
      .select("id");
    if (error) return { ok: false, error: error.message };
    if (!data || data.length === 0) {
      return {
        ok: false,
        error: "O lead não foi atualizado (não encontrado ou sem permissão). Recarregue a página.",
      };
    }
  } else if (!observacao) {
    return { ok: false, error: "Nada a registrar: o status é o mesmo e não há observação." };
  }

  let userId: string | null = null;
  let userEmail: string | null = null;
  try {
    const { data } = await supabase.auth.getSession();
    userId = data.session?.user.id ?? null;
    userEmail = data.session?.user.email ?? null;
  } catch {
    /* segue sem autor — o histórico ainda vale mais do que nada */
  }

  const { data: inserted, error: logError } = await supabase
    .from("lead_qualification_log")
    .insert({
      lead_id: leadId,
      from_status: from,
      to_status: to,
      note: observacao,
      changed_by: userId,
      changed_by_email: userEmail,
    })
    .select(LEAD_LOG_COLUMNS)
    .single();

  if (logError || !inserted) {
    return {
      ok: true,
      log: null,
      logError: logError?.message ?? "O histórico não confirmou a gravação.",
    };
  }
  return { ok: true, log: inserted as LeadLogRow, logError: null };
}
