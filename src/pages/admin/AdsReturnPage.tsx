import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { Button } from "@/guia/components/ui/button";
import { getAdsReturnReport } from "@/lib/adsReturnReport.functions";
import "@/styles/form-leads.css";

const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

export default function AdsReturnPage() {
  const fetchReport = useServerFn(getAdsReturnReport);
  const report = useQuery({ queryKey: ["ads-return-crm"], queryFn: () => fetchReport(), refetchInterval: 60_000 });
  const rows = report.data?.rows ?? [];
  const confirmed = rows.reduce((s, r) => s + r.confirmed, 0);
  const real = rows.reduce((s, r) => s + (r.realValue ?? 0), 0);
  return <BewildAdminShell active="retornoads" title="Retorno real do Google Ads" actions={<Button variant="outline" className="min-h-11" disabled={report.isFetching} onClick={() => void report.refetch()}><RefreshCw aria-hidden />Atualizar</Button>}>
    <section className="form-leads" aria-label="Retorno real por campanha do Google Ads">
      <p className="text-sm text-muted-foreground mb-4">Por campanha: leads confirmados no CRM, peso médio de lance (R$ 5.000 ou R$ 1.000 pela finalidade — não é receita) e valor real dos contratos informado pelo CRM. Nada é estimado.</p>
      {report.isPending ? <p role="status">Consultando leads e CRM…</p>
        : report.isError ? <p role="alert">Não foi possível carregar o relatório. Tente atualizar.</p>
        : !rows.length ? <p>Nenhum lead do Google Ads encontrado.</p>
        : <>
          {!report.data.contractsAvailable && <p role="alert" className="mb-4">O CRM não devolveu os contratos: o valor real fica indisponível, não zero.</p>}
          <p className="num mb-4">{confirmed} leads confirmados · {report.data.contractsAvailable ? `${money(real)} em valor real` : "valor real indisponível"}</p>
          <div className="grid gap-4">
            {rows.map(r => <article key={r.campaign} className="border-b border-border pb-4 min-w-0">
              <h3 className="font-semibold break-words">{r.campaign}</h3>
              <dl className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2 num">
                <div><dt className="text-sm text-muted-foreground">leads</dt><dd>{r.leads}</dd></div>
                <div><dt className="text-sm text-muted-foreground">confirmados no CRM</dt><dd>{r.confirmed}{r.unchecked ? ` (${r.unchecked} sem leitura)` : ""}</dd></div>
                <div><dt className="text-sm text-muted-foreground">peso médio</dt><dd>{r.avgWeight === null ? "—" : money(r.avgWeight)}</dd></div>
                <div><dt className="text-sm text-muted-foreground">valor real</dt><dd>{r.realValue === null ? "indisponível" : r.withValue ? money(r.realValue) : "—"}</dd></div>
                <div><dt className="text-sm text-muted-foreground">contratos sem valor</dt><dd>{r.withoutValue}</dd></div>
              </dl>
            </article>)}
          </div>
        </>}
    </section>
  </BewildAdminShell>;
}
