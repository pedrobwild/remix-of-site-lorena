/**
 * /conteudos paginado e com payload enxuto (auditoria de SEO, rodada 4,
 * 09/11/2026, ação 12). Antes a lista inteira saía no HTML com FAQ, meta
 * description e og:image de todos os posts (HTML de 397 kB, 1.183 elementos).
 *
 * O banco falso aplica o `select` como o PostgREST: só volta a coluna pedida.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useState } from "react";
import { isNotFound, isRedirect } from "@tanstack/react-router";

const FAQ_TEXTO = "Resposta longa da FAQ que só serve ao artigo";
const META = (n: number) => `Meta descrição exclusiva ${n}`;

const ROWS = Array.from({ length: 30 }, (_, i) => ({
  id: `id-${i}`,
  slug: `artigo-${i}`,
  title: `Artigo ${i}`,
  meta_title: null,
  meta_description: i === 27 ? "Fala de marcenaria planejada" : META(i),
  og_image: `https://exemplo.test/og-${i}.jpg`,
  category: i % 2 ? "reforma" : "mercado",
  excerpt: `Resumo ${i}`,
  cover_image: null,
  body: `Corpo inteiro ${i}`,
  faq: [{ q: "Pergunta?", a: `${FAQ_TEXTO} ${i}` }],
  reading_time: 5,
  author: "Pedro Alves",
  featured: i === 3,
  published: true,
  published_at: new Date(Date.UTC(2026, 9, 30 - i)).toISOString(),
  created_at: new Date(Date.UTC(2026, 9, 30 - i)).toISOString(),
}));

function pick(cols: string) {
  return (row: Record<string, unknown>) =>
    Object.fromEntries(
      cols
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c in row)
        .map((c) => [c, row[c]])
    );
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => {
      let cols = "*";
      const b = {
        select: (c: string) => {
          cols = c;
          return b;
        },
        eq: () => b,
        order: () => b,
        then: (res: (v: unknown) => unknown) => res({ data: ROWS.map(pick(cols)), error: null }),
      };
      return b;
    },
  },
}));

const selectSpy = vi.fn();
vi.mock("@/integrations/supabase/publicRest", () => ({
  publicRpc: async (fn: string) =>
    fn === "get_public_site_settings"
      ? {
          data: { pages_seo: { "/conteudos": { title: "Título do painel | Bewild" } } },
          error: null,
        }
      : { data: null, error: null },
  publicSelect: async (table: string, query: Record<string, string>) => {
    selectSpy(table, query);
    return { data: ROWS.map(pick(query.select)), error: null };
  },
}));
vi.mock("@/lib/pageSeo.functions", async () => {
  const { resolvePageSeo } = await import("@/lib/pageSeo");
  return { loadPageSeo: async () => resolvePageSeo("/conteudos") };
});
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));

import { Route } from "@/routes/conteudos.index";
import BewildConteudosPage from "@/pages/BewildConteudosPage";
import {
  paginarPosts,
  POSTS_POR_PAGINA,
  seoDaPagina,
  type PaginaDeConteudos,
  type PostIndexItem,
} from "@/lib/conteudosPagination";
import { resetPostIndex } from "@/lib/useBewildPosts";

type Dados = {
  pagina: PaginaDeConteudos | null;
  index: PostIndexItem[] | null;
  numero: number;
  seo: { title: string; description: string };
  jsonLd: unknown;
};
const loader = Route.options.loader as unknown as (ctx: {
  deps: { pagina: number };
  location: { search: Record<string, unknown> };
}) => Promise<Dados>;
const head = Route.options.head as unknown as (ctx: { loaderData?: Dados; matches: unknown[] }) => {
  meta: Array<Record<string, string>>;
  links: Array<Record<string, string>>;
  scripts: Array<{ type: string; children: string }>;
};

const carregar = (pagina?: number, extra: Record<string, unknown> = {}) =>
  loader({
    deps: { pagina: pagina ?? 1 },
    location: { search: { ...(pagina ? { pagina } : {}), ...extra } },
  });

async function caught(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    return e;
  }
  return undefined;
}

const html = (dados: Dados) =>
  renderToString(<BewildConteudosPage page={dados.pagina} initialIndex={dados.index} />).replace(
    /<!-- -->/g,
    ""
  );

afterEach(() => {
  cleanup();
  resetPostIndex();
  selectSpy.mockReset();
});

describe("paginarPosts", () => {
  it("destaque só na página 1; o lote segue a ordem; página além da última = null", () => {
    const rows = ROWS as never as Parameters<typeof paginarPosts>[0];
    const p1 = paginarPosts(rows, 1)!;
    expect(p1.featured?.slug).toBe("artigo-3");
    expect(p1.posts.map((p) => p.slug)).toEqual(
      ROWS.filter((r) => !r.featured)
        .slice(0, POSTS_POR_PAGINA)
        .map((r) => r.slug)
    );
    expect(p1.totalPaginas).toBe(Math.ceil((ROWS.length - 1) / POSTS_POR_PAGINA));
    expect(p1.total).toBe(ROWS.length);
    const p2 = paginarPosts(rows, 2)!;
    expect(p2.featured).toBeNull();
    expect(p2.posts[0].slug).toBe(ROWS.filter((r) => !r.featured)[POSTS_POR_PAGINA].slug);
    expect(paginarPosts(rows, p1.totalPaginas + 1)).toBeNull();
  });

  it("título distinto por página, sem mexer na página 1", () => {
    const seo = { title: "Guias de reforma | Bewild", description: "Leia os guias." };
    expect(seoDaPagina(seo, 1)).toEqual(seo);
    expect(seoDaPagina(seo, 2)).toEqual({
      title: "Guias de reforma, página 2 | Bewild",
      description: "Página 2. Leia os guias.",
    });
  });
});

describe("loader de /conteudos: payload enxuto", () => {
  it("página 1 leva só o destaque e o lote, sem FAQ, meta description, og:image e corpo", async () => {
    const dados = await carregar();
    expect(dados.pagina?.posts).toHaveLength(POSTS_POR_PAGINA);
    expect(dados.index).toBeNull();
    const payload = JSON.stringify({ pagina: dados.pagina, index: dados.index });
    for (const fora of [
      FAQ_TEXTO,
      "og-1.jpg",
      META(0),
      "Corpo inteiro",
      '"faq"',
      '"meta_description"',
      '"og_image"',
      '"body"',
    ]) {
      expect(payload).not.toContain(fora);
    }
    expect(Object.keys(dados.pagina!.posts[0]).sort()).toEqual([
      "category",
      "cover_image",
      "created_at",
      "excerpt",
      "featured",
      "id",
      "published_at",
      "reading_time",
      "slug",
      "title",
    ]);
  });

  it("?pagina=1 responde 301 para /conteudos; página além da última responde 404", async () => {
    const r = (await caught(carregar(1))) as { options?: { to?: string; statusCode?: number } };
    expect(isRedirect(r)).toBe(true);
    expect(r.options?.to).toBe("/conteudos");
    expect(r.options?.statusCode).toBe(301);
    expect(isNotFound(await caught(carregar(99)))).toBe(true);
  });

  it("URL com ?q= já leva o índice completo (com a meta description da busca)", async () => {
    const dados = await carregar(undefined, { q: "marcenaria" });
    expect(dados.index).toHaveLength(ROWS.length);
    expect(dados.index!.find((p) => p.slug === "artigo-27")?.meta_description).toBe(
      "Fala de marcenaria planejada"
    );
    // O resultado sai no HTML do servidor mesmo estando na página 3 da lista.
    const out = renderToString(
      <BewildConteudosPage page={dados.pagina} initialIndex={dados.index} query="marcenaria" />
    );
    expect(out).toContain('href="/conteudos/artigo-27"');
  });
});

describe("head() de cada página", () => {
  const canonical = (h: ReturnType<typeof head>) =>
    h.links.find((l) => l.rel === "canonical")?.href;
  const title = (h: ReturnType<typeof head>) => h.meta.find((m) => "title" in m)?.title;

  it("página 1 = /conteudos; página N = /conteudos?pagina=N, título próprio, og:url e WebPage iguais", async () => {
    const h1 = head({ loaderData: await carregar(), matches: [] });
    const h2 = head({ loaderData: await carregar(2), matches: [] });
    expect(canonical(h1)).toBe("https://bewild.com.br/conteudos");
    expect(canonical(h2)).toBe("https://bewild.com.br/conteudos?pagina=2");
    expect(h2.links.filter((l) => l.rel === "alternate").map((l) => l.href)).toEqual([
      "https://bewild.com.br/conteudos?pagina=2",
      "https://bewild.com.br/conteudos?pagina=2",
    ]);
    expect(h2.meta.find((m) => m.property === "og:url")?.content).toBe(
      "https://bewild.com.br/conteudos?pagina=2"
    );
    expect(title(h2)).not.toBe(title(h1));
    expect(title(h2)).toMatch(/página 2 \| Bewild$/);
    const webPage = h2.scripts
      .map((s) => JSON.parse(s.children))
      .find((n) => n.url?.includes("conteudos"));
    expect(webPage).toMatchObject({
      url: "https://bewild.com.br/conteudos?pagina=2",
      "@id": "https://bewild.com.br/conteudos?pagina=2#webpage",
    });
    // ItemList só com o que está na tela.
    const list = h2.scripts
      .map((s) => JSON.parse(s.children))
      .find((n) => n["@type"] === "ItemList");
    expect(list.itemListElement).toHaveLength(POSTS_POR_PAGINA);
  });
});

describe("HTML do servidor", () => {
  it("todo artigo é alcançável por link: cada página tem seu lote e links para as outras", async () => {
    const p1 = await carregar();
    const total = p1.pagina!.totalPaginas;
    const vistos = new Set<string>();
    for (let n = 1; n <= total; n++) {
      const dados = n === 1 ? p1 : await carregar(n);
      const out = html(dados);
      for (const m of out.matchAll(/href="\/conteudos\/(artigo-\d+)"/g)) vistos.add(m[1]);
      for (let k = 1; k <= total; k++) {
        const href = k === 1 ? 'href="/conteudos"' : `href="/conteudos?pagina=${k}"`;
        if (k === n)
          expect(out).toMatch(/aria-current="page"><span class="sr-only">Página <\/span>\d/);
        else expect(out).toContain(href);
      }
    }
    expect([...vistos].sort()).toEqual(ROWS.map((r) => r.slug).sort());
  });

  it("página 1 mostra o destaque e um lote, não a lista inteira", async () => {
    const out = html(await carregar());
    expect(out.match(/class="ct-card"/g)).toHaveLength(POSTS_POR_PAGINA);
    expect(out).toContain('class="ct-featured"');
    expect(out).toContain(`${ROWS.length} artigos no índice · página 1 de`);
  });
});

describe("no navegador", () => {
  it("busca carrega o índice completo uma vez e acha artigo de outra página", async () => {
    const dados = await carregar();
    function Pagina() {
      const [q, setQ] = useState("");
      return <BewildConteudosPage page={dados.pagina} query={q} onQueryChange={setQ} />;
    }
    render(<Pagina />);
    expect(screen.queryByRole("link", { name: /Artigo 27/ })).toBeNull();
    const input = screen.getByRole("searchbox");
    fireEvent.focus(input);
    await act(async () => {
      fireEvent.change(input, { target: { value: "marcenaria" } });
    });
    await waitFor(() =>
      expect(document.querySelector('a[href="/conteudos/artigo-27"]')).not.toBeNull()
    );
    expect(selectSpy).toHaveBeenCalledTimes(1);
    expect(selectSpy.mock.calls[0][1].select).not.toMatch(/\b(body|faq|og_image)\b/);
    // Busca esconde a paginação (o resultado vale para todos os artigos).
    expect(document.querySelector(".ct-pager")).toBeNull();
  });

  it("filtro de categoria vale para todos os artigos, não só para a página", async () => {
    const dados = await carregar();
    render(<BewildConteudosPage page={dados.pagina} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reforma" }));
    });
    await waitFor(() =>
      expect(document.querySelectorAll(".ct-grid .ct-card")).toHaveLength(
        ROWS.filter((r) => r.category === "reforma" && !r.featured).length
      )
    );
  });

  it("página N: canonical e título do useSeo iguais aos do servidor, sem o texto do painel por cima", async () => {
    const dados = await carregar(2);
    const seo = seoDaPagina(
      { title: "Guias de reforma de studios e apartamentos | Bewild", description: "D" },
      2
    );
    render(
      <BewildConteudosPage
        page={dados.pagina}
        pagedSeo={{ ...seo, canonicalSearch: "?pagina=2" }}
      />
    );
    // Espera o segundo apply (settings do banco, com override da aba Páginas para /conteudos).
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      "https://bewild.com.br/conteudos?pagina=2"
    );
    expect(document.title).toBe("Guias de reforma de studios e apartamentos, página 2 | Bewild");
    expect(document.head.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(
      "https://bewild.com.br/conteudos?pagina=2"
    );
  });

  it("página 1 continua com o canonical /conteudos e o texto do painel", async () => {
    const dados = await carregar();
    render(<BewildConteudosPage page={dados.pagina} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      "https://bewild.com.br/conteudos"
    );
    expect(document.title).toBe("Título do painel | Bewild");
  });
});
