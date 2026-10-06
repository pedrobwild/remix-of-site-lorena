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
});

describe("canonicalHostRedirect", () => {
  it("manda www para o domínio sem www com 301, mantendo caminho e query", () => {
    const res = canonicalHostRedirect(new Request("https://www.bewild.com.br/servicos?utm=x"))!;
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://bewild.com.br/servicos?utm=x");
  });
  it("não mexe no domínio canônico nem na prévia", () => {
    expect(canonicalHostRedirect(new Request("https://bewild.com.br/"))).toBeNull();
    expect(canonicalHostRedirect(new Request("https://id-preview--x.lovable.app/servicos"))).toBeNull();
  });
});
