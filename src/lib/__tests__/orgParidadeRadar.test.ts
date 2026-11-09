/**
 * Organization idêntica nos dois domínios (09/11/2026).
 *
 * O Radar (radarbewild.com.br, repositório shortstay-guide) publica em toda
 * página o MESMO nó Organization deste site (@id https://bewild.com.br/#org),
 * campo a campo, sameAs incluído — uma só Bewild para o Google. O que viaja
 * entre os dois repositórios é `src/content/orgBewild.json` (lá:
 * `src/data/orgBewild.json`), cópia fiel de ORG_NODE.
 *
 * Mudou a Organization (perfil novo no sameAs, nome, CNPJ, fundador…)?
 *   1. atualize `orgJsonLd.ts`, o arquivo `orgBewild.json` e IMPRESSAO_OFICIAL aqui;
 *   2. leve o MESMO arquivo e o MESMO valor para o Radar
 *      (`src/data/orgBewild.json` e `src/lib/__tests__/orgParidade.test.ts`);
 *   3. depois de publicar, rode `npm run conferir-org` no Radar (compara as
 *      páginas no ar dos dois domínios).
 */
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import orgBewild from "@/content/orgBewild.json";
import { ORG_JSONLD, ORG_NODE, ORG_SAME_AS } from "@/lib/orgJsonLd";

/** O mesmo valor travado no Radar (shortstay-guide, src/lib/__tests__/orgParidade.test.ts). */
const IMPRESSAO_OFICIAL = "cf1213cd207f7449c9a06797a23c4f0a525d296aa4837e9b8609e45d233c1568";

/** Chaves em ordem alfabética; a ordem das listas é mantida (ela conta). Igual ao scripts/lib/orgParidade.mjs do Radar. */
const ordenar = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(ordenar)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, ordenar((v as Record<string, unknown>)[k])]))
      : v;
const impressaoDigital = (no: unknown) => createHash("sha256").update(JSON.stringify(ordenar(no))).digest("hex");

describe("Organization do site = arquivo compartilhado com o Radar", () => {
  it("orgBewild.json é o ORG_NODE publicado no HTML do servidor, campo a campo", () => {
    expect(JSON.parse(JSON.stringify(ORG_NODE))).toEqual(orgBewild);
    const graph = JSON.parse(ORG_JSONLD)["@graph"] as Array<Record<string, unknown>>;
    expect(graph[0]).toEqual(orgBewild);
  });

  it("o sameAs do arquivo é o ORG_SAME_AS, na mesma ordem", () => {
    expect(orgBewild.sameAs).toEqual(ORG_SAME_AS);
  });

  it("a impressão digital é a mesma travada no Radar", () => {
    expect(impressaoDigital(orgBewild)).toBe(IMPRESSAO_OFICIAL);
    expect(impressaoDigital(JSON.parse(JSON.stringify(ORG_NODE)))).toBe(IMPRESSAO_OFICIAL);
  });
});
