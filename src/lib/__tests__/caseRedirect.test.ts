import { describe, expect, it } from "vitest";
import { canonicalHostRedirect, canonicalPathname, lowercasePathRedirect } from "../caseRedirect";

const req = (path: string, method = "GET") => new Request(`https://bewild.com.br${path}`, { method });

describe("lowercasePathRedirect", () => {
  it("redireciona /Servicos para /servicos com 301", () => {
    const res = lowercasePathRedirect(req("/Servicos"))!;
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://bewild.com.br/servicos");
  });
  it("tira a barra do fim com 301 e preserva a query string", () => {
    const res = lowercasePathRedirect(req("/servicos/?utm=x"))!;
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://bewild.com.br/servicos?utm=x");
    expect(lowercasePathRedirect(req("/Portfolio/Rm/"))!.headers.get("location")).toBe(
      "https://bewild.com.br/portfolio/rm",
    );
  });
  it("ignora caminhos já canônicos, inclusive a raiz", () => {
    expect(lowercasePathRedirect(req("/servicos"))).toBeNull();
    expect(lowercasePathRedirect(req("/"))).toBeNull();
    expect(canonicalPathname("/")).toBeNull();
  });
  it("ignora ids públicos, admin, api e arquivos", () => {
    expect(lowercasePathRedirect(req("/o/AbC123"))).toBeNull();
    expect(lowercasePathRedirect(req("/admin/Leads"))).toBeNull();
    expect(lowercasePathRedirect(req("/admin/leads/"))).toBeNull();
    expect(lowercasePathRedirect(req("/api/Foo"))).toBeNull();
    expect(lowercasePathRedirect(req("/images/Foto.JPG"))).toBeNull();
    expect(lowercasePathRedirect(req("/sitemap.xml"))).toBeNull();
  });
  it("ignora métodos que não são GET/HEAD", () => {
    expect(lowercasePathRedirect(req("/Servicos", "POST"))).toBeNull();
  });
  // Auditoria de SEO, rodada 4 (09/11/2026): /SITEMAP.XML e /Sitemap.xml
  // respondiam 200 com o mesmo conteúdo de /sitemap.xml, e o Search Console
  // tinha a grafia em maiúsculas enviada como um segundo sitemap, com erro.
  it("redireciona /SITEMAP.XML e /Sitemap.xml para /sitemap.xml com 301", () => {
    for (const path of ["/SITEMAP.XML", "/Sitemap.xml", "/sitemap.XML"]) {
      const res = lowercasePathRedirect(req(path))!;
      expect(res.status).toBe(301);
      expect(res.headers.get("location")).toBe("https://bewild.com.br/sitemap.xml");
    }
  });
  it("redireciona /LLMS.TXT para /llms.txt com 301 e preserva a query string", () => {
    const res = lowercasePathRedirect(req("/LLMS.TXT?v=2"))!;
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://bewild.com.br/llms.txt?v=2");
  });
  it("não mexe nas grafias canônicas das rotas de servidor nem em outros arquivos", () => {
    expect(lowercasePathRedirect(req("/sitemap.xml"))).toBeNull();
    expect(lowercasePathRedirect(req("/llms.txt"))).toBeNull();
    expect(lowercasePathRedirect(req("/.well-known/llms.txt"))).toBeNull();
    // Só a raiz: o mesmo nome dentro de uma pasta é um arquivo qualquer.
    expect(lowercasePathRedirect(req("/images/SITEMAP.XML"))).toBeNull();
    expect(lowercasePathRedirect(req("/Sitemap-bwild-antigo.xml"))).toBeNull();
  });
});

describe("canonicalHostRedirect", () => {
  it("manda www para o domínio sem www com 301, mantendo caminho e query", () => {
    const res = canonicalHostRedirect(new Request("https://www.bewild.com.br/servicos?utm=x"))!;
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://bewild.com.br/servicos?utm=x");
  });
  it("não mexe no domínio canônico nem na prévia", () => {
    expect(canonicalHostRedirect(new Request("https://bewild.com.br/"))).toBeNull();
    const lov = canonicalHostRedirect(new Request("https://bewild.lovable.app/portfolio?x=1"))!;
    expect(lov.status).toBe(301);
    expect(lov.headers.get("location")).toBe("https://bewild.com.br/portfolio?x=1");
    expect(canonicalHostRedirect(new Request("https://id-preview--x.lovable.app/servicos"))).toBeNull();
  });
  it("não redireciona em bewild.lovable.app o que a Vercel repassa para lá (evita laço)", () => {
    for (const path of [
      "/api/public/crm-stage-sync",
      "/_serverFn/abc",
      "/lovable/email/transactional/preview",
      "/__l5e/assets-v1/x/logo.png",
    ]) {
      expect(canonicalHostRedirect(new Request(`https://bewild.lovable.app${path}`))).toBeNull();
    }
    // páginas continuam indo para o domínio próprio
    expect(canonicalHostRedirect(new Request("https://bewild.lovable.app/servicos"))!.status).toBe(301);
    // no www o 301 vale para tudo
    expect(canonicalHostRedirect(new Request("https://www.bewild.com.br/api/public/x"))!.status).toBe(301);
  });
});
