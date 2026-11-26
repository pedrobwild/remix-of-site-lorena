/**
 * Produtos afiliados dentro do artigo (26/11/2026, pedido do Pedro).
 *
 * Duas coisas, ambas no HTML JÁ sanitizado (o sanitizador troca o `rel` de
 * todo link com `target="_blank"`, então isto roda sempre depois dele):
 *
 *  1. um parágrafo só com `[[produto:slug]]` vira o cartão do produto daquele
 *     slug no catálogo (`produtos_afiliados`). Produto desligado, inexistente
 *     ou catálogo fora do ar: a marcação some, sem parágrafo vazio nem texto
 *     cru para o leitor;
 *  2. qualquer link para o Mercado Livre colado à mão no texto sai com
 *     `rel="sponsored nofollow noopener"`, em nova aba, e o artigo ganha o
 *     aviso de comissão uma vez, no fim.
 *
 * Funções puras, sem DOM: o servidor e o navegador geram a mesma string.
 * O clique é contado pelo delegate global de botões (`data-cta`), que já
 * respeita o aceite de cookies; nenhum script novo entra no artigo.
 */
import { AVISO_AFILIADO, isAffiliateUrl, type ProdutoAfiliado } from "@/lib/afiliados";

export const REL_AFILIADO = "sponsored nofollow noopener";

const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";
/** Parágrafo inteiro com a marcação (é assim que o `marked` devolve uma linha sozinha). */
const MARCA_PARAGRAFO = new RegExp(`<p>\\s*\\[\\[produto:(${SLUG})\\]\\]\\s*</p>`, "g");
/** Marcação solta (no meio de uma frase, com slug inválido etc.): só é removida. */
const MARCA_SOLTA = /\s?\[\[produto:[^\]\n]*\]\]/g;
const AVISO_SOLTO = `<p class="bw-afiliado__aviso" data-afiliado-aviso>${AVISO_AFILIADO}</p>`;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const unescAttr = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const imagemValida = (url: string | null): url is string => {
  if (!url) return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
};

/** Cartão de um produto. Sem título (h1–h6): não muda a hierarquia do artigo nem o sumário. */
export function affiliateCardHtml(p: ProdutoAfiliado): string {
  const slug = esc(p.slug);
  const img = imagemValida(p.imagem_url)
    ? `<img class="bw-afiliado__img" src="${esc(p.imagem_url)}" alt="${esc(p.imagem_alt?.trim() || p.nome)}" loading="lazy" decoding="async" width="160" height="160">`
    : "";
  const motivo = p.motivo?.trim() ? `<p class="bw-afiliado__motivo">${esc(p.motivo.trim())}</p>` : "";
  const projeto =
    p.projeto_slug && new RegExp(`^${SLUG}$`).test(p.projeto_slug)
      ? `<p class="bw-afiliado__projeto"><a href="/portfolio/${p.projeto_slug}">Veja em um projeto da Bewild</a></p>`
      : "";
  return (
    `<aside class="bw-afiliado" data-afiliado-card="${slug}" aria-label="Produto recomendado">${img}` +
    `<div class="bw-afiliado__txt"><p class="bw-afiliado__nome">${esc(p.nome)}</p>${motivo}${projeto}` +
    `<p class="bw-afiliado__acao"><a class="bw-afiliado__link" href="${esc(p.link_afiliado)}" rel="${REL_AFILIADO}" target="_blank" data-afiliado="${slug}" data-cta="afiliado-${slug}">` +
    `Ver no Mercado Livre<span class="sr-only"> (abre em nova aba)</span></a></p>` +
    `<p class="bw-afiliado__aviso">${AVISO_AFILIADO}</p></div></aside>`
  );
}

/** `rel` e `target` certos em todo `<a>` que aponta para o Mercado Livre. Devolve se achou algum fora de cartão. */
function marcarLinks(html: string): { html: string; soltos: number } {
  let soltos = 0;
  const out = html.replace(/<a\b[^>]*>/gi, (tag) => {
    const href = /\shref\s*=\s*"([^"]*)"/i.exec(tag)?.[1];
    if (!href || !isAffiliateUrl(unescAttr(href))) return tag;
    if (!/\sdata-afiliado="/.test(tag)) soltos++;
    const limpo = tag.replace(/\s(?:rel|target)\s*=\s*"[^"]*"/gi, "");
    return limpo.replace(/>$/, ` rel="${REL_AFILIADO}" target="_blank">`);
  });
  return { html: out, soltos };
}

/**
 * Aplica as duas regras ao HTML sanitizado do artigo. `produtos` vazio (catálogo
 * fora do ar, caminho de reserva do navegador) remove as marcações e ainda
 * marca os links colados à mão.
 */
export function applyAffiliates(html: string, produtos: readonly ProdutoAfiliado[]): string {
  if (!html) return html;
  if (!html.includes("[[produto:") && !/meli\.la|mercadolivre\.com/i.test(html)) return html;

  const porSlug = new Map<string, ProdutoAfiliado>();
  for (const p of produtos) if (p.ativo && isAffiliateUrl(p.link_afiliado)) porSlug.set(p.slug, p);

  const comCartoes = html
    .replace(MARCA_PARAGRAFO, (_m, slug: string) => {
      const p = porSlug.get(slug);
      return p ? affiliateCardHtml(p) : "";
    })
    .replace(MARCA_SOLTA, "");

  const { html: marcado, soltos } = marcarLinks(comCartoes);
  if (soltos > 0 && !marcado.includes("data-afiliado-aviso")) return marcado + AVISO_SOLTO;
  return marcado;
}
