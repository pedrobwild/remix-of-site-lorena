import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/guia/components/ui/button";
import { RefreshCw } from "lucide-react";
import { summarizeButtonClicks, summarizeServiceButtonClicks, SERVICE_VARIANT_LABELS, type ButtonEvent, type ButtonRow, type ServiceButtonRow } from "@/lib/buttonClickReport";
import type { DateRange, Segment } from "./types";

export default function ButtonClicksPanel({ range, segments }: { range: DateRange; segments: Segment[] }) {
  const [rows, setRows] = useState<ButtonRow[] | null>(null);
  const [serviceRows, setServiceRows] = useState<ServiceButtonRow[]>([]);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setRows(null); setServiceRows([]); setError(false);
    async function load() {
      const events: ButtonEvent[] = [];
      for (let offset = 0; active; offset += 1000) {
        let query = supabase.from("analytics_events").select("id,path,event_type,session_id,value,utm_source,utm_medium,utm_campaign,utm_content")
          .in("event_type", ["click_cta", "click_whatsapp", "click_phone", "click_contact"])
          .gte("created_at", range.from.toISOString()).lte("created_at", range.to.toISOString());
        for (const segment of segments) query = query.eq(segment.dim, segment.value);
        const result = await query.order("created_at").order("id").range(offset, offset + 999);
        if (result.error) throw result.error;
        events.push(...(result.data ?? []));
        if (!result.data || result.data.length < 1000) break;
      }
      if (active) {
        setRows(summarizeButtonClicks(events));
        setServiceRows(summarizeServiceButtonClicks(events));
      }
    }
    void load().catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [range, segments, retry]);

  return <section className="aa-col-12 aa-card min-w-0" aria-label="Cliques em botões">
    <div className="aa-card__head flex flex-wrap gap-3">
      <h3 className="aa-card__title">cliques em botões</h3>
      <Button variant="ghost" size="icon" aria-label="Atualizar cliques em botões" title="Atualizar cliques em botões" onClick={() => setRetry(value => value + 1)} disabled={!error && rows === null}><RefreshCw /></Button>
    </div>
    {!error && rows !== null && <div className="min-w-0 mb-6">
      <h4 className="aa-card__title mb-3">Peça seu orçamento · serviços por variante do Google Ads</h4>
      {serviceRows.length === 0 ? <p className="aa-empty">Nenhum clique registrado neste botão no período.</p>
        : <table className="aa-table w-full table-fixed" aria-label="Peça seu orçamento por variante do Google Ads">
          <thead><tr><th className="w-2/5">página / variante</th><th className="num">cliques</th><th className="num">sessões</th></tr></thead>
          <tbody>{serviceRows.map(row => <tr key={JSON.stringify([row.page, row.variant])}>
            <td className="break-words"><span>{SERVICE_VARIANT_LABELS[row.variant]}</span><span className="aa-faint block break-all">{row.page}</span></td>
            <td className="num aa-mono">{row.clicks.toLocaleString("pt-BR")}</td>
            <td className="num aa-mono">{row.sessions.toLocaleString("pt-BR")}</td>
          </tr>)}</tbody>
        </table>}
    </div>}
    {error ? <p role="alert" className="aa-empty">Não foi possível carregar os cliques. Tente atualizar.</p>
      : rows === null ? <p role="status" className="aa-empty">Carregando cliques…</p>
      : rows.length === 0 ? <p className="aa-empty">Nenhum clique registrado neste período.</p>
      : <table className="aa-table w-full table-fixed">
        <thead><tr><th className="w-2/5">botão / página</th><th className="num">cliques</th><th className="num">sessões</th></tr></thead>
        <tbody>{rows.map(row => <tr key={JSON.stringify([row.page, row.cta])}>
          <td className="break-words"><span>{row.label}</span><span className="aa-faint block break-all">{row.page}</span></td>
          <td className="num aa-mono">{row.clicks.toLocaleString("pt-BR")}</td>
          <td className="num aa-mono">{row.sessions.toLocaleString("pt-BR")}</td>
        </tr>)}</tbody>
      </table>}
  </section>;
}