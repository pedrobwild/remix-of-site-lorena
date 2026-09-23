import { supabase } from "@/integrations/supabase/client";

/** Bucket público criado na FASE 1 — uploads de mídia do portfólio Bewild. */
export const BEWILD_BUCKET = "project-images";

/** Prefixo das fotos enviadas pelo painel e pela importação do Drive. */
export const BEWILD_PREFIX = "bewild/";

/** Slugify simples: lowercase, sem acento, hífen. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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

/** Formatos aceitos nas fotos de projeto (raster; SVG pode carregar script). */
export const BEWILD_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
const BEWILD_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
/** Tamanho máximo por foto. Fotos de câmera ficam em 3–12 MB. */
export const BEWILD_IMAGE_MAX_BYTES = 15 * 1024 * 1024;
/** Valor do atributo `accept` dos inputs de foto. */
export const BEWILD_IMAGE_ACCEPT = BEWILD_IMAGE_TYPES.join(",");

/**
 * Confere tipo e tamanho antes do upload. Devolve a mensagem de erro (pt-BR)
 * ou `null` quando o arquivo pode subir.
 */
export function validateBewildImageFile(file: Pick<File, "name" | "type" | "size">): string | null {
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  const typeOk = (BEWILD_IMAGE_TYPES as readonly string[]).includes(type);
  // Alguns navegadores deixam `type` vazio (ex.: AVIF em sistemas antigos):
  // aí vale a extensão.
  const extOk = !type && BEWILD_IMAGE_EXTS.some((ext) => name.endsWith(ext));
  if (!typeOk && !extOk) {
    return `"${file.name}" não é uma foto aceita. Use JPG, PNG, WebP ou AVIF.`;
  }
  if (file.size > BEWILD_IMAGE_MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1).replace(".", ",");
    return `"${file.name}" tem ${mb} MB. O limite é 15 MB por foto — reduza o arquivo e tente de novo.`;
  }
  return null;
}

/**
 * Sobe um arquivo único para `project-images/bewild/<folder>/<timestamp>-<nome>`
 * e devolve a URL pública. Sem reprocessamento — o admin sobe o arquivo como está.
 */
export async function uploadBewildImage(file: File, folder: string): Promise<string> {
  const invalid = validateBewildImageFile(file);
  if (invalid) throw new Error(invalid);
  const cleanFolder = slugify(folder || "sem-slug") || "sem-slug";
  const path = `${BEWILD_PREFIX}${cleanFolder}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(BEWILD_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BEWILD_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Caminho do objeto dentro do bucket a partir da URL pública (ou da URL de
 * transformação `/render/image/`). Ignora `?query` e `#hash` e decodifica
 * `%20` & cia. Devolve `null` para URLs de outro host, de outro bucket ou
 * fora do prefixo `bewild/` — nunca apagamos o que não foi o painel que subiu.
 *
 * `supabaseUrl` fica exposto para teste; por padrão usa `VITE_SUPABASE_URL`.
 */
export function storagePathFromPublicUrl(
  url: string | null | undefined,
  supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL,
  bucket: string = BEWILD_BUCKET,
): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (supabaseUrl) {
    try {
      if (new URL(supabaseUrl).origin !== parsed.origin) return null;
    } catch {
      return null;
    }
  }
  const prefixes = [
    `/storage/v1/object/public/${bucket}/`,
    `/storage/v1/render/image/public/${bucket}/`,
  ];
  const prefix = prefixes.find((p) => parsed.pathname.startsWith(p));
  if (!prefix) return null;
  let path: string;
  try {
    path = decodeURIComponent(parsed.pathname.slice(prefix.length));
  } catch {
    return null;
  }
  if (!path || !path.startsWith(BEWILD_PREFIX) || path.includes("..")) return null;
  return path;
}

/**
 * Apaga do bucket as fotos cujas URLs apontam para arquivos do painel.
 * URLs de fora (ou fora de `bewild/`) são ignoradas. Confere o `{ error }` —
 * o supabase-js não lança.
 */
export async function deleteBewildImages(
  urls: readonly string[],
): Promise<{ deleted: string[]; error: string | null }> {
  const paths = [
    ...new Set(urls.map((u) => storagePathFromPublicUrl(u)).filter((p): p is string => !!p)),
  ];
  if (paths.length === 0) return { deleted: [], error: null };
  const { data, error } = await supabase.storage.from(BEWILD_BUCKET).remove(paths);
  if (error) return { deleted: [], error: error.message };
  return { deleted: (data ?? []).map((o) => o.name), error: null };
}

/** Apaga uma foto do painel. Lança em caso de erro da API. */
export async function deleteBewildImage(url: string): Promise<void> {
  const { error } = await deleteBewildImages([url]);
  if (error) throw new Error(error);
}
