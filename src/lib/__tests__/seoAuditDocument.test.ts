import { describe, expect, it } from "vitest";
import { normalizeAuditPath, runSeoAudit } from "@/lib/seoAudit";

const settings = {
  google_site_verification: "abc",
  google_analytics_id: "G-1",
  google_tag_manager_id: null,
};

function publicDoc(): Document {
  const doc = document.implementation.createHTMLDocument("");
  doc.documentElement.setAttribute("lang", "pt-BR");
  doc.head.innerHTML = `
    <title>Reforma de apartamento em São Paulo com preço fechado | Bewild</title>
    <meta name="viewport" content="width=device-width">
    <meta name="description" content="${"Reforma de apartamento em São Paulo do projeto à entrega, com preço fechado, prazo em contrato e acompanhamento da obra.".padEnd(130, ".")}">
    <link rel="canonical" href="https://bewild.com.br/">
    <meta property="og:image" content="https://bewild.com.br/og.jpg">
    <script type="application/ld+json">{"@type":"Organization"}</script>`;
  doc.body.innerHTML = `<div id="root"><h1>Reforma</h1><h2>Como funciona</h2><img src="a.jpg" alt="Sala"></div>`;
  return doc;
}

describe("runSeoAudit(doc)", () => {
  it("audita o documento recebido, não a tela atual do painel", () => {
    // A "tela do painel" (document global) não tem nada disso.
    document.title = "Bewild | Painel Admin · SEO";
    document.head.innerHTML = `<meta name="robots" content="noindex, nofollow">`;
    document.body.innerHTML = "";

    const result = runSeoAudit(settings, publicDoc());
    const ids = result.issues.map((i) => i.id);
    expect(ids).not.toContain("robots-noindex");
    expect(ids).not.toContain("h1-missing");
    expect(ids).toContain("jsonld-ok");
    expect(result.stats.hasCanonical).toBe(true);
    expect(result.stats.h1Count).toBe(1);
    expect(result.stats.imagesWithoutAlt).toBe(0);

    // E a tela do painel, se auditada, teria nota bem pior.
    const painel = runSeoAudit(settings, document);
    expect(painel.issues.map((i) => i.id)).toContain("robots-noindex");
    expect(painel.score).toBeLessThan(result.score);
  });
});

describe("normalizeAuditPath", () => {
  it("aceita caminhos do site e URLs da mesma origem", () => {
    expect(normalizeAuditPath("")).toBe("/");
    expect(normalizeAuditPath("portfolio")).toBe("/portfolio");
    expect(normalizeAuditPath("/conteudos/x?y=1")).toBe("/conteudos/x?y=1");
    expect(normalizeAuditPath(`${window.location.origin}/faq`)).toBe("/faq");
  });

  it("recusa /admin, outros sites e caminhos estranhos", () => {
    expect(normalizeAuditPath("/admin/seo")).toBeNull();
    expect(normalizeAuditPath("/admin")).toBeNull();
    expect(normalizeAuditPath("https://evil.com/x")).toBeNull();
    expect(normalizeAuditPath("//evil.com")).toBeNull();
    expect(normalizeAuditPath("/a b")).toBeNull();
  });
});
