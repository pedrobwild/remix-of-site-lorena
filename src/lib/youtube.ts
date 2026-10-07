/**
 * Utilitários de YouTube para o corpo dos artigos.
 *
 * O editor do admin aceita qualquer link comum do YouTube e grava SEMPRE o
 * player no formato `https://www.youtube-nocookie.com/embed/<ID>` — único
 * formato de `<iframe>` que o sanitizador deixa passar (ver sanitizeHtml.ts).
 * O mesmo ID alimenta o VideoObject do JSON-LD, que é o que o Google usa para
 * indexar o vídeo na página.
 */

const ID = /^[A-Za-z0-9_-]{11}$/;

export const YOUTUBE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

/** Só aceita `src` de embed do YouTube (youtube.com ou youtube-nocookie.com). */
const EMBED_SRC = /^https:\/\/(?:www\.)?(?:youtube-nocookie\.com|youtube\.com)\/embed\/([A-Za-z0-9_-]{11})(?:[?#].*)?$/i;

/** Extrai o ID de um link do YouTube (watch, youtu.be, shorts, live, embed). */
export function parseYouTubeId(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  if (ID.test(raw)) return raw;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
  let candidate: string | null = null;
  if (host === "youtu.be") {
    candidate = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "watch") candidate = url.searchParams.get("v");
    else if (["embed", "shorts", "live", "v"].includes(parts[0] ?? "")) candidate = parts[1] ?? null;
  }
  return candidate && ID.test(candidate) ? candidate : null;
}

/** ID de um `src` de iframe já no formato de embed; null se não for do YouTube. */
export function parseYouTubeEmbedSrc(src: string | null | undefined): string | null {
  const m = EMBED_SRC.exec((src ?? "").trim());
  return m ? m[1] : null;
}

/** Converte "467", "467s", "7m47s", "1h2m3s" ou "7:47" em segundos inteiros. */
export function parseYouTubeTime(raw: string | null | undefined): number | null {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return null;
  let total: number | null = null;
  if (/^\d+s?$/.test(v)) total = parseInt(v, 10);
  else if (/^(?:\d+h)?(?:\d+m)?(?:\d+s)?$/.test(v)) {
    const h = /(\d+)h/.exec(v), m = /(\d+)m/.exec(v), sec = /(\d+)s/.exec(v);
    total = (h ? +h[1] * 3600 : 0) + (m ? +m[1] * 60 : 0) + (sec ? +sec[1] : 0);
  } else if (/^\d+(?::\d{1,2}){1,2}$/.test(v)) {
    total = v.split(":").reduce((acc, n) => acc * 60 + parseInt(n, 10), 0);
  }
  return total && total > 0 && total < 86400 ? total : null;
}

/** Segundo inicial de um link comum do YouTube (`t=`, `start=` ou `#t=`). */
export function parseYouTubeStart(input: string | null | undefined): number | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  return (
    parseYouTubeTime(url.searchParams.get("start")) ??
    parseYouTubeTime(url.searchParams.get("t")) ??
    parseYouTubeTime(hash.get("t"))
  );
}

/** Segundo final de um embed do YouTube (`end=`), quando o trecho tem fim marcado. */
export function parseYouTubeEnd(input: string | null | undefined): number | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return parseYouTubeTime(url.searchParams.get("end"));
  } catch {
    return null;
  }
}

/** Duração ISO 8601 (`PT9M49S`) em segundos; null se vier vazia ou fora do formato. */
export function isoDurationSeconds(iso: string | null | undefined): number | null {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec((iso ?? "").trim());
  if (!m || (!m[1] && !m[2] && !m[3])) return null;
  const total = +(m[1] || 0) * 3600 + +(m[2] || 0) * 60 + +(m[3] || 0);
  return total > 0 ? total : null;
}

export function youtubeEmbedUrl(id: string, start?: number | null): string {
  const base = `${YOUTUBE_EMBED_ORIGIN}/embed/${id}`;
  return start && start > 0 ? `${base}?start=${Math.floor(start)}` : base;
}

export function youtubeThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Atributos do player gravados no corpo (mesma lista no cliente e no servidor). */
export const YOUTUBE_IFRAME_ALLOW =
  "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
export const YOUTUBE_IFRAME_REFERRER = "strict-origin-when-cross-origin";

/** Vídeos do YouTube presentes num corpo (HTML/markdown), sem repetir ID. */
export function extractYouTubeEmbeds(
  body: string | null | undefined,
): Array<{ id: string; title: string; start: number | null; end: number | null }> {
  const out: Array<{ id: string; title: string; start: number | null; end: number | null }> = [];
  const seen = new Set<string>();
  for (const m of (body ?? "").matchAll(/<iframe\b[^>]*>/gi)) {
    const tag = m[0];
    const src = /\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
    const srcUrl = (src?.[1] ?? src?.[2] ?? "").replace(/&amp;/g, "&");
    const id = parseYouTubeEmbedSrc(srcUrl);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const t = /\stitle\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
    const title = (t?.[1] ?? t?.[2] ?? "")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .trim();
    out.push({ id, title, start: parseYouTubeStart(srcUrl), end: parseYouTubeEnd(srcUrl) });
  }
  return out;
}
