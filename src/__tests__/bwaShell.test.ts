/**
 * bwa-shell.css é derivado de home-bwa.css (scripts/bwaShell.ts): as páginas
 * internas carregam só a parte de home-bwa.css que usam. Aqui: o arquivo
 * commitado é o gerado; o cabeçalho/rodapé/botões estão nele; as seções que só
 * a home tem, não; e nenhuma página interna referencia home-bwa.css.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildBwaShell, buildHomeSplit, classesOf, homeTokens, isShellRule, HOME_CRITICAL_PATH, HOME_DEFERRED_PATH, SHELL_PATH } from "../../scripts/bwaShell";
import { HOME_FOLD_MARKER, withDeferredStylesheet } from "../pages/home-bwa-body";
import { HOME_DEFERRED_ASYNC_MEDIA, HOME_DEFERRED_BLOCKING_MEDIA } from "../content/homeHero";

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

  it("ninguém carrega home-bwa.css inteiro: a rota '/' usa home-critical.css e o corpo da home, home-deferred.css", () => {
    const files: string[] = [];
    (function walk(dir: string) {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { if (!/node_modules|__tests__/.test(e.name)) walk(p); }
        else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) files.push(p);
      }
    })(path.join(ROOT, "src"));
    const importers = (re: RegExp) => files.filter((f) => re.test(readFileSync(f, "utf8"))).map((f) => path.relative(ROOT, f)).sort();
    expect(importers(/home-bwa\.css\?url/)).toEqual([]);
    expect(importers(/home-critical\.css\?url/)).toEqual(["src/routes/index.tsx"]);
    expect(importers(/home-deferred\.css\?url/)).toEqual(["src/pages/home-bwa-body.ts", "src/routes/index.tsx"]);
  });
});

describe("home-critical.css + home-deferred.css (dobra da home)", () => {
  const critical = readFileSync(path.join(ROOT, HOME_CRITICAL_PATH), "utf8");
  const deferred = readFileSync(path.join(ROOT, HOME_DEFERRED_PATH), "utf8");

  it("os arquivos commitados são exatamente os gerados a partir de home-bwa.css", () => {
    const built = buildHomeSplit(ROOT);
    expect(critical).toBe(built.critical);
    expect(deferred).toBe(built.deferred);
  });

  it("o crítico tem tokens, cabeçalho, menu mobile e hero, e é pequeno; não tem o índice de serviços nem o FAQ", () => {
    for (const sel of [":root", ".bwa-nav", ".bwa-mobile-menu", ".bwa-hero-title", ".bwa-hero-facts", ".bwa-mobile-cta"]) {
      expect(critical, sel).toMatch(new RegExp(sel.replace(/[.[\]]/g, "\\$&") + "[\\s,{.:>\\[]"));
    }
    for (const sel of [".bwa-services-index", ".bwa-services-trigger", ".bwa-faq-item", ".bwa-final-grid"]) {
      expect(critical, sel).not.toMatch(new RegExp(sel.replace(/[.[\]]/g, "\\$&") + "[\\s,{.:>\\[]"));
    }
    const home = readFileSync(path.join(ROOT, "src/pages/home-bwa.css"), "utf8");
    expect(critical.length).toBeLessThan(home.length * 0.3);
  });

  it("o adiado repete as regras críticas que alcançam as seções de baixo (.bwa-title, .bwa-lead, body), na ordem original", () => {
    // Sem isso a cascata mudava: .bwa-services-title ficava com peso 500 em vez de 600
    // e .bwa-lead herdava a cor do hero (regressão de estilos computados, 25/10/2026).
    for (const sel of [".bwa-title", ".bwa-lead", ".bwa-button", ".bwa-services-index"]) {
      expect(deferred, sel).toMatch(new RegExp(sel.replace(/[.[\]]/g, "\\$&") + "[\\s,{.:>\\[]"));
    }
    expect(deferred).not.toMatch(/\.bwa-hero-facts-inner[\s,{.:>[]/);
  });

  it("a marca da dobra existe no HTML e o <link> do adiado entra logo antes dela", () => {
    const body = readFileSync(path.join(ROOT, "src/pages/home-bwa-body.ts"), "utf8");
    const { fold, below } = homeTokens(body);
    expect(fold.has("bwa-hero")).toBe(true);
    expect(fold.has("bwa-mobile-cta")).toBe(true);
    expect(fold.has("bwa-faq-item")).toBe(false);
    expect(below.has("bwa-faq-item")).toBe(true);
    const html = `<header class="bwa-nav"></header><section class="bwa-hero"></section>\n\n    ${HOME_FOLD_MARKER} id="para-quem"></section>`;
    const out = withDeferredStylesheet(html, "/assets/home-deferred-abc.css");
    expect(out.indexOf('<link rel="stylesheet"')).toBeGreaterThan(out.indexOf("</section>"));
    expect(out.lastIndexOf('<link rel="stylesheet"')).toBeLessThan(out.indexOf(HOME_FOLD_MARKER));
    expect(withDeferredStylesheet(html, "")).toBe(html);
  });

  it("o CSS adiado só bloqueia no desktop; no celular entra sem bloquear (media=print + onload) e há <noscript>", () => {
    const html = `<section class="bwa-hero"></section>\n\n    ${HOME_FOLD_MARKER} id="para-quem"></section>`;
    const out = withDeferredStylesheet(html, "/assets/home-deferred-abc.css");
    const links = out.match(/<link [^>]*>/g) ?? [];
    expect(links).toEqual([
      `<link rel="stylesheet" href="/assets/home-deferred-abc.css" media="${HOME_DEFERRED_BLOCKING_MEDIA}">`,
      `<link rel="stylesheet" href="/assets/home-deferred-abc.css" media="print" data-bwa-deferred onload="this.media='${HOME_DEFERRED_ASYNC_MEDIA}'">`,
      `<link rel="stylesheet" href="/assets/home-deferred-abc.css">`,
    ]);
    // O terceiro só vale sem JavaScript.
    expect(out).toContain(`<noscript><link rel="stylesheet" href="/assets/home-deferred-abc.css"></noscript>`);
    // Nenhum <link> comum (sem media) fora do <noscript>: ele bloquearia a renderização no celular.
    expect(out.replace(/<noscript>.*?<\/noscript>/g, "")).not.toMatch(/<link rel="stylesheet" href="[^"]*">/);
    // O hero ocupa a primeira tela abaixo desse limite (medido de 360×640 a 768×1024).
    expect(HOME_DEFERRED_BLOCKING_MEDIA).toBe("(min-width: 901px)");
    // Depois do onload, as duas cópias nunca valem na mesma largura (regras aplicadas uma vez só).
    expect(HOME_DEFERRED_ASYNC_MEDIA).toBe(`not all and ${HOME_DEFERRED_BLOCKING_MEDIA}`);
  });
});
