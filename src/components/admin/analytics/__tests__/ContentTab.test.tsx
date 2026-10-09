/**
 * ContentTab — lista cada artigo e cada projeto com seus acessos.
 *
 * O client do Supabase é um fake: `analytics_top_paths_v2` devolve caminhos
 * (e outros números na janela anterior), `bewild_posts` e `projects` devolvem
 * o cadastro. O teste confere os parâmetros pedidos e o que aparece na tela.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

type RpcCall = { name: string; args: Record<string, unknown> };
const rpcCalls: RpcCall[] = [];
const CUR = [
  { path: "/conteudos/custo-reforma", pageviews: 40, sessions: 30 },
  { path: "/blog/custo-reforma", pageviews: 2, sessions: 2 },
  { path: "/conteudos/short-stay", pageviews: 8, sessions: 6 },
  { path: "/portfolio/studio-moema", pageviews: 25, sessions: 20 },
  { path: "/", pageviews: 500, sessions: 300 },
];
const PREV = [{ path: "/conteudos/short-stay", pageviews: 16, sessions: 10 }];

vi.mock("@/integrations/supabase/client", () => {
  const tables: Record<string, unknown[]> = {
    bewild_posts: [
      { slug: "custo-reforma", title: "Quanto custa reformar", published: true, published_at: "2026-09-01T12:00:00Z" },
      { slug: "short-stay", title: "O que é short stay", published: true, published_at: "2026-08-01T12:00:00Z" },
      { slug: "sem-acesso", title: "Artigo sem acesso", published: true, published_at: null },
    ],
    projects: [
      { slug: "studio-moema", title: "Studio Moema", published: true, neighborhood: "Moema" },
      { slug: "loft-pinheiros", title: "Loft Pinheiros", published: true, neighborhood: "Pinheiros" },
    ],
  };
  return {
    supabase: {
      rpc: (name: string, args: Record<string, unknown>) => {
        rpcCalls.push({ name, args });
        // A primeira chamada é o período atual; a segunda, o anterior.
        const isPrev = rpcCalls.filter((c) => c.name === name).length > 1;
        return Promise.resolve({ data: isPrev ? PREV : CUR, error: null });
      },
      from: (table: string) => ({
        select: () => Promise.resolve({ data: tables[table] ?? [], error: null }),
      }),
    },
  };
});

import ContentTab from "../ContentTab";

const range = { from: new Date(2026, 8, 1), to: new Date(2026, 8, 30, 23, 59, 59, 999) };

beforeEach(() => {
  rpcCalls.length = 0;
});

describe("ContentTab", () => {
  it("lista todos os artigos com pv e sessões, somando o caminho legado /blog", async () => {
    render(<ContentTab range={range} segments={[{ dim: "device", value: "mobile" }]} comparePrev={false} />);
    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row").slice(1, -1); // sem cabeçalho e rodapé
    expect(rows.map((r) => within(r).getByRole("link").textContent)).toEqual([
      "Quanto custa reformar",
      "O que é short stay",
      "Artigo sem acesso",
    ]);
    expect(rows[0].textContent).toContain("42");
    expect(rows[0].textContent).toContain("32");
    expect(within(rows[0]).getByRole("link").getAttribute("href")).toBe("/conteudos/custo-reforma");
    expect(screen.getByText("2 de 3")).toBeTruthy();

    // Uma chamada só (sem comparação), com limite alto e os segmentos.
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0].name).toBe("analytics_top_paths_v2");
    expect(rpcCalls[0].args).toMatchObject({ p_limit: 10000, p_device: "mobile", p_country: null });
  });

  it("troca para projetos, busca por bairro e oculta itens sem acesso", async () => {
    render(<ContentTab range={range} segments={[]} comparePrev={false} />);
    fireEvent.click(await screen.findByRole("tab", { name: /Projetos do portfólio/ }));
    let links = within(screen.getByRole("table")).getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Studio Moema", "Loft Pinheiros"]);

    fireEvent.click(screen.getByLabelText("ocultar sem acesso"));
    links = within(screen.getByRole("table")).getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Studio Moema"]);

    fireEvent.change(screen.getByLabelText("buscar"), { target: { value: "pinheiros" } });
    expect(screen.getByText("nenhum projeto encontrado")).toBeTruthy();
  });

  it("com comparação, pede o período anterior e mostra a variação", async () => {
    render(<ContentTab range={range} segments={[]} comparePrev />);
    const table = await screen.findByRole("table");
    expect(rpcCalls).toHaveLength(2);
    expect(within(table).getByText("vs anterior")).toBeTruthy();
    const shortStay = within(table).getByText("O que é short stay").closest("tr") as HTMLElement;
    expect(shortStay.textContent).toContain("-50.0%");
  });
});
