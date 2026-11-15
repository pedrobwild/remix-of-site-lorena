import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_HOST,
  INDEXNOW_KEY,
  INDEXNOW_KEY_LOCATION,
  avisarIndexNowDaPagina,
  buildIndexNowPayload,
  indexNowPageUrl,
} from "@/lib/indexNow.server";

const raiz = resolve(__dirname, "../../..");

function fetchQueResponde(status: number) {
  return vi.fn(async () => new Response(status === 200 ? "" : "erro", { status }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("IndexNow: chave pública e endereço", () => {
  it("usa a chave publicada em public/<chave>.txt, a mesma do script do workflow", () => {
    expect(INDEXNOW_HOST).toBe("bewild.com.br");
    expect(INDEXNOW_KEY_LOCATION).toBe(`https://bewild.com.br/${INDEXNOW_KEY}.txt`);
    expect(readFileSync(resolve(raiz, `public/${INDEXNOW_KEY}.txt`), "utf8").trim()).toBe(
      INDEXNOW_KEY
    );
    expect(readFileSync(resolve(raiz, "scripts/submit-indexnow.mjs"), "utf8")).toContain(
      `const KEY = "${INDEXNOW_KEY}";`
    );
  });

  it("o workflow do sitemap roda a cada push na main e uma vez por dia (rede de segurança)", () => {
    const yml = readFileSync(resolve(raiz, ".github/workflows/indexnow.yml"), "utf8");
    expect(yml).toMatch(/^\s{2}push:\n\s{4}branches: \[main\]/m);
    expect(yml).toMatch(/^\s{2}schedule:\n(?:\s*#.*\n)*\s{4}- cron: "\d{1,2} \d{1,2} \* \* \*"/m);
    expect(yml).toContain("node scripts/submit-indexnow.mjs");
  });

  it("monta a URL canônica de post e de projeto", () => {
    expect(indexNowPageUrl("post", "quanto-custa-reformar-studio")).toBe(
      "https://bewild.com.br/conteudos/quanto-custa-reformar-studio"
    );
    expect(indexNowPageUrl("project", "studio-vila-madalena-28m2")).toBe(
      "https://bewild.com.br/portfolio/studio-vila-madalena-28m2"
    );
  });

  it("post fundido em outro aponta para o artigo que responde (o antigo é 301)", () => {
    expect(indexNowPageUrl("post", "cronograma-reforma-studio-60-dias-uteis")).toBe(
      "https://bewild.com.br/conteudos/quanto-tempo-demora-reforma-apartamento"
    );
  });

  it("recusa slug que não forma um endereço do site", () => {
    expect(indexNowPageUrl("post", "")).toBeNull();
    expect(indexNowPageUrl("post", "../admin")).toBeNull();
    expect(indexNowPageUrl("project", "com espaço")).toBeNull();
    expect(indexNowPageUrl("project", "https://outro.site/x")).toBeNull();
  });
});

describe("IndexNow: payload para api.indexnow.org", () => {
  it("leva host, key, keyLocation e só as URLs pedidas (sem o sitemap)", () => {
    expect(buildIndexNowPayload(["https://bewild.com.br/conteudos/a"])).toEqual({
      host: "bewild.com.br",
      key: INDEXNOW_KEY,
      keyLocation: `https://bewild.com.br/${INDEXNOW_KEY}.txt`,
      urlList: ["https://bewild.com.br/conteudos/a"],
    });
  });
});

describe("IndexNow: aviso de página salva no painel", () => {
  it("post publicado: envia um POST JSON com a URL canônica", async () => {
    const fetchFn = fetchQueResponde(200);
    const r = await avisarIndexNowDaPagina(
      { kind: "post", slug: "vistoria-de-entrega", published: true },
      { fetch: fetchFn }
    );
    expect(r).toEqual({
      status: "enviado",
      http: 200,
      url: "https://bewild.com.br/conteudos/vistoria-de-entrega",
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [endpoint, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(endpoint).toBe(INDEXNOW_ENDPOINT);
    expect(endpoint).toBe("https://api.indexnow.org/indexnow");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("content-type")).toBe("application/json; charset=utf-8");
    expect(JSON.parse(String(init.body))).toEqual({
      host: "bewild.com.br",
      key: INDEXNOW_KEY,
      keyLocation: `https://bewild.com.br/${INDEXNOW_KEY}.txt`,
      urlList: ["https://bewild.com.br/conteudos/vistoria-de-entrega"],
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("projeto publicado: avisa /portfolio/<slug>; 202 (chave em validação) também conta como enviado", async () => {
    const fetchFn = fetchQueResponde(202);
    const r = await avisarIndexNowDaPagina(
      { kind: "project", slug: "studio-pinheiros", published: true },
      { fetch: fetchFn }
    );
    expect(r).toEqual({
      status: "enviado",
      http: 202,
      url: "https://bewild.com.br/portfolio/studio-pinheiros",
    });
    const [, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body)).urlList).toEqual([
      "https://bewild.com.br/portfolio/studio-pinheiros",
    ]);
  });

  it("rascunho ou despublicado: não chama o IndexNow", async () => {
    const fetchFn = fetchQueResponde(200);
    await expect(
      avisarIndexNowDaPagina(
        { kind: "post", slug: "rascunho", published: false },
        { fetch: fetchFn }
      )
    ).resolves.toEqual({
      status: "ignorado",
      motivo: "não publicado",
    });
    await expect(
      avisarIndexNowDaPagina(
        { kind: "project", slug: "saiu-do-ar", published: false },
        { fetch: fetchFn }
      )
    ).resolves.toEqual({
      status: "ignorado",
      motivo: "não publicado",
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("slug inválido: não chama o IndexNow", async () => {
    const fetchFn = fetchQueResponde(200);
    await expect(
      avisarIndexNowDaPagina({ kind: "post", slug: "a/b", published: true }, { fetch: fetchFn })
    ).resolves.toEqual({
      status: "ignorado",
      motivo: "slug inválido",
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("erro de rede: não lança e registra no console do servidor", async () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchFn = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const r = await avisarIndexNowDaPagina(
      { kind: "post", slug: "x", published: true },
      { fetch: fetchFn }
    );
    expect(r).toEqual({
      status: "falhou",
      motivo: "fetch failed",
      url: "https://bewild.com.br/conteudos/x",
    });
    expect(erro).toHaveBeenCalledTimes(1);
    expect(String(erro.mock.calls[0][0])).toContain("[indexnow]");
    expect(String(erro.mock.calls[0][0])).toContain("https://bewild.com.br/conteudos/x");
  });

  it("IndexNow recusa (403, 422, 429): não lança, registra o código e o motivo", async () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await avisarIndexNowDaPagina(
      { kind: "project", slug: "y", published: true },
      { fetch: fetchQueResponde(403) }
    );
    expect(r).toMatchObject({
      status: "falhou",
      http: 403,
      url: "https://bewild.com.br/portfolio/y",
    });
    expect(erro).toHaveBeenCalledTimes(1);
    expect(String(erro.mock.calls[0][0])).toMatch(/HTTP 403/);
  });

  it("tempo esgotado (AbortSignal): não lança", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchFn = vi.fn(async (_url: string, init?: RequestInit) => {
      await new Promise((_, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("The operation was aborted.", "TimeoutError"))
        );
      });
      return new Response("");
    });
    const r = await avisarIndexNowDaPagina(
      { kind: "post", slug: "z", published: true },
      { fetch: fetchFn, timeoutMs: 5 }
    );
    expect(r.status).toBe("falhou");
  });
});
