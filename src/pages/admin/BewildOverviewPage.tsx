/**
 * /admin/dashboard — Visão geral Bewild (painel de marketing).
 *
 * Lê apenas dados reais já disponíveis no Supabase:
 *  - leads (tabela única — alimentada pela edge `notify-lead`)
 *  - bewild_posts e projects (contadores de conteúdo/portfólio)
 *  - RPCs analytics_overview_kpis / analytics_top_paths_v2 / analytics_breakdown
 *
 * Seletor de período (7/30/90 dias) propaga em todas as queries de
 * analytics. Mídia paga fica em estado "Conectar" porque ainda não há
 * integração GA4/Windsor/Meta no projeto — nunca exibimos valores fake.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Inbox,
  Eye,
  Users,
  Target,
  Timer,
  TrendingDown,
  Newspaper,
  FolderKanban,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { supabase } from "@/integrations/supabase/client";
import { aggregateLeadChannels } from "@/lib/leadChannel";

type Period = 7 | 30 | 90;

type Kpis = {
  sessions: number;
  unique_visitors: number;
  pageviews: number;
  pages_per_session: number;
  avg_engagement_ms: number;
  bounce_rate: number;
  conversions: number;
  conversion_rate: number;
} | null;

type TopPath = { path: string; pageviews: number; sessions: number };
type Breakdown = { dim: string; sessions: number; conversions: number };

type MetaInsights =
  | { connected: false; reason: "no_token" | "api_error"; error?: string }
  | {
      connected: true;
      account_id: string;
      date_preset: string;
      currency: string;
      spend: number;
      impressions: number;
      clicks: number;
      ctr: number;
      cpc: number;
      cpm: number;
      leads: number;
      cpl: number | null;
      roas: number | null;
      roas_available: boolean;
      updated_at: string;
    };
type LeadRow = {
  id: string;
  name: string | null;
  whatsapp: string | null;
  status: string | null;
  created_at: string;
};

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
];

const TARGET_PATHS = ["/", "/diagnostico", "/portfolio", "/conteudos"];

function fmtInt(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("pt-BR").format(Math.round(n));
}
function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${Number(n).toFixed(1)}%`;
}
function fmtTime(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r.toString().padStart(2, "0")}s`;
}
function fmtBRL(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(n));
}
function fmtDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function BewildOverviewPage() {
  const [period, setPeriod] = useState<Period>(30);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<Kpis>(null);
  const [topPaths, setTopPaths] = useState<TopPath[]>([]);
  const [sources, setSources] = useState<Breakdown[]>([]);
  const [leadsCount, setLeadsCount] = useState(0);
  const [contactedCount, setContactedCount] = useState(0);
  const [recentLeads, setRecentLeads] = useState<LeadRow[]>([]);
  const [channelDist, setChannelDist] = useState<{ channel: string; count: number }[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPublished, setPostsPublished] = useState(0);
  const [postsFeatured, setPostsFeatured] = useState(0);
  const [projectsTotal, setProjectsTotal] = useState(0);
  const [projectsPublished, setProjectsPublished] = useState(0);
  const [pagePerf, setPagePerf] = useState<Record<string, TopPath | undefined>>({});

  const [metaLoading, setMetaLoading] = useState(true);
  const [metaData, setMetaData] = useState<MetaInsights | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMetaLoading(true);
    setMetaData(null);
    supabase.functions
      .invoke("meta-insights", { body: { date_preset: "last_30d" } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setMetaData({ connected: false, reason: "api_error" });
        } else {
          setMetaData(data as MetaInsights);
        }
      })
      .catch(() => {
        if (!cancelled) setMetaData({ connected: false, reason: "api_error" });
      })
      .finally(() => {
        if (!cancelled) setMetaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sinceIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - period);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [period]);
  const untilIso = useMemo(() => new Date().toISOString(), [period]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);

      const [
        kpiRes,
        pathsRes,
        sourcesRes,
        leadsCountRes,
        contactedRes,
        recentLeadsRes,
        postsRes,
        projectsRes,
        leadChannelsRes,
      ] = await Promise.all([
        supabase.rpc("analytics_overview_kpis" as never, {
          p_since: sinceIso,
          p_until: untilIso,
        } as never),
        supabase.rpc("analytics_top_paths_v2" as never, {
          p_since: sinceIso,
          p_until: untilIso,
          p_limit: 10,
        } as never),
        supabase.rpc("analytics_breakdown" as never, {
          p_since: sinceIso,
          p_until: untilIso,
          p_dim: "utm_source",
          p_limit: 8,
        } as never),
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .gte("created_at", sinceIso),
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .gte("created_at", sinceIso)
          .neq("status", "novo"),
        supabase
          .from("leads")
          .select("id, name, whatsapp, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("bewild_posts" as never)
          .select("id, published, featured"),
        supabase
          .from("projects")
          .select("id, published"),
        supabase
          .from("leads")
          .select("utm_source, utm_medium, referrer")
          .gte("created_at", sinceIso),
      ]);

      if (cancelled) return;

      const kpi = (Array.isArray(kpiRes.data) ? kpiRes.data[0] : null) as Record<string, number | string | null> | null;
      setKpis(
        kpi
          ? {
              sessions: Number(kpi.sessions) || 0,
              unique_visitors: Number(kpi.unique_visitors) || 0,
              pageviews: Number(kpi.pageviews) || 0,
              pages_per_session: Number(kpi.pages_per_session) || 0,
              avg_engagement_ms: Number(kpi.avg_engagement_ms) || 0,
              bounce_rate: Number(kpi.bounce_rate) || 0,
              conversions: Number(kpi.conversions) || 0,
              conversion_rate: Number(kpi.conversion_rate) || 0,
            }
          : null
      );


      const paths = (pathsRes.data ?? []) as TopPath[];
      setTopPaths(paths);
      const perf: Record<string, TopPath | undefined> = {};
      for (const t of TARGET_PATHS) perf[t] = paths.find((p) => p.path === t);
      setPagePerf(perf);

      setSources((sourcesRes.data ?? []) as Breakdown[]);

      setLeadsCount(leadsCountRes.count ?? 0);
      setContactedCount(contactedRes.count ?? 0);
      setRecentLeads((recentLeadsRes.data ?? []) as LeadRow[]);

      const posts = (postsRes.data ?? []) as { published: boolean; featured: boolean }[];
      setPostsTotal(posts.length);
      setPostsPublished(posts.filter((p) => p.published).length);
      setPostsFeatured(posts.filter((p) => p.featured && p.published).length);

      const projs = (projectsRes.data ?? []) as { published: boolean }[];
      setProjectsTotal(projs.length);
      setProjectsPublished(projs.filter((p) => p.published).length);

      const channelLeads = (leadChannelsRes.data ?? []) as {
        utm_source: string | null;
        utm_medium: string | null;
        referrer: string | null;
      }[];
      setChannelDist(aggregateLeadChannels(channelLeads));

      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sinceIso, untilIso]);

  const totalLeads = leadsCount;
  const contactRate =
    leadsCount > 0 ? (contactedCount / leadsCount) * 100 : null;
  const engagementRate =
    kpis && kpis.bounce_rate != null ? 100 - kpis.bounce_rate : null;

  return (
    <BewildAdminShell
      active="overview"
      eyebrow="Painel"
      title="Visão geral"
      description="Marketing, conteúdo e funil reunidos. Dados reais do Bewild — sem placeholders."
      actions={
        <div className="bw-admin__period" role="group" aria-label="Período">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={period === p.value ? "is-active" : ""}
              onClick={() => setPeriod(p.value)}
              aria-pressed={period === p.value}
            >
              {p.label}
            </button>
          ))}
        </div>
      }
    >
      {loading && <p className="bw-admin__loading">Carregando dados…</p>}

      {/* KPIs principais (resultado + aquisição + engajamento) */}
      <div className="bw-admin__kpi-grid">
        <Kpi
          icon={<Inbox aria-hidden />}
          label="Leads no período"
          value={fmtInt(totalLeads)}
          sub="Recebidos pelo formulário de /diagnostico"
        />
        <Kpi
          icon={<Target aria-hidden />}
          label="Taxa de conversão"
          value={
            kpis && kpis.sessions > 0
              ? fmtPct((totalLeads / kpis.sessions) * 100)
              : "—"
          }
          sub={
            kpis && kpis.sessions > 0
              ? `${fmtInt(totalLeads)} leads / ${fmtInt(kpis.sessions)} sessões`
              : "Sem sessões registradas no período"
          }
        />
        <Kpi
          icon={<Users aria-hidden />}
          label="Sessões"
          value={fmtInt(kpis?.sessions)}
          sub={
            kpis
              ? `${fmtInt(kpis.unique_visitors)} visitantes únicos`
              : "Sem dados"
          }
        />
        <Kpi
          icon={<Eye aria-hidden />}
          label="Pageviews"
          value={fmtInt(kpis?.pageviews)}
          sub={
            kpis
              ? `${(kpis.pages_per_session || 0).toFixed(2)} páginas/sessão`
              : "Sem dados"
          }
        />
        <Kpi
          icon={<Timer aria-hidden />}
          label="Engajamento médio"
          value={fmtTime(kpis?.avg_engagement_ms)}
          sub="Tempo médio com a aba em foco"
        />
        <Kpi
          icon={<TrendingDown aria-hidden />}
          label="Taxa de rejeição"
          value={fmtPct(kpis?.bounce_rate)}
          sub={
            engagementRate != null
              ? `Engajamento ${engagementRate.toFixed(1)}% — derivado de 1 − taxa de engajamento (GA4-like)`
              : "Sem dados"
          }
        />
      </div>

      {/* Aquisição: origem do tráfego */}
      <div className="bw-admin__panel-grid">
        <section className="bw-admin__section">
          <header className="bw-admin__section-head">
            <h2 className="bw-admin__section-title">Origem do tráfego</h2>
            <a className="bw-admin__section-link" href="/admin/analytics?tab=acquisition">
              ver análise completa
            </a>
          </header>
          {sources.length === 0 ? (
            <p className="bw-admin__empty">Sem sessões com origem identificada no período.</p>
          ) : (
            <table className="bw-admin__table">
              <thead>
                <tr>
                  <th>utm_source</th>
                  <th className="num">Sessões</th>
                  <th className="num">Conversões</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.dim}>
                    <td className="ellip">{s.dim}</td>
                    <td className="num">{fmtInt(s.sessions)}</td>
                    <td className="num">{fmtInt(s.conversions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Conteúdo: páginas mais acessadas */}
        <section className="bw-admin__section">
          <header className="bw-admin__section-head">
            <h2 className="bw-admin__section-title">Páginas mais acessadas</h2>
            <a className="bw-admin__section-link" href="/admin/analytics?tab=behavior">
              ver análise completa
            </a>
          </header>
          {topPaths.length === 0 ? (
            <p className="bw-admin__empty">Sem pageviews no período.</p>
          ) : (
            <table className="bw-admin__table">
              <thead>
                <tr>
                  <th>Página</th>
                  <th className="num">Pageviews</th>
                  <th className="num">Sessões</th>
                </tr>
              </thead>
              <tbody>
                {topPaths.map((p) => (
                  <tr key={p.path}>
                    <td className="ellip">
                      <code>{p.path}</code>
                    </td>
                    <td className="num">{fmtInt(p.pageviews)}</td>
                    <td className="num">{fmtInt(p.sessions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* Performance por página estratégica */}
      <section className="bw-admin__section">
        <header className="bw-admin__section-head">
          <h2 className="bw-admin__section-title">Performance das páginas-chave</h2>
          <p className="bw-admin__section-desc">
            Tráfego para Home, Diagnóstico, Portfólio e Conteúdos.
          </p>
        </header>
        <table className="bw-admin__table">
          <thead>
            <tr>
              <th>Página</th>
              <th className="num">Pageviews</th>
              <th className="num">Sessões</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {TARGET_PATHS.map((path) => {
              const row = pagePerf[path];
              return (
                <tr key={path}>
                  <td>
                    <code>{path}</code>
                  </td>
                  <td className="num">{fmtInt(row?.pageviews)}</td>
                  <td className="num">{fmtInt(row?.sessions)}</td>
                  <td style={{ textAlign: "right" }}>
                    <a
                      className="bw-admin__section-link"
                      href={path}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir ${path}`}
                    >
                      abrir <ExternalLink style={{ display: "inline", width: 12, height: 12, verticalAlign: "-2px" }} />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Funil */}
      <div className="bw-admin__panel-grid">
        <section className="bw-admin__section">
          <header className="bw-admin__section-head">
            <h2 className="bw-admin__section-title">Saúde do funil</h2>
            <a className="bw-admin__section-link" href="/admin/leads">
              ver leads
            </a>
          </header>
          <div className="bw-admin__kpi-grid" style={{ marginBottom: 0 }}>
            <Kpi
              label="Novos leads"
              value={fmtInt(leadsCount)}
              sub="Via /diagnostico no período"
            />
            <Kpi
              label="Já contatados"
              value={fmtInt(contactedCount)}
              sub={
                leadsCount > 0
                  ? `Taxa de contato: ${fmtPct(contactRate)}`
                  : "Sem leads no período"
              }
            />
          </div>
          {recentLeads.length > 0 && (
            <table className="bw-admin__table" style={{ marginTop: 14 }}>
              <thead>
                <tr>
                  <th>Quem</th>
                  <th>Status</th>
                  <th className="num">Recebido</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <strong>{l.name ?? "(sem nome)"}</strong>
                      {l.whatsapp && (
                        <div className="muted" style={{ fontSize: 12 }}>
                          {l.whatsapp}
                        </div>
                      )}
                    </td>
                    <td>
                      <LeadStatusTag status={l.status} />
                    </td>
                    <td className="num muted">{fmtDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Conteúdo + Portfólio */}
        <section className="bw-admin__section">
          <header className="bw-admin__section-head">
            <h2 className="bw-admin__section-title">Estoque de conteúdo</h2>
          </header>
          <div className="bw-admin__kpi-grid" style={{ marginBottom: 14 }}>
            <Kpi
              icon={<Newspaper aria-hidden />}
              label="Posts publicados"
              value={fmtInt(postsPublished)}
              sub={`${postsTotal - postsPublished} em rascunho · ${postsFeatured} em destaque`}
            />
            <Kpi
              icon={<FolderKanban aria-hidden />}
              label="Projetos publicados"
              value={fmtInt(projectsPublished)}
              sub={`${projectsTotal - projectsPublished} em rascunho`}
            />
          </div>
          <p style={{ margin: 0 }}>
            <a className="bw-admin__section-link" href="/admin/conteudos">
              gerenciar conteúdos <ArrowUpRight style={{ display: "inline", width: 12, height: 12, verticalAlign: "-2px" }} />
            </a>
            {"   ·   "}
            <a className="bw-admin__section-link" href="/admin/projetos">
              gerenciar projetos <ArrowUpRight style={{ display: "inline", width: 12, height: 12, verticalAlign: "-2px" }} />
            </a>
          </p>
        </section>
      </div>

      {/* Origem dos leads por canal (channel grouping estilo GA4) */}
      <section className="bw-admin__section">
        <header className="bw-admin__section-head">
          <h2 className="bw-admin__section-title">Origem dos leads</h2>
          <p className="bw-admin__section-desc">
            Classificação por canal a partir de UTM e referrer dos leads
            recebidos no período. Sem UTM e sem referrer externo conta como
            Direto, comportamento esperado para tráfego que ainda não veio de
            campanha.
          </p>
        </header>
        {leadsCount === 0 ? (
          <p className="bw-admin__empty">Sem leads no período.</p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: 10,
            }}
          >
            {channelDist.map((row) => {
              const pct = leadsCount > 0 ? (row.count / leadsCount) * 100 : 0;
              return (
                <li key={row.channel}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: "var(--bw-ink)" }}>{row.channel}</span>
                    <span className="muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {fmtInt(row.count)} ({fmtPct(pct)})
                    </span>
                  </div>
                  <div
                    aria-hidden
                    style={{
                      height: 6,
                      background: "var(--bw-border, #ece8df)",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "var(--bw-ink, #004C7F)",
                        transition: "width .2s ease",
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Mídia paga — Meta Marketing API (Insights) */}
      <section className="bw-admin__section">
        <header className="bw-admin__section-head">
          <h2 className="bw-admin__section-title">Mídia paga</h2>
          <p className="bw-admin__section-desc">
            {metaData && metaData.connected
              ? `Meta Ads · últimos 30 dias · atualizado em ${fmtDateTime(metaData.updated_at)}`
              : "Investimento, CPL, CTR, CPC e ROAS aparecem aqui quando uma fonte real for conectada."}
          </p>
        </header>

        {metaLoading ? (
          <div className="bw-admin__kpi-grid" style={{ marginBottom: 0 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="bw-admin__kpi-card" aria-hidden>
                <div>
                  <p className="bw-admin__kpi-label">Carregando…</p>
                  <div className="bw-admin__kpi-value bw-admin__kpi-empty">—</div>
                </div>
              </div>
            ))}
          </div>
        ) : metaData && metaData.connected ? (
          <div className="bw-admin__kpi-grid" style={{ marginBottom: 0 }}>
            <Kpi
              label="Investimento"
              value={fmtBRL(metaData.spend)}
              sub={`${fmtInt(metaData.impressions)} impressões · ${fmtInt(metaData.clicks)} cliques`}
            />
            <Kpi
              label="CPL"
              value={metaData.cpl != null ? fmtBRL(metaData.cpl) : "—"}
              sub={
                metaData.leads > 0
                  ? `${fmtInt(metaData.leads)} leads na Meta`
                  : "Sem leads atribuídos no período"
              }
            />
            <Kpi
              label="CTR"
              value={`${metaData.ctr.toFixed(2)}%`}
              sub="Cliques ÷ impressões"
            />
            <Kpi
              label="CPC"
              value={fmtBRL(metaData.cpc)}
              sub={`CPM ${fmtBRL(metaData.cpm)}`}
            />
            <Kpi
              label="ROAS"
              value="—"
              sub="Requer receita do CRM"
            />
          </div>
        ) : (
          <div className="bw-admin__connect">
            <div className="bw-admin__connect-text">
              <strong>Conectar Google Ads / Meta Ads</strong>
              <p>
                Ainda não há integração ativa com GA4, Windsor.ai ou Meta Marketing API.
                Conecte uma fonte para popular gasto, cliques e custo por lead sem dados estimados.
              </p>
            </div>
            <span className="bw-admin__tag bw-admin__tag--off">Não conectado</span>
          </div>
        )}
      </section>

    </BewildAdminShell>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  const empty = value === "—";
  return (
    <div className="bw-admin__kpi-card">
      <div>
        <p className="bw-admin__kpi-label">
          {icon && (
            <span style={{ display: "inline-flex", verticalAlign: "-3px", marginRight: 6 }}>
              {icon}
            </span>
          )}
          {label}
        </p>
        <div className={"bw-admin__kpi-value" + (empty ? " bw-admin__kpi-empty" : "")}>
          {value}
        </div>
      </div>
      {sub && <p className="bw-admin__kpi-sub">{sub}</p>}
    </div>
  );
}

function LeadStatusTag({ status }: { status: string | null }) {
  const s = (status ?? "novo").toLowerCase();
  let cls = "bw-admin__tag";
  let label = status ?? "novo";
  if (s === "novo") cls += " bw-admin__tag--info";
  else if (s === "contatado" || s === "qualificado") cls += " bw-admin__tag--ok";
  else if (s === "descartado") cls += " bw-admin__tag--off";
  else cls += " bw-admin__tag--warn";
  return <span className={cls}>{label}</span>;
}
