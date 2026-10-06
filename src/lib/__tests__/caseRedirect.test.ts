import { describe, expect, it } from "vitest";
import { lowercasePathRedirect } from "../caseRedirect";

const req = (path: string, method = "GET") => new Request(`https://bewild.com.br${path}`, { method });

describe("lowercasePathRedirect", () => {
  it("redireciona /Servicos para /servicos com 307", () => {
    const res = lowercasePathRedirect(req("/Servicos"))!;
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://bewild.com.br/servicos");
  });
  it("preserva a query string", () => {
    const res = lowercasePathRedirect(req("/Portfolio/Rm?utm=x"))!;
    expect(res.headers.get("location")).toBe("https://bewild.com.br/portfolio/rm?utm=x");
  });
  it("ignora caminhos já em minúsculas", () => {
    expect(lowercasePathRedirect(req("/servicos"))).toBeNull();
  });
  it("ignora ids públicos, admin, api e arquivos", () => {
    expect(lowercasePathRedirect(req("/o/AbC123"))).toBeNull();
    expect(lowercasePathRedirect(req("/admin/Leads"))).toBeNull();
    expect(lowercasePathRedirect(req("/api/Foo"))).toBeNull();
    expect(lowercasePathRedirect(req("/images/Foto.JPG"))).toBeNull();
  });
  it("ignora métodos que não são GET/HEAD", () => {
    expect(lowercasePathRedirect(req("/Servicos", "POST"))).toBeNull();
  });
});
