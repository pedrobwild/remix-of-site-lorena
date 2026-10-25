/**
 * bwa-shell.css — a parte de src/pages/home-bwa.css que as páginas INTERNAS usam.
 *
 * home-bwa.css (≈160 KB brutos, 109 KB minificados, ~20 KB gzip) é a folha do
 * sistema `.bwa` inteiro: cabeçalho, rodapé, botões, tokens… e também as seções
 * exclusivas da home (hero, serviços, processo, bastidores, tour 3D, FAQ da
 * home). Até 25/10/2026 toda página interna (/orcamento, /reforma-de-studio-
 * sao-paulo, posts…) baixava o arquivo inteiro como CSS que bloqueia a
 * renderização, para usar só o cabeçalho, o rodapé e as seções reaproveitadas.
 *
 * Este módulo deriva, a cada build (plugin em vite.config.ts) e nos testes, um
 * `src/pages/bwa-shell.css` só com as regras que alguma página interna pode
 * usar. A regra para ficar no shell é mecânica e conservadora:
 *   - seletor sem classe (`:root`, `body`, `html[data-bwas]`) → shell;
 *   - alguma classe do seletor aparece em QUALQUER arquivo de src/ fora da
 *     lista HOME_FILES (componentes BwaNav/BwaFooter, servicos-bwa-sections,
 *     páginas internas…) → shell;
 *   - senão (todas as classes só existem nos arquivos da home, ou em lugar
 *     nenhum) → fica só em home-bwa.css.
 * Classes de estado (is-*, has-*, bwa-open…) não contam.
 *
 * A ordem relativa das regras é a do arquivo original, então a cascata nas
 * páginas internas é idêntica à de antes (as regras que saíram nunca casavam
 * lá). A home continua carregando home-bwa.css inteiro, sem mudança nenhuma.
 *
 * Fonte da verdade: home-bwa.css. Nunca edite bwa-shell.css à mão — o build
 * sobrescreve; o teste src/__tests__/bwaShell.test.ts confere que o arquivo
 * commitado é o gerado.
 */
import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

/** Arquivos que só a home usa: classe que só aparece neles não vai para o shell. */
export const HOME_FILES = [
  "src/pages/home-bwa-body.ts",
  "src/pages/home-bwa-script.ts",
  "src/pages/HomePage.tsx",
  "src/pages/homeFaq.ts",
  "src/lib/homeBastidores.ts",
  "src/lib/homeCatalog.ts",
  "src/lib/homeInstagram.ts",
  "src/lib/homeTour3d.ts",
  "src/lib/hydrateHomeProjects.ts",
  "src/routes/index.tsx",
  "src/content/homeHero.ts",
];

const STATE_CLASS = /^(is|has)-|^bwa-(open|active|visible|ready|done|loading|loaded)$|^(open|active|visible|ready|hidden)$/;
const SOURCE_FILE = /\.(ts|tsx|html)$/;
const SKIP_DIR = /^(node_modules|__tests__|\.git)$/;

export const SHELL_PATH = "src/pages/bwa-shell.css";
export const HOME_CSS_PATH = "src/pages/home-bwa.css";

function listSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIR.test(entry.name)) listSourceFiles(full, out);
    } else if (SOURCE_FILE.test(entry.name) && !/\.test\.|\.spec\./.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Palavras (classes candidatas) presentes em arquivos de src/ fora da home. */
export function tokensOutsideHome(repoRoot: string): Set<string> {
  const home = new Set(HOME_FILES.map((f) => path.resolve(repoRoot, f)));
  const tokens = new Set<string>();
  for (const file of listSourceFiles(path.join(repoRoot, "src"))) {
    if (home.has(path.resolve(file))) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/[A-Za-z_][\w-]*/g)) tokens.add(match[0]);
  }
  return tokens;
}

export function classesOf(selector: string): { classes: string[]; bare: boolean } {
  const classes = new Set<string>();
  let bare = false;
  for (const part of selector.split(",")) {
    const seg = part.replace(/\([^)]*\)/g, "()");
    for (const m of seg.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) classes.add(m[1]);
    const compounds = seg.trim().split(/\s*[>+~\s]\s*/).filter(Boolean);
    if (compounds.length && compounds.every((c) => !/[.#[]/.test(c))) bare = true;
  }
  return { classes: [...classes].filter((c) => !STATE_CLASS.test(c)), bare };
}

export function isShellRule(selector: string, outside: Set<string>): boolean {
  const { classes, bare } = classesOf(selector);
  if (bare || classes.length === 0) return true;
  return classes.some((c) => outside.has(c));
}

const HEADER = `/* GERADO por scripts/bwaShell.ts a partir de src/pages/home-bwa.css — NÃO EDITE.
 * Só as regras de home-bwa.css que alguma página interna usa (cabeçalho,
 * rodapé, botões, tokens e seções reaproveitadas), na mesma ordem. As páginas
 * internas carregam este arquivo no lugar de home-bwa.css; a home continua
 * com home-bwa.css inteiro. Edite home-bwa.css e rode o build (ou os testes). */
`;

/** Gera o conteúdo de bwa-shell.css a partir de home-bwa.css. */
export function buildBwaShell(repoRoot: string, homeCss = fs.readFileSync(path.join(repoRoot, HOME_CSS_PATH), "utf8")): string {
  const outside = tokensOutsideHome(repoRoot);
  const root = postcss.parse(homeCss);
  const keepKeyframes = new Set<string>();

  function prune(container: postcss.Container): void {
    for (const node of [...(container.nodes ?? [])]) {
      if (node.type === "comment") {
        node.remove();
      } else if (node.type === "rule") {
        if (isShellRule(node.selector, outside)) {
          node.walkDecls((d) => {
            if (/^animation(-name)?$/.test(d.prop)) for (const n of d.value.split(/[\s,]+/)) keepKeyframes.add(n);
          });
        } else node.remove();
      } else if (node.type === "atrule") {
        if (/keyframes$/.test(node.name) || node.name === "font-face" || node.name === "import" || node.name === "charset") continue;
        if (node.nodes) {
          prune(node);
          if (!node.nodes.length) node.remove();
        }
      }
    }
  }
  prune(root);
  root.walkAtRules(/keyframes$/, (kf) => {
    if (!keepKeyframes.has(kf.params.trim())) kf.remove();
  });
  const css = root.toString().replace(/\n{3,}/g, "\n\n").trim();
  return `${HEADER}\n${css}\n`;
}

/** Escreve src/pages/bwa-shell.css se mudou. Retorna true quando escreveu. */
export function writeBwaShell(repoRoot: string): boolean {
  const target = path.join(repoRoot, SHELL_PATH);
  const next = buildBwaShell(repoRoot);
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  if (current === next) return false;
  fs.writeFileSync(target, next);
  return true;
}

/** Plugin do Vite: regenera o shell no início de cada build/dev e quando home-bwa.css muda. */
export function bwaShellPlugin(repoRoot: string) {
  const homeCss = path.join(repoRoot, HOME_CSS_PATH);
  return {
    name: "bewild-bwa-shell",
    enforce: "pre" as const,
    buildStart() {
      writeBwaShell(repoRoot);
    },
    configureServer(server: { watcher: { on: (ev: string, fn: (file: string) => void) => void } }) {
      server.watcher.on("change", (file: string) => {
        if (path.resolve(file) === homeCss) writeBwaShell(repoRoot);
      });
    },
  };
}
