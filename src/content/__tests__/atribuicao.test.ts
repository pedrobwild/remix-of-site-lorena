/**
 * /atribuicao — página para reportagens e estudos citarem a Bewild.
 * O nome e o endereço precisam bater com a fonte única do JSON-LD
 * (src/lib/orgJsonLd.ts); a linha de crédito precisa citar o Índice e a
 * licença CC BY 4.0.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  ATRIBUICAO_EMAIL,
  ATRIBUICAO_ENDERECO,
  ATRIBUICAO_LICENCA_NOME,
  ATRIBUICAO_LICENCA_URL,
  ATRIBUICAO_LINHA,
  ATRIBUICAO_NOME,
} from "@/content/pages/atribuicao";
import { ORG_ADDRESS, ORG_EMAIL, ORG_LEGAL_NAME } from "@/lib/orgJsonLd";

describe("página de atribuição", () => {
  it("nome usa a razão social do JSON-LD", () => {
    expect(ATRIBUICAO_NOME).toContain(ORG_LEGAL_NAME);
  });

  it("endereço é o mesmo endereço oficial da Organization", () => {
    expect(ATRIBUICAO_ENDERECO).toContain(ORG_ADDRESS.streetAddress);
    expect(ATRIBUICAO_ENDERECO).toContain(ORG_ADDRESS.postalCode);
  });

  it("e-mail é o mesmo da Organization", () => {
    expect(ATRIBUICAO_EMAIL).toBe(ORG_EMAIL);
  });

  it("linha de crédito cita o Índice e a licença CC BY 4.0", () => {
    expect(ATRIBUICAO_LINHA).toContain("/indice-de-custo-de-reforma");
    expect(ATRIBUICAO_LINHA).toContain(ATRIBUICAO_LICENCA_NOME);
    expect(ATRIBUICAO_LINHA).toContain(ATRIBUICAO_LICENCA_URL);
  });

  it("rota e página existem e o link da licença aponta para /licenca-cc-by-4-0", () => {
    const route = readFileSync(path.resolve("src/routes/atribuicao.tsx"), "utf8");
    expect(route).toContain('createFileRoute("/atribuicao")');
    const page = readFileSync(path.resolve("src/pages/AtribuicaoPage.tsx"), "utf8");
    expect(page).toContain('href="/licenca-cc-by-4-0"');
  });
});
