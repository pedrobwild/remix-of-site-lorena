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
