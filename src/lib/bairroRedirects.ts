/**
 * Páginas de bairro (/reforma/<slug>) que já estiveram no sitemap e deixaram de
 * existir (bairro caiu abaixo do mínimo de projetos). Cada uma responde 301
 * para o bairro vizinho que existe, ou para /onde-atuamos. Só acrescentar:
 * URL que o Google já indexou não pode virar 404.
 */
export const BAIRRO_REDIRECTS: Record<string, string> = {
  // 13/10/2026: Santo Amaro caiu de 3 para 2 projetos após a correção de bairros.
  "santo-amaro": "/reforma/brooklin",
};

export function bairroRedirectTarget(slug: string): string | null {
  return BAIRRO_REDIRECTS[slug] ?? null;
}
