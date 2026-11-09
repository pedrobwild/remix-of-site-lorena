/**
 * 09/10/2026: a política de privacidade deixou de citar os recursos de IA
 * desligados ("Pergunte à Bewild" na /faq e a página de escopo), e as imagens
 * do blog passaram a usar só a base de custo de 188 contratos
 * (CONTRATOS_ANALISADOS em src/content/provas.ts).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CONTRATOS_ANALISADOS } from "@/content/provas";

const root = path.resolve(__dirname, "../../..");

function svgs(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const p = path.join(dir, nome);
    if (statSync(p).isDirectory()) return svgs(p);
    return nome.endsWith(".svg") ? [p] : [];
  });
}

describe("política de privacidade", () => {
  const page = readFileSync(path.join(root, "src/pages/PrivacidadePage.tsx"), "utf8");

  it("não descreve recursos de IA que não existem mais", () => {
    expect(page).not.toMatch(/Pergunte à Bewild/);
    expect(page).not.toMatch(/página de escopo/);
    expect(page).not.toMatch(/recursos de inteligência\s+artificial/);
  });

  it("descreve o tratamento de dados do Radar Bewild (09/11/2026)", () => {
    // O consentimento do pedido de material no Radar diz "cancelar pelo canal
    // indicado na política de privacidade"; esta seção fecha o laço.
    const texto = page.replace(/\s+/g, " ");
    expect(texto).toMatch(/<h2>Radar Bewild \(radarbewild\.com\.br\)<\/h2>/);
    expect(texto).toMatch(/Pedido de material/);
    expect(texto).toMatch(/Conta e simulações guardadas/);
    expect(texto).toMatch(/Medição de uso/);
    expect(texto).toMatch(/cancelar o recebimento de comunicações[^.]*escreva para/);
  });
});

describe("imagens do blog", () => {
  it(`usam a base de ${CONTRATOS_ANALISADOS} contratos, não versões paralelas`, () => {
    expect(CONTRATOS_ANALISADOS).toBe(188);
    for (const f of svgs(path.join(root, "public/images/blog"))) {
      const svg = readFileSync(f, "utf8");
      expect(svg, path.relative(root, f)).not.toMatch(/\b204 contratos\b/);
      expect(svg, path.relative(root, f)).not.toMatch(/R\$ 72\.584|R\$ 2\.758/);
    }
  });
});
