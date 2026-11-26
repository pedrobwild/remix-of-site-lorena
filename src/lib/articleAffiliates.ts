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
/** Qualquer marcação, mesmo com identificador errado (maiúscula, espaço, sublinhado). */
const MARCA = "\\[\\[produto:[^\\]\\n<]*\\]\\]";
/** O que pode cercar a marcação num parágrafo "só dela": o editor do painel grava `<br>`, `&nbsp;` e negrito. */
const RECHEIO = "(?:\\s|&nbsp;|<br\\s*/?>|</?(?:strong|em|b|i|u|span)>)";
/** Parágrafo que só tem marcações (uma ou mais): vira os cartões dos produtos ligados. */
const PARAGRAFO_DE_MARCAS = new RegExp(`<p>((?:${RECHEIO}|${MARCA})*${MARCA}(?:${RECHEIO}|${MARCA})*)</p>`, "g");
const MARCA_VALIDA = new RegExp(`\\[\\[produto:(${SLUG})\\]\\]`, "g");
const MARCA_QUALQUER = new RegExp(MARCA, "g");
/** Fica no lugar da marcação removida, para apagar só o elemento que ELA deixou vazio. */
const RASTRO = "@@bw-afiliado-removido@@";
const VAZIO_INLINE = new RegExp(`<(strong|em|b|i|u|span)>(?:\\s|&nbsp;|<br\\s*/?>|${RASTRO})*${RASTRO}(?:\\s|&nbsp;|<br\\s*/?>|${RASTRO})*</\\1>`, "g");
const VAZIO_BLOCO = new RegExp(`<(p|li|h[1-6])(?:\\s[^>]*)?>(?:\\s|&nbsp;|<br\\s*/?>|${RASTRO})*${RASTRO}(?:\\s|&nbsp;|<br\\s*/?>|${RASTRO})*</\\1>`, "g");
/** Marcação que o autor não fechou (`[[produto:tv`, `[[produto:tv]`): some, sem levar o resto da frase. */
const MARCA_ABERTA = /\s?\[\[produto:?[a-z0-9-]*\]?/gi;
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
  const nome = esc(p.nome);
  const img = imagemValida(p.imagem_url)
    ? `<img class="bw-afiliado__img" src="${esc(p.imagem_url)}" alt="${esc(p.imagem_alt?.trim() || p.nome)}" loading="lazy" decoding="async" width="160" height="160">`
    : "";
  const motivo = p.motivo?.trim() ? `<p class="bw-afiliado__motivo">${esc(p.motivo.trim())}</p>` : "";
  const projeto =
    p.projeto_slug && new RegExp(`^${SLUG}$`).test(p.projeto_slug)
      ? `<p class="bw-afiliado__projeto"><a href="/portfolio/${p.projeto_slug}">Veja em um projeto da Bewild</a></p>`
      : "";
  return (
    `<aside class="bw-afiliado" data-afiliado-card="${slug}" aria-label="Produto recomendado: ${nome}">${img}` +
    `<div class="bw-afiliado__txt"><p class="bw-afiliado__nome">${nome}</p>${motivo}${projeto}` +
    `<p class="bw-afiliado__acao"><a class="bw-afiliado__link" href="${esc(p.link_afiliado)}" rel="${REL_AFILIADO}" target="_blank" data-afiliado="${slug}" data-cta="afiliado-${slug}">` +
    `Ver no Mercado Livre<span class="sr-only">: ${nome} (abre em nova aba)</span></a></p>` +
    `<p class="bw-afiliado__aviso">${AVISO_AFILIADO}</p></div></aside>`
  );
}

/**
 * Link colado à mão: qualquer endereço do Mercado Livre conta (produto.,
 * lista., www., http ou https), não só os que o catálogo aceita. É critério de
 * marcação e aviso, nunca de validação de cadastro.
 */
export function isMercadoLivreUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.toLowerCase();
    return host === "meli.la" || /(^|\.)mercadolivre\.com(\.br)?$/.test(host);
  } catch {
    return false;
  }
}

/** `rel` e `target` certos em todo `<a>` que aponta para o Mercado Livre. Devolve se achou algum fora de cartão. */
function marcarLinks(html: string): { html: string; soltos: number } {
  let soltos = 0;
  const out = html.replace(/<a\b[^>]*>/gi, (tag) => {
    const href = /\shref\s*=\s*"([^"]*)"/i.exec(tag)?.[1];
    if (!href || !isMercadoLivreUrl(unescAttr(href))) return tag;
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
  if (!html.includes("[[produto") && !/meli\.la|mercadolivre\.com/i.test(html)) return html;

  const porSlug = new Map<string, ProdutoAfiliado>();
  for (const p of produtos) if (p.ativo && isAffiliateUrl(p.link_afiliado)) porSlug.set(p.slug, p);

  // 1. Parágrafo só de marcações: cartões dos produtos ligados (ou nada).
  // 2. Marcação em qualquer outro lugar: some; o elemento que ela deixou vazio
  //    (item de lista, título, negrito) some junto. Parágrafo vazio que já
  //    existia no artigo não é tocado.
  let comCartoes = html
    .replace(PARAGRAFO_DE_MARCAS, (_m, dentro: string) => {
      let cards = "";
      for (const m of dentro.matchAll(MARCA_VALIDA)) {
        const p = porSlug.get(m[1]);
        if (p) cards += affiliateCardHtml(p);
      }
      return cards;
    })
    .replace(MARCA_QUALQUER, RASTRO);
  if (comCartoes.includes(RASTRO)) {
    comCartoes = comCartoes
      .replace(VAZIO_INLINE, RASTRO)
      .replace(VAZIO_BLOCO, "")
      .replace(new RegExp(`\\s?${RASTRO}`, "g"), "");
  }

  if (comCartoes.includes("[[produto")) comCartoes = comCartoes.replace(MARCA_ABERTA, "");

  const { html: marcado, soltos } = marcarLinks(comCartoes);
  if (soltos > 0 && !marcado.includes("data-afiliado-aviso")) return marcado + AVISO_SOLTO;
  return marcado;
}
