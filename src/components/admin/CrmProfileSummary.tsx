import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/guia/components/ui/button";
import { getCrmProfileSummary } from "@/lib/crmProfiles.functions";

export function CrmProfileSummary() {
  const read = useServerFn(getCrmProfileSummary);
  const query = useQuery({ queryKey: ["crm-profile-summary"], queryFn: () => read(), refetchInterval: 60_000 });
  const summary = query.data?.summary;
  return <section className="my-6 grid gap-3" aria-label="Resumo geral dos perfis">
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="font-semibold">Resumo geral · perfis do CRM</h2>
      <Button variant="outline" className="min-h-11" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw aria-hidden="true" />Atualizar perfis</Button>
    </div>
    {query.isPending ? <p role="status">Consultando perfis…</p>
      : query.isError || !query.data?.available || !summary ? <p role="alert" className="text-destructive">Resumo de perfis indisponível.</p>
      : <>
        <p className="text-muted-foreground">{summary.total_conversations.toLocaleString("pt-BR")} conversas analisadas no CRM · não representa clientes únicos.</p>
        {!summary.total_conversations ? <p>Nenhuma conversa analisada.</p> : <ul className="flex flex-wrap gap-x-6 gap-y-3">
          {summary.profiles.map((p) => <li key={p.profile_key}><strong>{p.profile_name}</strong> <span className="tabular-nums">{p.count.toLocaleString("pt-BR")} · {p.percentage}%</span></li>)}
        </ul>}
      </>}
  </section>;
}