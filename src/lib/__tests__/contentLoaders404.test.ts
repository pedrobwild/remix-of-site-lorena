import { describe, it, expect, vi, beforeEach } from "vitest";
import { isNotFound, isRedirect } from "@tanstack/react-router";

const state: { data: unknown; error: unknown; throwNet: boolean } = { data: null, error: null, throwNet: false };

vi.mock("@/integrations/supabase/client", () => {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  for (const k of ["select", "eq", "neq", "order", "limit"]) chain[k] = vi.fn(self);
  chain.maybeSingle = vi.fn(async () => {
    if (state.throwNet) throw new Error("fetch failed");
    return { data: state.data, error: state.error };
  });
  chain.then = (res: (v: unknown) => unknown) => res({ data: [], error: null });
  return { supabase: { from: vi.fn(() => chain) } };
});

const lookup = vi.fn<(p: string) => Promise<string | null>>();
vi.mock("@/lib/notFoundLog", () => ({ lookupActiveRedirect: (p: string) => lookup(p) }));

import { loadPostContent, loadProjectContent, notFoundOrRedirect } from "../contentLoaders";

beforeEach(() => {
  state.data = null;
  state.error = null;
  state.throwNet = false;
  lookup.mockReset();
});

async function caught(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    return e;
  }
  return undefined;
}

describe("404 e 301 no servidor", () => {
  it("post inexistente sem redirecionamento → notFound()", async () => {
    lookup.mockResolvedValue(null);
    const e = await caught(loadPostContent("slug-inventado-xyz"));
    expect(isNotFound(e)).toBe(true);
    expect(lookup).toHaveBeenCalledWith("/conteudos/slug-inventado-xyz");
  });

  it("post inexistente com redirecionamento ativo → 301 para o destino", async () => {
    lookup.mockResolvedValue("/conteudos/novo-slug");
    const e = (await caught(loadPostContent("slug-antigo"))) as { options?: { href?: string; statusCode?: number } };
    expect(isRedirect(e)).toBe(true);
    expect(e.options?.href).toBe("/conteudos/novo-slug");
    expect(e.options?.statusCode).toBe(301);
  });

  it("destino inseguro não redireciona (404)", async () => {
    lookup.mockResolvedValue("//evil.com");
    expect(isNotFound(await caught(notFoundOrRedirect("/portfolio/x")))).toBe(true);
  });

  it("projeto inexistente → 404", async () => {
    lookup.mockResolvedValue(null);
    expect(isNotFound(await caught(loadProjectContent("slug-inventado-xyz")))).toBe(true);
  });

  it("falha de rede nunca vira 404 (página segue, cliente tenta de novo)", async () => {
    state.throwNet = true;
    const res = await loadPostContent("qualquer");
    expect(res.post).toBeUndefined();
    expect(lookup).not.toHaveBeenCalled();
  });
});

describe("endereço antigo de conteúdo sem prefixo (/<slug>)", () => {
  it("artigo publicado com esse slug → 301 para /conteudos/<slug>", async () => {
    lookup.mockResolvedValue(null);
    state.data = { slug: "short-stay-ou-long-stay-studio-compacto" };
    const e = (await caught(notFoundOrRedirect("/short-stay-ou-long-stay-studio-compacto"))) as {
      options?: { href?: string; statusCode?: number };
    };
    expect(isRedirect(e)).toBe(true);
    expect(e.options?.href).toBe("/conteudos/short-stay-ou-long-stay-studio-compacto");
    expect(e.options?.statusCode).toBe(301);
  });

  it("slug que não é artigo nem projeto → 404; caminho com duas partes não consulta", async () => {
    lookup.mockResolvedValue(null);
    state.data = null;
    expect(isNotFound(await caught(notFoundOrRedirect("/nada-aqui")))).toBe(true);
    state.data = { slug: "x" };
    expect(isNotFound(await caught(notFoundOrRedirect("/blog/x")))).toBe(true);
  });

  it("redirecionamento do painel vence o endereço antigo", async () => {
    lookup.mockResolvedValue("/conteudos/destino-do-painel");
    state.data = { slug: "antigo" };
    const e = (await caught(notFoundOrRedirect("/antigo"))) as { options?: { href?: string } };
    expect(e.options?.href).toBe("/conteudos/destino-do-painel");
  });
});
