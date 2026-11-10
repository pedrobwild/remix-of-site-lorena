/**
 * Rótulo no nome (WCAG 2.5.3, regra `label-content-name-mismatch` do
 * Lighthouse; auditoria de SEO, rodada 4, 09/11/2026, ação 17b). Link ou botão
 * com texto visível e `aria-label` precisa ter o nome acessível COMEÇANDO pelo
 * texto visível: quem usa comando de voz fala o que vê ("Studio Pinheiros"),
 * e o leitor de tela anuncia o mesmo. O Lighthouse apontava os cards de
 * projeto da home ("Ver projeto …" com o texto do card) e os cards "Continue
 * lendo" do artigo ("Ler: …" com categoria, resumo e tempo de leitura).
 *
 * Regra prática: card cujo texto já descreve o destino não leva `aria-label`
 * (o nome vem do conteúdo); aviso extra ("abre em nova aba") vai DEPOIS do
 * texto visível, num `.sr-only`.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const rpcMock = vi.fn();
vi.mock("@/integrations/supabase/publicRest", () => ({
  publicRpc: (...args: unknown[]) => rpcMock(...args),
  publicSelect: async () => ({ data: [], error: null }),
}));

const POSTS = [1, 2, 3].map((n) => ({
  id: `id-${n}`,
  slug: `artigo-${n}`,
  title: `Quanto rende um studio ${n}`,
  meta_title: null,
  meta_description: `Meta ${n}`,
  category: "mercado",
  excerpt: `Resumo do artigo ${n}.`,
  cover_image: null,
  body: "Texto.",
  faq: [],
  reading_time: 7,
  author: "Pedro Alves",
  featured: n === 1,
  published: true,
  published_at: "2026-10-01T12:00:00+00:00",
  created_at: "2026-10-01T12:00:00+00:00",
}));

vi.mock("@/integrations/supabase/client", () => {
  const b: Record<string, unknown> = {};
  for (const k of ["select", "eq", "neq", "order", "limit"]) b[k] = () => b;
  b.then = (res: (v: unknown) => unknown) => res({ data: POSTS, error: null });
  b.maybeSingle = async () => ({ data: null, error: null });
  return { supabase: { from: () => b, rpc: async () => ({ data: null, error: null }) } };
});
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));

import { HOME_BWA_HTML } from "@/pages/home-bwa-body";
import { hydrateHomeProjects } from "@/lib/hydrateHomeProjects";
import BewildPostPage from "@/pages/BewildPostPage";
import BewildConteudosPage from "@/pages/BewildConteudosPage";
import BewildBuscaPage from "@/pages/BewildBuscaPage";
import type { BewildPost } from "@/lib/useBewildPosts";

/** Texto como o Lighthouse compara: minúsculas, só letras e números. */
const norm = (s: string) =>
  s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");

/** Texto visível do elemento (sem o que é escondido do leitor ou da tela). */
function textoVisivel(el: Element): string {
  const c = el.cloneNode(true) as Element;
  c.querySelectorAll('[aria-hidden="true"], .sr-only, svg, img, script, style').forEach((n) =>
    n.remove()
  );
  return c.textContent ?? "";
}

/** Links e botões com `aria-label` que não começa pelo texto visível. */
function problemas(root: ParentNode): string[] {
  const out: string[] = [];
  root
    .querySelectorAll(
      'a[aria-label], button[aria-label], [role="link"][aria-label], [role="button"][aria-label]'
    )
    .forEach((el) => {
      const visivel = norm(textoVisivel(el));
      if (!visivel) return; // só ícone/imagem: o aria-label é o nome
      const nome = norm(el.getAttribute("aria-label") ?? "");
      if (!nome.startsWith(visivel))
        out.push(
          `${el.getAttribute("aria-label")} ≠ "${textoVisivel(el).replace(/\s+/g, " ").trim()}"`
        );
    });
  return out;
}

const dom = (html: string) => {
  const box = document.createElement("div");
  box.innerHTML = html;
  return box;
};

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("o verificador pega o caso apontado pelo Lighthouse", () => {
  it('card com "Ver projeto …" e texto diferente falha; aviso de nova aba depois do texto passa', () => {
    expect(
      problemas(
        dom('<a href="/x" aria-label="Ver projeto Studio"><strong>Studio</strong> 24 m²</a>')
      )
    ).toHaveLength(1);
    expect(
      problemas(
        dom(
          '<a href="/x" aria-label="Guia (abre em nova aba)">Guia<span aria-hidden="true">↗</span></a>'
        )
      )
    ).toEqual([]);
    expect(
      problemas(dom('<a href="/x" aria-label="Bewild, início"><img alt="Bewild"></a>'))
    ).toEqual([]);
  });
});

describe("home", () => {
  it("HTML do servidor: nenhum aria-label que não comece pelo texto visível", () => {
    expect(problemas(dom(HOME_BWA_HTML))).toEqual([]);
  });

  it("vitrine de projetos (top_projects) também", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }));
    window.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    };
    localStorage.clear();
    rpcMock.mockResolvedValue({
      data: [1, 2, 3, 4].map((n) => ({
        slug: `studio-${n}`,
        title: `Studio ${n}`,
        cover_url: `https://cdn.exemplo.com/${n}.png`,
        project_type: "short_stay",
        neighborhood: "Pinheiros",
        location: null,
        area_m2: 28.21,
        duration: null,
        views: 5,
      })),
      error: null,
    });
    document.body.innerHTML = HOME_BWA_HTML;
    await hydrateHomeProjects();
    expect(
      document.querySelectorAll('.bwa-pslider a[href^="/portfolio/studio-"]').length
    ).toBeGreaterThan(0);
    expect(problemas(document.body)).toEqual([]);
  });
});

describe("artigo e listas de artigos", () => {
  it('"Continue lendo" e o link do Radar (nova aba) no artigo', () => {
    const post = {
      ...POSTS[0],
      slug: "quanto-rende-studio-short-stay-sao-paulo",
      category: "mercado",
    } as unknown as BewildPost;
    const html = renderToString(
      <BewildPostPage
        slug={post.slug}
        initial={{
          post,
          related: POSTS.slice(1) as unknown as BewildPost[],
          bodyHtml: "<p>Texto.</p>",
        }}
      />
    );
    const box = dom(html);
    expect(box.querySelectorAll(".pt-related .ct-card")).toHaveLength(2);
    const radar = box.querySelector('.pt-links a[href^="https://radarbewild.com.br"]');
    expect(radar).not.toBeNull();
    // O aviso de nova aba continua no nome, depois do texto visível.
    expect(radar!.textContent).toMatch(/\(abre em nova aba\)$/);
    expect(problemas(box)).toEqual([]);
  });

  it("/conteudos (destaque e cards) e /buscar", async () => {
    const { container } = render(<BewildConteudosPage />);
    await waitFor(() => expect(container.querySelector(".ct-featured")).not.toBeNull());
    expect(container.querySelectorAll(".ct-grid .ct-card").length).toBeGreaterThan(0);
    expect(problemas(container)).toEqual([]);
    cleanup();
    const busca = render(
      <BewildBuscaPage
        initialPosts={POSTS as unknown as BewildPost[]}
        query="studio"
        onQueryChange={() => {}}
      />
    );
    expect(busca.container.querySelectorAll(".ct-card").length).toBeGreaterThan(0);
    expect(problemas(busca.container)).toEqual([]);
  });
});

describe("código-fonte", () => {
  it('nenhum card volta a usar aria-label "Ver projeto …" ou "Ler: …" (o texto do card é o nome)', () => {
    const arquivos: string[] = [];
    const andar = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) {
          if (f !== "__tests__" && f !== "admin") andar(p);
        } else if (/\.(ts|tsx)$/.test(f) && !/\.test\./.test(f)) arquivos.push(p);
      }
    };
    andar(join(process.cwd(), "src"));
    const culpados = arquivos.filter((f) =>
      /aria-label=(\{`|\\?")(Ver projeto|Ler:)/.test(readFileSync(f, "utf8"))
    );
    expect(culpados).toEqual([]);
  });
});
