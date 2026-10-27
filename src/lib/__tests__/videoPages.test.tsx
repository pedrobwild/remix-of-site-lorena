/**
 * Páginas de vídeo (/videos e /videos/<slug>) — 12/10/2026.
 *
 * O Google só indexa vídeo que está numa página de exibição: UM vídeo por
 * página, como assunto principal, com o player presente quando a página abre
 * (sem clique). Estes testes seguram as três coisas que fazem isso valer:
 *  1. o cadastro (src/content/videoPages.json + videoMeta.json) está completo;
 *  2. o HTML do servidor traz o player e o VideoObject certos;
 *  3. sitemap, funções de borda, llms.txt e artigos falam do mesmo vídeo com
 *     os mesmos dados.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// As páginas importam o cabeçalho, o rodapé e o useSeo, que instanciam o cliente
// do backend ao carregar. Aqui só interessa o miolo da página (player e textos).
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => new Promise(() => {}),
    from: () => ({ select: () => new Promise(() => {}) }),
  },
}));
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));
// useSeo vira um espião: o que a página pede ao <head> no navegador é conferido abaixo.
const useSeoSpy = vi.hoisted(() => vi.fn());
vi.mock("@/lib/useSeo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/useSeo")>()),
  useSeo: useSeoSpy,
}));

import VideoWatchPage from "@/pages/VideoWatchPage";
import VideosPage from "@/pages/VideosPage";
import { postJsonLd } from "@/lib/contentJsonLd";
import { Route as VideoRoute } from "@/routes/videos.$slug";
import { Route as VideosIndexRoute } from "@/routes/videos.index";
import { brandTitle, VISIBLE_TITLE_MAX } from "@/lib/seoTitle";
import type { BewildPost } from "@/lib/useBewildPosts";
import { parseRoutePath } from "@/lib/useHashRoute";
import {
  VIDEO_PAGES,
  VIDEOS_HUB_SEO,
  formatVideoDay,
  formatVideoDuration,
  videoEmbedUrl,
  videoPageBySlug,
  videoPageForPost,
  videoPagePath,
  videoPlayerSize,
} from "@/lib/videoPages";
import { isoDurationSeconds } from "@/lib/youtube";
// O gerador do sitemap é um script .mjs (roda no prebuild, fora do bundle).
import { postVideos, unpagedPostVideoIds, urlTag, videoLlmsLines, videoPageEntries } from "../../../scripts/generate-sitemap.mjs";

const root = path.resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const BASE = "https://bewild.com.br";
const ISO_COM_FUSO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

describe("cadastro dos vídeos", () => {
  it("tem páginas, com endereços únicos e em minúsculas com hífen", () => {
    expect(VIDEO_PAGES.length).toBeGreaterThan(0);
    const slugs = VIDEO_PAGES.map((v) => v.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(VIDEO_PAGES.map((v) => [v.slug, v] as const))("%s: um vídeo só, com os dados que o Google exige", (_slug, v) => {
    // Um vídeo por página: ou é do YouTube, ou é arquivo do site.
    expect(Boolean(v.youtubeId) !== Boolean(v.file)).toBe(true);
    if (v.youtubeId) expect(v.youtubeId).toMatch(/^[A-Za-z0-9_-]{11}$/);
    // name, thumbnailUrl e uploadDate são obrigatórios no VideoObject; a descrição é o texto da página.
    expect(v.name.length).toBeGreaterThan(10);
    expect(v.about.length).toBeGreaterThan(40);
    expect(v.thumbnail).toMatch(/^https:\/\/.+\.(jpe?g|png|webp|avif)$/);
    expect(v.uploadDate).toMatch(ISO_COM_FUSO);
    expect(Number.isNaN(Date.parse(v.uploadDate ?? ""))).toBe(false);
    if (v.duration) expect(isoDurationSeconds(v.duration)).toBeGreaterThan(0);
    expect(v.kind.trim()).not.toBe("");
  });

  it.each(VIDEO_PAGES.map((v) => [v.slug, v] as const))("%s: título e descrição da página cabem no que o Google mostra", (_slug, v) => {
    expect(brandTitle(v.title).length).toBeLessThanOrEqual(VISIBLE_TITLE_MAX);
    expect(v.description.length).toBeGreaterThanOrEqual(70);
    expect(v.description.length).toBeLessThanOrEqual(160);
  });

  it("títulos e descrições não se repetem entre as páginas", () => {
    for (const campo of ["title", "description", "name"] as const) {
      const valores = VIDEO_PAGES.map((v) => v[campo]);
      expect(new Set(valores).size, campo).toBe(valores.length);
    }
    expect(brandTitle(VIDEOS_HUB_SEO.title).length).toBeLessThanOrEqual(VISIBLE_TITLE_MAX);
    expect(VIDEOS_HUB_SEO.description.length).toBeLessThanOrEqual(160);
  });

  it("vídeo hospedado no site: capa e legendas existem, e o arquivo é o mesmo da home", () => {
    const proprios = VIDEO_PAGES.filter((v) => v.file);
    expect(proprios.length).toBeGreaterThan(0);
    const home = read("src/pages/home-bwa-body.ts");
    const asset = JSON.parse(read("src/assets/testimonials/depoimento-cliente.mp4.asset.json")) as { url: string };
    for (const v of proprios) {
      expect(v.thumbnailSrc.startsWith("/"), v.slug).toBe(true);
      expect(existsSync(path.join(root, "public", v.thumbnailSrc)), `capa de ${v.slug}`).toBe(true);
      if (v.captions) expect(existsSync(path.join(root, "public", v.captions)), `legendas de ${v.slug}`).toBe(true);
    }
    // Depoimento da Vivian: o mesmo arquivo que a home toca na janela de vídeo.
    const vivian = videoPageBySlug("depoimento-vivian");
    expect(vivian?.file).toBe(asset.url);
    expect(home).toContain(asset.url);
    expect(vivian?.captions && home.includes(vivian.captions)).toBe(true);
  });

  it("o player segue a proporção de cada vídeo", () => {
    // YouTube: 16:9. Sem tamanho no cadastro, vale o mesmo padrão.
    expect(videoPlayerSize({ width: 1280, height: 720 })).toEqual({ width: 960, height: 540, ratio: 1.7778 });
    for (const v of VIDEO_PAGES.filter((p) => p.youtubeId)) expect(videoPlayerSize(v).ratio).toBe(1.7778);
    // Depoimento da Vivian: gravado em pé. O arquivo tem 1024 × 576 com rotação de
    // 90° e 111,11 s (ffprobe no site publicado em 12/10/2026): na tela, 576 × 1024.
    const vivian = videoPageBySlug("depoimento-vivian")!;
    expect([vivian.width, vivian.height]).toEqual([576, 1024]);
    expect(videoPlayerSize(vivian)).toEqual({ width: 304, height: 540, ratio: 0.5625 });
    expect(vivian.duration).toBe("PT1M51S");
  });

  it("formata duração e data como a página mostra", () => {
    expect(formatVideoDuration("PT9M49S")).toBe("9 min 49 s");
    expect(formatVideoDuration("PT1H2M")).toBe("1 h 2 min");
    expect(formatVideoDuration("PT45S")).toBe("45 s");
    expect(formatVideoDuration(null)).toBe("");
    expect(formatVideoDay("2026-10-06T00:00:00-03:00")).toBe("06/10/2026");
    // 21:27 UTC ainda é dia 15 em São Paulo.
    expect(formatVideoDay("2026-06-15T21:27:27Z")).toBe("15/06/2026");
    expect(formatVideoDay(null)).toBe("");
  });
});

describe("HTML da página do vídeo", () => {
  it.each(VIDEO_PAGES.map((v) => [v.slug, v] as const))("%s: o player já vem no HTML, sem clique para carregar", (_slug, v) => {
    const html = renderToStaticMarkup(<VideoWatchPage video={v} />);
    const iframes = html.match(/<iframe\b[^>]*>/g) ?? [];
    const videos = html.match(/<video\b[^>]*>/g) ?? [];
    // Um player só (o Google indexa um vídeo por página).
    expect(iframes.length + videos.length).toBe(1);
    if (v.youtubeId) {
      expect(iframes[0]).toContain(`src="${videoEmbedUrl(v)}"`);
      expect(iframes[0]).toContain(`title="${v.name.replace(/"/g, "&quot;")}"`);
      // Carregamento imediato: nada de loading="lazy" nem miniatura no lugar do player.
      expect(iframes[0]).not.toMatch(/loading="lazy"/);
    } else {
      expect(html).toContain(`<source src="${v.file}" type="video/mp4"/>`);
      expect(videos[0]).toContain("controls");
      expect(videos[0]).toContain(`poster="${v.thumbnailSrc}"`);
      if (v.captions) expect(html).toContain(`src="${v.captions}"`);
    }
    expect(html).not.toMatch(/Reproduzir vídeo/);
    // Largura e altura no player, na proporção do vídeo: o Google precisa saber o
    // tamanho e a posição, e a caixa não pode mudar de tamanho depois de carregar.
    const size = videoPlayerSize(v);
    const player = (iframes[0] ?? videos[0]) as string;
    expect(player).toContain(`width="${size.width}"`);
    expect(player).toContain(`height="${size.height}"`);
    expect(html).toContain(`style="--vd-ratio:${size.ratio}"`);
    // O vídeo é o assunto da página: H1 com o nome dele, antes do player.
    const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1] ?? "";
    expect(h1.replace(/&quot;/g, '"')).toBe(v.name);
    expect(html.indexOf("<h1")).toBeLessThan(html.search(/<iframe|<video/));
    // Texto, artigo relacionado e os outros vídeos.
    expect(html.replace(/&quot;/g, '"')).toContain(v.about);
    if (v.post) expect(html).toContain(`href="/conteudos/${v.post.slug}"`);
    for (const outro of VIDEO_PAGES.filter((o) => o.slug !== v.slug)) {
      expect(html).toContain(`href="${videoPagePath(outro.slug)}"`);
    }
    expect(html).not.toContain(`href="${videoPagePath(v.slug)}"`);
    expect(html).toContain('href="/orcamento"');
  });

  it("o índice lista todas as páginas e não incorpora nenhum player", () => {
    const html = renderToStaticMarkup(<VideosPage />);
    for (const v of VIDEO_PAGES) expect(html).toContain(`href="${videoPagePath(v.slug)}"`);
    expect(html).not.toMatch(/<iframe|<video/);
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
  });

  it("a página do vídeo não usa a miniatura com clique dos artigos", () => {
    const fonte = read("src/pages/VideoWatchPage.tsx");
    expect(fonte).not.toMatch(/import PostYouTubeVideo|<PostYouTubeVideo/);
    expect(fonte).not.toMatch(/loading="lazy"/);
  });
});

describe("dados estruturados", () => {
  type Head = {
    meta: Array<Record<string, string>>;
    links: Array<Record<string, string>>;
    scripts: Array<{ children: string }>;
  };
  // O head() de verdade de cada rota: é ele que escreve o HTML que o Google lê.
  const headDoVideo = (slug: string, achou = true) =>
    (VideoRoute.options.head as unknown as (ctx: unknown) => Head)({ params: { slug }, loaderData: achou ? { slug } : undefined });
  const headDoIndice = () => (VideosIndexRoute.options.head as unknown as (ctx: unknown) => Head)({});
  const types = (scripts: Array<{ children: string }>) => scripts.map((s) => JSON.parse(s.children)["@type"] as string);

  it.each(VIDEO_PAGES.map((v) => [v.slug, v] as const))("%s: WebPage + VideoObject, com o vídeo como entidade principal", (_slug, v) => {
    const head = headDoVideo(v.slug);
    expect(head.meta.find((m) => "title" in m)?.title).toBe(brandTitle(v.title));
    expect(head.meta.find((m) => m.name === "description")?.content).toBe(v.description);
    expect(types(head.scripts)).toEqual(["WebPage", "VideoObject"]);
    const [page, video] = head.scripts.map((s) => JSON.parse(s.children));
    expect(video["@id"]).toBe(`${BASE}${videoPagePath(v.slug)}#video`);
    expect(page.mainEntity["@id"]).toBe(video["@id"]);
    expect(video.mainEntityOfPage["@id"]).toBe(page["@id"]);
    expect(page.breadcrumb.itemListElement.map((c: { name: string }) => c.name).slice(0, 2)).toEqual(["Início", "Vídeos"]);
    expect(video.name).toBe(v.name);
    expect(video.description).toBe(v.about);
    expect(video.thumbnailUrl).toEqual([v.thumbnail]);
    expect(video.uploadDate).toMatch(ISO_COM_FUSO);
    // Endereço do player (YouTube) OU do arquivo (vídeo do site), nunca a página do YouTube como arquivo.
    if (v.youtubeId) {
      expect(video.embedUrl).toBe(`https://www.youtube-nocookie.com/embed/${v.youtubeId}`);
      expect(video.contentUrl).toBeUndefined();
    } else {
      expect(video.contentUrl).toBe(`${BASE}${v.file}`);
      expect(video.embedUrl).toBeUndefined();
    }
    // A mesma miniatura na prévia de compartilhamento.
    expect(head.meta.find((m) => m.property === "og:image")?.content).toBe(v.thumbnail);
    expect(head.meta.find((m) => m.name === "robots")?.content).toMatch(/^index, follow/);
    expect(head.links.find((l) => l.rel === "canonical")?.href).toBe(`${BASE}${videoPagePath(v.slug)}`);
  });

  it("endereço fora do cadastro (404) não publica VideoObject e sai noindex", () => {
    const head = headDoVideo("nao-existe", false);
    expect(head.scripts).toEqual([]);
    expect(head.meta.find((m) => m.name === "robots")?.content).toBe("noindex, follow");
  });

  it("no navegador a página pede o mesmo endereço e continua indexável", () => {
    for (const v of VIDEO_PAGES) {
      useSeoSpy.mockClear();
      renderToStaticMarkup(<VideoWatchPage video={v} />);
      const pedido = useSeoSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(pedido.canonicalPath).toBe(videoPagePath(v.slug));
      expect(pedido.title).toBe(brandTitle(v.title));
      expect(pedido.ogImage).toBe(v.thumbnail);
      expect(pedido.noindex).toBeFalsy();
    }
    useSeoSpy.mockClear();
    renderToStaticMarkup(<VideosPage />);
    const indice = useSeoSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(indice.canonicalPath).toBe("/videos");
    expect(indice.noindex).toBeFalsy();
  });

  it("o índice é CollectionPage + ItemList, sem VideoObject", () => {
    const head = headDoIndice();
    expect(head.meta.find((m) => "title" in m)?.title).toBe(brandTitle(VIDEOS_HUB_SEO.title));
    expect(head.meta.find((m) => m.name === "robots")?.content).toMatch(/^index, follow/);
    expect(head.links.find((l) => l.rel === "canonical")?.href).toBe(`${BASE}/videos`);
    expect(types(head.scripts)).toEqual(["CollectionPage", "ItemList"]);
    const lista = JSON.parse(head.scripts[1].children);
    expect(lista.itemListElement.map((i: { url: string }) => i.url)).toEqual(VIDEO_PAGES.map((v) => `${BASE}${videoPagePath(v.slug)}`));
  });

  it("o artigo descreve o vídeo com os mesmos dados da página do vídeo", () => {
    const base = { id: "1", title: "Artigo", excerpt: "Resumo do artigo", author: "Pedro Alves", category: "reforma", published_at: "2026-09-22T05:45:27Z", created_at: "2026-09-22T05:45:27Z" };
    for (const v of VIDEO_PAGES.filter((p) => p.youtubeId && p.post)) {
      const noCorpo = { ...base, slug: v.post!.slug, body: `<iframe src="https://www.youtube-nocookie.com/embed/${v.youtubeId}"></iframe>` } as unknown as BewildPost;
      const naAbertura = { ...base, slug: v.post!.slug, body: "<p>Texto</p>", youtube_video_id: v.youtubeId } as unknown as BewildPost;
      for (const post of [noCorpo, naAbertura]) {
        const video = postJsonLd(post).find((n) => n["@type"] === "VideoObject") as Record<string, unknown>;
        expect(video.name, v.slug).toBe(v.name);
        expect(video.description, v.slug).toBe(v.about);
        expect(video.thumbnailUrl, v.slug).toEqual([v.thumbnail]);
        expect(video.uploadDate, v.slug).toBe(v.uploadDate);
      }
    }
  });

  it("só a página do vídeo publica VideoObject fora dos artigos", () => {
    // Em 12/10/2026, /faq e /contato publicaram o VideoObject da entrevista da
    // Record News sem mostrar o vídeo (nem o link). O Google pede que só se marque
    // o que a página mostra, e vídeo sem player na página não é indexado.
    const dir = path.join(root, "src/routes");
    const comVideo = readdirSync(dir)
      .filter((f) => f.endsWith(".tsx"))
      // Quem monta um VideoObject: videoObjectJsonLd, postVideoJsonLd, imprensaVideoJsonLd…
      // (videoListJsonLd, do índice, é só a lista de páginas e não entra). Comentários fora.
      .filter((f) => /VideoObject|[Vv]ideoObjectJsonLd|VideoJsonLd\b/.test(readFileSync(path.join(dir, f), "utf8").replace(/^\s*\/\/.*$/gm, "")));
    expect(comVideo).toEqual(["videos.$slug.tsx"]);
  });
});

describe("sitemap, rotas e links", () => {
  const entries = videoPageEntries() as Array<{
    slug: string;
    loc: string;
    video: { thumb: string; title: string; desc: string; player?: string; content?: string; secs: number | null; date: string | null };
  }>;

  it("o gerador do sitemap lê o mesmo cadastro, com os mesmos dados", () => {
    expect(entries.map((e) => e.slug)).toEqual(VIDEO_PAGES.map((v) => v.slug));
    for (const e of entries) {
      const v = videoPageBySlug(e.slug)!;
      expect(e.loc).toBe(`${BASE}${videoPagePath(v.slug)}`);
      // Mesma miniatura em todas as fontes: é o que o Google pede.
      expect(e.video.thumb).toBe(v.thumbnail);
      expect(e.video.title).toBe(v.name);
      expect(e.video.desc).toBe(v.about);
      expect(e.video.player).toBe(videoEmbedUrl(v) ?? undefined);
      expect(e.video.content).toBe(v.file ? `${BASE}${v.file}` : undefined);
      expect(e.video.secs).toBe(isoDurationSeconds(v.duration));
      expect(e.video.date).toBe(v.uploadDate);
    }
  });

  it("a entrada <video:video> sai bem formada", () => {
    const xml = urlTag({ loc: entries[0].loc, lastmod: "2026-10-12", changefreq: "monthly", priority: "0.6", videos: [entries[0].video] }) as string;
    expect(xml).toContain(`<loc>${entries[0].loc}</loc>`);
    expect(xml).toMatch(/<video:video><video:thumbnail_loc>https:\/\/[^<]+<\/video:thumbnail_loc><video:title>[^<]+<\/video:title><video:description>[^<]+<\/video:description><video:(player|content)_loc>https:\/\/[^<]+<\/video:\1_loc>/);
    expect(xml).toMatch(/<video:publication_date>\d{4}-\d{2}-\d{2}T[\d:.]+Z<\/video:publication_date>/);
  });

  it("retrato do sitemap: cada vídeo aparece uma vez, na página do vídeo", () => {
    const xml = read("src/content/snapshots/sitemap.xml");
    const urls = [...xml.matchAll(/<url>(.*?)<\/url>/gs)].map((m) => m[1]);
    const locDe = (u: string) => u.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "";
    for (const e of entries) {
      const doVideo = urls.filter((u) => locDe(u) === e.loc);
      expect(doVideo, e.loc).toHaveLength(1);
      expect(doVideo[0]).toContain(`<video:thumbnail_loc>${e.video.thumb}</video:thumbnail_loc>`);
      expect(doVideo[0]).toContain(e.video.player ? `<video:player_loc>${e.video.player}</video:player_loc>` : `<video:content_loc>${e.video.content}</video:content_loc>`);
    }
    expect(urls.some((u) => locDe(u) === `${BASE}/videos`)).toBe(true);
    // Nenhuma página fora de /videos/ leva a entrada de um vídeo que tem página própria.
    const ids = VIDEO_PAGES.map((v) => v.youtubeId ?? v.file ?? "");
    for (const u of urls.filter((x) => x.includes("<video:video>") && !locDe(x).startsWith(`${BASE}/videos/`))) {
      for (const id of ids) expect(u.includes(id), `${locDe(u)} repete o vídeo ${id}`).toBe(false);
    }
    // O artigo que cada página de vídeo indica existe (está publicado no sitemap).
    const locs = new Set(urls.map(locDe));
    for (const v of VIDEO_PAGES.filter((p) => p.post)) {
      expect(locs.has(`${BASE}/conteudos/${v.post!.slug}`), `artigo de ${v.slug}`).toBe(true);
    }
    // Toda URL /videos/<slug> do arquivo existe no cadastro.
    const noArquivo = urls.map(locDe).filter((l) => l.startsWith(`${BASE}/videos/`)).sort();
    expect(noArquivo).toEqual(entries.map((e) => e.loc).sort());
  });

  it("as funções de borda conhecem as mesmas páginas", () => {
    const slugs = VIDEO_PAGES.map((v) => v.slug);
    // Do "[" que abre a lista até o primeiro "]" depois dele.
    const lista = (fonte: string, inicio: RegExp) => {
      const m = inicio.exec(fonte);
      if (!m) return [];
      const bloco = fonte.slice(m.index + m[0].length);
      return [...bloco.slice(0, bloco.indexOf("]")).matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]);
    };
    const naoEncontrada = read("supabase/functions/not-found-check/index.ts");
    const sitemapDaBorda = read("supabase/functions/sitemap/index.ts");
    expect(lista(naoEncontrada, /VIDEO_SLUGS[^=]*=\s*\[/)).toEqual(slugs);
    expect(lista(sitemapDaBorda, /const videoUrls[^=]*=\s*\[/)).toEqual(slugs);
    // E usam a lista: a checagem responde 200 para a página e o sitemap a inclui.
    expect(naoEncontrada).toMatch(/path\.startsWith\("\/videos\/"\) && VIDEO_SLUGS\.includes\(/);
    expect(naoEncontrada).toContain('reason: "video_route"');
    expect(sitemapDaBorda).toMatch(/const all = \[[^\]]*\.\.\.videoUrls\]/);
    expect(sitemapDaBorda).toContain("loc: `${base}/videos/${slug}`");
  });

  it("o llms.txt lista as páginas de vídeo como o gerador escreve", () => {
    const llms = read("src/content/snapshots/llms.txt");
    const bloco = llms.slice(llms.indexOf("<!-- videos:start -->") + "<!-- videos:start -->".length, llms.indexOf("<!-- videos:end -->")).trim();
    expect(bloco.split("\n")).toEqual(videoLlmsLines());
    expect(llms).toContain("- [Vídeos](/videos):");
  });

  it("o roteador reconhece o índice e a página de cada vídeo", () => {
    expect(parseRoutePath("/videos")).toEqual({ name: "videos" });
    for (const v of VIDEO_PAGES) expect(parseRoutePath(videoPagePath(v.slug))).toEqual({ name: "video", slug: v.slug });
  });

  it("artigo, rodapé e mapa do site levam às páginas de vídeo", () => {
    for (const v of VIDEO_PAGES.filter((p) => p.post)) expect(videoPageForPost(v.post!.slug)?.slug).toBe(v.slug);
    expect(videoPageForPost("artigo-sem-video")).toBeNull();
    const artigo = read("src/pages/BewildPostPage.tsx");
    expect(artigo).toContain("const videoPage = post ? videoPageForPost(post.slug) : null;");
    expect(artigo).toMatch(/\{videoPage \? \([\s\S]{0,200}<a href=\{videoPagePath\(videoPage\.slug\)\}>/);
    expect(read("src/components/BwaFooter.tsx")).toContain('<a href="/videos">Vídeos</a>');
    expect(read("src/pages/MapaDoSitePage.tsx")).toMatch(/VIDEO_PAGES\.map\(\(v\) => \([\s\S]{0,120}<a href=\{routes\.video\(v\.slug\)\}>\{v\.name\}<\/a>/);
  });

  it("as políticas dizem que o vídeo do YouTube carrega com a página", () => {
    // O player aberto é exigência do Google para indexar; em troca, as políticas
    // precisam dizer isso (as outras incorporações só carregam com aceite ou clique).
    expect(VIDEO_PAGES.some((v) => v.youtubeId)).toBe(true);
    for (const pagina of ["src/pages/PrivacidadePage.tsx", "src/pages/PoliticaCookiesPage.tsx"]) {
      expect(read(pagina).replace(/\s+/g, " "), pagina).toMatch(/vídeos do YouTube das páginas de vídeo[^.]*youtube-nocookie\.com/);
    }
  });

  it("vídeo de artigo: com página própria sai do artigo; sem página, o gerador avisa", () => {
    const comPagina = VIDEO_PAGES.find((v) => v.youtubeId)!;
    const base = { slug: "artigo", title: "Artigo", published_at: "2026-09-01T00:00:00Z" };
    const iframe = (id: string) => `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Vídeo"></iframe>`;
    // Com página: nada no artigo (a entrada fica em /videos/<slug>) e nenhum aviso.
    expect(postVideos({ ...base, body: iframe(comPagina.youtubeId!) })).toEqual([]);
    expect(unpagedPostVideoIds({ ...base, body: iframe(comPagina.youtubeId!), youtube_video_id: comPagina.youtubeId })).toEqual([]);
    // Sem página: o do corpo continua no artigo (como era) e os dois entram no aviso.
    const semPagina = postVideos({ ...base, body: iframe("dQw4w9WgXcQ") }) as Array<{ id: string; player: string }>;
    expect(semPagina.map((v) => v.id)).toEqual(["dQw4w9WgXcQ"]);
    expect(semPagina[0].player).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    // O de abertura só toca com clique: não entra no sitemap, só no aviso.
    expect(postVideos({ ...base, body: "<p>x</p>", youtube_video_id: "aaaaaaaaaaa" })).toEqual([]);
    expect(unpagedPostVideoIds({ ...base, body: iframe("dQw4w9WgXcQ"), youtube_video_id: "aaaaaaaaaaa" })).toEqual(["aaaaaaaaaaa", "dQw4w9WgXcQ"]);
  });
});
