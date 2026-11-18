// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Domínio antigo bwild.com.br (18/11/2026): o DNS aponta para a Vercel e todo
 * caminho tem de sair com 301 para bewild.com.br. Os caminhos do mapa de
 * 17/09 têm destino próprio; o resto cai na regra geral, que mantém o caminho.
 * Sem a regra geral, o site inteiro abria com 200 no domínio antigo
 * (conteúdo duplicado). A Vercel aplica a primeira regra que casa, então a
 * regra geral fica por último.
 */
type Redirect = {
  source: string;
  has?: { type: string; value: string }[];
  destination: string;
  statusCode?: number;
  permanent?: boolean;
};

const HOST_ANTIGO = "^(www\\.)?bwild\\.com\\.br$";

const redirects: Redirect[] = JSON.parse(
  readFileSync(resolve(__dirname, "../../../vercel.json"), "utf8"),
).redirects;

const doDominioAntigo = redirects.filter((r) =>
  r.has?.some((h) => h.type === "host" && h.value === HOST_ANTIGO),
);

describe("redirecionamento do bwild.com.br", () => {
  it("toda regra do domínio antigo é 301 para https://bewild.com.br", () => {
    expect(doDominioAntigo.length).toBeGreaterThan(1);
    for (const r of doDominioAntigo) {
      expect(r.statusCode, r.source).toBe(301);
      expect(r.destination.startsWith("https://bewild.com.br/"), r.source).toBe(true);
    }
  });

  it("a última regra do domínio antigo é a geral, mantendo o caminho", () => {
    const ultima = doDominioAntigo[doDominioAntigo.length - 1];
    expect(ultima.source).toBe("/:path*");
    expect(ultima.destination).toBe("https://bewild.com.br/:path*");
    expect(doDominioAntigo.filter((r) => r.source === "/:path*")).toHaveLength(1);
    // Nenhuma regra específica do domínio antigo depois da geral.
    expect(redirects.indexOf(ultima)).toBeGreaterThan(
      Math.max(...doDominioAntigo.slice(0, -1).map((r) => redirects.indexOf(r))),
    );
  });

  it("páginas antigas com equivalente vão para a página equivalente", () => {
    const destino = (source: string) => doDominioAntigo.find((r) => r.source === source)?.destination;
    expect(destino("/servicos-reforma-studio-apartamento")).toBe("https://bewild.com.br/servicos");
    expect(destino("/post/reforma-de-studio-para-short-stay-sao-paulo")).toBe(
      "https://bewild.com.br/reforma-de-studio-sao-paulo",
    );
  });
});
