/**
 * utm.ts — preserva a origem da campanha (UTMs) entre páginas públicas.
 * Lê os parâmetros da URL atual; se não houver, cai no último valor visto
 * na sessão (sessionStorage), para não perder a campanha na navegação.
 */

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

const STORAGE_KEY = "bwa_utm";

export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

export function readUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  const fromUrl: UtmParams = {};
  const params = new URLSearchParams(window.location.search);
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) fromUrl[key] = value.slice(0, 120);
  }
  if (Object.keys(fromUrl).length > 0) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
    } catch {
      /* sessão indisponível: segue sem persistir */
    }
    return fromUrl;
  }
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as UtmParams;
  } catch {
    /* ignora JSON inválido */
  }
  return {};
}

/** Acrescenta as UTMs da sessão a um caminho interno (ex.: "/orcamento"). */
export function withUtm(path: string): string {
  const utm = readUtmParams();
  const entries = Object.entries(utm).filter(([, v]) => v);
  if (entries.length === 0) return path;
  const qs = new URLSearchParams(entries as [string, string][]).toString();
  return path + (path.includes("?") ? "&" : "?") + qs;
}
