/**
 * sitemap.xml e llms.txt gerados pelo servidor, a cada pedido, a partir do
 * banco (rotas src/routes/sitemap[.]xml.ts, llms[.]txt.ts e, via
 * src/server.ts, /.well-known/llms.txt).
 *
 * Por que no servidor: até 26/10/2026 os dois eram arquivos de public/
 * gravados no prebuild por scripts/generate-sitemap.mjs. No build da
 * hospedagem o script não tem a chave do banco e saía sem gravar, então o
 * arquivo publicado era sempre o último commitado à mão — o artigo de 22/10
 * ficou quatro dias fora do sitemap. Agora o conteúdo (projetos, bairros, artigos)
 * sai do banco na hora, com memo de 10 minutos; só o lastmod das páginas fixas
 * vem de src/content/sitemapLastmod.json, porque é data de commit e o servidor
 * não tem git (o script continua gravando esse arquivo).
 *
 * A regra de montagem é a de scripts/sitemap-build.mjs, compartilhada com o
 * script que grava o retrato dos testes (src/content/snapshots/). A edge
 * function `sitemap` do painel repete a regra (paridade conferida nos testes).
 */
import { supabase } from "@/integrations/supabase/client";
import { serverMemo } from "@/lib/serverMemo";
import videoMeta from "@/content/videoMeta.json";
import videoPages from "@/content/videoPages.json";
import lastmod from "@/content/sitemapLastmod.json";
import llmsTemplate from "@/content/llms.txt?raw";
import {
  buildLlmsTxt,
  buildSitemap,
  videoContext,
  type SitemapFaqRow,
  type SitemapPost,
  type SitemapProject,
} from "../../scripts/sitemap-build.mjs";

/** Validade do memo: uma publicação nova aparece em até 10 minutos. */
export const SITEMAP_MEMO_MS = 10 * 60_000;

/** Cabeçalho das duas respostas: o navegador revalida, a borda guarda 10 min e serve a cópia velha por um dia. */
export const SITEMAP_CACHE_CONTROL = "public, max-age=0, s-maxage=600, stale-while-revalidate=86400";

const ctx = videoContext(videoMeta, videoPages);

type Fontes = { projects: SitemapProject[]; posts: SitemapPost[]; faqRows: SitemapFaqRow[] };

/**
 * Projetos publicados e visíveis, artigos publicados e a FAQ ativa. Lança em
 * falha de rede: quem chama decide (a rota responde 503 e nunca um sitemap
 * vazio, que faria o Google esquecer as páginas).
 */
async function fetchFontes(): Promise<Fontes> {
  const [projects, posts, faq] = await Promise.all([
    supabase
      .from("projects")
      .select("slug, neighborhood, cover_url, created_at, content_updated_at")
      .eq("published", true)
      .eq("visible", true),
    supabase
      .from("bewild_posts")
      .select("slug, title, body, meta_description, excerpt, youtube_video_id, published_at, created_at, content_updated_at")
      .eq("published", true),
    supabase.from("assistant_kb").select("updated_at").eq("ativo", true),
  ]);
  if (projects.error) throw projects.error;
  if (posts.error) throw posts.error;
  if (faq.error) throw faq.error;
  return {
    projects: (projects.data ?? []) as SitemapProject[],
    posts: (posts.data ?? []) as SitemapPost[],
    faqRows: (faq.data ?? []) as SitemapFaqRow[],
  };
}

export type SitemapSaida = { xml: string; llms: string; urls: number; projetos: number; artigos: number };

/** Monta os dois textos a partir das linhas do banco (puro; exportado para os testes). */
export function montarSaida(fontes: Fontes): SitemapSaida {
  const sitemap = buildSitemap({ ...fontes, lastmod, ctx });
  const llms = buildLlmsTxt(llmsTemplate, {
    posts: fontes.posts,
    hoodUrls: sitemap.hoodUrls,
    videoEntries: sitemap.videoEntries,
  });
  return { xml: sitemap.xml, llms: llms.text, urls: sitemap.urls.length, projetos: fontes.projects.length, artigos: fontes.posts.length };
}

/**
 * sitemap.xml e llms.txt atuais, com memo de 10 minutos no servidor. Só um
 * resultado com projetos E artigos entra no memo: um banco vazio por falha
 * passageira não pode virar o sitemap de todo mundo por 10 minutos.
 */
export function loadSitemapSaida(): Promise<SitemapSaida> {
  return serverMemo("sitemap:saida", async () => montarSaida(await fetchFontes()), {
    ttlMs: SITEMAP_MEMO_MS,
    keep: (s) => s.projetos > 0 && s.artigos > 0,
  });
}

/** Resposta da rota: o texto com os cabeçalhos certos, ou 503 quando o banco não respondeu. */
export async function responderSitemap(tipo: "xml" | "llms"): Promise<Response> {
  let saida: SitemapSaida;
  try {
    saida = await loadSitemapSaida();
  } catch (err) {
    console.error("[sitemap] banco indisponível:", err);
    return new Response(tipo === "xml" ? "sitemap indisponível" : "llms.txt indisponível", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "retry-after": "60" },
    });
  }
  return new Response(tipo === "xml" ? saida.xml : saida.llms, {
    status: 200,
    headers: {
      "content-type": tipo === "xml" ? "application/xml; charset=utf-8" : "text/plain; charset=utf-8",
      "cache-control": SITEMAP_CACHE_CONTROL,
    },
  });
}
