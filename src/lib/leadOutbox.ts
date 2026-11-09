/**
 * Caixa de saída de leads no aparelho do visitante.
 *
 * Por quê (incidente de 06–08/11/2026): o backend da Lovable Cloud ficou
 * pausado ~41 h. Todo envio do formulário falhava ou estourava o tempo, o
 * pedido só existia no estado do React e 4–6 leads se perderam ao fechar a
 * aba. Agora o corpo completo enviado ao `notify-lead` (com atribuição e
 * dados da API de Conversões) fica no `localStorage` quando o envio não é
 * confirmado, e é reenviado sozinho quando a conexão volta — em qualquer
 * página do site, até 7 dias.
 *
 * - Cada envio tem um `submission_id` (UUID). O reenvio usa o MESMO id e o
 *   `notify-lead` não grava nem avisa de novo um id que já conhece; assim um
 *   envio que chegou, mas cuja resposta se perdeu, não vira lead duplicado.
 * - Uma entrada por pessoa e formulário (form_path + dígitos do WhatsApp +
 *   e-mail): um novo envio da mesma pessoa substitui o anterior.
 * - Tudo aqui engole erro (armazenamento bloqueado, cota, JSON corrompido) e
 *   não roda no servidor: a caixa de saída nunca pode quebrar a página.
 */

export const LEAD_OUTBOX_KEY = "bw:lead-outbox:v1";
/** Pedido mais velho que isso não é mais reenviado (o visitante já procurou outro canal). */
export const LEAD_OUTBOX_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const LEAD_OUTBOX_MAX = 10;
/** Intervalo mínimo entre tentativas da mesma entrada (dobra a cada falha, até o teto). */
export const LEAD_OUTBOX_RETRY_MS = 2 * 60 * 1000;
export const LEAD_OUTBOX_RETRY_MAX_MS = 30 * 60 * 1000;
/** Evento disparado na janela quando a caixa de saída muda. */
export const LEAD_OUTBOX_EVENT = "bw:lead-outbox-change";

/** Frase dos estados de falha/sem confirmação dos formulários (só quando a entrada foi guardada). */
export const LEAD_OUTBOX_SAVED_TEXT =
  "Seu pedido ficou salvo neste aparelho e será enviado sozinho assim que a conexão voltar.";

export type LeadOutboxBody = Record<string, unknown> & { submission_id: string };

export type LeadOutboxEntry = {
  submission_id: string;
  /** Corpo completo enviado ao `notify-lead`, inclusive `submission_id`. */
  body: LeadOutboxBody;
  /** Epoch em ms. */
  queued_at: number;
  attempts: number;
  last_attempt_at: number | null;
};

export type LeadOutboxSend = (body: LeadOutboxBody) => Promise<{ delivered: boolean }>;

const SUBMISSION_ID_RE = /^[0-9a-f-]{36}$/i;

/* ------------------------------------------------------------------ */
/* Funções puras                                                       */
/* ------------------------------------------------------------------ */

/** UUID v4 (`crypto.randomUUID` → `getRandomValues` → `Math.random`). */
export function newSubmissionId(): string {
  try {
    const c = (globalThis as { crypto?: Crypto }).crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
    const bytes = new Uint8Array(16);
    if (c && typeof c.getRandomValues === "function") c.getRandomValues(bytes);
    else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } catch {
    const r = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");
    return `${r()}${r()}-${r()}-4${r().slice(1)}-a${r().slice(1)}-${r()}${r()}${r()}`;
  }
}

export function isSubmissionId(value: unknown): value is string {
  return typeof value === "string" && SUBMISSION_ID_RE.test(value);
}

/** Mesma pessoa no mesmo formulário: form_path + dígitos do WhatsApp + e-mail. */
export function leadDedupKey(body: Record<string, unknown>): string {
  const text = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "");
  return [
    text(body.form_path).trim(),
    text(body.whatsapp).replace(/\D/g, ""),
    text(body.email).trim().toLowerCase(),
  ].join("|");
}

/** Espera antes da próxima tentativa: 2, 4, 8, 16 e depois 30 min. */
export function retryDelayMs(attempts: number): number {
  if (!(attempts > 0)) return 0;
  return Math.min(LEAD_OUTBOX_RETRY_MS * 2 ** (attempts - 1), LEAD_OUTBOX_RETRY_MAX_MS);
}

export function isDue(entry: LeadOutboxEntry, now: number): boolean {
  if (entry.last_attempt_at == null) return true;
  return now - entry.last_attempt_at >= retryDelayMs(entry.attempts);
}

function isEntry(value: unknown): value is LeadOutboxEntry {
  if (!value || typeof value !== "object") return false;
  const e = value as Partial<LeadOutboxEntry>;
  return (
    isSubmissionId(e.submission_id) &&
    !!e.body &&
    typeof e.body === "object" &&
    !Array.isArray(e.body) &&
    (e.body as Record<string, unknown>).submission_id === e.submission_id &&
    typeof e.queued_at === "number" &&
    Number.isFinite(e.queued_at) &&
    typeof e.attempts === "number" &&
    Number.isFinite(e.attempts) &&
    (e.last_attempt_at === null || (typeof e.last_attempt_at === "number" && Number.isFinite(e.last_attempt_at)))
  );
}

/** Conteúdo lido do armazenamento → entradas válidas, dentro do prazo, as mais novas. */
export function normalizeEntries(raw: unknown, now: number): LeadOutboxEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isEntry)
    .filter((e) => now - e.queued_at < LEAD_OUTBOX_TTL_MS)
    .sort((a, b) => a.queued_at - b.queued_at)
    .slice(-LEAD_OUTBOX_MAX);
}

function sameLead(entry: LeadOutboxEntry, body: Record<string, unknown>): boolean {
  return entry.submission_id === body.submission_id || leadDedupKey(entry.body) === leadDedupKey(body);
}

/**
 * Entra a nova entrada; sai qualquer outra do mesmo envio ou da mesma
 * pessoa/formulário. `attempted`: o envio interativo acabou de falhar, então
 * a primeira tentativa já conta (a próxima espera o intervalo).
 */
export function upsertEntry(
  entries: LeadOutboxEntry[],
  body: LeadOutboxBody,
  now: number,
  attempted = true,
): LeadOutboxEntry[] {
  const entry: LeadOutboxEntry = {
    submission_id: body.submission_id,
    body,
    queued_at: now,
    attempts: attempted ? 1 : 0,
    last_attempt_at: attempted ? now : null,
  };
  return normalizeEntries([...entries.filter((e) => !sameLead(e, body)), entry], now);
}

export function removeMatching(entries: LeadOutboxEntry[], body: Record<string, unknown>): LeadOutboxEntry[] {
  return entries.filter((e) => !sameLead(e, body));
}

/* ------------------------------------------------------------------ */
/* Armazenamento                                                       */
/* ------------------------------------------------------------------ */

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function readStored(now: number): LeadOutboxEntry[] {
  const s = storage();
  if (!s) return [];
  try {
    const raw = s.getItem(LEAD_OUTBOX_KEY);
    return raw ? normalizeEntries(JSON.parse(raw), now) : [];
  } catch {
    return [];
  }
}

function writeStored(entries: LeadOutboxEntry[]): boolean {
  const s = storage();
  if (!s) return false;
  try {
    if (entries.length) s.setItem(LEAD_OUTBOX_KEY, JSON.stringify(entries));
    else s.removeItem(LEAD_OUTBOX_KEY);
  } catch {
    return false;
  }
  try {
    window.dispatchEvent(new Event(LEAD_OUTBOX_EVENT));
  } catch {
    /* sem Event: ninguém escuta */
  }
  return true;
}

function updateStored(change: (entries: LeadOutboxEntry[]) => LeadOutboxEntry[], now: number): boolean {
  try {
    return writeStored(change(readStored(now)));
  } catch {
    return false;
  }
}

/** Entradas ainda válidas (as vencidas somem da leitura). */
export function listLeadOutbox(now: number = Date.now()): LeadOutboxEntry[] {
  return readStored(now);
}

/** Guarda o corpo para reenvio. `false` = não deu para guardar (sem armazenamento, cota, id inválido). */
export function enqueueLead(body: LeadOutboxBody, now: number = Date.now()): boolean {
  if (!body || !isSubmissionId(body.submission_id)) return false;
  return updateStored((entries) => upsertEntry(entries, body, now), now);
}

/** Tira da fila o mesmo envio e qualquer pendência da mesma pessoa/formulário (lead entregue). */
export function removeLeadFromOutbox(body: Record<string, unknown>, now: number = Date.now()): void {
  if (!body) return;
  const current = readStored(now);
  const next = removeMatching(current, body);
  if (next.length !== current.length) writeStored(next);
}

/* ------------------------------------------------------------------ */
/* Reenvio                                                             */
/* ------------------------------------------------------------------ */

let flushing = false;

export type LeadOutboxFlushResult = {
  delivered: LeadOutboxEntry[];
  /** Entradas que continuam na fila depois do reenvio. */
  remaining: number;
};

/**
 * Reenvia, uma por vez, as entradas cujo intervalo já passou (a que espera
 * há mais tempo primeiro). Entregue → sai da fila; senão conta a tentativa.
 * Para na primeira falha: com o backend fora, as outras falhariam também.
 * Uma execução por aba (`flushing`); outra aba vê a tentativa marcada antes
 * do envio e espera o intervalo. Nunca lança.
 */
export async function flushLeadOutbox(
  send: LeadOutboxSend,
  opts: { now?: () => number; ignoreBackoff?: boolean } = {},
): Promise<LeadOutboxFlushResult> {
  const now = opts.now ?? Date.now;
  const result: LeadOutboxFlushResult = { delivered: [], remaining: 0 };
  if (flushing) {
    result.remaining = listLeadOutbox(now()).length;
    return result;
  }
  flushing = true;
  try {
    const due = listLeadOutbox(now())
      .filter((e) => opts.ignoreBackoff || isDue(e, now()))
      .sort((a, b) => (a.last_attempt_at ?? 0) - (b.last_attempt_at ?? 0) || a.queued_at - b.queued_at);
    for (const entry of due) {
      // Pode ter saído enquanto a anterior era enviada (envio interativo
      // entregue, outra aba).
      const fresh = listLeadOutbox(now()).find((e) => e.submission_id === entry.submission_id);
      if (!fresh) continue;
      const attemptAt = now();
      updateStored(
        (entries) =>
          entries.map((e) =>
            e.submission_id === entry.submission_id ? { ...e, attempts: e.attempts + 1, last_attempt_at: attemptAt } : e,
          ),
        attemptAt,
      );
      let delivered = false;
      try {
        delivered = (await send(fresh.body))?.delivered === true;
      } catch {
        delivered = false;
      }
      if (!delivered) break;
      updateStored((entries) => entries.filter((e) => e.submission_id !== entry.submission_id), now());
      result.delivered.push({ ...fresh, attempts: fresh.attempts + 1, last_attempt_at: attemptAt });
    }
  } catch {
    /* nunca lança */
  } finally {
    flushing = false;
  }
  result.remaining = listLeadOutbox(now()).length;
  return result;
}

/** Só para testes. */
export function __resetLeadOutboxLock(): void {
  flushing = false;
}
