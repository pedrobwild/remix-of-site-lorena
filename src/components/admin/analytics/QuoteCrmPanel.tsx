import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { Button } from "@/guia/components/ui/button";
import { getQuoteCrmReport } from "@/lib/quoteCrmReport.functions";
import { SERVICE_VARIANT_LABELS } from "@/lib/buttonClickReport";
import type { DateRange, Segment } from "./types";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function QuoteCrmPanel({ range, segments }: { range: DateRange; segments: Segment[] }) {
  const getReport = useServerFn(getQuoteCrmReport);
  const [refresh, setRefresh] = useState(0);
  const supported = segments.filter((segment): segment is Segment & { dim: "utm_source" | "utm_medium" | "utm_campaign" | "landing_path" } =>
    ["utm_source", "utm_medium", "utm_campaign", "landing_path"].includes(segment.dim));
  const input = { from: range.from.toISOString(), until: range.to.toISOString(), segments: supported };
  const report = useQuery({ queryKey: ["quote-crm-report", input, refresh], queryFn: () => getReport({ data: input }), refetchInterval: 60_000 });
  const totals = report.data?.rows.reduce((sum, row) => ({ requests: sum.requests + row.requests, confirmed: sum.confirmed + row.confirmed, unavailable: sum.unavailable + row.unavailable }), { requests: 0, confirmed: 0, unavailable: 0 });
  return <section className="aa-card min-w-0 mb-6" aria-label="Orçamento até o CRM">
    <div className="aa-card__head flex flex-wrap gap-3">
      <h3 className="aa-card__title">orçamento → CRM · Google Ads</h3>
      <Button variant="ghost" size="icon" title="Atualizar confirmação no CRM" aria-label="Atualizar confirmação no CRM" disabled={report.isFetching} onClick={() => setRefresh(value => value + 1)}><RefreshCw /></Button>
    </div>
    <p className="aa-faint mb-4">Pedidos do formulário /orcamento → negócio encontrado no CRM. Pesos atuais de lance por finalidade; não são receita, valor de contrato nem confirmação de recebimento pelo Google Ads.</p>
    {supported.length !== segments.length && <p className="aa-faint mb-4">Filtros de dispositivo, país e referência não se aplicam aos pedidos.</p>}
    {report.isPending ? <p role="status" className="aa-empty">Consultando pedidos e CRM…</p>
      : report.isError ? <p role="alert" className="aa-empty">Não foi possível conferir os pedidos. Tente atualizar.</p>
      : !totals?.requests ? <p className="aa-empty">Nenhum pedido de orçamento no período.</p>
      : <>
        <p className="aa-mono mb-4">{totals.requests} pedidos · {totals.confirmed} confirmados no CRM · {totals.unavailable > 0 ? "taxa indisponível: leitura incompleta" : `${(totals.confirmed / totals.requests * 100).toFixed(1)}% pedido → CRM`}</p>
        {totals.unavailable > 0 && <p role="status" className="aa-faint mb-4">{totals.unavailable} pedidos aguardam uma leitura válida do CRM; não foram tratados como falhas de entrega.</p>}
        <div className="grid gap-4">
          {report.data?.rows.map(row => <article key={JSON.stringify([row.campaign, row.variant, row.objetivo])} className="border-b border-border pb-4 min-w-0">
            <h4 className="break-words font-semibold">{row.campaign}</h4>
            <p className="aa-faint break-words">{SERVICE_VARIANT_LABELS[row.variant]} · {row.objetivo}</p>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 aa-mono">
              <div><dt className="aa-faint">pedidos</dt><dd>{row.requests}</dd></div>
              <div><dt className="aa-faint">CRM confirmado</dt><dd>{row.confirmed}</dd></div>
              <div><dt className="aa-faint">não encontrado</dt><dd>{row.notConfirmed}</dd></div>
              <div><dt className="aa-faint">peso por pedido</dt><dd>{row.weight === null ? "Não definido" : money(row.weight)}</dd></div>
            </dl>
          </article>)}
        </div>
      </>}
  </section>;
}