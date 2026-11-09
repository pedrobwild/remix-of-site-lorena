/**
 * Caixa de saída de leads (backend pausado em 06–08/11/2026: 4–6 leads
 * perdidos porque o pedido só existia no estado do React).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetLeadOutboxLock,
  enqueueLead,
  flushLeadOutbox,
  isDue,
  isSubmissionId,
  LEAD_OUTBOX_EVENT,
  LEAD_OUTBOX_KEY,
  LEAD_OUTBOX_MAX,
  LEAD_OUTBOX_RETRY_MS,
  LEAD_OUTBOX_TTL_MS,
  leadDedupKey,
  listLeadOutbox,
  newSubmissionId,
  normalizeEntries,
  removeLeadFromOutbox,
  retryDelayMs,
  upsertEntry,
  type LeadOutboxBody,
} from "../leadOutbox";

const T0 = Date.UTC(2026, 10, 7, 12, 0, 0);
const MIN = 60_000;

let seq = 0;
function body(over: Record<string, unknown> = {}): LeadOutboxBody {
  seq += 1;
  return {
    submission_id: `00000000-0000-4000-8000-${String(seq).padStart(12, "0")}`,
    name: "Ana",
    whatsapp: "11912345678",
    email: "Ana@Exemplo.com",
    form_path: "/orcamento",
    utm_campaign: "120252065401790152",
    event_id: "evt-12345678",
    ...over,
  };
}

beforeEach(() => {
  window.localStorage.clear();
  __resetLeadOutboxLock();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("funções puras", () => {
  it("submission_id é um UUID aceito pelo servidor", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newSubmissionId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("submission_id sem crypto.randomUUID (navegador antigo / http)", () => {
    const original = globalThis.crypto.randomUUID;
    Object.defineProperty(globalThis.crypto, "randomUUID", { value: undefined, configurable: true });
    try {
      const id = newSubmissionId();
      expect(isSubmissionId(id)).toBe(true);
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    } finally {
      Object.defineProperty(globalThis.crypto, "randomUUID", { value: original, configurable: true });
    }
  });

  it("chave de deduplicação: formulário + dígitos do WhatsApp + e-mail em minúsculas", () => {
    expect(leadDedupKey(body({ whatsapp: "(11) 91234-5678", email: " ANA@exemplo.com " }))).toBe(
      "/orcamento|11912345678|ana@exemplo.com",
    );
    expect(leadDedupKey({ form_path: "/contato", whatsapp: "", email: null })).toBe("/contato||");
  });

  it("intervalo entre tentativas: 2 min, dobrando, até 30 min", () => {
    expect(retryDelayMs(0)).toBe(0);
    expect(retryDelayMs(1)).toBe(2 * MIN);
    expect(retryDelayMs(2)).toBe(4 * MIN);
    expect(retryDelayMs(4)).toBe(16 * MIN);
    expect(retryDelayMs(10)).toBe(30 * MIN);
    const entry = { ...upsertEntry([], body(), T0)[0] };
    expect(isDue(entry, T0 + LEAD_OUTBOX_RETRY_MS - 1)).toBe(false);
    expect(isDue(entry, T0 + LEAD_OUTBOX_RETRY_MS)).toBe(true);
  });

  it("mesma pessoa no mesmo formulário: o envio novo substitui o antigo", () => {
    const a = body();
    const b = body({ message: "corrigido" });
    const other = body({ form_path: "/contato" });
    let entries = upsertEntry([], a, T0);
    entries = upsertEntry(entries, other, T0 + 1);
    entries = upsertEntry(entries, b, T0 + 2);
    expect(entries.map((e) => e.submission_id)).toEqual([other.submission_id, b.submission_id]);
    expect(entries[1]).toMatchObject({ attempts: 1, last_attempt_at: T0 + 2, queued_at: T0 + 2 });
  });

  it("descarta lixo, vencidos e passa do teto mantendo os mais novos", () => {
    const fresh = upsertEntry([], body(), T0)[0];
    const old = { ...upsertEntry([], body({ whatsapp: "11900000000" }), T0 - LEAD_OUTBOX_TTL_MS)[0] };
    const mismatch = { ...fresh, submission_id: "11111111-1111-4111-8111-111111111111" };
    expect(normalizeEntries([fresh, old, mismatch, null, "x", { submission_id: "nope" }], T0)).toEqual([fresh]);
    expect(normalizeEntries("não é lista", T0)).toEqual([]);

    let entries: ReturnType<typeof upsertEntry> = [];
    for (let i = 0; i < LEAD_OUTBOX_MAX + 3; i++) entries = upsertEntry(entries, body({ whatsapp: `1190000000${i}` }), T0 + i);
    expect(entries).toHaveLength(LEAD_OUTBOX_MAX);
    expect(entries[0].queued_at).toBe(T0 + 3);
  });
});

describe("armazenamento", () => {
  it("guarda o corpo completo (com atribuição) e lista", () => {
    const b = body();
    expect(enqueueLead(b, T0)).toBe(true);
    const [entry] = listLeadOutbox(T0);
    expect(entry.body).toEqual(b);
    expect(entry.body.utm_campaign).toBe("120252065401790152");
    expect(JSON.parse(window.localStorage.getItem(LEAD_OUTBOX_KEY) ?? "[]")).toHaveLength(1);
  });

  it("avisa a página quando muda", () => {
    const spy = vi.fn();
    window.addEventListener(LEAD_OUTBOX_EVENT, spy);
    enqueueLead(body(), T0);
    window.removeEventListener(LEAD_OUTBOX_EVENT, spy);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("entregue: remove pelo id ou pela mesma pessoa/formulário", () => {
    const a = body();
    enqueueLead(a, T0);
    enqueueLead(body({ form_path: "/contato" }), T0);
    removeLeadFromOutbox({ ...body(), submission_id: newSubmissionId() }, T0);
    expect(listLeadOutbox(T0).map((e) => e.body.form_path)).toEqual(["/contato"]);
    removeLeadFromOutbox(body({ form_path: "/contato", whatsapp: "", email: "x@y.com" }), T0);
    expect(listLeadOutbox(T0)).toHaveLength(1);
  });

  it("vencido some da leitura; vazio apaga a chave", () => {
    enqueueLead(body(), T0);
    expect(listLeadOutbox(T0 + LEAD_OUTBOX_TTL_MS)).toEqual([]);
    removeLeadFromOutbox(body(), T0);
    expect(window.localStorage.getItem(LEAD_OUTBOX_KEY)).toBeNull();
  });

  it("id inválido não entra", () => {
    expect(enqueueLead({ ...body(), submission_id: "abc" }, T0)).toBe(false);
    expect(listLeadOutbox(T0)).toEqual([]);
  });

  it("armazenamento quebrado ou JSON corrompido nunca lança", () => {
    window.localStorage.setItem(LEAD_OUTBOX_KEY, "{corrompido");
    expect(listLeadOutbox(T0)).toEqual([]);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(enqueueLead(body(), T0)).toBe(false);
    expect(() => removeLeadFromOutbox(body(), T0)).not.toThrow();
    expect(listLeadOutbox(T0)).toEqual([]);
  });
});

describe("flushLeadOutbox", () => {
  it("só reenvia o que já passou do intervalo; entregue sai da fila", async () => {
    const b = body();
    enqueueLead(b, T0);
    const send = vi.fn().mockResolvedValue({ delivered: true });

    let r = await flushLeadOutbox(send, { now: () => T0 + MIN });
    expect(send).not.toHaveBeenCalled();
    expect(r).toEqual({ delivered: [], remaining: 1 });

    r = await flushLeadOutbox(send, { now: () => T0 + 2 * MIN });
    expect(send).toHaveBeenCalledWith(b);
    expect(r.delivered.map((e) => e.submission_id)).toEqual([b.submission_id]);
    expect(r.remaining).toBe(0);
    expect(listLeadOutbox(T0 + 2 * MIN)).toEqual([]);
  });

  it("falha: conta a tentativa, mantém o mesmo submission_id e para (backend fora)", async () => {
    const a = body();
    const c = body({ form_path: "/contato" });
    enqueueLead(a, T0);
    enqueueLead(c, T0);
    const send = vi.fn().mockResolvedValue({ delivered: false });
    const r = await flushLeadOutbox(send, { now: () => T0 + 10 * MIN });
    expect(send).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ delivered: [], remaining: 2 });
    const after = listLeadOutbox(T0 + 10 * MIN);
    const tried = after.find((e) => e.submission_id === send.mock.calls[0][0].submission_id);
    expect(tried).toMatchObject({ attempts: 2, last_attempt_at: T0 + 10 * MIN });
    // Próxima rodada começa pela que esperou mais.
    send.mockResolvedValue({ delivered: true });
    await flushLeadOutbox(send, { now: () => T0 + 11 * MIN });
    expect(send.mock.calls[1][0].submission_id).not.toBe(send.mock.calls[0][0].submission_id);
  });

  it("envio que lança conta como falha; o flush nunca lança", async () => {
    enqueueLead(body(), T0);
    const send = vi.fn().mockRejectedValue(new Error("rede"));
    await expect(flushLeadOutbox(send, { now: () => T0 + 5 * MIN })).resolves.toEqual({ delivered: [], remaining: 1 });
  });

  it("`ignoreBackoff` (evento online) não espera o intervalo", async () => {
    enqueueLead(body(), T0);
    const send = vi.fn().mockResolvedValue({ delivered: true });
    await flushLeadOutbox(send, { now: () => T0 + 1, ignoreBackoff: true });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("um flush por vez na mesma aba", async () => {
    enqueueLead(body(), T0);
    let release!: (v: { delivered: boolean }) => void;
    const send = vi.fn(() => new Promise<{ delivered: boolean }>((r) => (release = r)));
    const first = flushLeadOutbox(send, { now: () => T0 + 5 * MIN });
    const second = await flushLeadOutbox(send, { now: () => T0 + 5 * MIN, ignoreBackoff: true });
    expect(second).toEqual({ delivered: [], remaining: 1 });
    expect(send).toHaveBeenCalledTimes(1);
    release({ delivered: true });
    await expect(first).resolves.toMatchObject({ remaining: 0 });
  });

  it("entrada removida durante o flush (envio interativo entregue) não é reenviada", async () => {
    const a = body({ form_path: "/contato" });
    const b = body();
    enqueueLead(a, T0);
    enqueueLead(b, T0 + 1);
    const send = vi.fn(async (sent: LeadOutboxBody) => {
      if (sent.submission_id === a.submission_id) removeLeadFromOutbox(b, T0 + 5 * MIN);
      return { delivered: true };
    });
    await flushLeadOutbox(send, { now: () => T0 + 5 * MIN });
    expect(send).toHaveBeenCalledTimes(1);
  });
});
