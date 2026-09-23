/**
 * CORE-13 / PUB-15 — post A nunca aparece sob a URL de B, e erro de leitura
 * não vira skeleton eterno. PUB-04 — CTA interno sem utm_* fixo.
 * ADM-04 — post inexistente segue o redirect do admin (slug trocado).
 * CORE-14 — logo do publisher existe em public/.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

type Resp = { data: unknown; error: { message: string } | null };
const pending = new Map<string, (r: Resp) => void>();
const responder = vi.fn<(slug: string) => Promise<Resp>>();
const rpcMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => {
  const chain = (slugRef: { slug?: string }) => {
    const b = {
      select: () => b,
      eq: (col: string, v: unknown) => {
        if (col === "slug") slugRef.slug = String(v);
        return b;
      },
      neq: () => b,
      order: () => b,
      limit: () => Promise.resolve({ data: [], error: null }),
      maybeSingle: () => responder(slugRef.slug ?? ""),
    };
    return b;
  };
  return {
    supabase: {
      from: () => chain({}),
      rpc: (...a: unknown[]) => rpcMock(...a),
    },
  };
});
vi.mock("@/lib/devLog", () => ({ devWarn: vi.fn(), devError: vi.fn() }));
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));

import { useBewildPost } from "@/lib/useBewildPost";
import BewildPostPage from "@/pages/BewildPostPage";

const postRow = (slug: string, title: string) => ({
  id: `id-${slug}`,
  slug,
  title,
  meta_title: null,
  meta_description: null,
  category: "reforma",
  excerpt: null,
  cover_image: null,
  body: "Texto",
  faq: [],
  reading_time: 3,
  author: null,
  featured: false,
  published: true,
  published_at: "2026-09-22T00:00:00+00:00",
  created_at: "2026-09-22T00:00:00+00:00",
  updated_at: null,
});

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
  rpcMock.mockReset();
  rpcMock.mockResolvedValue({ data: null, error: null });
  pending.clear();
  responder.mockReset();
  responder.mockImplementation(
    (slug) => new Promise<Resp>((res) => pending.set(slug, res)),
  );
});

afterEach(() => cleanup());

describe("useBewildPost", () => {
  it("troca de slug zera o post na hora (nada de A sob a URL de B)", async () => {
    const { result, rerender } = renderHook(({ slug }) => useBewildPost(slug), {
      initialProps: { slug: "post-a" },
    });
    await act(async () => pending.get("post-a")!({ data: postRow("post-a", "A"), error: null }));
    expect(result.current.post?.title).toBe("A");

    rerender({ slug: "post-b" });
    expect(result.current.post).toBeNull();
    expect(result.current.loading).toBe(true);

    await act(async () => pending.get("post-b")!({ data: postRow("post-b", "B"), error: null }));
    expect(result.current.post?.title).toBe("B");
  });

  it("erro zera o post e expõe `error`; retry() busca de novo", async () => {
    const { result } = renderHook(() => useBewildPost("post-a"));
    await act(async () => pending.get("post-a")!({ data: null, error: { message: "timeout" } }));
    expect(result.current.post).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("timeout");

    act(() => result.current.retry());
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true);
    await act(async () => pending.get("post-a")!({ data: postRow("post-a", "A"), error: null }));
    expect(result.current.post?.title).toBe("A");
    expect(responder).toHaveBeenCalledTimes(2);
  });
});

describe("BewildPostPage", () => {
  it("erro mostra mensagem e 'Tentar novamente' (não skeleton eterno)", async () => {
    render(<BewildPostPage slug="quanto-custa" />);
    await act(async () => pending.get("quanto-custa")!({ data: null, error: { message: "offline" } }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Não foi possível carregar/);

    act(() => screen.getByRole("button", { name: /Tentar novamente/ }).click());
    await act(async () => pending.get("quanto-custa")!({ data: postRow("quanto-custa", "Quanto custa"), error: null }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Quanto custa");
  });

  it("CTA interno sem utm_* e publisher com logo existente + @id #org", async () => {
    render(<BewildPostPage slug="post-a" />);
    await act(async () => pending.get("post-a")!({ data: postRow("post-a", "A"), error: null }));

    const cta = screen.getByRole("link", { name: /Solicitar orçamento/ });
    expect(cta.getAttribute("href")).toBe("/orcamento");

    await waitFor(() => {
      const article = Array.from(document.head.querySelectorAll('script[type="application/ld+json"]'))
        .map((n) => JSON.parse(n.textContent || "{}") as Record<string, unknown>)
        .find((ld) => ld["@type"] === "Article");
      expect(article).toBeTruthy();
      const publisher = article!.publisher as { "@id": string; logo: { url: string } };
      expect(publisher["@id"]).toBe("https://bewild.com.br/#org");
      const logoPath = new URL(publisher.logo.url).pathname;
      expect(existsSync(resolve(process.cwd(), "public", `.${logoPath}`))).toBe(true);
    });
  });

  it("data da publicação sai no dia de São Paulo", async () => {
    render(<BewildPostPage slug="post-a" />);
    await act(async () => pending.get("post-a")!({ data: postRow("post-a", "A"), error: null }));
    expect(document.querySelector("time")?.textContent).toMatch(/^22 de set/);
  });
});

describe("BewildPostPage — post inexistente (ADM-04)", () => {
  it("com redirect cadastrado (slug trocado no admin), vai para o destino substituindo a entrada", async () => {
    window.history.replaceState(null, "", "/conteudos/slug-antigo");
    rpcMock.mockImplementation(async (fn: string) =>
      fn === "resolve_404_redirect" ? { data: "/conteudos/slug-novo", error: null } : { data: null, error: null },
    );
    const lengthBefore = window.history.length;
    render(<BewildPostPage slug="slug-antigo" />);
    await act(async () => pending.get("slug-antigo")!({ data: null, error: null }));

    await waitFor(() => expect(window.location.pathname).toBe("/conteudos/slug-novo"));
    expect(window.history.length).toBe(lengthBefore);
    expect(rpcMock).toHaveBeenCalledWith("resolve_404_redirect", { p_path: "/conteudos/slug-antigo" });
    expect(rpcMock).toHaveBeenCalledWith("log_404", expect.objectContaining({ p_path: "/conteudos/slug-antigo" }));
  });

  it("sem redirect: fica a 404 do post, com noindex", async () => {
    window.history.replaceState(null, "", "/conteudos/nao-existe");
    render(<BewildPostPage slug="nao-existe" />);
    await act(async () => pending.get("nao-existe")!({ data: null, error: null }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/não encontrado/i);
    await waitFor(() =>
      expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toMatch(/noindex/),
    );
    await waitFor(() => expect(rpcMock).toHaveBeenCalledWith("resolve_404_redirect", expect.anything()));
    expect(window.location.pathname).toBe("/conteudos/nao-existe");
  });
});
