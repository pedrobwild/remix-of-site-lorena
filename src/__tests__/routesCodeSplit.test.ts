/**
 * MOB-02 (06/10/2026) — as páginas precisam sair do pacote inicial.
 *
 * O TanStack Start só separa o componente da rota num arquivo próprio quando o
 * módulo da página é usado APENAS em `component`. Um import nomeado
 * (`import Pagina, { PAGINA_JSONLD } from "@/pages/Pagina"`) prende a página
 * inteira — componente, CSS e dependências — no pacote que toda rota baixa:
 * até 06/10 eram 9 páginas (~120 kB) + zod (80 kB) + 5 folhas de estilo a mais
 * na home. A rodada de SEO de 06/10 (PR #41) tirou as 9: o que o `head()`
 * precisa da página (JSON-LD, FAQ) mora em `src/content/pages/*` e a rota
 * importa a página só pelo `default` (ver src/routes/servicos.tsx). Este teste
 * segura essa regra para as rotas novas.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROUTES_DIR = path.resolve(__dirname, "../routes");

/** Imports estáticos de módulos de página: `@/pages/...` ou `../pages/...`. */
const PAGE_IMPORT = /^import\s+(type\s+)?([^;"']*?)\s+from\s+["'](?:@\/|(?:\.\.\/)+)pages\/[^"']+["']/gm;
/** Só o `default` (`import Pagina from …`): é o que o roteador consegue separar. */
const DEFAULT_ONLY = /^[A-Za-z_$][\w$]*$/;

/** Imports de página que prendem o módulo no pacote inicial (tudo que não é só-default nem `import type`). */
function pinnedPageImports(source: string): string[] {
  return Array.from(source.matchAll(PAGE_IMPORT))
    .filter(([, typeOnly, clause]) => !typeOnly && !DEFAULT_ONLY.test(clause.trim()))
    .map(([statement]) => statement.replace(/\s+/g, " "));
}

describe("rotas: páginas ficam fora do pacote inicial", () => {
  const files = readdirSync(ROUTES_DIR).filter((f) => f.endsWith(".tsx"));

  it("encontra os arquivos de rota", () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it.each(files)("%s só importa páginas pelo default", (file) => {
    const source = readFileSync(path.join(ROUTES_DIR, file), "utf8");
    expect(pinnedPageImports(source)).toEqual([]);
  });

  it("a checagem pega import nomeado, misto e de namespace — com @/ ou caminho relativo", () => {
    expect(pinnedPageImports('import Pagina, { PAGINA_JSONLD } from "@/pages/Pagina";')).toHaveLength(1);
    expect(pinnedPageImports('import { PAGINA_JSONLD } from "@/pages/Pagina";')).toHaveLength(1);
    expect(pinnedPageImports('import Pagina, * as tudo from "@/pages/Pagina";')).toHaveLength(1);
    expect(pinnedPageImports('import * as tudo from "../pages/Pagina";')).toHaveLength(1);
    expect(pinnedPageImports('import Pagina, {\n  PAGINA_JSONLD,\n} from "../pages/Pagina";')).toHaveLength(1);
    // Liberados: só o default, tipos, import dinâmico e o que não é página.
    expect(pinnedPageImports('import Pagina from "@/pages/Pagina";')).toEqual([]);
    expect(pinnedPageImports('import homeBwaCssUrl from "../pages/home-bwa.css?url";')).toEqual([]);
    expect(pinnedPageImports('import type { Props } from "@/pages/Pagina";')).toEqual([]);
    expect(pinnedPageImports('const Pagina = lazy(() => import("@/pages/Pagina"));')).toEqual([]);
    expect(pinnedPageImports('import { PAGINA_JSONLD } from "@/content/pages/pagina";')).toEqual([]);
  });
});

/**
 * Rodada 2 de velocidade (25/10/2026): head() e loader de toda rota entram no
 * pacote inicial de qualquer página. Os carregadores de conteúdo e os
 * montadores de JSON-LD só podem chegar por import dinâmico no loader.
 */
describe("montadores pesados fora do pacote inicial", () => {
  const PESADOS = /^import\s+(?!type\s)[^;]*from\s+["']@\/lib\/(contentLoaders|contentJsonLd|routeHeadData)["']/m;
  const arquivos = readdirSync(ROUTES_DIR).filter((f) => f.endsWith(".tsx") && !f.startsWith("admin"));
  it.each(arquivos)("%s não importa contentLoaders/contentJsonLd/routeHeadData de forma estática", (f) => {
    expect(readFileSync(path.join(ROUTES_DIR, f), "utf8")).not.toMatch(PESADOS);
  });
});

/**
 * Rodada 3 de velocidade (09/11/2026): o mesmo vale para o CONTEÚDO das
 * páginas (FAQ, JSON-LD, textos por bairro, cadastro de vídeos) e para o
 * cliente do Supabase. Medido no build: ~100 kB brutos de conteúdo de outras
 * páginas e o SDK inteiro (~55 kB gzip) iam no pacote inicial de qualquer
 * rota só por serem referenciados no head()/loader. O head() lê esses dados
 * do `loaderData`, e o loader os traz com `import("…")`. Metadados pequenos
 * (título/descrição) podem ficar num módulo `.seo.ts` próprio.
 */
describe("conteúdo das páginas e cliente do Supabase fora do pacote inicial", () => {
  const PESADOS = new RegExp(
    "^import\\s+(?!type\\s)[^;]*from\\s+[\"'](" +
      [
        "@/content/bairros",
        "@/content/faqPage",
        "@/content/incorporadoras",
        "@/content/indiceCusto",
        "@/content/lealMoreira",
        "@/content/pages/(?!atribuicao|licenca|privacidade)[^\"'.]+(\\.tsx?)?",
        "@/lib/videoPages",
        "@/lib/seoLoaders",
        "@/lib/lealMoreiraLoader",
        "@/guia/data/guiaMeta",
        "@/integrations/supabase/client",
      ].join("|") +
      ")[\"']",
    "m",
  );
  const arquivos = readdirSync(ROUTES_DIR).filter((f) => f.endsWith(".tsx") && !f.startsWith("admin"));
  it.each(arquivos)("%s não importa conteúdo pesado nem o cliente do Supabase de forma estática", (f) => {
    expect(readFileSync(path.join(ROUTES_DIR, f), "utf8")).not.toMatch(PESADOS);
  });

  it("a checagem pega o import estático e libera o dinâmico e os módulos .seo", () => {
    expect('import { bairroContent } from "@/content/bairros";').toMatch(PESADOS);
    expect('import { STUDIO_SP_JSONLD } from "@/content/pages/reforma-de-studio-sao-paulo";').toMatch(PESADOS);
    expect('import { supabase } from "@/integrations/supabase/client";').toMatch(PESADOS);
    expect('const content = () => import("@/content/pages/reforma-de-studio-sao-paulo");').not.toMatch(PESADOS);
    expect('import { LP_TITLE } from "@/content/pages/lp-reforma-de-studio-sao-paulo.seo";').not.toMatch(PESADOS);
    expect('import { LEAL_SEO } from "@/content/lealMoreira.seo";').not.toMatch(PESADOS);
    expect('import { PRIVACIDADE_SEO } from "@/content/pages/privacidade";').not.toMatch(PESADOS);
    expect('import type { KbItem } from "@/content/faqPage";').not.toMatch(PESADOS);
  });
});
