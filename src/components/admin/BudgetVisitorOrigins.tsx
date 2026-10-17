import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/guia/components/ui/button";
import { LEAD_CANAL_LABEL } from "@/lib/leadSource";
import { budgetVisitorArrivals, type JourneyEvent } from "@/lib/originJourney";

export default function BudgetVisitorOrigins({ events }: { events: JourneyEvent[] }) {
  const rows = useMemo(() => budgetVisitorArrivals(events), [events]);
  const [page, setPage] = useState(0);
  const lastPage = Math.max(0, Math.ceil(rows.length / 20) - 1);
  const current = Math.min(page, lastPage);
  return <section aria-label="Origem dos visitantes do orçamento" className="min-w-0 space-y-4 border-t border-border pt-6">
    <h3>Visitantes que chegaram a /orcamento</h3>
    <p className="text-sm text-muted-foreground">Chegadas consentidas, uma por sessão. Identificadores anônimos válidos somente nesta lista, sem vínculo com pedidos. Sem referência registrada, a origem não pode ser comprovada.</p>
    {!rows.length ? <p>Nenhuma chegada consentida registrada no período.</p> : <>
      <ul className="grid min-w-0 gap-4 lg:grid-cols-2">{rows.slice(current * 20, current * 20 + 20).map((row) => <li key={row.key} className="min-w-0 space-y-3 border-t border-border pt-4">
        <div className="flex flex-wrap justify-between gap-2"><h4>{row.visitor}</h4><span className="text-sm num">{row.createdAt ? new Date(row.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "Data não informada"}</span></div>
        <dl className="grid min-w-0 grid-cols-2 gap-3 text-sm">{[
          ["Canal", LEAD_CANAL_LABEL[row.canal]], ["Origem registrada", row.source], ["Meio", row.medium],
          ["Campanha", row.campaign], ["Site de referência", row.reference],
        ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-muted-foreground">{label}</dt><dd className="break-words [overflow-wrap:anywhere]">{value}</dd></div>)}</dl>
      </li>)}</ul>
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm num">{rows.length.toLocaleString("pt-BR")} chegadas · Página {current + 1} de {lastPage + 1}</span><div className="flex gap-2">
        <Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label="Página anterior de visitantes" title="Página anterior" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft aria-hidden="true" /></Button>
        <Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label="Próxima página de visitantes" title="Próxima página" disabled={current === lastPage} onClick={() => setPage(current + 1)}><ChevronRight aria-hidden="true" /></Button>
      </div></div>
    </>}
  </section>;
}