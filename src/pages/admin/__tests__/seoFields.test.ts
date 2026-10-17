import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.resolve(__dirname, "../SeoPage.tsx"), "utf8");
const arrayText = source.split("const SEO_FIELDS = [")[1]?.split("] as const")[0];
const fields = new Set(
  Array.from((arrayText ?? "").matchAll(/["']([^"']+)["']/g), (match) => match[1]),
);
const patchedFields = [
  ...new Set(Array.from(source.matchAll(/\bpatch\(\s*["']([^"']+)["']\s*,/g), (match) => match[1])),
];

describe("Campos editáveis do painel de SEO", () => {
  it("encontra o array SEO_FIELDS e as chamadas patch", () => {
    expect(arrayText, "O array SEO_FIELDS não foi encontrado no código-fonte.").toBeDefined();
    expect(patchedFields.length, "Nenhum campo editável foi encontrado nas chamadas patch.").toBeGreaterThan(0);
  });

  it.each(patchedFields)("inclui %s nos campos enviados ao salvar", (field) => {
    expect(fields.has(field), `O campo "${field}" está faltando no array SEO_FIELDS.`).toBe(true);
  });
});