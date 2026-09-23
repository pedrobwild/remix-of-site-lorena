import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", async () => {
  const fake = await import("./helpers/supabaseFake");
  return { supabase: fake.fakeSupabase };
});

import { calls, hasOp, resetFake, setResponder, verbOf } from "./helpers/supabaseFake";
import {
  isSafeRedirectTarget,
  needsSlugRedirect,
  publicPathFor,
  upsertSlugRedirect,
} from "@/lib/seoRedirects";

beforeEach(() => resetFake());

describe("regras do redirecionamento de slug", () => {
  it("caminhos públicos batem com as rotas do site", () => {
    expect(publicPathFor("post", "guia-reforma")).toBe("/conteudos/guia-reforma");
    expect(publicPathFor("project", "studio-pinheiros")).toBe("/portfolio/studio-pinheiros");
  });

  it("só redireciona item já publicado cujo slug mudou", () => {
    expect(needsSlugRedirect({ wasPublished: true, oldSlug: "a", newSlug: "b" })).toBe(true);
    expect(needsSlugRedirect({ wasPublished: false, oldSlug: "a", newSlug: "b" })).toBe(false);
    expect(needsSlugRedirect({ wasPublished: true, oldSlug: "a", newSlug: "a" })).toBe(false);
    expect(needsSlugRedirect({ wasPublished: true, oldSlug: null, newSlug: "b" })).toBe(false);
  });

  it("destino seguro: só caminho interno", () => {
    expect(isSafeRedirectTarget("/portfolio")).toBe(true);
    expect(isSafeRedirectTarget("/conteudos/x?utm=1")).toBe(true);
    expect(isSafeRedirectTarget("//evil.com")).toBe(false);
    expect(isSafeRedirectTarget("https://evil.com")).toBe(false);
    expect(isSafeRedirectTarget("javascript:alert(1)")).toBe(false);
    expect(isSafeRedirectTarget("/a b")).toBe(false);
    expect(isSafeRedirectTarget("/\\evil.com")).toBe(false);
  });
});

describe("upsertSlugRedirect", () => {
  it("cria a linha nova com source manual e reaponta cadeias", async () => {
    setResponder((call) => (verbOf(call) === "select" ? { data: null } : { data: [] }));
    const res = await upsertSlugRedirect("/conteudos/velho", "/conteudos/novo");
    expect(res).toEqual({ error: null });
    const [lookup, insert, chain] = calls;
    expect(hasOp(lookup, "eq", "path", "/conteudos/velho")).toBe(true);
    expect(verbOf(insert)).toBe("insert");
    const inserted = insert.ops.find(([op]) => op === "insert")?.[1][0] as Record<string, unknown>;
    expect(inserted).toMatchObject({
      path: "/conteudos/velho",
      status: "redirect",
      redirect_to: "/conteudos/novo",
      source: "manual",
    });
    expect(verbOf(chain)).toBe("update");
    expect(hasOp(chain, "update", { redirect_to: "/conteudos/novo" })).toBe(true);
    expect(hasOp(chain, "eq", "redirect_to", "/conteudos/velho")).toBe(true);
    expect(hasOp(chain, "neq", "path", "/conteudos/novo")).toBe(true);
  });

  it("linha existente é atualizada sem mexer em hits/source", async () => {
    setResponder((call) => (verbOf(call) === "select" ? { data: { id: 42 } } : { data: [] }));
    await upsertSlugRedirect("/portfolio/a", "/portfolio/b");
    const update = calls[1];
    const patch = update.ops.find(([op]) => op === "update")?.[1][0] as Record<string, unknown>;
    expect(patch).toMatchObject({ status: "redirect", redirect_to: "/portfolio/b" });
    expect(patch).not.toHaveProperty("hits");
    expect(patch).not.toHaveProperty("source");
    expect(hasOp(update, "eq", "id", 42)).toBe(true);
  });

  it("devolve o erro do banco", async () => {
    setResponder((call) =>
      verbOf(call) === "select" ? { data: null } : { error: { message: "permission denied" } },
    );
    await expect(upsertSlugRedirect("/portfolio/a", "/portfolio/b")).resolves.toEqual({
      error: "permission denied",
    });
  });

  it("recusa caminhos inválidos sem tocar no banco", async () => {
    await expect(upsertSlugRedirect("/a", "//evil.com")).resolves.toEqual({
      error: "Caminhos de redirecionamento inválidos.",
    });
    expect(calls).toHaveLength(0);
  });
});
