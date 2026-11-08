import { describe, expect, it } from "vitest";
import { resolveProperty, isFresh, SNAPSHOT_TTL, STUDIO_QUERY, snapshotRequest, safeEqual, rollingSnapshotRequest } from "@/lib/searchConsoleSnapshot";
describe("Snapshots Search Console", () => {
  it("agenda os 30 dias do painel com comparação igual, usando o dia de São Paulo antes da meia-noite", () => {
    expect(rollingSnapshotRequest(30, new Date("2026-11-08T02:59:00Z"))).toEqual({ start_date: "2026-10-09", end_date: "2026-11-07", prev_start_date: "2026-09-09", prev_end_date: "2026-10-08" });
    expect(rollingSnapshotRequest(30, new Date("2026-11-08T03:00:00Z"))).toEqual({ start_date: "2026-10-10", end_date: "2026-11-08", prev_start_date: "2026-09-10", prev_end_date: "2026-10-09" });
  });
  it("mantém a busca solicitada exata", () => expect(STUDIO_QUERY).toBe("reforma de studios"));
  it("requer escolha quando domínio e prefixo estão verificados", () => {
    const result = resolveProperty([{ siteUrl: "https://bewild.com.br/" }, { siteUrl: "sc-domain:bewild.com.br" }], "https://bewild.com.br/");
    expect(result.siteUrl).toBeNull();
    expect(result.candidates).toHaveLength(2);
  });
  it("não aceita propriedade sem verificação", () => {
    expect(() => resolveProperty([{ siteUrl: "https://bewild.com.br/", permissionLevel: "siteUnverifiedUser" }], "https://bewild.com.br/", "https://bewild.com.br/")).toThrow();
  });
  it("atualização diária expira depois de 24 horas", () => {
    const time = Date.parse("2026-11-03T07:00:00Z");
    expect(isFresh(new Date(time).toISOString(), time + SNAPSHOT_TTL - 1)).toBe(true);
    expect(isFresh(new Date(time).toISOString(), time + SNAPSHOT_TTL)).toBe(false);
    expect(isFresh(null, time)).toBe(false);
  });
  it("rejeita datas inexistentes", () => {
    expect(snapshotRequest.safeParse({ start_date: "2026-02-30", end_date: "2026-03-01", prev_start_date: "2026-01-01", prev_end_date: "2026-01-28" }).success).toBe(false);
  });
  it("callback exige segredo correspondente", () => {
    expect(safeEqual("private-server-secret", "publishable-key")).toBe(false);
    expect(safeEqual("private-server-secret", "private-server-secret")).toBe(true);
  });
});