/**
 * Título e descrição de /orcamento, /faq, /contato e /politica-de-cookies:
 * cabem no resultado do Google (título até 60, descrição até 160 caracteres) e
 * o HTML do servidor diz o mesmo que o navegador depois de hidratar.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PAGE_SEO_DEFAULTS } from "@/lib/pageSeo";

const root = path.resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const paginas = [
  { rota: "/orcamento", pagina: "src/pages/OrcamentoPage.tsx", titulo: PAGE_SEO_DEFAULTS["/orcamento"].title, descricao: PAGE_SEO_DEFAULTS["/orcamento"].description },
  { rota: "/contato", pagina: "src/pages/ContatoPage.tsx", titulo: PAGE_SEO_DEFAULTS["/contato"].title, descricao: PAGE_SEO_DEFAULTS["/contato"].description },
  {
    rota: "/faq",
    pagina: "src/pages/FaqPage.tsx",
    titulo: /title: "([^"]+)"/.exec(read("src/routes/faq.tsx"))![1],
    descricao: /description: "([^"]+)"/.exec(read("src/routes/faq.tsx"))![1],
  },
  {
    rota: "/politica-de-cookies",
    pagina: "src/pages/PoliticaCookiesPage.tsx",
    titulo: /title: "([^"]+)"/.exec(read("src/routes/politica-de-cookies.tsx"))![1],
    descricao: /description: "([^"]+)"/.exec(read("src/routes/politica-de-cookies.tsx"))![1],
  },
];

describe.each(paginas)("SEO de $rota", ({ pagina, titulo, descricao }) => {
  it("título até 60 e descrição até 160 caracteres", () => {
    expect(titulo.length).toBeLessThanOrEqual(60);
    expect(descricao.length).toBeGreaterThanOrEqual(110);
    expect(descricao.length).toBeLessThanOrEqual(160);
  });

  it("o texto do navegador (useSeo) é o mesmo do servidor", () => {
    const fonte = read(pagina);
    expect(fonte).toContain(`"${titulo}"`);
    expect(fonte).toContain(`"${descricao}"`);
  });
});
