import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachCrmAuth } from "@/lib/crmAuth";
import { connectionMetadata, externalConnectionSchema } from "@/lib/externalApi";

export const listExternalConnections = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_admin");
    if (roleError || isAdmin !== true) throw new Error("Acesso restrito a administradores.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("external_api_connections")
      .select("id,name,provider,website_url,updated_at").order("updated_at", { ascending: false }).order("id").limit(1000);
    if (error) throw new Error("Não foi possível consultar as conexões.");
    return { connections: (data ?? []).map(row => connectionMetadata({ ...row, provider: row.provider === "bwild_engine" ? "bwild_engine" : "custom" })), engineConfigured: Boolean(process.env["BWILD_ENGINE_INTEGRATION_KEY"]) };
  });

export const saveExternalConnection = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) => externalConnectionSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_admin");
    if (roleError || isAdmin !== true) throw new Error("Acesso restrito a administradores.");
    const secret = process.env["EXTERNAL_API_ENCRYPTION_KEY"];
    if (!secret) throw new Error("Proteção das chaves indisponível.");
    const { encryptApiKey } = await import("@/lib/externalApiCrypto.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let id = data.id;
    if (data.provider === "bwild_engine") {
      const existing = await supabaseAdmin.from("external_api_connections").select("id").eq("provider", "bwild_engine").maybeSingle();
      if (existing.error) throw new Error("Não foi possível consultar a conexão.");
      id = existing.data?.id ?? id;
    }
    const row = { name: data.name, provider: data.provider, website_url: data.website_url, encrypted_key: await encryptApiKey(data.api_key, secret), updated_at: new Date().toISOString() };
    const result = id
      ? await supabaseAdmin.from("external_api_connections").update(row).eq("id", id).select("id").single()
      : await supabaseAdmin.from("external_api_connections").insert({ ...row, created_by: context.userId }).select("id").single();
    if (result.error) throw new Error("Não foi possível salvar a conexão.");
    return { saved: true };
  });

export const removeExternalConnection = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_admin");
    if (roleError || isAdmin !== true) throw new Error("Acesso restrito a administradores.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("external_api_connections").delete().eq("id", data.id);
    if (error) throw new Error("Não foi possível remover a conexão.");
    return { removed: true };
  });

export const testEngineConnection = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("is_admin");
    if (roleError || isAdmin !== true) throw new Error("Acesso restrito a administradores.");
    try {
      const { resolveEngineKey } = await import("@/lib/externalApi.server");
      const key = await resolveEngineKey(process.env["BWILD_ENGINE_INTEGRATION_KEY"], process.env["EXTERNAL_API_ENCRYPTION_KEY"]);
      if (!key) return { ok: false, message: "Nenhuma chave cadastrada para o Bwild Engine." };
      const { fetchEngineStages } = await import("@/lib/crmStageSync.server");
      await fetchEngineStages(key, { lead_ids: [] });
      return { ok: true, message: "Bwild Engine conectado. Consulta autorizada." };
    } catch { return { ok: false, message: "Não foi possível validar a conexão. Confira a chave e as permissões no Bwild Engine." }; }
  });