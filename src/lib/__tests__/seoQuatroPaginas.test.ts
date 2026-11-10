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
  // /faq: título e descrição em constantes de src/content/faqPage.ts (01/11/2026),
  // usadas pela rota (HTML do servidor) e pela página (useSeo) — ver o teste abaixo.
  // (lidas do arquivo: importar faqPage.ts traz o cliente do banco para o teste).
  {
    rota: "/faq",
    pagina: "src/pages/FaqPage.tsx",
    titulo: /FAQ_SEO_TITLE = "([^"]+)"/.exec(read("src/content/faqPage.ts"))?.[1] ?? "",
    descricao: /FAQ_SEO_DESCRIPTION = "([^"]+)"/.exec(read("src/content/faqPage.ts"))?.[1] ?? "",
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
    if (pagina === "src/pages/FaqPage.tsx") {
      // Mesmas constantes na rota e na página.
      for (const arquivo of [fonte, read("src/routes/faq.tsx")]) {
        expect(arquivo).toMatch(/title: FAQ_SEO_TITLE\b/);
        expect(arquivo).toMatch(/description: FAQ_SEO_DESCRIPTION\b/);
      }
      return;
    }
    expect(fonte).toContain(`"${titulo}"`);
    expect(fonte).toContain(`"${descricao}"`);
  });
});

/**
 * /reforma-de-apartamento-sao-paulo (auditoria de SEO, rodada 4, 09/11/2026,
 * ação 9): título com a busca ("empresa de reforma de apartamento") e uma
 * prova que o site já publica, até 60 caracteres; descrição até 155. O texto
 * mora em `reforma-de-apartamento-sao-paulo.seo.ts`, lido pela rota (HTML do
 * servidor) e pela página (useSeo). Lido como texto: o módulo de conteúdo
 * traz o cliente do banco para o teste.
 */
describe("SEO de /reforma-de-apartamento-sao-paulo", () => {
  const seo = read("src/content/pages/reforma-de-apartamento-sao-paulo.seo.ts");
  const titulo = /SEO_TITLE = "([^"]+)"/.exec(seo)?.[1] ?? "";
  const descricao = /SEO_DESCRIPTION =\s*"([^"]+)"/.exec(seo)?.[1] ?? "";

  it("título até 60 caracteres, com reforma de apartamento, São Paulo/SP e a prova dos 5 anos de garantia", () => {
    expect(titulo.length).toBeGreaterThan(0);
    expect(titulo.length).toBeLessThanOrEqual(60);
    expect(titulo.toLowerCase()).toContain("reforma de apartamento");
    expect(titulo).toMatch(/São Paulo|\bSP\b/);
    expect(titulo).toContain("5 anos de garantia");
  });

  it("descrição de 110 a 155 caracteres", () => {
    expect(descricao.length).toBeGreaterThanOrEqual(110);
    expect(descricao.length).toBeLessThanOrEqual(155);
  });

  it("rota, página e conteúdo usam as mesmas constantes", () => {
    const rota = read("src/routes/reforma-de-apartamento-sao-paulo.tsx");
    expect(rota).toContain('from "@/content/pages/reforma-de-apartamento-sao-paulo.seo"');
    expect(rota).toMatch(/title: loaderData\?\.seo\.title \?\? SEO_TITLE\b/);
    expect(rota).toMatch(/description: loaderData\?\.seo\.description \?\? SEO_DESCRIPTION\b/);
    const pagina = read("src/pages/ReformaApartamentoSpPage.tsx");
    expect(pagina).toMatch(/title: SEO_TITLE\b/);
    expect(pagina).toMatch(/description: SEO_DESCRIPTION\b/);
    expect(read("src/content/pages/reforma-de-apartamento-sao-paulo.tsx")).toContain(
      'export { SEO_TITLE, SEO_DESCRIPTION } from "./reforma-de-apartamento-sao-paulo.seo";',
    );
  });
});
