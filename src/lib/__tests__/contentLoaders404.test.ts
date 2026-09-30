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
