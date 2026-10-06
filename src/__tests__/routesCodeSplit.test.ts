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
