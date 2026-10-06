/**
 * MOB-04 — home-bwa.css + bwa-internal.css continuam sendo as últimas folhas do
 * <head> depois de uma navegação interna (o CSS da página nova entra no fim),
 * e na carga direta — em que o servidor já as manda por último — nada é movido.
 * No início de uma navegação para página com header .bwa, as duas são pedidas
 * de imediato (`preinit` do React), para a troca de página não esperar por elas.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

// No Vitest um import `*.css?url` vem vazio: dá endereços de verdade às duas folhas.
vi.mock("../../pages/home-bwa.css?url", () => ({ default: "/assets/home-bwa.css" }));
vi.mock("../../pages/bwa-internal.css?url", () => ({ default: "/assets/bwa-internal.css" }));

const preinit = vi.hoisted(() => vi.fn());
vi.mock("react-dom", async (original) => ({ ...(await original<typeof import("react-dom")>()), preinit }));

import { installBwaStylesheetPreinit, keepBwaStylesheetsLast, usesBwaStylesheets } from "../bwaStylesheetOrder";

const homeBwaCssUrl = "/assets/home-bwa.css";
const bwaInternalCssUrl = "/assets/bwa-internal.css";

function sheet(href: string): HTMLLinkElement {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.setAttribute("href", href);
  document.head.appendChild(link);
  return link;
}

const order = () =>
  Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style')).map(
    (el) => el.getAttribute("href") ?? "<style>",
  );

afterEach(() => {
  document.head.innerHTML = "";
  preinit.mockClear();
});

describe("keepBwaStylesheetsLast", () => {
  it("carga direta (já estão por último): não mexe em nada", () => {
    sheet("/assets/styles.css");
    sheet("/assets/contato.css");
    const home = sheet(homeBwaCssUrl);
    const internal = sheet(bwaInternalCssUrl);
    const observer = new MutationObserver(() => {});
    observer.observe(document.head, { childList: true });
    keepBwaStylesheetsLast();
    expect(observer.takeRecords()).toHaveLength(0);
    observer.disconnect();
    expect(document.head.lastElementChild).toBe(internal);
    expect(internal.previousElementSibling).toBe(home);
  });

  it("navegação interna: o CSS da página nova entrou depois — as duas voltam para o fim, na ordem", () => {
    sheet("/assets/styles.css");
    const home = sheet(homeBwaCssUrl);
    const internal = sheet(bwaInternalCssUrl);
    sheet("/assets/portfolio.css"); // anexado pelo Vite ao carregar a página
    keepBwaStylesheetsLast();
    expect(order()).toEqual(["/assets/styles.css", "/assets/portfolio.css", homeBwaCssUrl, bwaInternalCssUrl]);
    // Os mesmos elementos (sem duplicar nem recriar).
    expect(document.head.lastElementChild).toBe(internal);
    expect(internal.previousElementSibling).toBe(home);
  });

  it("vindo da home: home-bwa.css está no começo (link da rota) e vai para o fim, sem duplicar", () => {
    sheet("/assets/styles.css");
    sheet(homeBwaCssUrl);
    sheet("/assets/routes.css");
    sheet("/assets/contato.css");
    sheet(bwaInternalCssUrl);
    keepBwaStylesheetsLast();
    expect(order()).toEqual(["/assets/styles.css", "/assets/routes.css", "/assets/contato.css", homeBwaCssUrl, bwaInternalCssUrl]);
  });

  it("um <style> depois delas também conta como folha", () => {
    sheet(homeBwaCssUrl);
    sheet(bwaInternalCssUrl);
    document.head.appendChild(document.createElement("style"));
    keepBwaStylesheetsLast();
    expect(order()).toEqual(["<style>", homeBwaCssUrl, bwaInternalCssUrl]);
  });

  it("sem as duas folhas no documento, não faz nada", () => {
    sheet("/assets/styles.css");
    sheet(homeBwaCssUrl);
    keepBwaStylesheetsLast();
    expect(order()).toEqual(["/assets/styles.css", homeBwaCssUrl]);
  });
});

describe("usesBwaStylesheets", () => {
  it("páginas com o header .bwa usam as folhas; home, LPs, guia e áreas com layout próprio não", () => {
    for (const p of ["/faq", "/orcamento", "/portfolio", "/portfolio/um-projeto", "/conteudos/um-artigo", "/buscar", "/pagina-que-nao-existe"]) {
      expect(usesBwaStylesheets(p), p).toBe(true);
    }
    for (const p of ["/", "/o", "/p", "/guia-do-investidor", "/diagnostico", "/admin", "/admin/leads"]) {
      expect(usesBwaStylesheets(p), p).toBe(false);
    }
  });

  it("acompanha as rotas que pedem `bwaCss: false` ao seoHead()", () => {
    const routesDir = path.resolve(__dirname, "../../routes");
    const semBwa = readdirSync(routesDir)
      .filter((f) => f.endsWith(".tsx") && /bwaCss:\s*false/.test(readFileSync(path.join(routesDir, f), "utf8")))
      .map((f) => (f === "index.tsx" ? "/" : "/" + f.replace(/\.tsx$/, "").replace(/\./g, "/")));
    expect(semBwa.length).toBeGreaterThan(0);
    for (const p of semBwa) expect(usesBwaStylesheets(p), p).toBe(false);
  });
});

describe("installBwaStylesheetPreinit", () => {
  type Handler = (e: { fromLocation?: { pathname: string }; toLocation: { pathname: string } }) => void;
  function fakeRouter() {
    let handler: Handler | null = null;
    const unsubscribe = vi.fn(() => {
      handler = null;
    });
    return {
      router: {
        subscribe: (_event: "onBeforeNavigate", fn: Handler) => {
          handler = fn;
          return unsubscribe;
        },
      },
      navigate: (from: string | undefined, to: string) =>
        handler?.({ fromLocation: from === undefined ? undefined : { pathname: from }, toLocation: { pathname: to } }),
      unsubscribe,
    };
  }

  it("da home para uma página interna: pede as duas folhas no grupo de precedência das .bwa", () => {
    const { router, navigate } = fakeRouter();
    installBwaStylesheetPreinit(router);
    navigate("/", "/faq");
    expect(preinit.mock.calls).toEqual([
      [homeBwaCssUrl, { as: "style", precedence: "bwa" }],
      [bwaInternalCssUrl, { as: "style", precedence: "bwa" }],
    ]);
  });

  it("não pede nada na carga inicial, na mesma página (âncora/busca) nem a caminho de página sem header .bwa", () => {
    const { router, navigate } = fakeRouter();
    installBwaStylesheetPreinit(router);
    navigate(undefined, "/faq"); // carga inicial: vieram no HTML do servidor
    navigate("/buscar", "/buscar"); // ?q= mudou
    navigate("/faq", "/"); // home: carrega home-bwa.css pelo próprio head
    navigate("/faq", "/guia-do-investidor");
    navigate("/", "/o");
    navigate("/", "/admin/leads");
    expect(preinit).not.toHaveBeenCalled();
  });

  it("devolve o cancelamento da inscrição", () => {
    const { router, navigate, unsubscribe } = fakeRouter();
    const off = installBwaStylesheetPreinit(router);
    off();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    navigate("/", "/faq");
    expect(preinit).not.toHaveBeenCalled();
  });
});
