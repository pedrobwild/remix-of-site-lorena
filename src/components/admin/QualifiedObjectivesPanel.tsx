import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/guia/components/ui/button";
import { getQualifiedObjectives } from "@/lib/qualifiedObjectives.functions";
import GoogleAdsDeliveryStatus from "./GoogleAdsDeliveryStatus";

const day = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
export default function QualifiedObjectivesPanel() {
  const [from, setFrom] = useState(() => `${day().slice(0, 7)}-01`);
  const [until, setUntil] = useState(day);
  const fetchReport = useServerFn(getQualifiedObjectives);
  const valid = Boolean(from && until && from <= until);
  const report = useQuery({ queryKey: ["qualified-objectives", from, until], queryFn: () => fetchReport({ data: { from, until } }), enabled: valid, refetchInterval: 60000 });
  function download() {
    if (!report.data) return;
    const url = URL.createObjectURL(new Blob([report.data.csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `google-ads-qualificados-${from}-${until}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  return <section className="min-w-0 space-y-6" aria-label="Qualificados por objetivo">
    <header><h2 className="bw-admin__section-title">Qualificados por objetivo</h2><p className="text-sm text-muted-foreground">Período de criação do lead · horário de São Paulo</p></header>
    <div className="flex flex-wrap items-end gap-4">
      <label className="grid gap-2">De<input className="min-h-11 border border-border bg-background px-3" type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
      <label className="grid gap-2">Até<input className="min-h-11 border border-border bg-background px-3" type="date" value={until} onChange={event => setUntil(event.target.value)} /></label>
      <Button variant="outline" className="min-h-11" disabled={!valid || report.isFetching} onClick={() => void report.refetch()}><RefreshCw />Atualizar</Button>
      <Button className="min-h-11" disabled={!valid || !report.data?.exportCount || report.isFetching || report.isError} onClick={download}><Download />Exportar Google Ads</Button>
    </div>
    {!valid ? <p role="alert">Escolha um período válido.</p> : report.isPending ? <p role="status">Consultando qualificados…</p> : report.isError ? <p role="alert">Não foi possível carregar o painel. Tente atualizar.</p> : report.data && <>
      <dl className="grid grid-cols-2 gap-6 border-y border-border py-5 num"><div><dt className="text-sm text-muted-foreground">Qualificados</dt><dd className="text-2xl font-semibold">{report.data.total}</dd></div><div><dt className="text-sm text-muted-foreground">Conversões exportáveis</dt><dd className="text-2xl font-semibold">{report.data.exportCount}</dd></div></dl>
      {!report.data.groups.length ? <p>Nenhum lead qualificado no período.</p> : <div className="divide-y divide-border">{report.data.groups.map(group => <div key={group.objective} className="flex items-center justify-between gap-4 py-4"><span className="break-words">{group.objective}</span><strong className="num">{group.count}</strong></div>)}</div>}
      <p className="text-sm text-muted-foreground">CSV de Lead qualificado investidor · consentimento do formulário · janelas de 90 dias com clique e 63 sem clique · deduplicado. Download não confirma recebimento pelo Google Ads.</p>
    </>}
    <GoogleAdsDeliveryStatus />
  </section>;
}