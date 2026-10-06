/**
 * Converte uma URL pública do bucket `project-images` para o endpoint de
 * transformação de imagem do Storage (`/render/image/public/`), reduzindo
 * peso e melhorando o LCP das capas.
 *
 * Qualquer outra entrada (URL externa, caminho relativo, string vazia) é
 * devolvida inalterada.
 */
export function optimizedImageUrl(url: string, width = 1200, quality = 70): string {
  if (!url) return url;
  const marker = "/storage/v1/object/public/project-images/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  if (url.includes("/storage/v1/render/image/public/")) return url;

  const rendered = url.replace(marker, "/storage/v1/render/image/public/project-images/");
  const sep = rendered.includes("?") ? "&" : "?";
  return `${rendered}${sep}width=${width}&quality=${quality}`;
}

/** Larguras usadas no srcSet das capas do grid do portfólio. */
export const THUMB_WIDTHS = [480, 640, 960, 1280] as const;

/**
 * Monta o `srcSet` com o endpoint de transformação para URLs do bucket
 * `project-images`. Para outras URLs devolve `undefined` (sem srcSet).
 */
export function optimizedSrcSet(
  url: string,
  widths: readonly number[] = THUMB_WIDTHS,
  quality = 70,
): string | undefined {
  if (!url || optimizedImageUrl(url, widths[0], quality) === url) return undefined;
  return widths.map((w) => `${optimizedImageUrl(url, w, quality)} ${w}w`).join(", ");
}

/**
 * Página do projeto (/portfolio/:slug). Os originais do bucket são PNG de
 * ~3 MB (até 15 MB) e cada projeto tem ~22 fotos: servir o original fazia a
 * página pesar dezenas de MB. O endpoint de render entrega WebP redimensionado.
 */
/** Miniaturas da galeria (3 colunas no desktop, 1–2 no celular). */
export const GALLERY_WIDTHS = [480, 640, 960, 1280] as const;
/** Capa e itens largos da galeria (largura total, até 1540 px de layout). */
export const WIDE_WIDTHS = [640, 960, 1280, 1600, 1920, 2400] as const;
/** Visualizador em tela cheia. */
export const LIGHTBOX_WIDTHS = [960, 1280, 1600, 1920, 2400] as const;

/** `sizes` dos itens da galeria — espelha o grid de portfolio-detail.css. */
export const GALLERY_SIZES = "(max-width: 480px) 100vw, (max-width: 780px) 50vw, min(33vw, 520px)";
/** `sizes` da capa e dos itens largos (`.pd-wrap` limitado a 1540 px). */
export const WIDE_SIZES = "min(100vw, 1540px)";
/** `sizes` do antes/depois (2 colunas acima de 680 px). */
export const HALF_SIZES = "(max-width: 680px) 100vw, min(50vw, 770px)";

/**
 * Capas de /conteudos e do artigo. As capas são os originais do bucket (PNG de
 * 3 MB em média, até 10 MB): os cards as pediam inteiras — rolar a lista no
 * celular baixava dezenas de MB (MOB-06, 06/10/2026).
 */
/** `sizes` dos cards (3, 2 ou 1 coluna — `.ct-grid` em conteudos.css, `.pt-related__grid` em post.css). */
export const CONTENT_CARD_SIZES =
  "(max-width: 640px) calc(100vw - 40px), (max-width: 960px) 50vw, min(33vw, 500px)";
/** Card em destaque de /conteudos: largura total até 960 px; depois, ~55% do miolo. */
export const CONTENT_FEATURED_WIDTHS = [640, 960, 1280, 1600] as const;
export const CONTENT_FEATURED_SIZES = "(max-width: 960px) calc(100vw - 40px), min(55vw, 830px)";
/**
 * Capa do artigo: coluna de leitura de 880 px (`--pt-measure` em post.css).
 *
 * Até 700 px a moldura é 4:3 com `object-fit: cover`: uma capa 16:9 é
 * desenhada ~1,33× mais larga que a moldura. O `sizes` declara a largura da
 * moldura mesmo assim, de propósito: com o fator, quase todo celular atual
 * (densidade 2,6–3) pularia para o arquivo de 1760 px — mais pesado que os
 * 1200 px fixos de antes, na imagem principal da página. Do jeito que está,
 * nenhum celular baixa mais do que baixava, e só telas de 360 px com densidade
 * 2 ficam com o arquivo de 640 px (~1,5 px de imagem por px de tela).
 */
export const POST_COVER_WIDTHS = [640, 960, 1200, 1760] as const;
export const POST_COVER_SIZES = "(max-width: 920px) calc(100vw - 40px), 880px";

export type ResponsiveImage = { src: string; srcSet?: string };

/**
 * `src` + `srcSet` prontos para um <img>. O `src` (fallback e o que robôs
 * leem) usa `fallbackWidth`; URLs fora do bucket voltam como estão.
 */
export function responsiveImage(
  url: string,
  widths: readonly number[],
  fallbackWidth: number,
  quality = 70,
): ResponsiveImage {
  return {
    src: optimizedImageUrl(url, fallbackWidth, quality),
    srcSet: optimizedSrcSet(url, widths, quality),
  };
}

/**
 * `src` + `srcSet` + `sizes` para um <img>. `sizes` só acompanha `srcSet`: em
 * imagem fora do bucket (arquivo do site, outro bucket) não há variantes, e
 * um `sizes` solto só sujaria o HTML e o preload que o React gera.
 */
export function responsiveImageProps(
  url: string,
  widths: readonly number[],
  fallbackWidth: number,
  sizes: string,
  quality = 70,
): ResponsiveImage & { sizes?: string } {
  const image = responsiveImage(url, widths, fallbackWidth, quality);
  return image.srcSet ? { ...image, sizes } : { src: image.src };
}

/**
 * Capa da página do projeto. Usada no <img> e no preload do head() da rota
 * (`/portfolio/$slug`) — precisam gerar exatamente as mesmas URLs, senão o
 * navegador baixa a capa duas vezes.
 */
export function projectCoverImage(url: string): ResponsiveImage {
  return responsiveImage(url, WIDE_WIDTHS, 1280);
}
