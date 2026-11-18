/**
 * Migration 0018 (auditoria do /admin/analytics, 18/11/2026).
 *
 * Não há Postgres no CI: o teste lê o SQL (mesmo padrão de
 * edicaoCosmeticaMigration.test.ts) e confere o que o painel depende dele:
 *  - `CREATE OR REPLACE VIEW` só aceita as MESMAS colunas na mesma ordem
 *    (senão o banco recusa e as RPCs que leem a view quebrariam);
 *  - contatos incluem o telefone e são canais distintos por sessão;
 *  - o funil novo encadeia cada etapa na anterior (nunca sobe).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");
const NOVA = readFileSync(path.join(root, "drizzle/migrations/0018_analytics_contatos_e_funil.sql"), "utf8");
const ORIGINAL = readFileSync(
  path.join(root, "supabase/migrations/20260420055333_ee1dac81-705f-48ba-97a4-550ccac60ad9.sql"),
  "utf8",
);
const JOURNAL = JSON.parse(readFileSync(path.join(root, "drizzle/migrations/meta/_journal.json"), "utf8")) as {
  entries: { idx: number; tag: string }[];
};

const semComentario = (sql: string) =>
  sql
    .split("\n")
    .map((l) => l.replace(/--.*$/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .toLowerCase();

/** Lista final de colunas da view (SELECT depois do CTE `s`). */
function colunasDaView(sql: string): string[] {
  const c = semComentario(sql);
  const i = c.indexOf("view public.analytics_sessions");
  const fim = c.indexOf(" from s;", i);
  const select = c.slice(c.lastIndexOf(") select ", fim) + ") select ".length, fim);
  return select.split(",").map((col) => {
    const parts = col.trim().split(" ");
    return parts[parts.length - 1].replace(/[()]/g, "");
  });
}

describe("migration 0018 — contatos e funil", () => {
  it("a view mantém as mesmas colunas, na mesma ordem", () => {
    expect(colunasDaView(NOVA)).toEqual(colunasDaView(ORIGINAL));
    expect(semComentario(NOVA)).toContain("with (security_invoker = true)");
  });

  it("contatos: canais distintos por sessão, com telefone e formulário", () => {
    const c = semComentario(NOVA);
    expect(c).toContain("count(distinct event_type) filter (where event_type in ( 'click_contact','click_whatsapp','click_phone','form_submit' ))");
    expect(c).toContain("bool_or(event_type in ('click_contact','click_whatsapp','click_phone','form_submit'))");
  });

  it("funil v2: cada etapa só conta a sessão da etapa anterior, depois dela; só admin", () => {
    const c = semComentario(NOVA);
    expect(c).toContain("from ev join s1 using (session_id)");
    expect(c).toContain("from ev join s2 using (session_id)");
    expect(c).toContain("from ev join s3 using (session_id)");
    expect(c.match(/ev\.created_at >= s[123]\.t/g)).toHaveLength(3);
    expect(c).toContain("if not public.is_admin() then raise exception 'forbidden'");
    expect(c).toContain("revoke all on function public.analytics_funnel_v2(timestamptz, timestamptz) from public, anon");
  });

  it("está registrada no journal do drizzle", () => {
    expect(JOURNAL.entries.find((entry) => entry.idx === 18)).toMatchObject({ idx: 18, tag: "0018_analytics_contatos_e_funil" });
  });
});
