/**
 * Convite de orçamento no topo do artigo (auditoria de SEO, rodada 4,
 * 09/11/2026, ação 2).
 *
 * Os artigos recebem 84% das impressões do site e somavam 0 eventos-chave
 * como página de entrada orgânica; o único botão para /orcamento ficava no
 * fim do post. O convite entra logo depois do primeiro parágrafo, que é a
 * resposta direta do artigo, sem mexer em nenhum texto do post.
 *
 * Funções puras sobre o HTML já sanitizado: o servidor e o navegador geram a
 * mesma string, então não há diferença de hidratação. O clique sai pelo
 * delegate global (`reportButtonClick`), identificado por `data-cta`; o botão
 * do fim do post continua identificado pelo rótulo, como já era.
 */

/** Identificação do clique no relatório de botões (`click_cta` / `cta_click`). */
export const LEAD_CTA_ID = "artigo-topo-orcamento";

export type LeadCta = { text: string; label: string; href: string };

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Marcação do convite. Texto, rótulo e destino entram escapados. */
export function leadCtaHtml({ text, label, href }: LeadCta): string {
  return (
    `<aside class="pt-lead-cta" aria-label="Orçamento">` +
    `<p>${escapeHtml(text)}</p>` +
    `<a class="pt-btn" href="${escapeHtml(href)}" data-cta="${LEAD_CTA_ID}">${escapeHtml(label)} <span class="ar" aria-hidden="true">→</span></a>` +
    `</aside>`
  );
}

/** Tag de abertura ou fechamento; valores de atributo entre aspas podem conter ">". */
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
const VOID_TAGS = new Set([
  "area",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

/** Texto do trecho, sem tags nem espaço nas pontas ("" = só imagem, quebra ou espaço). */
const textOf = (inner: string) =>
  inner
    .replace(new RegExp(TAG.source, "g"), "")
    .replace(/&nbsp;|&#160;/g, " ")
    .trim();

/**
 * Insere `ctaHtml` depois do primeiro parágrafo de texto do corpo.
 *
 * Só vale parágrafo no nível de cima (nunca dentro de citação, lista, figura
 * ou tabela) e antes do primeiro H2: depois dele o texto já é de uma seção.
 * Parágrafo que termina em dois-pontos apresenta o bloco seguinte (lista,
 * tabela): o convite vai para depois desse bloco, para não separar os dois.
 * Sem parágrafo de abertura, o convite fica imediatamente antes do primeiro
 * H2. Corpo sem parágrafo de texto nem H2 volta como veio.
 */
export function insertLeadCta(html: string, ctaHtml: string): string {
  if (!html || !ctaHtml) return html;
  const insertAt = (index: number) => html.slice(0, index) + ctaHtml + html.slice(index);
  let depth = 0;
  let paragraphStart = -1;
  /** Fim do parágrafo de abertura que termina em dois-pontos (-1 = não é o caso). */
  let afterLead = -1;
  TAG.lastIndex = 0;
  for (let m = TAG.exec(html); m; m = TAG.exec(html)) {
    const [raw, closing, rawName, attrs] = m;
    const name = rawName.toLowerCase();
    if (VOID_TAGS.has(name) || attrs.trimEnd().endsWith("/")) continue;
    if (!closing) {
      if (depth === 0) {
        if (name === "h2") return insertAt(afterLead >= 0 ? afterLead : m.index);
        paragraphStart = name === "p" ? m.index + raw.length : -1;
      }
      depth += 1;
      continue;
    }
    depth = Math.max(0, depth - 1);
    if (depth !== 0) continue;
    const end = m.index + raw.length;
    // Fechou o bloco que o parágrafo de abertura apresentava.
    if (afterLead >= 0) return insertAt(end);
    if (name === "p" && paragraphStart >= 0) {
      const text = textOf(html.slice(paragraphStart, m.index));
      if (text.endsWith(":")) afterLead = end;
      else if (text) return insertAt(end);
      paragraphStart = -1;
    }
  }
  return afterLead >= 0 ? insertAt(afterLead) : html;
}
