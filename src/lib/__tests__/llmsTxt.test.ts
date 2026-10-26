import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { rewriteWellKnownLlms } from "../../server";

/**
 * /llms.txt sai da rota de servidor (src/routes/llms[.]txt.ts) a partir do
 * modelo src/content/llms.txt, com as listas preenchidas pelo banco; o
 * retrato em src/content/snapshots/llms.txt é a fixture dos testes.
 * /.well-known/llms.txt é a cópia que alguns robôs de IA procuram: é a mesma
 * resposta, por reescrita do caminho em src/server.ts.
 */
describe("llms.txt", () => {
  const MARCADORES = ["<!-- posts:start -->", "<!-- posts:end -->", "<!-- bairros:start -->", "<!-- bairros:end -->", "<!-- videos:start -->", "<!-- videos:end -->"];

  it("o modelo mantém os marcadores que o servidor preenche, vazios", () => {
    const modelo = readFileSync(resolve("src/content/llms.txt"), "utf8");
    for (const marker of MARCADORES) expect(modelo).toContain(marker);
    for (const [a, b] of [["posts", "posts"], ["bairros", "bairros"], ["videos", "videos"]]) {
      const entre = modelo.slice(modelo.indexOf(`<!-- ${a}:start -->`) + `<!-- ${a}:start -->`.length, modelo.indexOf(`<!-- ${b}:end -->`));
      expect(entre.trim(), `seção ${a} do modelo deve ficar vazia (o servidor preenche)`).toBe("");
    }
  });

  it("o retrato é o modelo com as três listas preenchidas", () => {
    const modelo = readFileSync(resolve("src/content/llms.txt"), "utf8");
    const retrato = readFileSync(resolve("src/content/snapshots/llms.txt"), "utf8");
    for (const marker of MARCADORES) expect(retrato).toContain(marker);
    // Fora dos marcadores, modelo e retrato são o mesmo texto.
    const semListas = (t: string) =>
      t.replace(/(<!-- (posts|bairros|videos):start -->)[\s\S]*?(<!-- \2:end -->)/g, "$1$3");
    expect(semListas(retrato)).toBe(semListas(modelo));
    expect(retrato).toMatch(/<!-- posts:start -->\n- \[[^\]]+\]\(\/conteudos\//);
  });

  it("/.well-known/llms.txt é reescrito para /llms.txt sem redirecionar", () => {
    const r = rewriteWellKnownLlms(new Request("https://bewild.com.br/.well-known/llms.txt", { headers: { accept: "text/plain" } }));
    expect(new URL(r.url).pathname).toBe("/llms.txt");
    expect(r.headers.get("accept")).toBe("text/plain");
    const outro = new Request("https://bewild.com.br/llms.txt");
    expect(rewriteWellKnownLlms(outro)).toBe(outro);
  });
});
