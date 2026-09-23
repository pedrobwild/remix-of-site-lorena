/**
 * Leitura/gravação de `site_settings` pelas telas de admin (SEO e
 * Configurações).
 *
 * As telas usavam `fetchSiteSettings`, que devolve os DEFAULTS do código
 * quando a leitura falha, e depois salvavam ~35 campos de uma vez: uma falha
 * momentânea de leitura + um clique em "salvar" apagava ID do Meta Pixel,
 * códigos de verificação, GTM, Google Ads… Aqui:
 *  - a leitura é direta e checa o erro (a tela não abre o formulário sem ela);
 *  - o save envia só os campos que mudaram em relação ao que foi lido;
 *  - colunas que ainda não existem no banco (ex.: `cnpj` antes da migração)
 *    são detectadas e ficam fora do save, com mensagem clara.
 */
import { supabase } from "@/integrations/supabase/client";

export type SettingsRow = Record<string, unknown>;
export type SettingsPatch = Record<string, string | null>;

/** Valor editável normalizado: string aparada ou `null` quando vazio. */
export function normalizeSettingValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

/**
 * Campos (entre `fields`) cujo valor atual difere do que foi carregado.
 * Compara normalizado, então "" e null contam como iguais e espaços nas
 * pontas não geram gravação.
 */
export function diffSettings(
  loaded: SettingsRow,
  current: SettingsRow,
  fields: readonly string[],
): SettingsPatch {
  const patch: SettingsPatch = {};
  for (const f of fields) {
    const before = normalizeSettingValue(loaded[f]);
    const after = normalizeSettingValue(current[f]);
    if (before !== after) patch[f] = after;
  }
  return patch;
}

/** Colunas pedidas que não vieram na linha lida — não existem no banco. */
export function missingColumns(row: SettingsRow, fields: readonly string[]): string[] {
  return fields.filter((f) => !Object.prototype.hasOwnProperty.call(row, f));
}

/** Traduz os erros mais comuns do PostgREST para uma mensagem acionável. */
export function settingsErrorMessage(error: { message?: string; code?: string } | null): string {
  if (!error) return "Erro desconhecido.";
  const msg = error.message ?? "";
  const col = msg.match(/Could not find the '([^']+)' column/i)?.[1];
  if (error.code === "PGRST204" || col) {
    return col
      ? `A coluna "${col}" ainda não existe na tabela site_settings do banco. Aplique a migração correspondente antes de editar esse campo.`
      : `Uma das colunas enviadas não existe em site_settings: ${msg}`;
  }
  if (error.code === "42501" || /permission|row-level security/i.test(msg)) {
    return "Sua sessão não tem permissão para alterar as configurações. Entre de novo no painel.";
  }
  if (/failed to fetch|network/i.test(msg)) {
    return "Sem conexão com o servidor. Verifique a internet e tente de novo.";
  }
  return msg || "Não foi possível concluir a operação.";
}

/** Lê a linha única (id = 1) de `site_settings`, com erro explícito. */
export async function loadSettingsRow(): Promise<{ row: SettingsRow | null; error: string | null }> {
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error) return { row: null, error: settingsErrorMessage(error) };
  if (!data) {
    return {
      row: null,
      error: "A linha de configurações (id = 1) não existe ou não está visível para esta conta.",
    };
  }
  return { row: data as SettingsRow, error: null };
}

/**
 * Grava só o `patch`. Pede a linha de volta: com RLS, um update sem
 * permissão não dá erro — só não altera nada.
 */
export async function saveSettingsPatch(
  patch: Record<string, unknown>,
): Promise<{ error: string | null }> {
  if (Object.keys(patch).length === 0) return { error: null };
  const { data, error } = await supabase
    .from("site_settings")
    .update(patch as never)
    .eq("id", 1)
    .select("id");
  if (error) return { error: settingsErrorMessage(error) };
  if (!data || data.length === 0) {
    return { error: "Nada foi gravado: a linha de configurações não foi encontrada ou sua conta não tem permissão." };
  }
  return { error: null };
}
