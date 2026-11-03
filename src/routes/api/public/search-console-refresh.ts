import { createFileRoute } from "@tanstack/react-router";
import { safeEqual, snapshotRequest, cacheKey, SNAPSHOT_TTL } from "@/lib/searchConsoleSnapshot";
import { previousDays } from "@/lib/seoPanel";

export const Route = createFileRoute("/api/public/search-console-refresh")({
  server: { handlers: { POST: async ({ request }) => {
    const secret = process.env["SEARCH_CONSOLE_CRON_SECRET"];
    const given = request.headers.get("x-search-console-secret");
    const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
    if (!secret || !given || !safeEqual(secret, given)) return json(401, { error: "não autorizado" });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { refreshSnapshot } = await import("@/lib/searchConsoleSnapshot.server");
    const records = await supabaseAdmin.from("search_console_snapshots").select("request,site_url,attempted_at").order("attempted_at", { ascending: false }).order("cache_key").limit(20);
    if (records.error) return json(502, { error: "Falha ao ler as atualizações pendentes." });
    const requests = (records.data ?? []).map(r => snapshotRequest.parse(r.request));
    const selected = records.data?.find(r => r.site_url)?.site_url;
    if (selected) {
      const end = new Date(Date.now() - SNAPSHOT_TTL).toISOString().slice(0, 10);
      const start = new Date(new Date(end).getTime() - 27 * SNAPSHOT_TTL).toISOString().slice(0, 10);
      const previous = previousDays(start, end);
      requests.push({ start_date: start, end_date: end, prev_start_date: previous.start, prev_end_date: previous.end, site_url: selected });
    }
    let updated = 0;
    const seen = new Set<string>();
    try {
      for (const data of requests) {
        const key = cacheKey(data);
        if (seen.has(key)) continue;
        seen.add(key);
        let result;
        try {
          result = await refreshSnapshot(supabaseAdmin, data);
        } catch (error) {
          const failed = await supabaseAdmin.from("search_console_snapshots").upsert({ cache_key: key, request: data, attempted_at: new Date().toISOString(), error: error instanceof Error ? error.message : "Falha ao atualizar o Google." });
          if (failed.error) console.error("Não foi possível registrar falha de atualização Search Console.");
          throw error;
        }
        if (result.status === "selection_required") return json(409, { error: "Selecione a propriedade no painel." });
        updated++;
      }
      return json(200, { updated });
    } catch {
      return json(502, { error: "Atualização interrompida; a última cópia foi preservada.", updated });
    }
  } } },
});