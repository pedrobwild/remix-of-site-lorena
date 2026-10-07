/**
 * Provas numéricas têm uma fonte só (src/content/provas.ts) e o guia não pode
 * contradizer os artigos. Quebrou aqui? Use as constantes de provas.ts em vez
 * de escrever o número à mão.
 *
 * Histórico: em 06/10/2026 o site passou a dizer "+188 reformas entregues",
 * mas 188 é o número de CONTRATOS da base de custo, não de obras entregues; e
 * o guia mostrava 80% de ocupação na Vila Mariana enquanto o post da Bewild
 * (GuestFavorites) mostra 60%.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { BAIRROS } from "@/guia/data/bairros";
import { BAIRROS_CONTENT } from "@/content/bairros";

const SRC = join(__dirname, "..");

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return nome === "__tests__" ? [] : arquivos(caminho);
    return /\.(ts|tsx)$/.test(nome) ? [caminho] : [];
  });
}

const FONTES = arquivos(SRC).filter((f) => !f.endsWith(join("content", "provas.ts")));

describe("provas numéricas", () => {
  it("nenhum arquivo escreve à mão quantas reformas foram entregues", () => {
    const proibido = /\+?\d{2,4}\s*(<\/strong>|<\/b>)?\s*(<span>)?\s*(reformas|obras)\s+entregues/i;
    const achados = FONTES.filter((f) => proibido.test(readFileSync(f, "utf8"))).map((f) => relative(SRC, f));
    expect(achados).toEqual([]);
  });

  it("188 só aparece como contratos, nunca como entregas", () => {
    const achados = FONTES.filter((f) => /188\s+(reformas|obras)|\+188\b/i.test(readFileSync(f, "utf8"))).map((f) =>
      relative(SRC, f),
    );
    expect(achados).toEqual([]);
  });

  it("o guia não mostra nota, studios ou tempo de mercado sem fonte", () => {
    const guia = arquivos(join(SRC, "guia")).map((f) => readFileSync(f, "utf8")).join("\n");
    expect(guia).not.toMatch(/4,9 nota|\+200 studios|\+5 anos no mercado/);
  });
});

describe("ocupação do guia × artigos", () => {
  const comFonte = BAIRROS.filter((b) => b.mercado.ocupacaoFonte === "guestfavorites-2026");

  it("os bairros do levantamento GuestFavorites estão marcados", () => {
    expect(comFonte.map((b) => b.id).sort()).toEqual(
      ["bela-vista", "campo-belo", "consolacao", "itaim-bibi", "jardim-paulista", "moema", "pinheiros", "vila-mariana"],
    );
  });

  it.each(comFonte.filter((b) => BAIRROS_CONTENT[b.id]).map((b) => [b.nome, b] as const))(
    "%s: a ocupação do guia é a mesma da página /reforma do bairro",
    (_nome, b) => {
      const c = BAIRROS_CONTENT[b.id];
      const texto = [...c.intro, ...c.faq.map((f) => f.a)].join(" ");
      expect(texto).toContain(`${b.mercado.ocupacao}%`);
    },
  );
});
