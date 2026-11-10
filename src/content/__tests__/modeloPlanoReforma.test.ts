import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ITENS, MODELO_PLANO_REFORMA_PATH } from "@/content/pages/autorizacao-condominio";

/**
 * Modelo de plano de reforma (roadmap de SEO, rodada 4, PR-18): o arquivo mora em
 * `public/modelos/` e é oferecido em /autorizacao-condominio e no artigo da NBR 16280
 * (corpo no banco). Se alguém renomear ou apagar o arquivo, os dois links quebram.
 */
describe("modelo de plano de reforma", () => {
  const arquivo = join(process.cwd(), "public", MODELO_PLANO_REFORMA_PATH);

  it("existe em public/ e é um .docx (zip com o documento do Word)", () => {
    const bytes = readFileSync(arquivo);
    expect(bytes.subarray(0, 2).toString("latin1")).toBe("PK");
    expect(bytes.includes(Buffer.from("word/document.xml"))).toBe(true);
  });

  it("caminho com extensão, para o interceptador de links deixar o navegador baixar", () => {
    expect(MODELO_PLANO_REFORMA_PATH).toMatch(/^\/modelos\/[a-z0-9-]+\.docx$/);
  });

  it("/autorizacao-condominio oferece o download numa resposta sobre o plano de reforma", () => {
    const item = ITENS.find((i) => i.href === MODELO_PLANO_REFORMA_PATH);
    expect(item?.q).toMatch(/plano de reforma/i);
    expect(item?.linkLabel).toMatch(/modelo de plano de reforma/i);
  });
});
