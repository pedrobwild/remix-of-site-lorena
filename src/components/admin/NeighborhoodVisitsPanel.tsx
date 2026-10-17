import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { summarizeNeighborhoodVisits, neighborhoodVisitorArrivals, neighborhoodVisitTime, VISIT_PATHS, type NeighborhoodEvent } from "@/lib/neighborhoodVisits";
import { LEAD_CANAL_LABEL } from "@/lib/leadSource";
import { Button } from "@/guia/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function NeighborhoodVisitsPanel() {
  const [days, setDays] = useState(30);
  const [events, setEvents] = useState<NeighborhoodEvent[] | null>(null);
  const [error, setError] = useState(false);
  const [bairroFilter, setBairroFilter] = useState("");
  const [page, setPage] = useState(0);
  useEffect(() => {
    let active = true;
    setEvents(null);
    setError(false);
    const until = new Date();
    const since = new Date(until.getTime() - days * 86400000);
    void (async () => {
      const rows: NeighborhoodEvent[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error: queryError } = await supabase.from("analytics_events")
          .select("id,created_at,event_type,path,session_id,visitor_id,value,utm_source,utm_medium,referrer")
          .in("path", [...VISIT_PATHS]).in("event_type", ["pageview", "click_cta"])
          .gte("created_at", since.toISOString()).lte("created_at", until.toISOString())
          .order("created_at", { ascending: true }).order("id", { ascending: true })
          .range(offset, offset + 999);
        if (!active) return;
        if (queryError) { setError(true); return; }
        rows.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      if (active) setEvents(rows);
    })().catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [days]);
  const reports = useMemo(() => summarizeNeighborhoodVisits(events ?? []), [events]);
  const arrivals = useMemo(() => neighborhoodVisitorArrivals(events ?? []), [events]);
  const filtered = arrivals.filter((row) => !bairroFilter.trim() || row.bairros.some((bairro) => bairro.toLocaleLowerCase("pt-BR").includes(bairroFilter.trim().toLocaleLowerCase("pt-BR"))));
  const lastPage = Math.max(0, Math.ceil(filtered.length / 20) - 1);
  const current = Math.min(page, lastPage);
  const number = (value: number) => value.toLocaleString("pt-BR");
  return (
    <section aria-label="Bairros de interesse" className="min-w-0 space-y-6">
      <h2>Bairros de interesse</h2>
      <label className="flex flex-wrap items-center gap-3">Período
        <select className="min-h-11 max-w-full" value={days} onChange={(e) => { setDays(Number(e.target.value)); setPage(0); }}>
          <option value={7}>Últimos 7 dias</option><option value={30}>Últimos 30 dias</option><option value={90}>Últimos 90 dias</option>
        </select>
      </label>
      <p className="text-sm text-muted-foreground">Bairro consultado nas coletas ou informado no orçamento, não a localização do visitante. Somente visitas com consentimento. Visitas sem bairro registrado permanecem não informadas.</p>
      {error ? <p role="alert">Não foi possível carregar as visitas. Tente mudar o período para consultar novamente.</p>
        : events === null ? <p role="status">Carregando visitas…</p>
        : <div className="grid min-w-0 gap-8 lg:grid-cols-2">{reports.map((report) => (
          <article key={report.path} className="min-w-0 space-y-4">
            <h3 className="break-words">{report.path === "/orcamento" ? "Pedidos de orçamento" : "Coletas por bairro"}</h3>
            <p className="break-all text-sm">{report.path}</p>
            <dl className="grid grid-cols-2 gap-4">
              <div><dt>Visitantes únicos</dt><dd className="num text-2xl font-semibold">{number(report.visitors)}</dd></div>
              <div><dt>Visitas</dt><dd className="num text-2xl font-semibold">{number(report.pageviews)}</dd></div>
            </dl>
            {report.pageviews === 0 ? <p>Nenhuma visita registrada no período.</p> : <>
              <p>Bairro não informado: <strong className="num">{number(report.unknown)}</strong> visitantes</p>
              {report.bairros.length === 0 ? <p>Nenhum bairro de interesse registrado no período.</p> : <ul className="space-y-4">{report.bairros.map((row) => (
                <li key={row.bairro} className="min-w-0">
                  <div className="flex items-start justify-between gap-3"><span className="min-w-0 break-words">{row.bairro}</span><strong className="num shrink-0">{number(row.visitors)}</strong></div>
                  <meter className="h-3 w-full" min={0} max={Math.max(report.visitors, 1)} value={row.visitors} aria-label={`${row.bairro}: ${row.visitors} visitantes`} />
                </li>
              ))}</ul>}
            </>}
          </article>
        ))}</div>}
      <p className="text-sm text-muted-foreground">Cada visitante conta uma vez por bairro e página no período. Quem consulta mais de um bairro aparece em ambos; a soma dos bairros não representa visitantes únicos totais.</p>
      {!error && events !== null && <section aria-label="Visitas por bairro, origem e horário" className="min-w-0 space-y-4 border-t border-border pt-6">
        <h3>Visitas por bairro, origem e horário</h3>
        <p className="text-sm text-muted-foreground">Uma chegada por sessão e página. Horários de São Paulo. Bairro informado na mesma visita, sem vínculo com pedidos. Origem ausente permanece não informada.</p>
        <label className="flex flex-wrap items-center gap-3">Filtrar bairro
          <input className="min-h-11 w-full max-w-sm rounded-md border border-input bg-background px-3 text-foreground" value={bairroFilter} onChange={(e) => { setBairroFilter(e.target.value); setPage(0); }} placeholder="Nome do bairro" />
        </label>
        {!filtered.length ? <p>Nenhuma visita encontrada para este período e bairro.</p> : <>
          <ul className="grid min-w-0 gap-6 lg:grid-cols-2">{filtered.slice(current * 20, current * 20 + 20).map((row) => <li key={row.key} className="min-w-0 space-y-3 border-t border-border pt-4">
            <div className="flex flex-wrap justify-between gap-2"><h4>{row.visitor}</h4><span className="num text-sm">{neighborhoodVisitTime(row.createdAt)}</span></div>
            <dl className="grid min-w-0 grid-cols-2 gap-3 text-sm">{[
              ["Bairro informado", row.bairros.join(", ") || "Não informado"], ["Página", row.path ?? "Não informada"],
              ["Canal", row.canal ? LEAD_CANAL_LABEL[row.canal] : "Não informado"], ["Origem registrada", row.source],
              ["Meio", row.medium], ["Site de referência", row.reference],
            ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-muted-foreground">{label}</dt><dd className="break-words [overflow-wrap:anywhere]">{value}</dd></div>)}</dl>
          </li>)}</ul>
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="num text-sm">{number(filtered.length)} chegadas · Página {current + 1} de {lastPage + 1}</span><div className="flex gap-2">
            <Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label="Página anterior de visitas" title="Página anterior" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft aria-hidden="true" /></Button>
            <Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label="Próxima página de visitas" title="Próxima página" disabled={current === lastPage} onClick={() => setPage(current + 1)}><ChevronRight aria-hidden="true" /></Button>
          </div></div>
        </>}
      </section>}
    </section>
  );
}