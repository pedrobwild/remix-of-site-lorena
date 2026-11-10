/**
 * Payload de hidratação do artigo (auditoria de SEO, rodada 4, 09/11/2026,
 * ação 11): tudo o que o loader de /conteudos/$slug devolve vai serializado
 * para o `<script data-tsr-stream-part>` do HTML. Antes o texto do artigo
 * aparecia três vezes no HTML (DOM + markdown cru + HTML sanitizado) e os três
 * relacionados vinham com o corpo inteiro.
 *
 * O banco falso aplica o `select` como o PostgREST: só volta a coluna pedida.
 */
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

const TRECHO = "Prazo de obra começa cinco dias úteis depois do projeto aprovado";
const VIDEO = "dQw4w9WgXcQ";

const PRINCIPAL = {
  id: "p-1",
  slug: "quanto-tempo-demora-reforma-apartamento",
  title: "Quanto tempo demora uma reforma de apartamento",
  meta_title: null,
  meta_description: "Prazo real de reforma em SP.",
  og_image: null,
  category: "reforma",
  excerpt: "Resumo do prazo.",
  cover_image: null,
  body: [
    "Autor: Pedro Alves · Revisão técnica: Thiago Dantas",
    "",
    `${TRECHO}, e não na assinatura do contrato.`,
    "",
    "## Etapa um",
    "",
    "Texto da etapa um.",
    "",
    "## Etapa dois",
    "",
    "Texto da etapa dois.",
    "",
    "## Etapa três",
    "",
    `<iframe src="https://www.youtube.com/embed/${VIDEO}" title="Vídeo da obra"></iframe>`,
    "",
    "## Etapa quatro",
    "",
    "Texto da etapa quatro.",
  ].join("\n"),
  faq: [{ q: "Quanto tempo?", a: "Depende da metragem." }],
  reading_time: 9,
  author: "Pedro Alves",
  featured: false,
  published: true,
  published_at: "2026-10-01T12:00:00+00:00",
  created_at: "2026-10-01T12:00:00+00:00",
  updated_at: "2026-10-02T12:00:00+00:00",
  content_updated_at: "2026-10-02T12:00:00+00:00",
  youtube_video_id: null,
};

const CORPO_RELACIONADO = "Texto inteiro de outro artigo que não pode ir para o payload deste.";
const RELACIONADOS = [1, 2, 3].map((n) => ({
  ...PRINCIPAL,
  id: `r-${n}`,
  slug: `relacionado-${n}`,
  title: `Relacionado ${n}`,
  excerpt: `Resumo ${n}`,
  meta_description: `Meta ${n}`,
  body: `${CORPO_RELACIONADO} (${n})`,
  faq: [{ q: `Pergunta ${n}?`, a: `Resposta ${n}.` }],
}));

const pedidos: string[] = [];

vi.mock("@/integrations/supabase/client", () => {
  const consulta = () => {
    let cols = "*";
    let slug: string | null = null;
    const pick = (row: Record<string, unknown>) =>
      cols === "*"
        ? row
        : Object.fromEntries(
            cols
              .split(",")
              .map((c) => c.trim())
              .filter((c) => c in row)
              .map((c) => [c, row[c]])
          );
    const b = {
      select: (c: string) => {
        cols = c;
        pedidos.push(c);
        return b;
      },
      eq: (col: string, v: unknown) => {
        if (col === "slug") slug = String(v);
        return b;
      },
      neq: () => b,
      order: () => b,
      limit: () => Promise.resolve({ data: RELACIONADOS.map(pick), error: null }),
      maybeSingle: () =>
        Promise.resolve({ data: slug === PRINCIPAL.slug ? pick(PRINCIPAL) : null, error: null }),
    };
    return b;
  };
  return {
    supabase: { from: () => consulta(), rpc: () => Promise.resolve({ data: null, error: null }) },
  };
});
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));

import { Route } from "@/routes/conteudos.$slug";
import BewildPostPage from "@/pages/BewildPostPage";
import type { BewildPost } from "@/lib/useBewildPosts";
import type { RelatedPost } from "@/lib/useBewildPost";

type Dados = {
  post: BewildPost;
  related: RelatedPost[];
  bodyHtml: string;
  head: { jsonLd: Record<string, unknown>[] | null };
};
const loader = Route.options.loader as unknown as (ctx: {
  params: { slug: string };
}) => Promise<Dados>;

const vezes = (texto: string, trecho: string) => texto.split(trecho).length - 1;

describe("loader de /conteudos/$slug: payload sem texto repetido", () => {
  it("o texto do artigo aparece uma vez só no que vai para o payload", async () => {
    const dados = await loader({ params: { slug: PRINCIPAL.slug } });
    const payload = JSON.stringify(dados);
    expect(vezes(payload, TRECHO)).toBe(1);
    expect(dados.bodyHtml).toContain(TRECHO);
    expect(dados.post.body).toBe("");
  });

  it("relacionados vêm só com as colunas do card, sem corpo, FAQ e meta", async () => {
    pedidos.length = 0;
    const dados = await loader({ params: { slug: PRINCIPAL.slug } });
    expect(dados.related).toHaveLength(3);
    for (const r of dados.related) {
      expect(Object.keys(r).sort()).toEqual([
        "category",
        "cover_image",
        "excerpt",
        "id",
        "reading_time",
        "slug",
        "title",
      ]);
    }
    expect(JSON.stringify(dados)).not.toContain(CORPO_RELACIONADO);
    // A consulta dos relacionados não pede o corpo ao banco.
    expect(pedidos.filter((c) => !/\bbody\b/.test(c))).toHaveLength(1);
  });

  it("JSON-LD continua lendo o corpo cru (vídeo do corpo, FAQ, revisor e contagem de palavras)", async () => {
    const dados = await loader({ params: { slug: PRINCIPAL.slug } });
    const ld = dados.head.jsonLd ?? [];
    const article = ld.find((n) => n["@type"] === "Article");
    expect(article?.wordCount).toBeGreaterThan(10);
    expect(ld.some((n) => n["@type"] === "VideoObject" && String(n.embedUrl).includes(VIDEO))).toBe(
      true
    );
    expect(ld.some((n) => n["@type"] === "FAQPage")).toBe(true);
  });

  it("a página monta o artigo inteiro a partir do bodyHtml: sumário, convite do topo, tempo de leitura e relacionados", async () => {
    const dados = await loader({ params: { slug: PRINCIPAL.slug } });
    const html = renderToString(
      <BewildPostPage
        slug={PRINCIPAL.slug}
        initial={{ post: dados.post, related: dados.related, bodyHtml: dados.bodyHtml }}
      />
    ).replace(/<!-- -->/g, "");
    expect(html).toContain(TRECHO);
    expect(html).toContain('aria-label="Neste artigo"');
    expect(html.match(/data-cta="artigo-topo-orcamento"/g)).toHaveLength(1);
    expect(html.indexOf(TRECHO)).toBeLessThan(html.indexOf('data-cta="artigo-topo-orcamento"'));
    expect(html).toContain("9 min de leitura");
    expect(html).toContain("Revisão técnica: ");
    expect(html).toContain('href="/conteudos/relacionado-1"');
    // A linha "Autor/Revisão" saiu do corpo (postStructure), como antes.
    expect(html).not.toContain("Autor: Pedro Alves · Revisão");
  });

  it("sem bodyHtml (sanitizador falhou) o corpo cru fica para o navegador converter", async () => {
    const { withoutRawBody } = await import("@/lib/contentLoaders");
    const post = { ...PRINCIPAL, faq: [] } as unknown as BewildPost;
    const seo = { title: "t", description: "d" } as never;
    expect(withoutRawBody({ seo, post, related: [], bodyHtml: null }).post?.body).toBe(
      PRINCIPAL.body
    );
    expect(withoutRawBody({ seo, post, related: [], bodyHtml: "" }).post?.body).toBe(
      PRINCIPAL.body
    );
    expect(withoutRawBody({ seo, post, related: [], bodyHtml: "<p>x</p>" }).post?.body).toBe("");
  });
});
