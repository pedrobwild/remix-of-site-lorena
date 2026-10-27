/**
 * Leitura, no servidor, das configurações públicas do site
 * (`get_public_site_settings`: textos de SEO salvos em /admin/seo), com memo
 * curto no módulo.
 *
 * Por que o memo: até 25/10/2026 cada página pública consultava esse RPC de
 * duas a três vezes por visita, em sequência (loader do root, loader da rota
 * e o dos Bastidores em /servicos), e cada ida ao banco a partir da borda
 * custa centenas de milissegundos — parte dos 2,7 s de TTFB medidos no
 * celular. Com o memo, o isolate consulta uma vez a cada 60 s e as chamadas
 * simultâneas da mesma renderização compartilham a mesma promessa.
 *
 * 60 s é o atraso máximo para uma edição no painel aparecer no HTML do
 * servidor (o `useSeo` do cliente corrige na hora, como sempre fez). Quem
 * precisar do valor sem memo chama `readPublicSiteSettings({ fresh: true })`.
 */

export const SETTINGS_MEMO_MS = 60_000;
const TIMEOUT_MS = 2500;

type Settings = Record<string, unknown>;

let memo: { at: number; value: Settings | null } | null = null;
let inFlight: Promise<Settings | null> | null = null;

/**
 * URL e chave PÚBLICA do banco. Na Lovable chegam por `process.env`; na Vercel
 * (para onde bewild.com.br vai, decisão de 27/10/2026) não há essas variáveis, então cai
 * nas `VITE_*` que o build embute (as mesmas que o navegador já usa). Sem o
 * fallback, o HTML do servidor na Vercel saía com o SEO padrão em vez do
 * salvo em /admin/seo.
 */
export function publicSupabaseEnv(): { url: string | undefined; key: string | undefined } {
  return {
    url: process.env["SUPABASE_URL"] || import.meta.env.VITE_SUPABASE_URL || undefined,
    key: process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || undefined,
  };
}

async function fetchSettings(): Promise<Settings | null> {
  const { url, key } = publicSupabaseEnv();
  if (!url || !key) return null;
  try {
    const response = await fetch(`${url}/rest/v1/rpc/get_public_site_settings`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as unknown;
    return data && typeof data === "object" && !Array.isArray(data) ? (data as Settings) : null;
  } catch {
    return null;
  }
}

/** `null` = sem acesso ao banco (ou chaves ausentes): quem chama usa o padrão. */
export async function readPublicSiteSettings(opts?: { fresh?: boolean; now?: () => number }): Promise<Settings | null> {
  const now = opts?.now ?? Date.now;
  if (!opts?.fresh && memo && now() - memo.at < SETTINGS_MEMO_MS) return memo.value;
  if (!inFlight) {
    inFlight = fetchSettings()
      .then((value) => {
        // Falha não entra no memo: a próxima visita tenta de novo.
        if (value) memo = { at: now(), value };
        return value;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/** Só para testes. */
export function resetSiteSettingsMemo(): void {
  memo = null;
  inFlight = null;
}
