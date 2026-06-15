import { supabase } from "@/integrations/supabase/client";

/** Bucket público criado na FASE 1 — uploads de mídia do portfólio Bewild. */
export const BEWILD_BUCKET = "project-images";

/** Slugify simples: lowercase, sem acento, hífen. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Valida slug: minúsculo, números, hífen, sem início/fim em hífen. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug);
}

function safeName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
  const base = (dot >= 0 ? name.slice(0, dot) : name) || "img";
  return slugify(base).slice(0, 60) + ext;
}

/**
 * Sobe um arquivo único para `project-images/bewild/<folder>/<timestamp>-<nome>`
 * e devolve a URL pública. Sem reprocessamento — o admin sobe o arquivo como está.
 */
export async function uploadBewildImage(
  file: File,
  folder: string,
): Promise<string> {
  const cleanFolder = slugify(folder || "sem-slug") || "sem-slug";
  const path = `bewild/${cleanFolder}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from(BEWILD_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type || undefined,
    });
  if (error) throw error;
  const { data } = supabase.storage.from(BEWILD_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Tenta apagar um arquivo do bucket a partir da URL pública.
 * Falha silenciosamente: se o arquivo veio de fora ou já não existe,
 * não bloqueamos a operação de save.
 */
export async function deleteBewildImage(url: string): Promise<void> {
  try {
    const marker = `/${BEWILD_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx < 0) return;
    const path = url.slice(idx + marker.length);
    if (!path) return;
    await supabase.storage.from(BEWILD_BUCKET).remove([path]);
  } catch {
    /* ignora */
  }
}
