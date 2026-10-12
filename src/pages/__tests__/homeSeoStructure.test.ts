/**
 * Estrutura da home para busca (análise de palavras-chave de 11/10/2026).
 *
 *  - O <h1> é a linha com a palavra-chave ("Reforma completa de studios e
 *    apartamentos · São Paulo"), com a aparência de rótulo de sempre. O slogan
 *    "Seu desejo é uma obra." continua igual na tela, como <p class="bwa-hero-title">:
 *    antes ele era o <h1> e a palavra-chave ficava num <p> pequeno.
 *  - A home linka no texto as páginas de serviço e o pilar de short stay (antes
 *    só o rodapé e o menu levavam a elas).
 *
 * A copy não muda aqui; só a marcação. Texto novo: a linha "Por tipo de
 * imóvel…" e o link "Conhecer a marcenaria sob medida".
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HOME_BWA_HTML } from "../home-bwa-body";

const doc = new DOMParser().parseFromString(`<body>${HOME_BWA_HTML}</body>`, "text/html");
const texto = (el: Element | null) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const css = readFileSync(path.resolve(__dirname, "../home-bwa.css"), "utf8");

describe("home: título principal", () => {
  it("tem um único <h1>, com a palavra-chave e a aparência de rótulo", () => {
    const h1s = doc.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(texto(h1s[0])).toBe("Reforma completa de studios e apartamentos · São Paulo");
    expect(h1s[0].classList.contains("bwa-label")).toBe(true);
    expect(h1s[0].closest(".bwa-hero-copy")).not.toBeNull();
  });

  it("o slogan segue no herói, logo depois do <h1>, sem ser título", () => {
    const slogan = doc.querySelector(".bwa-hero-copy .bwa-hero-title");
    expect(slogan?.tagName).toBe("P");
    expect(texto(slogan)).toBe("Seu desejo é uma obra.");
    expect(doc.querySelector(".bwa-hero-copy h1")?.nextElementSibling).toBe(slogan);
    // O subtítulo continua sendo o primeiro <h2> da página.
    expect(slogan?.nextElementSibling?.tagName).toBe("H2");
  });

  it("o CSS estiliza o slogan pela classe (nenhuma regra presa ao <h1> do herói)", () => {
    expect(css).not.toMatch(/\.bwa-hero\s+h1/);
    expect(css).toMatch(/\.bwa-hero \.bwa-hero-title\s*\{/);
  });
});

describe("home: links internos com a palavra-chave", () => {
  const link = (href: string) =>
    Array.from(doc.querySelectorAll<HTMLAnchorElement>(`main a[href="${href}"]`));

  it("linka as três páginas de serviço no texto", () => {
    expect(link("/reforma-de-studio-sao-paulo").map(texto)).toContain("reforma de studio");
    expect(link("/reforma-de-apartamento-sao-paulo").map(texto)).toContain("reforma de apartamento");
    expect(link("/reforma-de-cobertura-sao-paulo").map(texto)).toContain("reforma de cobertura");
  });

  it("linka o pilar de short stay e a página de marcenaria", () => {
    expect(link("/conteudos/o-que-e-short-stay").map(texto)).toContain("o que é short stay");
    expect(link("/marcenaria").some((a) => /marcenaria sob medida/i.test(texto(a)))).toBe(true);
  });

  it("os links novos são medidos (data-cta) e não levam UTM", () => {
    for (const href of [
      "/reforma-de-studio-sao-paulo",
      "/reforma-de-apartamento-sao-paulo",
      "/reforma-de-cobertura-sao-paulo",
      "/conteudos/o-que-e-short-stay",
      "/marcenaria",
    ]) {
      const links = link(href);
      expect(links.length, href).toBeGreaterThan(0);
      for (const a of links) expect(a.dataset.cta, href).toBeTruthy();
    }
    expect(HOME_BWA_HTML).not.toMatch(/href=\\?"\/[^"]*utm_/);
  });
});
