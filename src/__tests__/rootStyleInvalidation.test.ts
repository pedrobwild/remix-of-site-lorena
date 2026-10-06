/**
 * MOB-03 (06/10/2026) — nada pode obrigar o navegador a recalcular o estilo do
 * `<html>` enquanto a página está em uso.
 *
 * No Chrome, recalcular o estilo do `<html>` recalcula o DOCUMENTO INTEIRO
 * sempre que as folhas usam `rem` junto de `em`/`ch` (qualquer site real).
 * Medido na home, em celular intermediário simulado: ~80 ms a cada vez.
 * O site caía nisso de três formas:
 *
 *  1. `html:has(.bwa-tour3d-dialog[open])` no CSS — com `:has()` ancorado na
 *     raiz, o `<html>` é reavaliado a cada nó inserido ou texto trocado em
 *     qualquer ponto da página (menu, acordeão, digitação, carrossel…);
 *  2. classes postas/tiradas do `<html>` pelo JavaScript (`bwa-home-root`,
 *     `bwas-on`, `bwa-typing`);
 *  3. `:has()` no `<body>` das LPs (`body:has(.bw-lp)`), cuja folha continua
 *     carregada depois que o visitante segue para o resto do site.
 *
 * O estado que o CSS precisa ler na raiz vai em ATRIBUTO `data-*` (um atributo
 * só invalida os elementos que o seletor cita) — ver `data-bwas`,
 * `data-bwa-typing`, `data-bwa-tour3d-open` e `data-bw-lp`.
 *
 * As checagens leem o código como texto. Não entendem CSS aninhado (`&:has()`)
 * nem todo jeito de chegar ao `<html>` pelo JavaScript: pegam as formas que já
 * apareceram no site e as vizinhas mais prováveis.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "node_modules" || name === "__tests__") continue;
      walk(full, out);
    } else out.push(full);
  }
  return out;
}

const rel = (file: string) => path.relative(SRC, file).split(path.sep).join("/");
const files = walk(SRC);
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Todo prelúdio de regra (seletor ou condição de @-regra), inclusive dentro de @media/@layer. */
function preludes(css: string): string[] {
  return Array.from(stripComments(css).matchAll(/([^{};]+)\{/g), (m) => m[1].trim());
}

/* ----------------------------- leitura de seletores ----------------------------- */

/** Corta `text` nos separadores, só fora de parênteses, colchetes e aspas. */
function splitTopLevel(text: string, isSeparator: (ch: string) => boolean): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = "";
  let current = "";
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = "";
      current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
    } else if (ch === "(" || ch === "[") {
      depth += 1;
      current += ch;
    } else if (ch === ")" || ch === "]") {
      depth -= 1;
      current += ch;
    } else if (depth === 0 && isSeparator(ch)) {
      parts.push(current);
      current = "";
    } else current += ch;
  }
  parts.push(current);
  return parts;
}

/** Lista de seletores → seletores complexos (`a b, c > d` → [`a b`, `c > d`]). */
const complexSelectors = (prelude: string) =>
  splitTopLevel(prelude, (ch) => ch === ",").map((s) => s.trim()).filter(Boolean);

/** Seletor complexo → compostos (`a.b > c:hover` → [`a.b`, `c:hover`]). */
const compounds = (complex: string) =>
  splitTopLevel(complex, (ch) => /[\s>+~]/.test(ch)).map((s) => s.trim()).filter(Boolean);

/** Tira os grupos `:nome(...)` indicados, com tudo o que estiver dentro. */
function dropFunctionalPseudo(compound: string, names: string): string {
  const open = new RegExp(`:(?:${names})\\(`, "i");
  let out = compound;
  for (let m = open.exec(out); m; m = open.exec(out)) {
    let depth = 0;
    let end = m.index + m[0].length - 1;
    for (; end < out.length; end++) {
      if (out[end] === "(") depth += 1;
      else if (out[end] === ")" && --depth === 0) break;
    }
    out = out.slice(0, m.index) + out.slice(end + 1);
  }
  return out;
}

/** `html`, `body` ou `:root` como alvo do composto (inclusive dentro de `:is()`/`:where()`). */
const NAMES_ROOT = /(^|[(,\s])(html|body)(?![\w-])|:root(?![\w-])/i;
/** Classe, id, atributo ou nome de elemento: o composto não vale para "qualquer elemento". */
const NARROWS = /[.#[]|(^|[(,\s])[a-z][\w-]*/i;

/**
 * O composto pode ser o `<html>`/`<body>`? `:not(...)` não restringe a esses
 * dois, então sai antes da análise (`html:not(.a, .b)` continua sendo `html`).
 */
function mayMatchRoot(compound: string, leftmost: boolean): boolean {
  const core = dropFunctionalPseudo(compound, "not");
  if (NAMES_ROOT.test(core)) return true;
  // Sem nada que restrinja (`*`, `:has()` solto, `:hover`…): vale para qualquer
  // elemento — inclusive a raiz, se não houver um ancestral exigido antes.
  return leftmost && !NARROWS.test(core.replace(/^\*/, ""));
}

/** Algum `:has()` do seletor complexo está pendurado no `<html>`/`<body>`? */
function hasRootAnchoredHas(complex: string): boolean {
  const parts = compounds(complex);
  return parts.some((compound, index) => {
    const at = compound.search(/:has\(/i);
    return at >= 0 && mayMatchRoot(compound.slice(0, at), index === 0);
  });
}

describe("CSS: nenhum :has() ancorado no <html>/<body>", () => {
  const sheets = files.filter((f) => f.endsWith(".css"));

  it("nenhuma folha de src/ usa :has() que alcance o <html> ou o <body>", () => {
    expect(sheets.length).toBeGreaterThan(20);
    const hits = sheets.flatMap((file) =>
      preludes(readFileSync(file, "utf8"))
        .filter((prelude) => !prelude.startsWith("@"))
        .flatMap(complexSelectors)
        .filter(hasRootAnchoredHas)
        .map((selector) => `${rel(file)}: ${selector.slice(0, 120)}`),
    );
    expect(hits).toEqual([]);
  });

  it("a checagem pega os casos que já existiram no site e os vizinhos", () => {
    const flagged = (prelude: string) => complexSelectors(prelude).some(hasRootAnchoredHas);
    expect(flagged("html:has(.bwa-tour3d-dialog[open])")).toBe(true);
    expect(flagged("html:has(.bw-lp),body:has(.bw-lp)")).toBe(true);
    expect(flagged(".ok, body:has(.bw-lp)")).toBe(true);
    expect(flagged(":root:has(dialog[open])")).toBe(true);
    expect(flagged("body.x:has(.y)")).toBe(true);
    expect(flagged("HTML:has(.y)")).toBe(true);
    expect(flagged("html:not(.a, .b):has(.y)")).toBe(true);
    expect(flagged(":is(html, body):has(.y)")).toBe(true);
    // Sem alvo, o :has() vale para qualquer elemento — a raiz incluída.
    expect(flagged(":has(.y)")).toBe(true);
    expect(flagged("*:has(.y)")).toBe(true);
    expect(flagged(":not(.x):has(.y)")).toBe(true);
    expect(preludes("@media (max-width:900px){html:has(.a){overflow:hidden}}").some(flagged)).toBe(true);
  });

  it("…e deixa passar o :has() em elemento comum", () => {
    const flagged = (prelude: string) => complexSelectors(prelude).some(hasRootAnchoredHas);
    expect(flagged(".bw-admin__section:has(> .bw-admin__table)")).toBe(false);
    expect(flagged("html[data-bw-lp] body")).toBe(false);
    expect(flagged("tbody:has(td)")).toBe(false);
    expect(flagged("html .card:has(img)")).toBe(false);
    expect(flagged(".x:not(body):has(.y)")).toBe(false);
    expect(flagged(":is(.a, .b):has(.y)")).toBe(false);
    // Alvo genérico, mas debaixo de um ancestral: não chega à raiz.
    expect(flagged(".wrap > :has(.y)")).toBe(false);
    expect(flagged('a[href*=":has("]')).toBe(false);
  });
});

/**
 * Seletor de atributo sobre `class` em posição de ancestral com alvo genérico
 * (`[class^="admin-"] *`): o navegador passa a invalidar a subárvore inteira de
 * qualquer elemento que troque de classe. Só pode existir na folha do painel.
 */
const CLASS_ATTRIBUTE = /\[\s*class\s*(?:[~|^$*]?=|\])/i;
const ADMIN_FONT_SCOPE = "styles/admin-font-scope.css";

function hasClassAttrOverUniversal(complex: string): boolean {
  const parts = compounds(complex);
  if (parts.length < 2) return false;
  const subject = dropFunctionalPseudo(parts[parts.length - 1], "not").replace(/^\*/, "");
  if (NARROWS.test(subject)) return false;
  return parts.slice(0, -1).some((ancestor) => CLASS_ATTRIBUTE.test(ancestor));
}

describe("CSS: nada de `[class…] *` fora do painel", () => {
  it("só src/styles/admin-font-scope.css usa seletor de atributo sobre class com alvo genérico", () => {
    const sheets = files.filter((f) => f.endsWith(".css") && rel(f) !== ADMIN_FONT_SCOPE);
    const hits = sheets.flatMap((file) =>
      preludes(readFileSync(file, "utf8"))
        .filter((prelude) => !prelude.startsWith("@"))
        .flatMap(complexSelectors)
        .filter(hasClassAttrOverUniversal)
        .map((selector) => `${rel(file)}: ${selector.slice(0, 120)}`),
    );
    expect(hits).toEqual([]);
  });

  it("a checagem pega a regra que existia em index.css e as vizinhas", () => {
    expect(hasClassAttrOverUniversal('[class^="admin-"] *')).toBe(true);
    expect(hasClassAttrOverUniversal('[class*=" admin-"] *')).toBe(true);
    expect(hasClassAttrOverUniversal('[class^="admin-"] > *')).toBe(true);
    expect(hasClassAttrOverUniversal('[class^="admin-"] *::before')).toBe(true);
    expect(hasClassAttrOverUniversal('[class^="admin-"] *:hover')).toBe(true);
    expect(hasClassAttrOverUniversal('[class^="admin-"] :not(.x)')).toBe(true);
    expect(hasClassAttrOverUniversal("[class] *")).toBe(true);
    // Alvo com classe ou elemento (invalidação dirigida) e atributo no próprio alvo continuam liberados.
    expect(hasClassAttrOverUniversal('[class^="admin-"] .mono')).toBe(false);
    expect(hasClassAttrOverUniversal('[class^="admin-"] svg')).toBe(false);
    expect(hasClassAttrOverUniversal('[class^="admin-"]')).toBe(false);
    expect(hasClassAttrOverUniversal(".admin *")).toBe(false);
    expect(hasClassAttrOverUniversal('[data-state="open"] *')).toBe(false);
  });

  it("a folha do painel entra por ProtectedRoute e pelas duas molduras do admin — e só pelo admin", () => {
    const IMPORT = /import\s+["']@\/styles\/admin-font-scope\.css["']/;
    for (const file of ["components/admin/ProtectedRoute.tsx", "components/admin/AdminLayout.tsx", "components/admin/BewildAdminShell.tsx"]) {
      expect(IMPORT.test(readFileSync(path.join(SRC, file), "utf8")), file).toBe(true);
    }
    // Fora do admin ninguém pode carregá-la (citar num comentário, como o index.css faz, pode).
    const outsideAdmin = files
      .filter((f) => /\.(ts|tsx|css)$/.test(f) && !/(^|\/)admin\//.test(rel(f)) && rel(f) !== ADMIN_FONT_SCOPE)
      .filter((f) => stripComments(readFileSync(f, "utf8")).includes("admin-font-scope.css"));
    expect(outsideAdmin.map(rel)).toEqual([]);
  });
});

/** Escrita em `classList`/`className` a partir de `alvo` (`document.documentElement` ou um apelido dele). */
const classWrite = (target: string) =>
  new RegExp(`${target}\\s*\\.\\s*(?:classList\\s*\\.\\s*(?:add|remove|toggle|replace)\\b|className\\s*\\+?=(?!=))`, "g");
/** `const html = document.documentElement` (ou `doc.documentElement`, `let`, reatribuição…). */
const ROOT_ALIAS = /([A-Za-z_$][\w$]*)\s*(?::[^=;]+)?=\s*[\w$.]*\bdocumentElement\b(?!\s*\.)/g;

function rootClassWrites(source: string): string[] {
  const hits = source.match(classWrite("\\bdocumentElement")) ?? [];
  for (const [, alias] of source.matchAll(ROOT_ALIAS)) {
    hits.push(...(source.match(classWrite(`(?<![\\w$.])${alias.replace(/\$/g, "\\$")}`)) ?? []));
  }
  return hits;
}

describe("JS: o site público não troca classes do <html>", () => {
  it("nenhum arquivo fora do admin escreve em classList/className do <html>", () => {
    const sources = files.filter(
      (f) => /\.(ts|tsx)$/.test(f) && !/\/admin\//.test(f.split(path.sep).join("/")),
    );
    expect(sources.length).toBeGreaterThan(100);
    const hits = sources.flatMap((file) => rootClassWrites(readFileSync(file, "utf8")).map((match) => `${rel(file)}: ${match}`));
    expect(hits).toEqual([]);
  });

  it("a checagem pega as três trocas de classe que existiam (direta e por apelido)", () => {
    expect(rootClassWrites('document.documentElement.classList.add("bwa-home-root");')).toHaveLength(1);
    expect(rootClassWrites("const html = document.documentElement;\nhtml.classList.add(ON_CLASS);\nreturn () => html.classList.remove(ON_CLASS);")).toHaveLength(2);
    expect(rootClassWrites("const html = document.documentElement;\nconst set = (typing: boolean) => html.classList.toggle(TYPING_CLASS, typing);")).toHaveLength(1);
    expect(rootClassWrites('const root: HTMLElement = doc.documentElement;\nroot.className = "x";')).toHaveLength(1);
    expect(rootClassWrites('document.documentElement.className += " x";')).toHaveLength(1);
  });

  it("…e deixa passar leitura de classe, atributos e estilo", () => {
    expect(rootClassWrites('document.documentElement.classList.contains("dark")')).toEqual([]);
    expect(rootClassWrites('if (document.documentElement.className === "x") run();')).toEqual([]);
    expect(rootClassWrites('const html = document.documentElement;\nhtml.toggleAttribute("data-bwa-typing", true);\nhtml.style.setProperty("--x", "1px");')).toEqual([]);
    // Apelido de OUTRA coisa com o mesmo começo não conta.
    expect(rootClassWrites("const total = document.documentElement.scrollHeight;\ntotalEl.classList.add('x');")).toEqual([]);
    expect(rootClassWrites("const html = document.documentElement;\nnotHtml.classList.add('x');\nmenu.html.classList.add('x');")).toEqual([]);
  });
});
