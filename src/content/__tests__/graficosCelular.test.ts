/**
 * Versão de celular dos gráficos do blog (public/images/blog/<slug>/<nome>-m.svg).
 * scripts/graficos/leitura_celular.py corta a margem lateral interna para o texto
 * não encolher na coluna de 331 px do artigo. O corte é sempre simétrico sobre a
 * base de 420 e a largura declarada acompanha o viewBox: se um dos dois sair do
 * lugar, a imagem aparece esticada ou com um lado cortado.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const BLOG = path.resolve(__dirname, "../../../public/images/blog");
const arquivos = readdirSync(BLOG)
  .filter((d) => statSync(path.join(BLOG, d)).isDirectory())
  .flatMap((d) => readdirSync(path.join(BLOG, d)).filter((f) => f.endsWith("-m.svg")).map((f) => `${d}/${f}`));

describe("gráficos do blog: versão de celular", () => {
  it("há versões de celular para conferir", () => {
    expect(arquivos.length).toBeGreaterThan(100);
  });

  it.each(arquivos)("%s tem largura igual à do viewBox e corte simétrico", (rel) => {
    const raiz = /<svg\b[^>]*>/.exec(readFileSync(path.join(BLOG, rel), "utf8"))?.[0] ?? "";
    const vb = /viewBox=['"]([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)['"]/.exec(raiz);
    const largura = /\swidth=['"](\d+)['"]/.exec(raiz);
    const altura = /\sheight=['"](\d+)['"]/.exec(raiz);
    expect(vb, "viewBox").not.toBeNull();
    const [x, y, w, h] = (vb ?? []).slice(1).map(Number);
    expect(y).toBe(0);
    expect(Number(largura?.[1])).toBe(w);
    expect(2 * x + w).toBe(420);
    // A altura declarada segue a escala de 1:1 do viewBox (os scripts arredondam).
    expect(Math.abs(Number(altura?.[1]) - h)).toBeLessThanOrEqual(1);
  });
});
