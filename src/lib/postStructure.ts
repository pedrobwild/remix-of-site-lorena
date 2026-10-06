/**
 * Estrutura on-page dos artigos de /conteudos (plano "Blog: busca + IA",
 * 06/10/2026). Roda sobre o HTML JÁ sanitizado do corpo do post, no servidor
 * e no cliente (mesma saída nos dois, sem diferença de hidratação).
 *
 *  1. `extractPostCredits`: a maioria dos posts abre o corpo com a linha
 *     "Autor: … · Revisão técnica: …" (às vezes com "Atualizado em: dd/mm/aaaa"
 *     digitado à mão). Ela duplica o byline do cabeçalho, empurra a resposta
 *     direta para o 2º parágrafo (o trecho que Google e assistentes de IA mais
 *     citam) e a data manual diverge da data real do post. A linha sai do
 *     corpo; o revisor vira dado: aparece no cabeçalho e no JSON-LD
 *     (`reviewedBy`).
 *  2. `addHeadingAnchors`: H2/H3 ganham `id` estável (slug do texto). Isso
 *     permite o sumário "Neste artigo", links diretos para a seção
 *     (`#quanto-custa-por-metragem`), e dá a buscadores e IAs trechos
 *     endereçáveis. `id` não está na lista do sanitizador de propósito: é
 *     gerado aqui, a partir do texto, nunca vem do conteúdo.
 */

export type PostTocItem = { id: string; text: string; level: 2 | 3 };

export type PostCredits = {
  /** Nome do revisor como escrito no post ("Thiago Dantas", "Pedro Alves"). */
  reviewer: string | null;
  /** "técnica" | "editorial" quando o post diz. */
  reviewKind: string | null;
};

const decode = (s: string) =>
  s
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const textOf = (html: string) => decode(html.replace(/<\/?(?:p|h[1-6]|li|td|th|tr|br|div|figcaption|blockquote)\b[^>]*>/gi, " ").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

/** Primeiro parágrafo do corpo é a linha de créditos? (Autor/Revisão/Atualizado em) */
const CREDITS_RE = /^(?:atualizado em:?\s*[\d/.-]+\s*)?autor(?:a)?:\s/i;

/**
 * Remove a linha de créditos do início do corpo e devolve o revisor citado
 * nela. Só olha o PRIMEIRO parágrafo, e só quando ele começa por "Autor:" ou
 * "Atualizado em: … Autor:" — texto editorial nunca é tocado.
 */
export function extractPostCredits(html: string): { html: string; credits: PostCredits } {
  const none = { html, credits: { reviewer: null, reviewKind: null } };
  if (!html) return none;
  const m = html.match(/^\s*<p>([\s\S]*?)<\/p>\s*/i);
  if (!m) return none;
  const line = textOf(m[1]);
  if (!CREDITS_RE.test(line) || line.length > 400) return none;
  const rev = line.match(/revis[aã]o\s+(t[eé]cnica|editorial)?\s*:\s*([^,|·(]+)/i);
  const reviewer = rev?.[2]?.trim().replace(/[.;]+$/, "") || null;
  const reviewKind = rev?.[1] ? rev[1].toLowerCase().replace("tecnica", "técnica") : null;
  return { html: html.slice(m[0].length), credits: { reviewer, reviewKind } };
}

/** "Quanto custa, por m²?" → "quanto-custa-por-m2" */
export function headingSlug(text: string): string {
  const s = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return s || "secao";
}

/**
 * Dá `id` aos H2/H3 do corpo (únicos na página) e devolve o sumário.
 * Headings que já têm atributos ficam como estão (o sanitizador só deixa
 * passar `<h2>` sem `id`, então na prática todos recebem).
 */
export function addHeadingAnchors(html: string): { html: string; toc: PostTocItem[] } {
  const toc: PostTocItem[] = [];
  if (!html) return { html, toc };
  // ids que a página já usa fora do corpo
  const used = new Set(["main", "faq", "perguntas-frequentes"]);
  const out = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/gi, (tag, lvl: string, inner: string) => {
    const text = textOf(inner);
    if (!text) return tag;
    const base = headingSlug(text);
    let id = base;
    for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
    used.add(id);
    toc.push({ id, text, level: lvl === "2" ? 2 : 3 });
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`;
  });
  return { html: out, toc };
}

export type StructuredPostBody = { html: string; toc: PostTocItem[]; credits: PostCredits };

/** Pipeline completo, aplicado ao HTML já sanitizado. */
export function structurePostBody(sanitizedHtml: string): StructuredPostBody {
  const { html: noCredits, credits } = extractPostCredits(sanitizedHtml);
  const { html, toc } = addHeadingAnchors(noCredits);
  return { html, toc, credits };
}

/** Sumário só faz sentido com pelo menos 4 seções H2. */
export const TOC_MIN_SECTIONS = 4;

/** Palavras do corpo (texto visível), para `wordCount` no Article. */
export function bodyWordCount(html: string | null | undefined): number {
  if (!html) return 0;
  return textOf(html).split(" ").filter(Boolean).length;
}
