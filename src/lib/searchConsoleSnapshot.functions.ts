import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachCrmAuth } from "@/lib/crmAuth";
import { snapshotRequest, cacheKey, isFresh } from "@/lib/searchConsoleSnapshot";

export const getSearchConsoleSnapshot = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) => snapshotRequest.parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("is_admin");
    if (role.error || role.data !== true) throw new Error("Acesso restrito a administradores.");
    const { readSnapshot } = await import("@/lib/searchConsoleSnapshot.server");
    return readSnapshot(context.supabase, data);
  });

export const refreshSearchConsoleSnapshot = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) => snapshotRequest.parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("is_admin");
    if (role.error || role.data !== true) throw new Error("Acesso restrito a administradores.");
    const secret = process.env["SEARCH_CONSOLE_CRON_SECRET"];
    if (secret) {
      const schedule = await context.supabase.rpc("prepare_search_console_daily_job", { p_secret: secret });
      if (schedule.error) throw new Error("Não foi possível preparar a atualização diária.");
    }
    const existing = await context.supabase.from("search_console_snapshots").select("refreshed_at,attempted_at,site_url").eq("cache_key", cacheKey(data)).maybeSingle();
    if (existing.error) throw new Error("Não foi possível ler a cópia do Search Console.");
    const { readSnapshot, refreshSnapshot } = await import("@/lib/searchConsoleSnapshot.server");
    if (isFresh(existing.data?.attempted_at ?? null)) return readSnapshot(context.supabase, data);
    const request = { ...data, site_url: data.site_url ?? existing.data?.site_url ?? undefined };
    try {
      const refreshed = await refreshSnapshot(context.supabase, request);
      if (refreshed.status === "selection_required") return refreshed;
      return readSnapshot(context.supabase, request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível atualizar o Google.";
      const failed = await context.supabase.from("search_console_snapshots").upsert({ cache_key: cacheKey(data), request, attempted_at: new Date().toISOString(), error: message });
      if (failed.error) throw new Error(message);
      return readSnapshot(context.supabase, request);
    }
  });