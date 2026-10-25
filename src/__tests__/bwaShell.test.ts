/**
 * bwa-shell.css é derivado de home-bwa.css (scripts/bwaShell.ts): as páginas
 * internas carregam só a parte de home-bwa.css que usam. Aqui: o arquivo
 * commitado é o gerado; o cabeçalho/rodapé/botões estão nele; as seções que só
 * a home tem, não; e nenhuma página interna referencia home-bwa.css.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildBwaShell, classesOf, isShellRule, SHELL_PATH } from "../../scripts/bwaShell";

const ROOT = path.resolve(__dirname, "../..");
const committed = readFileSync(path.join(ROOT, SHELL_PATH), "utf8");

describe("bwa-shell.css", () => {
  it("o arquivo commitado é exatamente o gerado a partir de home-bwa.css", () => {
    expect(committed).toBe(buildBwaShell(ROOT));
  });

  it("tem cabeçalho, menu mobile, rodapé, botões e tokens; não tem o hero nem o índice de serviços da home", () => {
    for (const sel of [".bwa-nav", ".bwa-mobile-menu", ".bwa-footer", ".bwa-button", ".bwa-shell", ":root"]) {
      expect(committed, sel).toMatch(new RegExp(sel.replace(/[.[\]]/g, "\\$&") + "[\\s,{.:>\\[]"));
    }
    // (seletores agrupados com membros compartilhados ficam inteiros — por isso só classes
    // que nunca dividem regra com o cabeçalho/rodapé)
    for (const sel of [".bwa-hero-caption", ".bwa-hero-facts", ".bwa-services-index", ".bwa-services-trigger"]) {
      expect(committed, sel).not.toMatch(new RegExp(sel.replace(/[.[\]]/g, "\\$&") + "[\\s,{.:>\\[]"));
    }
  });

  it("é bem menor que home-bwa.css", () => {
    const home = readFileSync(path.join(ROOT, "src/pages/home-bwa.css"), "utf8");
    expect(committed.length).toBeLessThan(home.length * 0.45);
  });

  it("a classificação: seletor sem classe e classe usada fora da home vão para o shell; classe só da home, não", () => {
    const outside = new Set(["bwa-nav", "bwa-nav-dd", "bwa-nav-dd-panel", "bwa-button"]);
    expect(isShellRule(":root", outside)).toBe(true);
    expect(isShellRule("html[data-bwas] body", outside)).toBe(true);
    expect(isShellRule(".bwa-nav-dd.bwa-open .bwa-nav-dd-panel", outside)).toBe(true);
    expect(isShellRule(".bwa-hero .bwa-button", outside)).toBe(true);
    expect(isShellRule(".bwa-hero-title", outside)).toBe(false);
    expect(isShellRule(".bwa-services-item.is-active", outside)).toBe(false);
    expect(classesOf(".bwa-faq-item.bwa-open:hover > .bwa-faq-answer").classes).toEqual(["bwa-faq-item", "bwa-faq-answer"]);
  });

  it("fora da rota '/', ninguém carrega home-bwa.css", () => {
    const files: string[] = [];
    (function walk(dir: string) {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { if (!/node_modules|__tests__/.test(e.name)) walk(p); }
        else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) files.push(p);
      }
    })(path.join(ROOT, "src"));
    const importers = files
      .filter((f) => /home-bwa\.css\?url/.test(readFileSync(f, "utf8")))
      .map((f) => path.relative(ROOT, f));
    expect(importers).toEqual(["src/routes/index.tsx"]);
  });
});
