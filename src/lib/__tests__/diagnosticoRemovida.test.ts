/**
 * O "diagnóstico" não existe mais (decisão do Pedro, 11/10/2026): a única
 * entrada de lead é o pedido de orçamento. O endereço /diagnostico faz 301
 * para /orcamento e nenhuma página pública oferece ou linka o diagnóstico.
 *
 * O que continua de propósito: os leads antigos gravados com
 * `form_path = "/diagnostico"` (adminLeads, leadDelivery, Meta CAPI), o endereço
 * da tela /admin/diagnostico (que lista os pedidos de orçamento) e a palavra
 * "diagnóstico" no sentido técnico dentro dos artigos (etapa de levantamento
 * do imóvel), que não é uma oferta.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeLegacyPath } from "@/lib/useHashRoute";

const root = path.resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

/** Arquivos .ts/.tsx de uma pasta, sem o painel (admin) e sem os testes. */
function fontes(dir: string): string[] {
  return readdirSync(path.join(root, dir)).flatMap((nome) => {
    const rel = path.join(dir, nome);
    if (statSync(path.join(root, rel)).isDirectory()) {
      return nome === "admin" || nome === "__tests__" ? [] : fontes(rel);
    }
    return /\.(ts|tsx)$/.test(nome) ? [rel] : [];
  });
}

/**
 * Só o texto que chega ao visitante: sai o que é comentário e saem os dois
 * identificadores técnicos que ficaram (a chave de analytics do botão do FAQ e
 * o segmento de URL usado para esconder o assistente na rota antiga).
 */
function textoVisivel(fonte: string): string {
  return fonte
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/faq-diagnostico|"diagnostico"/g, "");
}

describe("/diagnostico removida", () => {
  it("SPA normaliza /diagnostico para /orcamento", () => {
    expect(normalizeLegacyPath("/diagnostico")).toBe("/orcamento");
  });

  it("rota do servidor responde 301 para /orcamento", () => {
    const route = read("src/routes/diagnostico.tsx");
    expect(route).toMatch(/redirect\(\{\s*to:\s*"\/orcamento",\s*statusCode:\s*301\s*\}\)/);
    expect(route).not.toMatch(/component:/);
  });

  it("sitemap, llms.txt e IndexNow não anunciam /diagnostico", () => {
    for (const f of ["src/content/snapshots/sitemap.xml", "src/content/snapshots/llms.txt", "src/content/llms.txt", "scripts/sitemap-build.mjs"]) {
      expect(read(f), f).not.toMatch(/\/diagnostico\b/);
    }
    const ping = read("supabase/functions/ping-sitemap/index.ts");
    expect(ping).not.toMatch(/"\/diagnostico"/);
    expect(ping).toMatch(/"\/orcamento"/);
  });

  it("nenhum link das páginas públicas aponta para /diagnostico", () => {
    for (const f of [
      "src/components/BwaFooter.tsx",
      "src/components/BwaNav.tsx",
      "src/pages/home-bwa-body.ts",
      "src/pages/FaqPage.tsx",
      "src/pages/ReformaStudioSpPage.tsx",
      "src/pages/ReformaApartamentoSpPage.tsx",
      "src/pages/LpPanfletoPage.tsx",
      "src/pages/LpObraPage.tsx",
      "src/lib/postInternalLinks.ts",
      "src/lib/publicPages.ts",
    ]) {
      expect(read(f), f).not.toMatch(/href=\\?"\/diagnostico|["'`]\/diagnostico["'`?#]/);
    }
  });

  it("as páginas dos QR codes (/p e /o) oferecem orçamento, não diagnóstico", () => {
    for (const f of ["src/pages/LpPanfletoPage.tsx", "src/pages/LpObraPage.tsx", "src/routes/p.tsx", "src/routes/o.tsx"]) {
      expect(read(f), f).not.toMatch(/diagn[oó]stic/i);
    }
    expect(read("src/pages/LpPanfletoPage.tsx")).toMatch(/Começa com um <i>orçamento\.<\/i>/);
  });

  it("a folha de estilo da página antiga saiu junto", () => {
    expect(existsSync(path.join(root, "src/styles/bw-diag.css"))).toBe(false);
  });

  it("nenhuma página pública fala em diagnóstico: o convite é sempre o orçamento", () => {
    // Artigos (chamada final), portfólio (WhatsApp), parceiros, indicação, guia
    // do investidor e política de privacidade ainda citavam o diagnóstico.
    const arquivos = ["src/pages", "src/guia", "src/content", "src/components"].flatMap(fontes);
    expect(arquivos.length).toBeGreaterThan(100);
    const achados = arquivos.filter((f) => /diagn[oó]stic[oa]/i.test(textoVisivel(read(f))));
    expect(achados).toEqual([]);
  });

  it("a chamada final dos artigos usa o rótulo de orçamento do resto do site", () => {
    const post = read("src/pages/BewildPostPage.tsx");
    const rotulo = "Orçamento · sem custo, sem compromisso";
    expect(post).toContain(`eyebrow: "${rotulo}"`);
    for (const f of ["src/pages/BewildConteudosPage.tsx", "src/pages/BewildPortfolioPage.tsx", "src/pages/BewildProjectPage.tsx"]) {
      expect(read(f), f).toContain(rotulo);
    }
    expect(post).toMatch(/const ctaHref = "\/orcamento";/);
  });

  it("o painel acompanha /orcamento como página-chave, não a página antiga", () => {
    const painel = read("src/pages/admin/BewildOverviewPage.tsx");
    expect(painel).toMatch(/const TARGET_PATHS = \["\/", "\/orcamento", "\/portfolio", "\/conteudos"\];/);
  });
});
