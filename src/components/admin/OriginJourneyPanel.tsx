import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LEAD_CANAL_LABEL } from "@/lib/leadSource";
import { summarizeOriginJourney, type JourneyEvent, type JourneyLead } from "@/lib/originJourney";

const number = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export default function OriginJourneyPanel() {
  const [days, setDays] = useState(30);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<{ events: JourneyEvent[]; leads: JourneyLead[] } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setData(null); setError(false);
    const until = new Date().toISOString();
    const since = new Date(Date.now() - days * 86400000).toISOString();
    async function readEvents() {
      const rows: JourneyEvent[] = [];
      for (let offset = 0; ; offset += 1000) {
        const result = await supabase.from("analytics_events")
          .select("event_type,path,session_id,visitor_id,scroll_depth,duration_ms,utm_source,utm_medium,referrer")
          .eq("path", "/orcamento").in("event_type", ["pageview", "scroll_depth", "click_whatsapp", "form_submit", "engagement_time"])
          .gte("created_at", since).lte("created_at", until)
          .order("created_at").order("id").range(offset, offset + 999);
        if (result.error) throw result.error;
        rows.push(...(result.data ?? []));
        if (!active || !result.data || result.data.length < 1000) return rows;
      }
    }
    async function readLeads() {
      const rows: JourneyLead[] = [];
      for (let offset = 0; ; offset += 1000) {
        const result = await supabase.from("leads")
          .select("id,form_path,status,crm_won,crm_lost,crm_stage_name,gclid,fbclid,utm_source,utm_medium,first_utm_source,first_utm_medium,referrer")
          .eq("form_path", "/orcamento").gte("created_at", since).lte("created_at", until)
          .order("created_at").order("id").range(offset, offset + 999);
        if (result.error) throw result.error;
        rows.push(...(result.data ?? []));
        if (!active || !result.data || result.data.length < 1000) return rows;
      }
    }
    void Promise.all([readEvents(), readLeads()]).then(([events, leads]) => {
      if (active) setData({ events, leads });
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [days, retry]);
  const reports = useMemo(() => summarizeOriginJourney(data?.events ?? [], data?.leads ?? []), [data]);
  return <section aria-label="Origens e contratos" className="min-w-0 space-y-6">
    <h2>Origens e contratos</h2>
    <label className="flex flex-wrap items-center gap-3">Período
      <select className="min-h-11 max-w-full" value={days} onChange={(event) => { setDays(Number(event.target.value)); setRetry((value) => value + 1); }}>
        <option value={7}>Últimos 7 dias</option><option value={30}>Últimos 30 dias</option><option value={90}>Últimos 90 dias</option><option value={365}>Últimos 12 meses</option>
      </select>
    </label>
    <p className="text-sm text-muted-foreground">Visitas consentidas a /orcamento no período e situação atual dos pedidos criados nesse mesmo período. Contrato confirmado somente quando o Bwild Engine informa negócio ganho.</p>
    <p className="text-sm text-muted-foreground">Visitas e pedidos são grupos separados, sem ligação individual comprovada. Não há taxa de conversão de visitante em contrato. A origem das visitas usa UTM e referência; os pedidos também usam GCLID e FBCLID.</p>
    {error ? <p role="alert">Não foi possível carregar as origens. Selecione o período novamente para tentar outra vez.</p>
      : !data ? <p role="status">Carregando origens e contratos…</p>
      : <>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div><dt>Sessões no orçamento</dt><dd className="num text-2xl font-semibold">{number(reports.reduce((sum, row) => sum + row.sessions, 0))}</dd></div>
          <div><dt>Pedidos recebidos</dt><dd className="num text-2xl font-semibold">{number(data.leads.length)}</dd></div>
          <div><dt>Contratos confirmados</dt><dd className="num text-2xl font-semibold">{number(reports.reduce((sum, row) => sum + row.contracts, 0))}</dd></div>
          <div><dt>Visitas sem sessão</dt><dd className="num text-2xl font-semibold">{number(data.events.filter((event) => event.event_type === "pageview" && !event.session_id).length)}</dd></div>
        </dl>
        {data.events.length === 0 && data.leads.length === 0 ? <p>Nenhuma visita ou pedido registrado no período.</p> : null}
        <div className="grid min-w-0 gap-8 lg:grid-cols-2">{reports.map((row) => <article key={row.canal} className="min-w-0 space-y-4 border-t border-border pt-5">
          <h3>{LEAD_CANAL_LABEL[row.canal]}</h3>
          <meter className="h-3 w-full" min={0} max={Math.max(data.leads.length, 1)} value={row.requests} aria-label={`${LEAD_CANAL_LABEL[row.canal]}: ${row.requests} pedidos`} />
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              ["Visitantes identificados", row.visitors], ["Sessões", row.sessions], ["Visualizações", row.pageviews],
              ["Sessões com leitura de 50%", row.scroll50], ["Sessões com clique no WhatsApp", row.whatsapp], ["Sessões com envio medido", row.submissions],
              ["Tempo ativo médio / sessão (s)", row.engagementSeconds], ["Pedidos recebidos", row.requests], ["Qualificados, não ganhos", row.qualified],
              ["Perdidos / descartados", row.lost], ["Contratos confirmados", row.contracts], ["Pedidos que viraram contrato (%)", row.contractRate],
            ].map(([label, value]) => <div key={label}><dt className="break-words text-muted-foreground">{label}</dt><dd className="num font-semibold">{number(Number(value))}</dd></div>)}
          </dl>
          <h4>Etapa atual dos pedidos</h4>
          {row.stages.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum pedido desta origem.</p> : <ul className="space-y-2 text-sm">{row.stages.map((stage) => <li key={stage.name} className="flex justify-between gap-3"><span className="min-w-0 break-words">{stage.name}</span><strong className="num shrink-0">{number(stage.count)}</strong></li>)}</ul>}
        </article>)}</div>
        <p className="text-sm text-muted-foreground">Sem aceite de cookies, o pedido ainda pode ser recebido, mas o comportamento não é medido. Visitantes sem identificador usam a sessão; a mesma pessoa pode aparecer em mais de uma origem. Tempo ativo e envios dependem dos eventos registrados. As etapas refletem a última sincronização do CRM, não uma sequência de passagens pelo funil.</p>
      </>}
  </section>;
}