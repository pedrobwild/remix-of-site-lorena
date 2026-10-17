import { createClient } from "@supabase/supabase-js";

// Mesma conexão pública de leitura do Radar; nunca usa a sessão do Bewild.
const url = "https://zxdjgifncmkvjbjmrjss.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Inp4ZGpnaWZuY21rdmpiam1yanNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Njc3OTEsImV4cCI6MjA4ODM0Mzc5MX0.erbsi5xpt66U-2cYD3yrriXbyIg3cINI6wbJ9YX6LAw";
const listeners = new Set<() => void>();
let close: (() => void) | undefined;

/** Os eventos são apenas avisos: não lê, registra nem guarda o payload. */
export function subscribeRadarCollections(listener: () => void) {
  listeners.add(listener);
  if (!close) {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const notify = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { for (const callback of listeners) callback(); }, 300);
    };
    const channel = client.channel("radar-coletas-abertas")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "radar_observacoes", filter: "cidade=eq.São Paulo" }, notify)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "radar_observacoes", filter: "cidade=eq.São Paulo" }, notify)
      .subscribe((status) => { if (status === "SUBSCRIBED") notify(); });
    close = () => { clearTimeout(timer); void client.removeChannel(channel); };
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { close?.(); close = undefined; }
  };
}