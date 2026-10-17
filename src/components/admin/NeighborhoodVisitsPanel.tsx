import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { summarizeNeighborhoodVisits, VISIT_PATHS, type NeighborhoodEvent } from "@/lib/neighborhoodVisits";

export default function NeighborhoodVisitsPanel() {
  const [days, setDays] = useState(30);
  const [events, setEvents] = useState<NeighborhoodEvent[] | null>(null);
  const [error, setError] = useState(false);
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
          .select("event_type,path,session_id,visitor_id,value")
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
  const number = (value: number) => value.toLocaleString("pt-BR");
  return (
    <section aria-label="Bairros de interesse" className="min-w-0 space-y-6">
      <h2>Bairros de interesse</h2>
      <label className="flex flex-wrap items-center gap-3">Período
        <select className="min-h-11 max-w-full" value={days} onChange={(e) => setDays(Number(e.target.value))}>
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
    </section>
  );
}