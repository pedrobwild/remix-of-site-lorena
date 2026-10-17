import { decryptApiKey } from "@/lib/externalApiCrypto.server";

/** Somente chamadas internas já autorizadas; nunca retorna a chave ao navegador. */
export async function resolveEngineKey(fallback: string | null | undefined, encryptionSecret: string | null | undefined): Promise<string | null> {
  if (fallback) return fallback;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("external_api_connections").select("encrypted_key").eq("provider", "bwild_engine").maybeSingle();
  if (error) throw new Error("Não foi possível consultar a conexão do CRM.");
  if (!data) return null;
  if (!encryptionSecret) throw new Error("Proteção das chaves indisponível.");
  return decryptApiKey(data.encrypted_key, encryptionSecret);
}