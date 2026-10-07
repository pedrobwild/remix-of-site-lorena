/**
 * Import só de efeito colateral some do build de produção (07/10/2026).
 *
 * O package.json tem `"sideEffects": false`. Com isso, no `vite build`, um
 * `import "./modulo"` de arquivo nosso (.ts/.tsx) que não usa nada do módulo
 * é descartado: o código de topo dele nunca roda no site publicado. No `vite
 * dev` (preview do Lovable) não há tree-shaking e tudo parece funcionar.
 *
 * Foi o que quebrou o mapa do /guia-do-investidor: `import
 * "@/guia/lib/maplibreWorker"` chamava `setWorkerUrl` e sumia no build, então
 * o MapLibre procurava `assets/maplibre-gl-worker.mjs` (404) e a tela mostrava
 * "O mapa não carregou". Hoje a URL é exportada e passada ao mapa pela prop
 * `workerUrl`.
 *
 * Regra: import local só de efeito colateral é proibido, exceto folha de estilo
 * (o Vite sempre mantém CSS) ou quando o mesmo arquivo também importa algo do
 * mesmo módulo (aí o módulo entra no build e o código de topo dele roda — caso
 * de `src/server.ts` com `./lib/error-capture`). O efeito tem de sair de uma
 * função ou valor importado e usado. Pacotes do node_modules seguem o
 * `sideEffects` do próprio pacote e ficam fora desta checagem.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "..");

const BARE_IMPORT = /^\s*import\s+["']([^"']+)["'];?/gm;
const STYLESHEET = /\.(css|scss|sass|less)(\?[^"']*)?$/;
const isLocal = (spec: string) => spec.startsWith(".") || spec.startsWith("@/");
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/** Imports locais só de efeito colateral que o build de produção descartaria. */
function droppedSideEffectImports(source: string): string[] {
  return Array.from(source.matchAll(BARE_IMPORT))
    .map(([, spec]) => spec)
    .filter((spec) => isLocal(spec) && !STYLESHEET.test(spec))
    .filter((spec) => {
      // O mesmo módulo também importado com nomes (não só tipos) entra no build.
      const comNomes = new RegExp(`^\\s*import\\s+(?!type\\s)[^;"']+?\\s+from\\s+["']${escapeRegExp(spec)}["']`, "m");
      return !comNomes.test(source);
    });
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "__tests__" || name === "test" ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) && !/\.(test|spec)\.(ts|tsx)$/.test(name) && !name.endsWith(".d.ts") ? [full] : [];
  });
}

describe('imports só de efeito colateral (package.json "sideEffects": false)', () => {
  const files = sourceFiles(SRC);

  it("encontra os arquivos do site", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("nenhum arquivo depende de import local só de efeito colateral", () => {
    const problemas = files.flatMap((file) =>
      droppedSideEffectImports(readFileSync(file, "utf8")).map((spec) => `${path.relative(SRC, file)}: import "${spec}"`),
    );
    expect(problemas).toEqual([]);
  });

  it("a checagem pega o caso do mapa e libera CSS, pacotes e módulo também importado com nomes", () => {
    expect(droppedSideEffectImports('import "@/guia/lib/maplibreWorker";')).toEqual(["@/guia/lib/maplibreWorker"]);
    expect(droppedSideEffectImports("import './polyfill'\nimport { x } from './outro';")).toEqual(["./polyfill"]);
    expect(droppedSideEffectImports('import "./guia-investidor.css";')).toEqual([]);
    expect(droppedSideEffectImports('import "maplibre-gl/dist/maplibre-gl.css";')).toEqual([]);
    expect(droppedSideEffectImports('import "@testing-library/jest-dom";')).toEqual([]);
    expect(droppedSideEffectImports('import "./lib/error-capture";\nimport { consumeLastCapturedError } from "./lib/error-capture";')).toEqual([]);
    // Importar só tipos não segura o módulo no build.
    expect(droppedSideEffectImports('import "./efeito";\nimport type { T } from "./efeito";')).toEqual(["./efeito"]);
    expect(droppedSideEffectImports('const m = await import("./dinamico");')).toEqual([]);
  });
});
