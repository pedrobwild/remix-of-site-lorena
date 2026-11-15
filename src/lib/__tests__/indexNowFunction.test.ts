import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      inputValidator: () => builder,
      handler: (fn: unknown) => fn,
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/lib/crmAuth", () => ({ attachCrmAuth: {} }));
import { notifyIndexNow } from "@/lib/indexNow.functions";
import { INDEXNOW_KEY } from "@/lib/indexNow.server";

const handler = notifyIndexNow as unknown as (input: unknown) => Promise<unknown>;

/** Supabase com o JWT do admin: `is_admin` e a leitura de `published` da linha salva. */
function contexto(
  isAdmin: boolean,
  row: { published: boolean } | null,
  error: { message: string } | null = null
) {
  const consultas: Array<{ table: string; slug: string }> = [];
  const supabase = {
    rpc: vi.fn(async () => ({ data: isAdmin, error: null })),
    from: vi.fn((table: string) => ({
      select: () => ({
        eq: (_col: string, slug: string) => ({
          maybeSingle: async () => {
            consultas.push({ table, slug });
            return { data: row, error };
          },
        }),
      }),
    })),
  };
  return { supabase, consultas };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("notifyIndexNow (função de servidor do painel)", () => {
  it("nega a quem não é administrador antes de ler o banco ou chamar o IndexNow", async () => {
    const fetchFn = vi.fn();
    vi.stubGlobal("fetch", fetchFn);
    const { supabase } = contexto(false, { published: true });
    await expect(
      handler({ data: { kind: "post", slug: "x" }, context: { supabase } })
    ).rejects.toThrow("Acesso restrito a administradores.");
    expect(supabase.from).not.toHaveBeenCalled();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("post publicado no banco: avisa a URL canônica /conteudos/<slug>", async () => {
    const fetchFn = vi.fn(async () => new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchFn);
    const { supabase, consultas } = contexto(true, { published: true });
    await expect(
      handler({ data: { kind: "post", slug: "vistoria-de-entrega" }, context: { supabase } })
    ).resolves.toEqual({
      status: "enviado",
      http: 200,
      url: "https://bewild.com.br/conteudos/vistoria-de-entrega",
    });
    expect(consultas).toEqual([{ table: "bewild_posts", slug: "vistoria-de-entrega" }]);
    const [, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      host: "bewild.com.br",
      key: INDEXNOW_KEY,
      keyLocation: `https://bewild.com.br/${INDEXNOW_KEY}.txt`,
      urlList: ["https://bewild.com.br/conteudos/vistoria-de-entrega"],
    });
  });

  it("projeto publicado: lê a tabela projects e avisa /portfolio/<slug>", async () => {
    const fetchFn = vi.fn(async () => new Response("", { status: 202 }));
    vi.stubGlobal("fetch", fetchFn);
    const { supabase, consultas } = contexto(true, { published: true });
    await expect(
      handler({ data: { kind: "project", slug: "studio-brooklin" }, context: { supabase } })
    ).resolves.toMatchObject({
      status: "enviado",
      url: "https://bewild.com.br/portfolio/studio-brooklin",
    });
    expect(consultas).toEqual([{ table: "projects", slug: "studio-brooklin" }]);
  });

  it("vale o que está no banco: rascunho ou linha inexistente não vai ao IndexNow", async () => {
    const fetchFn = vi.fn();
    vi.stubGlobal("fetch", fetchFn);
    for (const row of [{ published: false }, null]) {
      const { supabase } = contexto(true, row);
      await expect(
        handler({ data: { kind: "post", slug: "rascunho" }, context: { supabase } })
      ).resolves.toEqual({
        status: "ignorado",
        motivo: "não publicado",
      });
    }
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("falha ao ler o banco: não lança, registra e não chama o IndexNow", async () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchFn = vi.fn();
    vi.stubGlobal("fetch", fetchFn);
    const { supabase } = contexto(true, null, { message: "timeout" });
    await expect(
      handler({ data: { kind: "project", slug: "p" }, context: { supabase } })
    ).resolves.toMatchObject({ status: "falhou" });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(String(erro.mock.calls[0]?.[0])).toContain("[indexnow]");
  });

  it("erro de rede no IndexNow: a função responde sem lançar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new TypeError("fetch failed")))
    );
    const { supabase } = contexto(true, { published: true });
    await expect(
      handler({ data: { kind: "post", slug: "x" }, context: { supabase } })
    ).resolves.toMatchObject({ status: "falhou" });
  });
});
