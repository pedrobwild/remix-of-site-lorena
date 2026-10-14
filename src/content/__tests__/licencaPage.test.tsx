/**
 * /licenca-cc-by-4-0 — página de licença dos dados do Índice Bewild.
 * O resumo dos termos tem de vir do deed oficial do Creative Commons; se
 * alguém resumir por conta própria ou sumir o link do texto legal, o uso
 * citável da licença fica comprometido (a página existe para reportagens e
 * estudos citarem a Bewild).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));
vi.mock("@/lib/useSeo", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/useSeo")>(), useSeo: () => {} }));

import LicencaPage from "@/pages/LicencaPage";
import { COMO_CITAR } from "@/content/indiceCusto";
import {
  LICENCA_CANONICAL,
  LICENCA_CC_DEED_PTBR,
  LICENCA_CC_LEGALCODE,
  LICENCA_CC_URL,
} from "@/content/pages/licenca";

const html = renderToStaticMarkup(createElement(LicencaPage));
const doc = new DOMParser().parseFromString(html, "text/html");

describe("página da licença CC BY 4.0", () => {
  it("publica o resumo oficial do deed (termos de direito e obrigação)", () => {
    for (const termo of ["Compartilhar", "Adaptar", "Atribuição", "Sem restrições adicionais"]) {
      expect(doc.documentElement.textContent, `termo ausente: ${termo}`).toContain(termo);
    }
    // Aviso oficial do CC: o deed não é a licença e não tem valor legal.
    expect(doc.documentElement.textContent).toContain("não é a licença e não tem valor legal");
  });

  it("aponta para o texto oficial do Creative Commons (canônico, legal code e deed pt-BR)", () => {
    for (const url of [LICENCA_CC_URL, LICENCA_CC_LEGALCODE, LICENCA_CC_DEED_PTBR]) {
      expect(doc.querySelector(`a[href="${url}"]`), `link ausente: ${url}`).not.toBeNull();
    }
  });

  it("usa o mesmo COMO_CITAR do Índice e volta para a página dos dados", () => {
    expect(doc.documentElement.textContent).toContain(COMO_CITAR);
    expect(doc.querySelector('a[href="/indice-de-custo-de-reforma"]')).not.toBeNull();
    expect(doc.querySelector('a[href="/dados/indice-custo-reforma-bewild-2026-10.csv"]')).not.toBeNull();
  });

  it("não estende a licença ao resto do site (textos, fotos, projetos e marca)", () => {
    expect(doc.documentElement.textContent).toContain("O restante deste site não está sob a licença");
  });

  it("existe o arquivo da rota e a rota responde pelo caminho canônico", () => {
    const root = path.resolve(__dirname, "../../..");
    expect(readFileSync(path.join(root, "src/routes/licenca-cc-by-4-0.tsx"), "utf8")).toContain('createFileRoute("/licenca-cc-by-4-0")');
  });
});
