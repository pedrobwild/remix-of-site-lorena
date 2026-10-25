import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getLeadQualityDaily } from "@/lib/leadQualityDaily.functions";
import { RefreshCw } from "lucide-react";

export function LeadQualityDailyChart({ revision }: { revision: number }) {
  const read = useServerFn(getLeadQualityDaily);
  const query = useQuery({ queryKey: ["lead-quality-daily", revision], queryFn: () => read(), refetchInterval: 15000 });
  const data = query.data;
  const date = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return <section className="bw-admin__section min-w-0" aria-label="Qualificação diária">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Qualificação por dia · últimos 30 dias</h2>
      <button className="bw-admin__btn bw-admin__btn--sm" aria-label="Atualizar gráfico" title="Atualizar gráfico" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className="size-4" /></button>
    </div>
    {query.isPending ? <p role="status">Carregando marcações…</p> : query.isError ? <p role="alert">Não foi possível atualizar o gráfico.</p> : data && <>
      {data.daily.every(row => !row.qualified && !row.disqualified) ? <p className="text-muted-foreground">Nenhuma marcação no período.</p> : <div className="h-64 w-full min-w-0" role="img" aria-label="Leads qualificados e não qualificados por dia, horário de São Paulo">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={data.daily}>
          <CartesianGrid vertical={false} stroke="var(--bw-line)" />
          <XAxis dataKey="day" tickFormatter={value => String(value).slice(5).split("-").reverse().join("/")} fontSize={11} />
          <YAxis allowDecimals={false} width={30} fontSize={11} />
          <Tooltip labelFormatter={value => String(value).split("-").reverse().join("/")} />
          <Legend /><Bar name="Qualificados" dataKey="qualified" fill="var(--bw-navy)" /><Bar name="Não qualificados" dataKey="disqualified" fill="var(--bw-sky)" />
        </BarChart></ResponsiveContainer>
      </div>}
      <p className="text-sm text-muted-foreground">Marcações do site e do Engine · cada lead contado uma vez por situação em cada dia · atualização automática a cada 15 segundos.</p>
      <div className="mt-4 border-t border-border pt-3 text-sm" aria-live="polite">
        <strong>Google Ads</strong>
        <p>Conversões de qualificação: coleta externa · recebimento ainda não confirmado nesta tela.</p>
        <p>Lista de não qualificados: {data.delivery?.at ? `${data.delivery.status === "sent" ? (data.delivery.count ? `${data.delivery.count} registros enviados para processamento` : "Nenhum registro elegível para envio") : "Falha no último envio"} · ${date(data.delivery.at)}` : "Último envio indisponível"}.</p>
        <p className="text-muted-foreground">Somente com aceite de publicidade comprovado e atual. Envio para processamento não confirma atribuição no Google.</p>
        <p className="text-muted-foreground">Conferido em {date(data.checkedAt)}</p>
      </div>
    </>}
  </section>;
}