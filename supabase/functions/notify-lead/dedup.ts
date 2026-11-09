// Deduplicação por `submission_id` (caixa de saída do site, 09/11/2026).
// Sem imports de rede: testado também pelo Vitest (src/lib/__tests__).

type PgError = { code?: string; message?: string } | null;

/** Coluna ainda não existe no banco (migration pendente). */
export function isMissingColumnError(error: PgError): boolean {
  if (!error) return false;
  return error.code === "PGRST204" || error.code === "42703" || /form_path/.test(error.message ?? "");
}

/** O pedaço do cliente do Supabase que a busca usa (facilita o teste). */
export type LeadLookupClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        limit(n: number): {
          maybeSingle(): PromiseLike<{ data: unknown; error: PgError }>;
        };
      };
    };
  };
};

/**
 * Lead já gravado com este `submission_id` (reenvio da caixa de saída do
 * site, ou resposta perdida no caminho)? `null` = não achou ou não deu para
 * conferir — inclusive antes da migration da coluna (42703/PGRST204): aí o
 * fluxo segue normal, como antes.
 */
export async function findLeadBySubmission(
  admin: LeadLookupClient,
  submissionId: string | null,
): Promise<string | null> {
  if (!submissionId) return null;
  try {
    const { data, error } = await admin
      .from("leads")
      .select("id")
      .eq("submission_id", submissionId)
      .limit(1)
      .maybeSingle();
    if (error) {
      if (!isMissingColumnError(error)) console.error("[notify-lead] dedup lookup failed", error.code ?? "unknown");
      return null;
    }
    const id = (data as { id?: unknown } | null)?.id;
    return typeof id === "string" ? id : null;
  } catch (err) {
    console.error("[notify-lead] dedup lookup threw", err instanceof Error ? err.name : "unknown");
    return null;
  }
}
