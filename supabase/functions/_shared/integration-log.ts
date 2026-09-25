// Registro de envios para plataformas externas na tabela `integration_log`
// (migration 20260925050543). Sem dados pessoais: só ids, status e códigos de
// erro. Nunca lança — o registro não pode derrubar quem chamou.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

export type IntegrationLogRow = {
  integration: string;
  event_name: string | null;
  lead_id: string | null;
  status: "sent" | "skipped" | "error";
  http_status?: number | null;
  detail?: Record<string, unknown> | null;
};

export async function logIntegration(admin: SupabaseClient | null, row: IntegrationLogRow): Promise<void> {
  if (!admin) return;
  try {
    const { error } = await admin.from("integration_log").insert({
      integration: row.integration,
      event_name: row.event_name,
      lead_id: row.lead_id,
      status: row.status,
      http_status: row.http_status ?? null,
      detail: row.detail ?? null,
    });
    if (error) console.warn("[integration_log] insert failed", error.code ?? "unknown");
  } catch {
    /* o registro nunca derruba o envio */
  }
}
