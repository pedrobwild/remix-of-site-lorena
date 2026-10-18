import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdsReturnReport } from "@/lib/adsReturnReport.functions";

const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

/** Receita real (contratos do CRM) por campanha — a mesma que vai ao Google Ads como "Contrato assinado". */
export default function AdsRevenuePanel() {
  const fetchReport = useServerFn(getAdsReturnReport);
  const report = useQuery({ queryKey: ["ads-return-crm"], queryFn: () => fetchReport(), refetchInterval: 60_000 });
  const rows = report.data?.rows ?? [];
  return <section aria-label="Receita real por campanha do Google Ads" className="mb-6 min-w-0">
    <h2 className="font-semibold mb-1">Receita real por campanha · Google Ads</h2>
    <p className="text-sm text-muted-foreground mb-3">Valor dos contratos assinados informado pelo CRM, o mesmo enviado ao Google Ads na conversão "Contrato assinado". Nada é estimado.</p>
    {report.isPending ? <p role="status">Consultando o CRM…</p>
      : report.isError ? <p role="alert">Não foi possível carregar a receita. Tente atualizar.</p>
      : !report.data.contractsAvailable ? <p role="alert">O CRM ainda não devolve os contratos: a receita fica indisponível, não zero.</p>
      : !rows.length ? <p>Nenhum lead do Google Ads encontrado.</p>
      : <ul className="grid gap-2">
        {rows.map(r => <li key={r.campaign} className="flex flex-wrap justify-between gap-2 border-b border-border pb-2 num">
          <span className="break-words min-w-0">{r.campaign}</span>
          <span>{r.contracts} contratos · {r.withValue ? money(r.realValue ?? 0) : "—"}{r.withoutValue ? ` · ${r.withoutValue} sem valor` : ""}</span>
        </li>)}
      </ul>}
  </section>;
}
