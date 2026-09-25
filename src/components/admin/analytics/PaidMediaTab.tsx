/**
 * PaidMediaTab — aba "Mídia paga" do Analytics (Meta Ads).
 *
 * Lê o que a edge function `meta-sync` grava a cada 30 min:
 *  - `meta_ads_daily` — investimento, impressões, cliques e leads por
 *    campanha e por dia (a Meta revisa os últimos dias; o sync relê 8);
 *  - `meta_leads` — leads recebidos pelos formulários instantâneos;
 *  - `leads` do site com utm_source da Meta ou clique de anúncio (fbclid).
 *
 * "Leads (Meta)" é o que a Meta atribui às campanhas (formulário + site, pela
 * janela de atribuição dela); "formulários" e "leads do site" são o que de
 * fato chegou aqui. As datas seguem o fuso da conta (São Paulo). Segmentos do
 * site não se aplicam a esta aba.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { invertDir, trend } from "@/lib/analyticsCompare";
import {
  campaignsFromDaily,
  dailyAdsSeries,
  fetchAdsDaily,
  fetchMetaSyncStates,
  fmtDayShort,
  isMetaSiteLead,
  localDayOf,
  META_SITE_LEAD_FILTER,
  metaSyncSummary,
  shiftDay,
  sumAdsDaily,
  triggerMetaSync,
  type AdsTotals,
  type MetaSyncStateRow,
} from "@/lib/metaAds";
import type { DateRange } from "./types";

type Props = {
  range: DateRange;
  comparePrev: boolean;
  /** Segmentos ativos no painel — não se aplicam aqui (só avisa). */
  segmentsCount?: number;
};

type DailyRows = Awaited<ReturnType<typeof fetchAdsDaily>>["rows"];
type FormLead = { campaign_id: string | null; created_time: string };
type SiteLead = { utm_source: string | null; utm_campaign: string | null; fbclid: string | null; created_at: string };

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
function fmtMoney(n: number | null): string {
  return n == null || !Number.isFinite(n) ? "—" : brl.format(n);
}
function fmtNum(n: number | null): string {
  return n == null ? "—" : Math.round(n).toLocaleString("pt-BR");
}
function fmtPct(n: number | null): string {
  return n == null || !Number.isFinite(n) ? "—" : `${n.toFixed(2)}%`;
}

function Delta({ cur, prev, invert = false }: { cur: number | null; prev: number | null; invert?: boolean }) {
  if (cur == null || prev == null) {
    return (
      <span className="aa-kpi__delta" data-dir="flat">
        —
      </span>
    );
  }
  const t = trend(cur, prev);
  const dir = invert ? invertDir(t.dir) : t.dir;
  return (
    <span className="aa-kpi__delta" data-dir={dir}>
      {t.dir === "up" ? "↑" : t.dir === "down" ? "↓" : "·"} {t.label}
    </span>
  );
}

/** utm_campaign do lead do site bate com a campanha (nome ou id)? */
function sameCampaign(utm: string | null, id: string, name: string): boolean {
  const u = (utm ?? "").trim().toLowerCase();
  return !!u && (u === id || u === name.trim().toLowerCase());
}

export default function PaidMediaTab({ range, comparePrev, segmentsCount = 0 }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<DailyRows>([]);
  const [prevRows, setPrevRows] = useState<DailyRows>([]);
  const [formLeads, setFormLeads] = useState<FormLead[] | null>(null);
  const [prevFormLeads, setPrevFormLeads] = useState<number | null>(null);
  const [siteLeads, setSiteLeads] = useState<SiteLead[] | null>(null);
  const [prevSiteLeads, setPrevSiteLeads] = useState<number | null>(null);
  const [states, setStates] = useState<MetaSyncStateRow[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const fromDay = localDayOf(range.from);
  const toDay = localDayOf(range.to);
  const days = Math.max(1, Math.round((Date.parse(toDay) - Date.parse(fromDay)) / 86_400_000) + 1);
  const prevToDay = shiftDay(fromDay, -1);
  const prevFromDay = shiftDay(fromDay, -days);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const sinceIso = range.from.toISOString();
    const untilIso = range.to.toISOString();
    const prevSince = new Date(range.from.getTime() - days * 86_400_000).toISOString();

    Promise.all([
      fetchAdsDaily(fromDay, toDay),
      comparePrev ? fetchAdsDaily(prevFromDay, prevToDay) : Promise.resolve({ rows: [] as DailyRows, error: null }),
      supabase
        .from("meta_leads")
        .select("campaign_id, created_time")
        .is("deleted_at", null)
        .eq("is_test", false)
        .gte("created_time", sinceIso)
        .lte("created_time", untilIso)
        .limit(5000),
      comparePrev
        ? supabase
            .from("meta_leads")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .eq("is_test", false)
            .gte("created_time", prevSince)
            .lt("created_time", sinceIso)
        : Promise.resolve({ count: null, error: null }),
      supabase
        .from("leads")
        .select("utm_source, utm_campaign, fbclid, created_at")
        .gte("created_at", sinceIso)
        .lte("created_at", untilIso)
        .or(META_SITE_LEAD_FILTER)
        .limit(5000),
      comparePrev
        ? supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .gte("created_at", prevSince)
            .lt("created_at", sinceIso)
            .or(META_SITE_LEAD_FILTER)
        : Promise.resolve({ count: null, error: null }),
      fetchMetaSyncStates(),
    ])
      .then(([cur, prev, forms, prevForms, site, prevSite, st]) => {
        if (cancelled) return;
        setRows(cur.rows);
        setPrevRows(prev.rows);
        setFormLeads(forms.error ? null : ((forms.data ?? []) as FormLead[]));
        setPrevFormLeads(prevForms.error ? null : (prevForms.count ?? null));
        setSiteLeads(site.error ? null : ((site.data ?? []) as SiteLead[]).filter(isMetaSiteLead));
        setPrevSiteLeads(prevSite.error ? null : (prevSite.count ?? null));
        setStates(st.states);
        setError(cur.error ?? prev.error ?? null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, fromDay, toDay, prevFromDay, prevToDay, days, comparePrev, refreshKey]);

  const totals = useMemo(() => sumAdsDaily(rows), [rows]);
  const prevTotals = useMemo<AdsTotals | null>(() => (comparePrev ? sumAdsDaily(prevRows) : null), [comparePrev, prevRows]);
  const series = useMemo(() => dailyAdsSeries(rows, fromDay, toDay), [rows, fromDay, toDay]);
  const campaigns = useMemo(() => campaignsFromDaily(rows), [rows]);
  const sync = metaSyncSummary(states);

  async function syncNow() {
    setSyncing(true);
    setSyncMsg(null);
    const res = await triggerMetaSync();
    setSyncing(false);
    setSyncMsg(res.message);
    setRefreshKey((k) => k + 1);
  }

  if (loading) {
    return (
      <div className="aa-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aa-col-3 aa-skel" style={{ height: 92 }} />
        ))}
        <div className="aa-col-12 aa-skel" style={{ height: 300 }} />
        <div className="aa-col-12 aa-skel" style={{ height: 200 }} />
      </div>
    );
  }

  const statusBar = (
    <div className="aa-row aa-mono" role="status" style={{ fontSize: "var(--aa-text-xs)", color: "var(--aa-fg-faint)", gap: 8, flexWrap: "wrap" }}>
      <span data-testid="paid-sync-status">
        meta · <b style={{ color: sync.tone === "error" ? "var(--aa-danger, #B3261E)" : "var(--aa-fg)" }}>{sync.label}</b> · automática a
        cada 30 min
      </span>
      <button
        type="button"
        className="admin-analytics__btn"
        data-variant="ghost"
        onClick={() => void syncNow()}
        disabled={syncing}
        style={{ fontSize: "var(--aa-text-xs)", padding: "2px 8px" }}
      >
        {syncing ? "sincronizando…" : "sincronizar agora"}
      </button>
      {syncMsg && <span>· {syncMsg}</span>}
      {comparePrev && (
        <span>
          · Δ vs. {fmtDayShort(prevFromDay)} – {fmtDayShort(prevToDay)}
        </span>
      )}
      {segmentsCount > 0 && <span>· os segmentos do site não se aplicam à mídia paga</span>}
      {sync.hint && <span style={{ flexBasis: "100%" }}>{sync.hint}</span>}
    </div>
  );

  if (error) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div className="aa-empty">
          <span className="aa-empty__icon">!</span>
          erro ao carregar · <span className="aa-mono">{error}</span>
        </div>
        {statusBar}
      </div>
    );
  }

  if (!rows.length && !prevRows.length && !sync.connected) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div className="aa-empty" style={{ lineHeight: 1.6 }}>
          <span className="aa-empty__icon">∅</span>
          meta ads não conectada · salve o token de usuário do sistema da Meta (segredo META_ADS_ACCESS_TOKEN) no
          projeto: investimento, cliques e leads por campanha chegam aqui a cada 30 min
        </div>
        {statusBar}
      </div>
    );
  }

  const formCount = formLeads?.length ?? null;
  const siteCount = siteLeads?.length ?? null;
  const kpis: { label: string; value: string; cur: number | null; prev: number | null; invert?: boolean }[] = [
    { label: "investimento", value: fmtMoney(totals.spend), cur: totals.spend, prev: prevTotals?.spend ?? null },
    { label: "leads (meta)", value: fmtNum(totals.leads), cur: totals.leads, prev: prevTotals?.leads ?? null },
    { label: "custo por lead", value: fmtMoney(totals.cpl), cur: totals.cpl, prev: prevTotals?.cpl ?? null, invert: true },
    { label: "ctr (link)", value: fmtPct(totals.ctr), cur: totals.ctr, prev: prevTotals?.ctr ?? null },
    { label: "cpc (link)", value: fmtMoney(totals.cpc), cur: totals.cpc, prev: prevTotals?.cpc ?? null, invert: true },
    { label: "impressões", value: fmtNum(totals.impressions), cur: totals.impressions, prev: prevTotals?.impressions ?? null },
    { label: "formulários recebidos", value: fmtNum(formCount), cur: formCount, prev: prevFormLeads },
    { label: "leads do site via meta", value: fmtNum(siteCount), cur: siteCount, prev: prevSiteLeads },
  ];
  if (totals.conversations || prevTotals?.conversations) {
    kpis.push({ label: "conversas iniciadas", value: fmtNum(totals.conversations), cur: totals.conversations, prev: prevTotals?.conversations ?? null });
  }

  const moneyAxisWidth = Math.max(40, String(Math.round(Math.max(0, ...series.map((p) => p.spend)))).length * 7 + 26);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="aa-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="aa-kpi">
            <span className="aa-kpi__label">{k.label}</span>
            <span className="aa-kpi__value">{k.value}</span>
            {comparePrev && <Delta cur={k.cur} prev={k.prev} invert={k.invert} />}
          </div>
        ))}
      </div>

      {statusBar}

      <div className="aa-card">
        <div className="aa-card__head" style={{ flexWrap: "wrap" }}>
          <h3 className="aa-card__title" style={{ whiteSpace: "nowrap" }}>investimento × leads por dia</h3>
          <span className="aa-faint aa-mono" style={{ fontSize: "var(--aa-text-xs)" }}>
            {fmtDayShort(fromDay)} – {fmtDayShort(toDay)} · leads = atribuídos pela meta
          </span>
        </div>
        {rows.length === 0 ? (
          <div className="aa-empty">
            <span className="aa-empty__icon">∅</span>
            sem investimento no período
          </div>
        ) : (
          <div style={{ height: 280, color: "var(--aa-fg)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--aa-border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={(d: string) => fmtDayShort(d)}
                  tick={{ fontSize: "var(--aa-text-2xs)", fontFamily: "var(--aa-font-mono)", fill: "var(--aa-fg-faint)" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="money"
                  tickFormatter={(v: number) => `R$${Math.round(v)}`}
                  tick={{ fontSize: "var(--aa-text-2xs)", fontFamily: "var(--aa-font-mono)", fill: "var(--aa-fg-faint)" }}
                  tickLine={false}
                  axisLine={false}
                  width={moneyAxisWidth}
                />
                <YAxis
                  yAxisId="leads"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: "var(--aa-text-2xs)", fontFamily: "var(--aa-font-mono)", fill: "var(--aa-fg-faint)" }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--aa-bg-elev)",
                    border: "1px solid var(--aa-border)",
                    borderRadius: 6,
                    fontFamily: "var(--aa-font-mono)",
                    fontSize: "var(--aa-text-xs)",
                    color: "var(--aa-fg)",
                  }}
                  labelFormatter={(d) => fmtDayShort(String(d))}
                  formatter={(value, name) =>
                    name === "investimento" ? [fmtMoney(Number(value)), name] : [fmtNum(Number(value)), name]
                  }
                />
                <Bar yAxisId="money" dataKey="spend" name="investimento" fill="var(--aa-accent)" fillOpacity={0.35} isAnimationActive={false} />
                <Line
                  yAxisId="leads"
                  type="monotone"
                  dataKey="leads"
                  name="leads"
                  stroke="var(--aa-accent-goal, #B45309)"
                  strokeWidth={1.6}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="aa-card">
        <div className="aa-card__head">
          <h3 className="aa-card__title" style={{ whiteSpace: "nowrap" }}>por campanha</h3>
          <span className="aa-faint aa-mono" style={{ fontSize: "var(--aa-text-xs)", textAlign: "right" }}>
            formulários = recebidos aqui · site = leads com utm_campaign igual ao nome ou id da campanha
          </span>
        </div>
        {campaigns.length === 0 ? (
          <div className="aa-empty">
            <span className="aa-empty__icon">∅</span>
            nenhuma campanha com entrega no período
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="aa-table" data-testid="campaign-table">
              <thead>
                <tr>
                  <th>campanha</th>
                  <th className="num">investimento</th>
                  <th className="num">impressões</th>
                  <th className="num">cliques (link)</th>
                  <th className="num">ctr</th>
                  <th className="num">cpc</th>
                  <th className="num">leads (meta)</th>
                  <th className="num">cpl</th>
                  <th className="num">formulários</th>
                  <th className="num">site</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const forms = formLeads ? formLeads.filter((l) => l.campaign_id === c.campaignId).length : null;
                  const site = siteLeads ? siteLeads.filter((l) => sameCampaign(l.utm_campaign, c.campaignId, c.campaignName)).length : null;
                  return (
                    <tr key={c.campaignId}>
                      <td style={{ maxWidth: 320 }} title={c.campaignName}>
                        {c.campaignName}
                      </td>
                      <td className="num">{fmtMoney(c.spend)}</td>
                      <td className="num">{fmtNum(c.impressions)}</td>
                      <td className="num">{fmtNum(c.linkClicks)}</td>
                      <td className="num">{fmtPct(c.ctr)}</td>
                      <td className="num">{fmtMoney(c.cpc)}</td>
                      <td className="num">{fmtNum(c.leads)}</td>
                      <td className="num">{fmtMoney(c.cpl)}</td>
                      <td className="num">{fmtNum(forms)}</td>
                      <td className="num">{fmtNum(site)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
