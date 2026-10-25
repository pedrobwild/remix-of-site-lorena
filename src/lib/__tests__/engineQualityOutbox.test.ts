import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  classifyEngineResponse,
  drainEngineQualityOutbox,
  engineQualityBody,
  nextAttemptAt,
  OUTBOX_MAX_ATTEMPTS,
} from "@/lib/engineQualityOutbox.server";

vi.mock("@/lib/externalApi.server", () => ({ resolveEngineKey: async () => "chave-teste" }));

const sql = readFileSync("drizzle/migrations/0010_engine_quality_outbox.sql", "utf8");

function fakeDb(rows: Record<string, unknown>[]) {
  const updates: { patch: Record<string, unknown>; id: unknown }[] = [];
  const chain: Record<string, unknown> = {};
  for (const m of ["select", "eq", "lte", "order", "limit"]) chain[m] = () => chain;
  chain.then = (resolve: (v: unknown) => unknown) => resolve({ data: rows, error: null });
  const db = {
    from: () => ({
      ...chain,
      update: (patch: Record<string, unknown>) => {
        const u = { patch, id: null as unknown };
        updates.push(u);
        const c = { eq: (col: string, v: unknown) => { if (col === "id") u.id = v; return c; }, then: (r: (v: unknown) => unknown) => r({ error: null }) };
        return c;
      },
    }),
  };
  return { db, updates };
}

const ev = { id: "11111111-1111-4111-8111-111111111111", lead_id: "22222222-2222-4222-8222-222222222222", decision: "descartado", marked_at: "2026-10-25T16:00:00.000Z", attempts: 0 };
const env = () => null;

describe("fila de marcações do site para o Engine", () => {
  it("só entra marcação com origem no site (a do Engine nunca volta)", () => {
    expect(sql).toContain("NEW.manual_qualification_source IS DISTINCT FROM 'site'");
  });
  it("pendência antiga do mesmo lead é substituída pela mais nova", () => {
    expect(sql).toContain("SET status = 'superseded'");
  });
  it("corpo fixo: mesmo id e horário, sem dados pessoais", () => {
    expect(engineQualityBody(ev as never)).toEqual({ event_id: ev.id, lead_id: ev.lead_id, decision: "descartado", marked_at: ev.marked_at });
  });
  it("classifica as respostas do Engine", () => {
    expect(classifyEngineResponse(200, { status: "sent", outcome: "disqualified_in_engine" })).toEqual({ kind: "done", status: "sent", outcome: "disqualified_in_engine" });
    expect(classifyEngineResponse(200, { status: "skipped", outcome: "engine_newer" }).kind).toBe("done");
    expect(classifyEngineResponse(503, { status: "failed", outcome: "no_engine_client" }).kind).toBe("retry");
    expect(classifyEngineResponse(409, { error: "event_payload_conflict" }).kind).toBe("fail");
    expect(classifyEngineResponse(401, {}).kind).toBe("stop");
  });
  it("espera cresce e para em 6 horas", () => {
    const now = new Date("2026-10-25T00:00:00Z");
    expect(nextAttemptAt(1, now)).toBe("2026-10-25T00:02:00.000Z");
    expect(nextAttemptAt(20, now)).toBe("2026-10-25T06:00:00.000Z");
  });
  it("entrega com sucesso marca como enviado", async () => {
    const { db, updates } = fakeDb([ev]);
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ accepted: true, status: "sent", outcome: "disqualified_in_engine" }), { status: 200 }));
    const r = await drainEngineQualityOutbox(db, env, { fetchImpl: fetchImpl as never });
    expect(r.enviados).toBe(1);
    expect(updates[0].patch).toMatchObject({ status: "sent", outcome: "disqualified_in_engine", attempts: 1 });
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)["x-integration-key"]).toBe("chave-teste");
  });
  it("falha temporária fica pendente; depois do limite, vira falha", async () => {
    const down = vi.fn(async () => new Response("{}", { status: 503 }));
    const a = fakeDb([ev]);
    expect((await drainEngineQualityOutbox(a.db, env, { fetchImpl: down as never })).reenvio).toBe(1);
    expect(a.updates[0].patch.status).toBeUndefined();
    const b = fakeDb([{ ...ev, attempts: OUTBOX_MAX_ATTEMPTS - 1 }]);
    expect((await drainEngineQualityOutbox(b.db, env, { fetchImpl: down as never })).falhas).toBe(1);
    expect(b.updates[0].patch.status).toBe("failed");
  });
});
