import { describe, expect, it, vi } from "vitest";
import { prerenderedFileCandidates, servePrerendered } from "../prerenderedHtml";
import { PRERENDERED_PAGES } from "@/config/prerender";

describe("páginas pré-renderizadas servidas pelo worker", () => {
  it("lista: só caminhos da lista, home vira /index.html", () => {
    expect(prerenderedFileCandidates("/")).toEqual(["/index.html", "/"]);
    expect(prerenderedFileCandidates("/reforma-de-studio-sao-paulo")).toEqual([
      "/reforma-de-studio-sao-paulo/index.html",
      "/reforma-de-studio-sao-paulo/",
    ]);
    expect(prerenderedFileCandidates("/orcamento")).toEqual([]);
    expect(prerenderedFileCandidates("/conteudos/x")).toEqual([]);
    expect(prerenderedFileCandidates("/admin")).toEqual([]);
  });

  it("a lista não tem /orcamento, /faq, /mapa-do-site, /conteudos, /portfolio nem /admin", () => {
    for (const p of ["/orcamento", "/faq", "/mapa-do-site", "/conteudos", "/portfolio", "/admin", "/guia-do-investidor"]) {
      expect(PRERENDERED_PAGES as readonly string[]).not.toContain(p);
    }
    expect(PRERENDERED_PAGES).toContain("/reforma-de-studio-sao-paulo");
    expect(PRERENDERED_PAGES).toContain("/");
  });

  const htmlAsset = (body: string) =>
    new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8", etag: '"abc"' } });

  it("serve o index.html do binding ASSETS e marca a resposta", async () => {
    const fetchAsset = vi.fn(async (r: Request) =>
      new URL(r.url).pathname === "/reforma-de-studio-sao-paulo/index.html" ? htmlAsset("<html>static</html>") : new Response("nf", { status: 404 }),
    );
    const res = await servePrerendered(new Request("https://bewild.com.br/reforma-de-studio-sao-paulo?gclid=1"), { ASSETS: { fetch: fetchAsset } });
    expect(res?.status).toBe(200);
    expect(res?.headers.get("x-bw-prerendered")).toBe("1");
    expect(await res?.text()).toBe("<html>static</html>");
    expect(fetchAsset).toHaveBeenCalledTimes(1);
  });

  it("segue um redirecionamento do binding (/x/index.html → /x/)", async () => {
    const fetchAsset = vi.fn(async (r: Request) => {
      const p = new URL(r.url).pathname;
      if (p === "/servicos/index.html") return new Response(null, { status: 308, headers: { location: "/servicos/" } });
      if (p === "/servicos/") return htmlAsset("<html>ok</html>");
      return new Response("nf", { status: 404 });
    });
    const res = await servePrerendered(new Request("https://bewild.com.br/servicos"), { ASSETS: { fetch: fetchAsset } });
    expect(await res?.text()).toBe("<html>ok</html>");
  });

  it("sem arquivo, sem binding, fora da lista ou POST: null (segue o SSR)", async () => {
    const nf = { ASSETS: { fetch: async () => new Response("nf", { status: 404 }) } };
    expect(await servePrerendered(new Request("https://bewild.com.br/servicos"), nf)).toBeNull();
    expect(await servePrerendered(new Request("https://bewild.com.br/servicos"), undefined)).toBeNull();
    expect(await servePrerendered(new Request("https://bewild.com.br/servicos"), {})).toBeNull();
    expect(await servePrerendered(new Request("https://bewild.com.br/orcamento"), { ASSETS: { fetch: async () => htmlAsset("x") } })).toBeNull();
    expect(await servePrerendered(new Request("https://bewild.com.br/servicos", { method: "POST" }), { ASSETS: { fetch: async () => htmlAsset("x") } })).toBeNull();
  });
});
