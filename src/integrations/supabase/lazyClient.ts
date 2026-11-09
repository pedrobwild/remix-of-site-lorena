/**
 * Acesso tardio ao cliente do Supabase.
 *
 * `import { supabase } from "@/integrations/supabase/client"` estático prende
 * o SDK inteiro (~55 kB gzip) no pacote que toda página pública baixa. Módulos
 * que só usam o cliente em alguma ação (envio de formulário, página 404,
 * leitura sem dado do servidor, painel) passam por aqui: o SDK é baixado na
 * primeira chamada e reaproveitado depois. Nos testes, o `vi.mock` do módulo
 * `client` continua valendo, porque o import dinâmico resolve o mesmo módulo.
 */
import type { supabase as SupabaseClientInstance } from "./client";

export type SupabaseClientType = typeof SupabaseClientInstance;

let pending: Promise<SupabaseClientType> | null = null;

export function getSupabase(): Promise<SupabaseClientType> {
  if (!pending) {
    pending = import("./client").then((m) => m.supabase);
    pending.catch(() => {
      pending = null;
    });
  }
  return pending;
}
