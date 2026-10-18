import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { Button } from "@/guia/components/ui/button";
import { getGoogleAdsServiceReport } from "@/lib/googleAdsServiceReport.functions";
import { GOOGLE_ADS_WEIGHTS } from "@/lib/googleAdsServiceReport";
import { SERVICE_VARIANT_LABELS } from "@/lib/buttonClickReport";
import "@/styles/form-leads.css";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const PERIODS = [{ days: 7, label: "7 dias" }, { days: 30, label: "30 dias" }, { days: 90, label: "90 dias" }];

export default function GoogleAdsServicesPage() {
  const fetchReport = useServerFn(getGoogleAdsServiceReport);
  const [days, setDays] = useState(30);
  const input = useMemo(() => {
    const until = new Date(); until.setSeconds(0, 0);
    return { from: new Date(until.getTime() - days * 86_400_000).toISOString(), until: until.toISOString() };
  }, [days]);
  const report = useQuery({ queryKey: ["google-ads-services", input], queryFn: () => fetchReport({ data: input }), refetchInterval: 60_000 });
  const pages = useMemo(() => {
    const map = new Map<string, NonNullable<typeof report.data>["rows"]>();
    for (const row of report.data?.rows ?? []) map.set(row.page, [...(map.get(row.page) ?? []), row]);
    return [...map.entries()];
  }, [report.data]);

  return <BewildAdminShell active="googleads" title="Google Ads por serviço" actions={<Button variant="outline" className="min-h-11" disabled={report.isFetching} onClick={() => void report.refetch()}><RefreshCw aria-hidden />Atualizar</Button>}>
    <section className="form-leads" aria-label="Google Ads por página de serviço">
      <div className="form-leads__filters">
        <label>Período<select value={days} onChange={e => setDays(Number(e.target.value))}>{PERIODS.map(p => <option key={p.days} value={p.days}>{p.label}</option>)}</select></label>
      </div>
      <h2 className="font-semibold mt-4">Pesos de lance por finalidade</h2>
      <p className="text-sm text-muted-foreground">Valores enviados ao Google Ads para orientar os lances; não são receita nem valor de contrato.</p>
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 my-4">
        {GOOGLE_ADS_WEIGHTS.map(w => <div key={w.objetivo} className="min-w-0"><dt className="text-sm text-muted-foreground break-words">{w.objetivo}</dt><dd className="num">{w.weight === null ? "Sem peso" : money(w.weight)}</dd></div>)}
      </dl>
      <p className="text-sm text-muted-foreground mb-4">Cliques = botões da página de serviço. Conversões = pedidos de orçamento de quem entrou no site por essa página, conferidos no CRM.</p>
      {report.isPending ? <p role="status">Carregando cliques e conversões…</p>
        : report.isError ? <p role="alert">Não foi possível carregar o relatório. Tente atualizar.</p>
        : !pages.length ? <p>Nenhum clique ou pedido nas páginas de serviço no período.</p>
        : pages.map(([page, rows]) => <article key={page} className="border-b border-border py-4 min-w-0">
          <h3 className="font-semibold break-words">{page}</h3>
          {rows.map(row => <div key={row.campaign + row.variant} className="mt-3 min-w-0">
            <p className="break-words">{row.campaign} · <span className="text-muted-foreground">{SERVICE_VARIANT_LABELS[row.variant]}</span></p>
            <dl className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2 num">
              <div><dt className="text-sm text-muted-foreground">cliques</dt><dd>{row.clicks}</dd></div>
              <div><dt className="text-sm text-muted-foreground">sessões</dt><dd>{row.sessions}</dd></div>
              <div><dt className="text-sm text-muted-foreground">pedidos</dt><dd>{row.leads}</dd></div>
              <div><dt className="text-sm text-muted-foreground">no CRM</dt><dd>{row.unavailable > 0 ? `${row.confirmed} (${row.unavailable} sem leitura)` : row.confirmed}</dd></div>
              <div><dt className="text-sm text-muted-foreground">peso confirmado</dt><dd>{money(row.confirmedWeight)}</dd></div>
            </dl>
          </div>)}
        </article>)}
    </section>
  </BewildAdminShell>;
}
