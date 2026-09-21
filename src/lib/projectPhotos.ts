/**
 * Classificação das fotos do portfólio.
 *
 * Cada projeto tem duas galerias:
 *  - `gallery_urls`: imagens do projeto 3D (renders). Tudo que já existia no
 *    portfólio está aqui.
 *  - `ready_gallery_urls`: fotos da obra pronta (apartamento entregue).
 *
 * A "tag" Obra pronta não é um campo à parte: um projeto é "Obra pronta"
 * quando tem ao menos uma foto da obra. Derivar em vez de gravar evita a tag
 * ficar inconsistente com o conteúdo (projeto marcado sem foto ou o inverso).
 */
export type PhotoKind = "projeto_3d" | "obra_pronta";

export const PHOTO_KIND_LABEL: Record<PhotoKind, string> = {
  projeto_3d: "Projeto 3D",
  obra_pronta: "Obra pronta",
};

export type WithGalleries = {
  gallery_urls?: string[] | null;
  ready_gallery_urls?: string[] | null;
};

const clean = (urls: string[] | null | undefined): string[] =>
  (urls ?? []).filter((u): u is string => typeof u === "string" && u.trim().length > 0);

/** Imagens do projeto 3D (renders). */
export function renderPhotos(p: WithGalleries | null | undefined): string[] {
  return clean(p?.gallery_urls);
}

/** Fotos da obra pronta. */
export function readyPhotos(p: WithGalleries | null | undefined): string[] {
  return clean(p?.ready_gallery_urls);
}

export function hasReadyPhotos(p: WithGalleries | null | undefined): boolean {
  return readyPhotos(p).length > 0;
}

export function photoKind(p: WithGalleries | null | undefined): PhotoKind {
  return hasReadyPhotos(p) ? "obra_pronta" : "projeto_3d";
}

export function photoKindLabel(p: WithGalleries | null | undefined): string {
  return PHOTO_KIND_LABEL[photoKind(p)];
}
