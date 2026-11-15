/**
 * Datas em lote (auditoria de SEO, rodada 4, 09/11/2026, ação 17a).
 *
 * O gatilho `bewild_posts_set_content_updated_at` (migration 20261006150000)
 * carimba `content_updated_at` em QUALQUER mudança de coluna de conteúdo. Em
 * 08/11/2026 às 21:46:55, 8 artigos do cluster de short stay ganharam o mesmo
 * `dateModified` num update em lote. A migration nova recria a função para
 * respeitar a chave de transação `bewild.edicao_cosmetica`: com ela em 'on',
 * o update preserva a data; sem ela, nada muda (edição real pelo painel).
 *
 * Não há Postgres no CI: o teste lê o SQL (mesmo padrão de
 * engineQualityOutbox.test.ts) e a documentação de uso em docs/SEO.md.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");
const MIGRATIONS = path.join(root, "supabase/migrations");
const ARQUIVO = "20261110120000_bewild_posts_edicao_cosmetica.sql";
const ORIGINAL = "20261006150000_bewild_posts_content_updated_at.sql";

const ler = (nome: string) => readFileSync(path.join(MIGRATIONS, nome), "utf8");
/** SQL sem comentários de linha e com espaços normalizados, para comparar trechos. */
const codigo = (sql: string) =>
  sql
    .split("\n")
    .map((l) => l.replace(/--.*$/, ""))
    .join("\n")
    .replace(/\s+/g, " ")
    .toLowerCase();
/** Lista `ignorar` da função (colunas que não contam como conteúdo). */
const ignorar = (sql: string) =>
  /ignorar text\[\] := array\[([^\]]*)\]/i.exec(sql)?.[1].replace(/\s+/g, "");

describe("migration da edição cosmética em lote", () => {
  const sql = ler(ARQUIVO);
  const c = codigo(sql);

  it("é a última migration que recria a função do gatilho (aplicada depois da original)", () => {
    const recriam = readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .filter((f) =>
        /create or replace function public\.bewild_posts_set_content_updated_at/i.test(ler(f))
      )
      .sort();
    expect(recriam).toEqual([ORIGINAL, ARQUIVO]);
    expect(/^\d{14}_[a-z0-9_]+\.sql$/.test(ARQUIVO)).toBe(true);
  });

  it("com a chave em 'on' preserva old.content_updated_at, antes de comparar o conteúdo", () => {
    const chave = c.indexOf("current_setting('bewild.edicao_cosmetica', true)");
    expect(chave).toBeGreaterThan(-1);
    expect(c).toMatch(
      /if coalesce\(current_setting\('bewild\.edicao_cosmetica', true\), ''\) = 'on' then new\.content_updated_at := old\.content_updated_at; return new; end if;/
    );
    // A checagem da chave vem antes do carimbo por diferença de conteúdo.
    expect(chave).toBeLessThan(c.indexOf("is distinct from"));
  });

  it("sem a chave, o comportamento é o da migration original (mesmas colunas ignoradas, carimbo com now())", () => {
    const original = codigo(ler(ORIGINAL));
    expect(ignorar(sql)).toBe(ignorar(ler(ORIGINAL)));
    const ramo = (s: string) =>
      s.slice(
        s.indexOf("if (to_jsonb(new) - ignorar)"),
        s.indexOf("return new; end; $$;") + "return new; end; $$;".length
      );
    expect(ramo(c)).toBe(ramo(original));
    expect(c).toContain("new.content_updated_at := now();");
  });

  it("recria só a função: não mexe no gatilho, não atualiza linhas, não liga/desliga trigger", () => {
    expect(c).not.toMatch(/\b(drop|create) trigger\b/);
    expect(c).not.toMatch(/\bupdate public\./);
    expect(c).not.toMatch(/\b(disable|enable) trigger\b/);
    expect(c).toMatch(
      /create or replace function public\.bewild_posts_set_content_updated_at\(\) returns trigger language plpgsql/
    );
  });

  it("o uso documentado no SQL é com set local, dentro de uma transação", () => {
    expect(sql).toContain("begin;");
    expect(sql).toContain("set local bewild.edicao_cosmetica = 'on';");
    expect(sql).toContain("commit;");
    // Nunca `set` de sessão: valeria para os updates seguintes da conexão.
    expect(sql).not.toMatch(/^\s*--\s*set bewild\.edicao_cosmetica/m);
  });
});

describe("docs/SEO.md explica quando usar a chave", () => {
  const doc = readFileSync(path.join(root, "docs/SEO.md"), "utf8");
  const secao = doc.slice(doc.indexOf("### Edição em lote sem mexer na data"));

  it("tem a seção, o bloco de uso e o nome da migration", () => {
    expect(doc).toContain("### Edição em lote sem mexer na data");
    expect(secao).toContain("set local bewild.edicao_cosmetica = 'on';");
    expect(secao).toContain(ARQUIVO.replace(".sql", ""));
  });

  it("lista quando usar e quando não usar", () => {
    for (const usar of ["links", "CTA", "ortogr"])
      expect(secao).toMatch(new RegExp(`Use[\\s\\S]*${usar}`, "i"));
    for (const naoUsar of ["conteúdo principal", "dados", "FAQ"])
      expect(secao).toMatch(new RegExp(`Não use[\\s\\S]*${naoUsar}`, "i"));
  });
});
