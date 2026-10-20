// Exportação para planilha e BI (edge function `data-export`) — regras puras,
// usadas pela função (Deno) e pelo painel/testes (Vite/Vitest). Sem nada de
// Deno aqui.
//
// Conjuntos SEM dados pessoais:
//   - leads: sem nome, WhatsApp, e-mail, mensagem, navegador, cookies (_fbp,
//     _fbc) nem ids de clique (gclid/fbclid viram só "tem/não tem"); o
//     referrer vira só o host.
//   - meta_leads: sem nome, e-mail, telefone nem respostas do formulário.
//   - meta_ads_daily, analytics_daily e tracking_daily: só números agregados.
//
// A única exceção é google_ads_offline (conversões offline do Google Ads,
// lidas pelo Data Manager): e-mail e telefone saem SÓ como hash SHA-256 (o
// formato que o Google pede para as conversões otimizadas para leads) e o
// gclid sai como está, porque é ele que liga a conversão ao clique. Nunca
// sai e-mail ou telefone em texto puro. Regras em
// buildGoogleAdsOfflineRows, mais abaixo.
//
// Formatos (docs/INTEGRACOES.md › Exportação):
//   - CSV (padrão): separador vírgula e decimal com vírgula (planilhas e BI em
//     português — o número decimal vai entre aspas); `dec=dot` para decimal com
//     ponto; `sep=semicolon` para abrir direto no Excel em português (ponto e
//     vírgula + marca UTF-8). Sim/não viram 1/0; datas e horas no fuso de São
//     Paulo ("2026-09-25" e "2026-09-25 14:30:00").
//   - JSON: { dataset, from, to, …, rows: [ … ] } com números e sim/não nativos.

export const EXPORT_TZ = "America/Sao_Paulo";
export const DEFAULT_DAYS = 90;
export const MAX_DAYS = 731;
export const MAX_ROWS = 50_000;

export const EXPORT_DATASETS = [
  "leads",
  "meta_leads",
  "meta_ads_daily",
  "analytics_daily",
  "tracking_daily",
  "google_ads_offline",
] as const;
export type ExportDataset = (typeof EXPORT_DATASETS)[number];

export type ColumnKind = "text" | "int" | "decimal" | "bool" | "date" | "datetime";
export type ExportColumn = { name: string; kind: ColumnKind };

type DatasetInfo = {
  label: string;
  description: string;
  /** Coluna que o período filtra. */
  period: string;
  columns: readonly ExportColumn[];
};

const col = (name: string, kind: ColumnKind = "text"): ExportColumn => ({ name, kind });

export const DATASETS: Record<ExportDataset, DatasetInfo> = {
  leads: {
    label: "Leads do site",
    description: "Um lead por linha: data, status, perfil do imóvel e origem (UTMs, página, anúncio). Sem nome, telefone, e-mail nem mensagem.",
    period: "created_at",
    columns: [
      col("id"),
      col("created_at", "datetime"),
      col("status"),
      col("lead_source"),
      col("location"),
      col("lives_in_sp", "bool"),
      col("area_m2", "int"),
      col("objetivo"),
      col("chaves"),
      col("planta"),
      col("utm_source"),
      col("utm_medium"),
      col("utm_campaign"),
      col("utm_term"),
      col("utm_content"),
      col("first_utm_source"),
      col("first_utm_medium"),
      col("first_utm_campaign"),
      col("referrer_host"),
      col("landing_path"),
      col("form_path"),
      col("has_gclid", "bool"),
      col("has_fbclid", "bool"),
      col("consent_marketing", "bool"),
      col("meta_lead_sent", "bool"),
      col("meta_qualified_sent", "bool"),
    ],
  },
  meta_leads: {
    label: "Formulários da Meta",
    description: "Um lead dos formulários instantâneos por linha: data, formulário, campanha, conjunto, anúncio e plataforma. Sem contato nem respostas.",
    period: "created_time",
    columns: [
      col("id"),
      col("created_time", "datetime"),
      col("status"),
      col("form_id"),
      col("form_name"),
      col("campaign_id"),
      col("campaign_name"),
      col("adset_id"),
      col("adset_name"),
      col("ad_id"),
      col("ad_name"),
      col("platform"),
      col("is_organic", "bool"),
      col("is_test", "bool"),
      col("city"),
    ],
  },
  meta_ads_daily: {
    label: "Campanhas da Meta por dia",
    description: "Investimento, impressões, cliques e leads (formulário, site e conversas) por campanha e dia.",
    period: "date",
    columns: [
      col("date", "date"),
      col("account_id"),
      col("campaign_id"),
      col("campaign_name"),
      col("objective"),
      col("currency"),
      col("spend", "decimal"),
      col("impressions", "int"),
      col("clicks", "int"),
      col("link_clicks", "int"),
      col("leads", "int"),
      col("form_leads", "int"),
      col("site_leads", "int"),
      col("conversations", "int"),
    ],
  },
  analytics_daily: {
    label: "Visitas ao site por dia",
    description:
      "Sessões, visitantes, páginas vistas e conversões por dia, origem (UTMs e site de origem) e aparelho — as contas do Analytics. Visitantes não somam entre linhas.",
    period: "day",
    columns: [
      col("day", "date"),
      col("utm_source"),
      col("utm_medium"),
      col("utm_campaign"),
      col("referrer_host"),
      col("device"),
      col("sessions", "int"),
      col("visitors", "int"),
      col("pageviews", "int"),
      col("conversions", "int"),
      col("converted_sessions", "int"),
      col("bounces", "int"),
    ],
  },
  tracking_daily: {
    label: "Pixel próprio por dia",
    description: "Aberturas, visualizações e cliques dos pixels e links rastreados por dia e campanha (robôs à parte).",
    period: "day",
    columns: [
      col("day", "date"),
      col("kind"),
      col("campaign"),
      col("source"),
      col("medium"),
      col("content"),
      col("term"),
      col("hits", "int"),
      col("bots", "int"),
    ],
  },
  google_ads_offline: {
    label: "Conversões offline do Google Ads",
    description:
      "Lead qualificado investidor (Short stay, Locação tradicional ou Uso misto) e Contrato assinado, no formato do Data Manager. E-mail e telefone só em hash SHA-256.",
    period: "created_at",
    columns: [
      col("Google Click ID"),
      col("Email"),
      col("Phone Number"),
      col("Conversion Name"),
      col("Conversion Time"),
      col("Conversion Value", "decimal"),
      col("Conversion Currency"),
    ],
  },
};

export function isExportDataset(v: unknown): v is ExportDataset {
  return typeof v === "string" && (EXPORT_DATASETS as readonly string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Chave
// ---------------------------------------------------------------------------

export const KEY_PATTERN = /^bwx_[0-9a-f]{64}$/;

/**
 * A chave vem do cabeçalho `x-export-key`, de `Authorization: Bearer …` ou do
 * parâmetro `key` (o IMPORTDATA do Google Sheets não manda cabeçalho). Vale a
 * primeira com o formato certo; `provided` diz se veio alguma coisa.
 */
export function readExportKey(req: Request): { key: string | null; provided: boolean } {
  const url = new URL(req.url);
  const bearer = /^Bearer\s+(\S+)\s*$/i.exec(req.headers.get("authorization") ?? "")?.[1] ?? null;
  const candidates = [req.headers.get("x-export-key"), bearer, url.searchParams.get("key")]
    .map((v) => (v ?? "").trim())
    .filter((v) => v !== "");
  return { key: candidates.find((v) => KEY_PATTERN.test(v)) ?? null, provided: candidates.length > 0 };
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Período (dias do fuso de São Paulo)
// ---------------------------------------------------------------------------

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

function tzParts(at: Date): Record<string, number> {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EXPORT_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const out: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") out[p.type] = Number(p.value);
  return out;
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** Dia (YYYY-MM-DD) em São Paulo. */
export function spDay(at: Date): string {
  const p = tzParts(at);
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}`;
}

/** "YYYY-MM-DD HH:MM:SS" em São Paulo — entra como data e hora em planilhas e no BI. */
export function spDateTime(value: unknown): string | null {
  if (value == null || value === "") return null;
  const at = new Date(String(value));
  if (Number.isNaN(at.getTime())) return null;
  const p = tzParts(at);
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

function validDay(day: string): boolean {
  if (!DAY_RE.test(day)) return false;
  const t = Date.parse(`${day}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === day;
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

/** Início do dia em São Paulo, como instante (vale mesmo se o horário de verão voltar). */
export function spDayStart(day: string): Date {
  const naive = Date.parse(`${day}T00:00:00Z`);
  const offset = (t: number) => {
    const p = tzParts(new Date(t));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
  };
  let t = naive - offset(naive);
  t = naive - offset(t);
  return new Date(t);
}

// ---------------------------------------------------------------------------
// Pedido
// ---------------------------------------------------------------------------

export type ExportFormat = "csv" | "json";

export type ExportRequest = {
  dataset: ExportDataset;
  format: ExportFormat;
  sep: "," | ";";
  dec: "," | ".";
  /** Primeiro e último dia (inclusive), em São Paulo. */
  from: string;
  to: string;
  /** Instantes para filtrar created_at: [since, until). */
  since: string;
  until: string;
};

export type ParsedExportRequest = { ok: true; value: ExportRequest } | { ok: false; error: string };

/**
 * `dataset` (obrigatório), `format=csv|json`, `sep=comma|semicolon`,
 * `dec=comma|dot`, e o período: `days=N` (os últimos N dias, hoje incluído;
 * padrão 90) ou `from=AAAA-MM-DD` e `to=AAAA-MM-DD` (inclusive; `to` padrão
 * hoje). No máximo 731 dias.
 */
export function parseExportRequest(url: URL, now = new Date()): ParsedExportRequest {
  const q = url.searchParams;
  const dataset = (q.get("dataset") ?? "").trim();
  if (!dataset) return { ok: false, error: `Informe o conjunto: dataset=${EXPORT_DATASETS.join("|")}.` };
  if (!isExportDataset(dataset)) return { ok: false, error: `Conjunto desconhecido: use ${EXPORT_DATASETS.join(", ")}.` };

  const formatRaw = (q.get("format") ?? "csv").trim().toLowerCase();
  if (formatRaw !== "csv" && formatRaw !== "json") return { ok: false, error: "Formato inválido: use format=csv ou format=json." };

  const sepRaw = (q.get("sep") ?? "comma").trim().toLowerCase();
  const sep = sepRaw === "comma" || sepRaw === "," ? "," : sepRaw === "semicolon" || sepRaw === ";" ? ";" : null;
  if (!sep) return { ok: false, error: "Separador inválido: use sep=comma ou sep=semicolon." };

  const decRaw = (q.get("dec") ?? "comma").trim().toLowerCase();
  const dec = decRaw === "comma" || decRaw === "," ? "," : decRaw === "dot" || decRaw === "." ? "." : null;
  if (!dec) return { ok: false, error: "Decimal inválido: use dec=comma ou dec=dot." };

  const today = spDay(now);
  const fromRaw = (q.get("from") ?? "").trim();
  const toRaw = (q.get("to") ?? "").trim();
  let from: string;
  let to: string;
  if (fromRaw || toRaw) {
    if (!fromRaw) return { ok: false, error: "Informe from=AAAA-MM-DD junto com to." };
    if (!validDay(fromRaw)) return { ok: false, error: "Data inicial inválida: use from=AAAA-MM-DD." };
    if (toRaw && !validDay(toRaw)) return { ok: false, error: "Data final inválida: use to=AAAA-MM-DD." };
    from = fromRaw;
    to = toRaw || today;
    if (from > to) return { ok: false, error: "A data inicial é depois da final." };
  } else {
    const daysRaw = (q.get("days") ?? String(DEFAULT_DAYS)).trim();
    const days = /^\d{1,4}$/.test(daysRaw) ? Number(daysRaw) : NaN;
    if (!(days >= 1 && days <= MAX_DAYS)) return { ok: false, error: `Período inválido: use days entre 1 e ${MAX_DAYS}.` };
    to = today;
    from = addDays(today, -(days - 1));
  }
  const span = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
  if (span > MAX_DAYS) return { ok: false, error: `Período longo demais: no máximo ${MAX_DAYS} dias por exportação.` };

  return {
    ok: true,
    value: {
      dataset,
      format: formatRaw,
      sep,
      dec,
      from,
      to,
      since: spDayStart(from).toISOString(),
      until: spDayStart(addDays(to, 1)).toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Linhas (só as colunas públicas de cada conjunto)
// ---------------------------------------------------------------------------

/** Colunas lidas do banco. gclid/fbclid/referrer entram só para virar sim/não e host. */
export const LEADS_SELECT =
  "id, created_at, status, lead_source, location, lives_in_sp, area_m2, objetivo, chaves, planta, utm_source, utm_medium, utm_campaign, utm_term, utm_content, first_utm_source, first_utm_medium, first_utm_campaign, referrer, landing_path, form_path, gclid, fbclid, consent_marketing, meta_lead_sent_at, meta_qualified_sent_at";

export const META_LEADS_SELECT =
  "id, created_time, status, form_id, form_name, campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name, platform, is_organic, is_test, city";

export const META_ADS_SELECT =
  "date, account_id, campaign_id, campaign_name, objective, currency, spend, impressions, clicks, link_clicks, leads, form_leads, site_leads, conversations";

export type ExportRecord = Record<string, unknown>;

function hostOf(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host || null;
  } catch {
    return null;
  }
}

const present = (v: unknown) => v != null && v !== "";

function leadRecord(r: ExportRecord): ExportRecord {
  return {
    id: r.id,
    created_at: r.created_at,
    status: r.status,
    lead_source: r.lead_source,
    location: r.location,
    lives_in_sp: r.lives_in_sp,
    area_m2: r.area_m2,
    objetivo: r.objetivo,
    chaves: r.chaves,
    planta: r.planta,
    utm_source: r.utm_source,
    utm_medium: r.utm_medium,
    utm_campaign: r.utm_campaign,
    utm_term: r.utm_term,
    utm_content: r.utm_content,
    first_utm_source: r.first_utm_source,
    first_utm_medium: r.first_utm_medium,
    first_utm_campaign: r.first_utm_campaign,
    referrer_host: hostOf(r.referrer),
    landing_path: r.landing_path,
    form_path: r.form_path,
    has_gclid: present(r.gclid),
    has_fbclid: present(r.fbclid),
    consent_marketing: r.consent_marketing,
    meta_lead_sent: present(r.meta_lead_sent_at),
    meta_qualified_sent: present(r.meta_qualified_sent_at),
  };
}

/** Linha do banco → linha exportada, só com as colunas do conjunto (na ordem dele). */
export function toExportRecord(dataset: ExportDataset, row: ExportRecord): ExportRecord {
  const source = dataset === "leads" ? leadRecord(row) : row;
  const out: ExportRecord = {};
  for (const c of DATASETS[dataset].columns) out[c.name] = source[c.name] ?? null;
  return out;
}

// ---------------------------------------------------------------------------
// Conversões offline do Google Ads (google_ads_offline)
// ---------------------------------------------------------------------------
//
// Duas conversões, com os nomes EXATOS das ações criadas no Google Ads:
//   - "Lead qualificado investidor": status `qualificado` E objetivo de
//     locação (Short stay, Locação tradicional ou Uso misto). Moradia e
//     Ainda avaliando não entram. Hora = primeira passagem para `qualificado`
//     em lead_qualification_log (sem registro, updated_at).
//   - "Contrato assinado": crm_won = true, qualquer objetivo. Hora =
//     crm_last_change_at (sem ela, updated_at). Valor vazio por enquanto (o
//     lead não guarda o valor do contrato).
// O Google só aceita conversão até 90 dias depois do clique (com gclid) e até
// 63 dias quando o casamento é só por e-mail/telefone; conta-se do created_at
// do lead. Leads de parceria comercial ficam fora.

export const GOOGLE_ADS_QUALIFIED_CONVERSION = "Lead qualificado investidor";
export const GOOGLE_ADS_WON_CONVERSION = "Contrato assinado";
/** Objetivos que contam como investidor (locação). Valores de LEAD_OBJETIVOS. */
export const GOOGLE_ADS_INVESTOR_OBJETIVOS: readonly string[] = ["Short stay", "Locação tradicional", "Uso misto"];
export const GOOGLE_ADS_GCLID_WINDOW_DAYS = 90;
export const GOOGLE_ADS_HASH_WINDOW_DAYS = 63;

/** Colunas lidas do banco para este conjunto (só dentro da função; o CSV leva hash). */
export const GOOGLE_ADS_OFFLINE_SELECT =
  "id, created_at, updated_at, status, objetivo, gclid, email, whatsapp, crm_won, crm_last_change_at, consent_marketing";

/** E-mail como o Google pede antes do hash: sem espaços nas pontas e em minúsculas. */
export function normalizeEmailForHash(raw: unknown): string | null {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}

/** Telefone BR → E.164 (+55DDDNÚMERO). Aceita só dígitos com ou sem o 55. */
export function normalizePhoneForHash(raw: unknown): string | null {
  let d = (typeof raw === "string" || typeof raw === "number" ? String(raw) : "").replace(/\D/g, "").replace(/^0+/, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if (d.length < 10 || d.length > 11) return null;
  return `+55${d}`;
}

/** "yyyy-MM-dd HH:mm:ss-03:00" — hora de São Paulo com o fuso explícito, como o Google pede. */
export function googleAdsConversionTime(value: unknown): string | null {
  if (value == null || value === "") return null;
  const at = new Date(String(value));
  if (Number.isNaN(at.getTime())) return null;
  const p = tzParts(at);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const offsetMin = Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60_000);
  const sign = offsetMin < 0 ? "-" : "+";
  const abs = Math.abs(offsetMin);
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function isPartnerLead(objetivo: unknown): boolean {
  return typeof objetivo === "string" && objetivo.trim().toLowerCase().startsWith("parceria comercial");
}

function isTrue(v: unknown): boolean {
  return v === true || v === "true" || v === "t";
}

/** Evidência resolvida no servidor, nunca deduzida do flag do formulário. */
export type GoogleAdsExportConsent = {
  event: { recordId: string; noticeVersion: string; acceptedAt: string; advertising: boolean };
  current: { recordId: string; noticeVersion: string; acceptedAt: string; advertising: boolean };
};

/** Ausência de autorização atual ou na captura bloqueia inclusive o GCLID. */
export function canExportGoogleAdsLead(
  lead: ExportRecord,
  consent: GoogleAdsExportConsent | undefined,
  now: number,
): boolean {
  if (lead.consent_marketing !== true || !consent) return false;
  const created = Date.parse(String(lead.created_at ?? ""));
  if (!Number.isFinite(created)) return false;
  return [consent.event, consent.current].every((record, index) => {
    const at = Date.parse(record.acceptedAt);
    return record.advertising === true && record.recordId.trim().length > 0 &&
      record.noticeVersion.trim().length > 0 && Number.isFinite(at) &&
      at <= (index === 0 ? created : now);
  });
}

export type GoogleAdsOfflineInput = {
  leads: readonly ExportRecord[];
  /** Aceite na captura e escolha mais recente, resolvidos de registros persistidos.
   * Sem essa fonte, a exportação fica bloqueada; não inferir do flag legado. */
  consentByLead?: ReadonlyMap<string, GoogleAdsExportConsent>;
  /** Primeira passagem para `qualificado`, por lead (ISO). */
  qualifiedAt: ReadonlyMap<string, string>;
  /**
   * Contratos reais do CRM por lead (valor e data de fechamento). Ausente =
   * CRM não respondeu: valor vazio, nunca estimado nem trocado por peso de lance.
   */
  contracts?: ReadonlyMap<string, readonly { total: number | null; closed_at: string | null }[]>;
  now?: Date;
};

/** Linhas do CSV, já com hash. Ordenadas pela hora da conversão. */
export async function buildGoogleAdsOfflineRows(input: GoogleAdsOfflineInput): Promise<ExportRecord[]> {
  const now = (input.now ?? new Date()).getTime();
  const out: { at: number; row: ExportRecord }[] = [];
  for (const lead of input.leads) {
    if (!canExportGoogleAdsLead(lead, input.consentByLead?.get(String(lead.id)), now)) continue;
    if (isPartnerLead(lead.objetivo)) continue;
    const created = Date.parse(String(lead.created_at ?? ""));
    if (Number.isNaN(created)) continue;

    const gclid = typeof lead.gclid === "string" && lead.gclid.trim() ? lead.gclid.trim() : null;
    const email = normalizeEmailForHash(lead.email);
    const phone = normalizePhoneForHash(lead.whatsapp);
    if (!gclid && !email && !phone) continue;

    const windowDays = gclid ? GOOGLE_ADS_GCLID_WINDOW_DAYS : GOOGLE_ADS_HASH_WINDOW_DAYS;
    if (now - created > windowDays * DAY_MS) continue;

    const conversions: { name: string; when: unknown; value?: number | null }[] = [];
    const objetivo = typeof lead.objetivo === "string" ? lead.objetivo.trim() : "";
    if (lead.status === "qualificado" && GOOGLE_ADS_INVESTOR_OBJETIVOS.includes(objetivo)) {
      conversions.push({ name: GOOGLE_ADS_QUALIFIED_CONVERSION, when: input.qualifiedAt.get(String(lead.id)) ?? lead.updated_at });
    }
    if (isTrue(lead.crm_won)) {
      const real = input.contracts?.get(String(lead.id)) ?? [];
      const fallback = lead.crm_last_change_at ?? lead.updated_at;
      if (real.length) {
        // Um contrato = uma conversão, com valor e data informados pelo CRM.
        for (const c of real) {
          const value = typeof c.total === "number" && Number.isFinite(c.total) && c.total > 0 ? c.total : null;
          conversions.push({ name: GOOGLE_ADS_WON_CONVERSION, when: c.closed_at ?? fallback, value });
        }
      } else {
        conversions.push({ name: GOOGLE_ADS_WON_CONVERSION, when: fallback });
      }
    }
    if (!conversions.length) continue;

    const emailHash = email ? await sha256Hex(email) : null;
    const phoneHash = phone ? await sha256Hex(phone) : null;
    for (const c of conversions) {
      const time = googleAdsConversionTime(c.when);
      if (!time) continue;
      out.push({
        at: Date.parse(String(c.when)),
        row: {
          "Google Click ID": gclid,
          Email: emailHash,
          "Phone Number": phoneHash,
          "Conversion Name": c.name,
          "Conversion Time": time,
          "Conversion Value": c.value ?? null,
          "Conversion Currency": "BRL",
        },
      });
    }
  }
  out.sort((a, b) => a.at - b.at);
  return out.map((o) => o.row);
}

/**
 * A chave lê este conjunto se o tiver OU se tiver "leads" (as chaves antigas
 * não podem ganhar o conjunto novo antes da migração que amplia a lista).
 */
export function keyAllowsDataset(keyDatasets: readonly string[], dataset: ExportDataset): boolean {
  if (keyDatasets.includes(dataset)) return true;
  return dataset === "google_ads_offline" && keyDatasets.includes("leads");
}

// ---------------------------------------------------------------------------
// CSV / JSON
// ---------------------------------------------------------------------------

function num(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function bool(value: unknown): boolean | null {
  if (value == null) return null;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "t" || value === 1) return true;
  if (value === "false" || value === "f" || value === 0) return false;
  return null;
}

/** Valor tipado para o JSON (horas em São Paulo, números e sim/não nativos). */
export function jsonValue(kind: ColumnKind, value: unknown): unknown {
  switch (kind) {
    case "int":
    case "decimal":
      return num(value);
    case "bool":
      return bool(value);
    case "datetime":
      return spDateTime(value);
    case "date":
      return value == null || value === "" ? null : String(value).slice(0, 10);
    default:
      return value == null ? null : String(value);
  }
}

/** Texto da célula do CSV, antes das aspas. Texto que começa com = + - @ ganha um ' (não vira fórmula). */
export function csvText(kind: ColumnKind, value: unknown, dec: "," | "."): string {
  const v = jsonValue(kind, value);
  if (v == null) return "";
  if (kind === "bool") return v ? "1" : "0";
  if (kind === "int" || kind === "decimal") {
    const s = String(v);
    return dec === "," ? s.replace(".", ",") : s;
  }
  const s = String(v).replace(/\u0000/g, "");
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

function quote(cell: string, sep: string): string {
  return cell.includes(sep) || /["\r\n]/.test(cell) || /^\s|\s$/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

export function toCsv(dataset: ExportDataset, records: readonly ExportRecord[], opts: { sep: "," | ";"; dec: "," | "." }): string {
  const cols = DATASETS[dataset].columns;
  const lines = [cols.map((c) => quote(c.name, opts.sep)).join(opts.sep)];
  for (const r of records) lines.push(cols.map((c) => quote(csvText(c.kind, r[c.name], opts.dec), opts.sep)).join(opts.sep));
  // Excel em português (ponto e vírgula) só lê acentos com a marca UTF-8.
  return `${opts.sep === ";" ? "\uFEFF" : ""}${lines.join("\r\n")}\r\n`;
}

export function toJson(
  req: Pick<ExportRequest, "dataset" | "from" | "to">,
  records: readonly ExportRecord[],
  meta: { generatedAt: Date; truncated: boolean },
): string {
  const cols = DATASETS[req.dataset].columns;
  return JSON.stringify({
    dataset: req.dataset,
    from: req.from,
    to: req.to,
    timezone: EXPORT_TZ,
    generated_at: spDateTime(meta.generatedAt.toISOString()),
    row_count: records.length,
    truncated: meta.truncated,
    columns: cols.map((c) => c.name),
    rows: records.map((r) => Object.fromEntries(cols.map((c) => [c.name, jsonValue(c.kind, r[c.name])]))),
  });
}

export function exportFilename(req: Pick<ExportRequest, "dataset" | "from" | "to" | "format">): string {
  return `bewild-${req.dataset}-${req.from}_${req.to}.${req.format}`;
}
