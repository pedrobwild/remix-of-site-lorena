/**
 * Limpeza segura das fotos de projeto no storage.
 *
 * Antes, clicar em "×" numa foto apagava o arquivo NA HORA, antes de salvar.
 * Como a capa costuma ser a mesma URL da primeira foto da galeria (a
 * importação do Drive faz cover = urls[0]), remover a foto da galeria e
 * clicar em "Cancelar" deixava a página publicada com a capa quebrada.
 *
 * Agora o formulário só acumula as URLs que passaram por ele; depois de um
 * save bem-sucedido apagamos apenas as que:
 *  1. não aparecem em nenhum campo do registro salvo (capa, antes/depois,
 *     galerias) — comparando pelo caminho no bucket, não pela string;
 *  2. são arquivos do painel (`project-images/bewild/…`);
 *  3. não são usadas por nenhum OUTRO projeto (conferido no banco; se a
 *     conferência falhar, não apaga nada — sobra arquivo órfão, nunca foto
 *     quebrada no site).
 */
import { supabase } from "@/integrations/supabase/client";
import { deleteBewildImages, storagePathFromPublicUrl } from "@/lib/bewildAdmin";

export type ProjectImageFields = {
  cover_url?: string | null;
  before_image_url?: string | null;
  after_image_url?: string | null;
  gallery_urls?: readonly string[] | null;
  ready_gallery_urls?: readonly string[] | null;
};

/** Todas as URLs de imagem referenciadas por um projeto. */
export function projectImageUrls(p: ProjectImageFields): string[] {
  const out: string[] = [];
  for (const u of [p.cover_url, p.before_image_url, p.after_image_url]) if (u) out.push(u);
  for (const list of [p.gallery_urls, p.ready_gallery_urls]) {
    if (Array.isArray(list)) for (const u of list) if (u) out.push(u);
  }
  return out;
}

/** Chave de comparação: caminho no bucket quando é arquivo do painel, senão a URL sem query/hash. */
function imageKey(url: string, supabaseUrl?: string): string {
  const path =
    supabaseUrl === undefined
      ? storagePathFromPublicUrl(url)
      : storagePathFromPublicUrl(url, supabaseUrl);
  return path ?? url.split(/[?#]/)[0];
}

/**
 * Candidatas que NÃO aparecem no registro salvo (pura, testável).
 * Só devolve URLs de arquivos do painel — as demais nunca são apagadas.
 */
export function unreferencedImageUrls(
  candidates: Iterable<string>,
  saved: ProjectImageFields,
  supabaseUrl?: string,
): string[] {
  const inUse = new Set(projectImageUrls(saved).map((u) => imageKey(u, supabaseUrl)));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of candidates) {
    if (!url) continue;
    const path =
      supabaseUrl === undefined
        ? storagePathFromPublicUrl(url)
        : storagePathFromPublicUrl(url, supabaseUrl);
    if (!path) continue; // não é arquivo do painel
    if (inUse.has(path) || seen.has(path)) continue;
    seen.add(path);
    out.push(url);
  }
  return out;
}

/** Literal de array do Postgres com aspas (URLs têm `:` e `/`). */
function pgTextArray(values: readonly string[]): string {
  return `{${values.map((v) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`;
}

/**
 * URLs (entre as candidatas) usadas por outro projeto. Lança se qualquer
 * consulta falhar — quem chama deve então NÃO apagar.
 */
async function urlsUsedByOtherProjects(projectId: string, urls: string[]): Promise<Set<string>> {
  const scalar = ["cover_url", "before_image_url", "after_image_url"] as const;
  const arrays = ["gallery_urls", "ready_gallery_urls"] as const;
  const literal = pgTextArray(urls);

  const results = await Promise.all([
    ...scalar.map((col) =>
      supabase.from("projects").select(col).neq("id", projectId).in(col, urls),
    ),
    ...arrays.map((col) =>
      supabase.from("projects").select(col).neq("id", projectId).overlaps(col, literal),
    ),
  ]);

  const used = new Set<string>();
  const wanted = new Set(urls);
  for (const res of results) {
    if (res.error) throw new Error(res.error.message);
    for (const row of (res.data ?? []) as Record<string, unknown>[]) {
      for (const value of Object.values(row)) {
        const list = Array.isArray(value) ? value : [value];
        for (const u of list) if (typeof u === "string" && wanted.has(u)) used.add(u);
      }
    }
  }
  return used;
}

export type CleanupResult = { deleted: number; skipped: number; error: string | null };

/**
 * Depois de salvar o projeto: apaga do bucket as fotos que saíram do
 * formulário e não são usadas em mais nenhum lugar.
 */
export async function cleanupRemovedProjectImages(
  projectId: string,
  candidates: Iterable<string>,
  saved: ProjectImageFields,
): Promise<CleanupResult> {
  const orphans = unreferencedImageUrls(candidates, saved);
  if (orphans.length === 0) return { deleted: 0, skipped: 0, error: null };

  let usedElsewhere: Set<string>;
  try {
    usedElsewhere = await urlsUsedByOtherProjects(projectId, orphans);
  } catch (e) {
    return {
      deleted: 0,
      skipped: orphans.length,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const toDelete = orphans.filter((u) => !usedElsewhere.has(u));
  if (toDelete.length === 0) return { deleted: 0, skipped: orphans.length, error: null };
  const { error } = await deleteBewildImages(toDelete);
  return {
    deleted: error ? 0 : toDelete.length,
    skipped: orphans.length - toDelete.length,
    error,
  };
}
