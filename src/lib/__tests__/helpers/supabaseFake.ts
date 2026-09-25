/**
 * Fake mínimo do client do Supabase para testes das rotinas do painel.
 *
 * Cada `supabase.from(tabela)` devolve um builder encadeável que registra as
 * chamadas (`update`, `eq`, `select`…) e, ao ser aguardado, pede a resposta a
 * `respond(call)` — o teste decide o `{ data, error, count }` olhando a
 * tabela e as operações registradas.
 */
import { vi } from "vitest";

export type RecordedCall = {
  table: string;
  ops: Array<[string, unknown[]]>;
};

export type FakeResponse = {
  data?: unknown;
  error?: { message: string; code?: string } | null;
  count?: number | null;
};

type Responder = (call: RecordedCall) => FakeResponse | Promise<FakeResponse>;

export const calls: RecordedCall[] = [];
let responder: Responder = () => ({ data: null, error: null });
let session: { user: { id: string; email?: string } } | null = null;

export function setResponder(fn: Responder) {
  responder = fn;
}

export function setSession(s: typeof session) {
  session = s;
}

export function resetFake() {
  calls.length = 0;
  responder = () => ({ data: null, error: null });
  session = null;
  fakeSupabase.from.mockClear();
  fakeSupabase.storage.from.mockClear();
  storageRemove.mockReset();
  storageRemove.mockResolvedValue({ data: [], error: null });
  functionsInvoke.mockReset();
  functionsInvoke.mockResolvedValue({ data: { ok: true, meta: "skipped" }, error: null });
}

/**
 * Primeira operação "de verbo" (select/insert/update/delete/upsert). Em
 * `.update().select()` o verbo é o update — a primeira da lista.
 */
export function verbOf(call: RecordedCall): string | undefined {
  const verbs = ["select", "insert", "update", "delete", "upsert"];
  return call.ops.find(([op]) => verbs.includes(op))?.[0];
}

export function hasOp(call: RecordedCall, op: string, ...args: unknown[]): boolean {
  return call.ops.some(
    ([name, a]) => name === op && args.every((arg, i) => JSON.stringify(a[i]) === JSON.stringify(arg)),
  );
}

function makeBuilder(table: string) {
  const call: RecordedCall = { table, ops: [] };
  calls.push(call);
  const builder: Record<string, unknown> = {};
  const proxy: unknown = new Proxy(builder, {
    get(_target, prop) {
      if (prop === "then") {
        return (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
          Promise.resolve()
            .then(() => responder(call))
            .then((res) => ({ data: null, error: null, count: null, ...res }))
            .then(onFulfilled, onRejected);
      }
      return (...args: unknown[]) => {
        call.ops.push([String(prop), args]);
        return proxy;
      };
    },
  });
  return proxy;
}

export const storageRemove = vi.fn();
/** `supabase.functions.invoke(nome, { body })` — edge functions chamadas pelo painel. */
export const functionsInvoke = vi.fn();

export const fakeSupabase = {
  from: vi.fn((table: string) => makeBuilder(table)),
  auth: {
    getSession: vi.fn(async () => ({ data: { session }, error: null })),
  },
  storage: {
    from: vi.fn(() => ({ remove: storageRemove })),
  },
  functions: {
    invoke: (name: string, opts?: { body?: unknown }) => functionsInvoke(name, opts),
  },
};
