import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import GoogleAdsQualityPanel from "@/components/admin/GoogleAdsQualityPanel";
import { Button } from "@/guia/components/ui/button";
import { getGoogleAdsServiceReport } from "@/lib/googleAdsServiceReport.functions";
import "@/styles/form-leads.css";

export default function GoogleAdsDisqualificationsPage() {
  const fetchReport = useServerFn(getGoogleAdsServiceReport);
  const [days, setDays] = useState(30);
  const input = useMemo(() => {
    const until = new Date(); until.setSeconds(0, 0);
    return { from: new Date(until.getTime() - days * 86_400_000).toISOString(), until: until.toISOString() };
  }, [days]);
  const report = useQuery({ queryKey: ["google-ads-services", input], queryFn: () => fetchReport({ data: input }), refetchInterval: 60_000 });
  return <BewildAdminShell active="desqualificacoes" title="Desqualificações · Google Ads" actions={<Button variant="outline" className="min-h-11" disabled={report.isFetching} onClick={() => void report.refetch()}><RefreshCw aria-hidden />Atualizar</Button>}>
    <section className="form-leads" aria-label="Desqualificações de leads do Google Ads">
      <div className="form-leads__filters"><label>Período<select value={days} onChange={event => setDays(Number(event.target.value))}>{[7, 30, 90].map(value => <option key={value} value={value}>{value} dias</option>)}</select></label></div>
      {report.isPending ? <p role="status">Carregando desqualificações…</p> : report.isError ? <p role="alert">Não foi possível carregar as desqualificações. Tente atualizar.</p> : report.data && <GoogleAdsQualityPanel leads={report.data.qualityLeads} />}
    </section>
  </BewildAdminShell>;
}