/**
 * Sufixo de marca nos títulos gerados (" | Bewild").
 *
 * O Google exibe cerca de 60 caracteres do <title> e reescreve ou corta o
 * resto (https://developers.google.com/search/docs/appearance/title-link).
 * Na auditoria de 06/10/2026, 85 páginas passavam de 60 — 63 projetos e as
 * 16 páginas de bairro — quase sempre por causa do sufixo. Regra: a marca só
 * entra quando cabe no visível; fora disso o título fica só com o que o
 * usuário procura (prédio, bairro, metragem). A marca segue em
 * `og:site_name`, no JSON-LD e na URL.
 */
export const BRAND_SUFFIX = " | Bewild";

/** Teto do que o Google costuma mostrar inteiro. */
export const VISIBLE_TITLE_MAX = 60;

/** `base + " | Bewild"` quando cabe em 60 caracteres; senão só `base`. */
export function brandTitle(base: string, max: number = VISIBLE_TITLE_MAX): string {
  const clean = base.trim();
  if (!clean) return "Bewild";
  if (clean.endsWith(BRAND_SUFFIX)) return brandTitle(clean.slice(0, -BRAND_SUFFIX.length), max);
  return clean.length + BRAND_SUFFIX.length <= max ? `${clean}${BRAND_SUFFIX}` : clean;
}
