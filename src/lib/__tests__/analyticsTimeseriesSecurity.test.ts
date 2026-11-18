// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  path.resolve(__dirname, "../../../drizzle/migrations/0019_analytics_timeseries_consulta_fixa.sql"),
  "utf8",
).toLowerCase().replace(/\s+/g, " ");

describe("segurança da série de visitas", () => {
  it("consulta fixa sem comandos construídos com entrada do usuário", () => {
    expect(sql).toContain("return query select date_trunc(p_grain, s.started_at)");
    expect(sql).not.toMatch(/\bexecute\b(?!(?: on function))/);
    expect(sql).not.toContain("format(");
    expect(sql).toContain("where s.started_at >= p_since and s.started_at < p_until");
  });

  it("verifica administrador antes de ler e nega acesso público", () => {
    const guard = sql.indexOf("if not public.is_admin() then");
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(sql.indexOf("return query"));
    expect(sql).toContain("raise exception 'forbidden'");
    expect(sql).toContain("from public, anon;");
    expect(sql).toContain("to authenticated, service_role;");
    expect(sql).toContain("set search_path to 'public'");
  });

  it("mantém períodos permitidos e agregados originais", () => {
    expect(sql).toContain("p_grain not in ('hour','day','week','month')");
    expect(sql).toContain("raise exception 'invalid grain'");
    expect(sql).toContain("count(*)::bigint as sessions");
    expect(sql).toContain("sum(s.pageviews)::bigint as pageviews");
    expect(sql).toContain("sum(s.conversions)::bigint as conversions");
  });
});