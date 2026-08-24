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
