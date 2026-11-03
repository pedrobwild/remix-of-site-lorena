import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { Button } from "@/guia/components/ui/button";
import { getGoogleAdsLeadsReport } from "@/lib/googleAdsLeadsReport.functions";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export default function GoogleAdsLeadsPanel() {
  const [from, setFrom] = useState(() => `${today().slice(0, 7)}-01`);
  const [to, setTo] = useState(today);
  const fetchReport = useServerFn(getGoogleAdsLeadsReport);
  const valid = Boolean(from && to && from <= to);
  const report = useQuery({ queryKey: ["google-ads-leads", from, to], queryFn: () => fetchReport({ data: { from, to } }), enabled: valid, staleTime: 60000, retry: false });
  const data = report.data;
  const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: data?.currency ?? "BRL" }).format(value);
  return <section className="min-w-0 space-y-6" aria-label="Resultados Google Ads">
    <h2 className="bw-admin__section-title">Google Ads{data ? ` · ${data.account}` : ""}</h2>
    <div className="flex flex-wrap items-end gap-4">
      <label className="grid gap-2">De<input type="date" className="min-h-11 max-w-full border border-border bg-background px-3" value={from} onChange={event => setFrom(event.target.value)} /></label>
      <label className="grid gap-2">Até<input type="date" className="min-h-11 max-w-full border border-border bg-background px-3" value={to} onChange={event => setTo(event.target.value)} /></label>
      <Button variant="outline" className="min-h-11" disabled={!valid || report.isFetching} onClick={() => void report.refetch()}><RefreshCw />Atualizar</Button>
    </div>
    {!valid ? <p role="alert">Escolha um período válido.</p> : report.isPending ? <p role="status">Consultando Google Ads…</p> : report.isError ? <p role="alert">{report.error.message}</p> : data && <>
      <dl className="grid grid-cols-1 gap-6 border-y border-border py-5 sm:grid-cols-2 lg:grid-cols-5 num">
        {[{ label: "Cliques", value: number.format(data.totals.clicks) }, { label: "Conversões do Ads", value: number.format(data.totals.conversions) }, { label: "Investimento", value: money(data.totals.cost) }, { label: "Pedidos atribuídos", value: number.format(data.requests) }, { label: "Custo por lead (pedido)", value: data.costPerLead === null ? "—" : money(data.costPerLead) }].map(item => <div key={item.label} className="min-w-0"><dt className="text-sm text-muted-foreground">{item.label}</dt><dd className="break-words text-2xl font-semibold">{item.value}</dd></div>)}
      </dl>
      <p className="text-sm text-muted-foreground">Todas as campanhas da conta · datas inclusivas no fuso {data.timeZone}. Conversões atribuídas pelo Google Ads não representam pessoas únicas. O custo por lead usa somente {data.requestAction ?? "a ação de pedido do formulário, indisponível na conta"}; qualificações e contratos não entram no denominador. Dados recentes podem mudar após o processamento do Google.</p>
      {!data.totals.clicks && !data.totals.cost && !data.totals.conversions && <p>Nenhuma atividade do Google Ads neste período.</p>}
      <div><h3 className="font-semibold">Conversões por ação</h3><div className="divide-y divide-border">{data.conversions.filter(action => action.allConversions > 0).map(action => <div key={action.id} className="flex flex-wrap justify-between gap-3 py-3"><span className="min-w-0 break-words">{action.name}</span><span className="num">{number.format(action.allConversions)}</span></div>)}</div></div>
      <p className="text-sm text-muted-foreground">Atualizado em {new Date(data.fetchedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · São Paulo</p>
    </>}
  </section>;
}