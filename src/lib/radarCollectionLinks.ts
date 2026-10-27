/** Artigos conferidos: citam diária média por bairro atribuída ao Radar Bewild. */
const RADAR_ADR_POSTS = new Set([
  "short-stay-brooklin-ocupacao-diaria-airbnb",
  "melhor-bairro-investir-studio-sao-paulo",
  "studio-airbnb-pinheiros-quanto-rende",
]);

/** Acréscimo editorial após o trecho de diária; nunca altera valores ou o texto existente. */
export function linkRadarCollectionsInHtml(html: string, slug: string): string {
  if (!RADAR_ADR_POSTS.has(slug) || /href=["']\/coletas-por-bairro["']/.test(html)) return html;
  const blocks = /<p\b[^>]*>[\s\S]*?<\/p>|<table\b[^>]*>[\s\S]*?<\/table>/gi;
  for (const match of html.matchAll(blocks)) {
    const text = match[0].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
    if (!/diária média/i.test(text) || !/Radar Bewild/i.test(text) || !/R\$\s*\d/.test(text)) continue;
    const end = (match.index ?? 0) + match[0].length;
    return `${html.slice(0, end)}\n<p>Veja as coletas que embasam esses números em <a href="/coletas-por-bairro">Coletas do Radar Bewild por bairro</a>.</p>${html.slice(end)}`;
  }
  return html;
}