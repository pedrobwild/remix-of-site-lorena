import { useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, ExternalLink } from "lucide-react";

/**
 * /admin/rastreamento — acompanhamento de tráfego e de mídia paga.
 *
 * Blocos:
 *  1. Impressões e cliques no Google (Search Console, por URL).
 *  2. Leads enviados (tabela `leads`, por formulário, com origem de clique).
 *  3. Eventos de mídia disparados (espelho `ad_event` do Pixel/Google em
 *     analytics_events — sem dado pessoal).
 *  4. Cliques em links rastreados de anúncio (tracking_hits, via RPC).
 *  5. Cliques no FAQ (eventos `faq_question_click` gravados em analytics_events).
 *  6. Visitas por URL (pageviews da própria medição do site).
 */

type GscRow = {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type GscResponse = {
  site_url: string;
  start_date: string;
  end_date: string;
  rows: GscRow[];
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  error?: string;
};

type PathRow = { path: string; pageviews: number; sessions: number };
type FaqRow = { pergunta: string; cliques: number };
type LeadRow = { formulario: string; leads: number; viaGoogle: number; viaMeta: number };
type AdEventRow = { evento: string; quantidade: number };
type AdClickRow = {
  campaign: string | null;
  source: string | null;
  medium: string | null;
  opens: number;
  views: number;
  clicks: number;
};
type BreakdownRow = {
  dim: string | null;
  sessions: number;
  conversions: number;
  bounce_rate: number;
};
type OriginRow = {
  origem: string;
  sessoes: number;
  conversoes: number;
  rejeicao: number | null;
};

/** Teto de linhas lidas por bloco (o PostgREST corta em 1000). */
const FAQ_EVENTS_LIMIT = 1000;
const LEADS_LIMIT = 1000;
const AD_EVENTS_LIMIT = 1000;

/** Rótulo amigável do formulário a partir de `leads.form_path`. */
const FORM_LABELS: Readonly<Record<string, string>> = {
  "/contato": "Contato",
  "/orcamento": "Orçamento",
  "/diagnostico": "Diagnóstico (antigo)",
  "/o": "LP Obra",
  "/p": "LP Panfleto",
  "/parceiros": "Parceiros",
  "/parceiros/incorporadoras": "Incorporadoras",
  "/indique-um-amigo": "Indicação",
};

function formLabel(path: string | null): string {
  if (!path) return "(sem formulário)";
  return FORM_LABELS[path] ?? path;
}

const PERIODS = [
  { days: 7, label: "7 dias" },
  { days: 28, label: "28 dias" },
  { days: 90, label: "90 dias" },
];

function pathOf(url: string) {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url;
  }
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

/**
 * Classifica uma dimensão (utm_source ou referrer_host) no balde de origem.
 * "Direto / próprio site" = sem origem ou referência do próprio domínio.
 */
function classifyOrigin(dim: string | null): string {
  const d = (dim ?? "").toLowerCase().trim();
  if (!d || d === "bewild.com.br" || d === "www.bewild.com.br" || d === "direct") {
    return "Direto / próprio site";
  }
  if (d.includes("google")) return "Google";
  if (
    d.includes("facebook") ||
    d.includes("instagram") ||
    d.includes("meta") ||
    d === "fb" ||
    d === "ig"
  ) {
    return "Meta";
  }
  return "Outros";
}

/** Ordem fixa de exibição dos baldes de origem. */
const ORIGIN_ORDER = ["Google", "Meta", "Direto / próprio site", "Outros"];

function mergeOrigins(rows: BreakdownRow[]): OriginRow[] {
  const map = new Map<string, OriginRow>();
  for (const r of rows) {
    const origem = classifyOrigin(r.dim);
    const row = map.get(origem) ?? { origem, sessoes: 0, conversoes: 0, rejeicao: null };
    row.sessoes += Number(r.sessions);
    row.conversoes += Number(r.conversions);
    map.set(origem, row);
  }
  // Rejeição ponderada pelas sessões de cada linha de origem.
  for (const row of map.values()) {
    let peso = 0;
    let soma = 0;
    for (const r of rows) {
      if (classifyOrigin(r.dim) !== row.origem) continue;
      const s = Number(r.sessions);
      if (r.bounce_rate == null || s <= 0) continue;
      peso += s;
      soma += Number(r.bounce_rate) * s;
    }
    row.rejeicao = peso > 0 ? soma / peso : null;
  }
  return [...map.values()].sort(
    (a, b) => ORIGIN_ORDER.indexOf(a.origem) - ORIGIN_ORDER.indexOf(b.origem),
  );
}

export default function RastreamentoPage() {
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(true);
  const [gsc, setGsc] = useState<GscResponse | null>(null);
  const [gscErro, setGscErro] = useState<string | null>(null);
  const [paths, setPaths] = useState<PathRow[]>([]);
  const [pathsErro, setPathsErro] = useState<string | null>(null);
  const [faq, setFaq] = useState<FaqRow[]>([]);
  const [faqErro, setFaqErro] = useState<string | null>(null);
  const [faqTruncado, setFaqTruncado] = useState(false);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [leadsErro, setLeadsErro] = useState<string | null>(null);
  const [leadsTruncado, setLeadsTruncado] = useState(false);
  const [adEvents, setAdEvents] = useState<AdEventRow[]>([]);
  const [adEventsErro, setAdEventsErro] = useState<string | null>(null);
  const [adEventsTruncado, setAdEventsTruncado] = useState(false);
  const [adClicks, setAdClicks] = useState<AdClickRow[]>([]);
  const [adClicksErro, setAdClicksErro] = useState<string | null>(null);
  const [origens, setOrigens] = useState<OriginRow[]>([]);
  const [origensErro, setOrigensErro] = useState<string | null>(null);
  const [sessoesComAceite, setSessoesComAceite] = useState(0);
  // Trocar de período rápido disparava cargas concorrentes; só a última vale.
  const requestId = useRef(0);

  const range = useMemo(() => {
    const until = new Date();
    const since = new Date(until.getTime() - days * 86_400_000);
    return { since: since.toISOString(), until: until.toISOString() };
  }, [days]);

  async function load() {
    const id = ++requestId.current;
    setLoading(true);

    const [gscRes, pathsRes, faqRes, leadsRes, adEventsRes, adClicksRes, utmRes, refRes] =
      await Promise.all([
      supabase.functions.invoke("search-console-stats", {
        body: { days, dimension: "page", rowLimit: 100 },
      }),
      supabase.rpc("analytics_top_paths_v2", {
        p_since: range.since,
        p_until: range.until,
        p_limit: 50,
      }),
      supabase
        .from("analytics_events")
        .select("path, value, created_at")
        .eq("event_type", "faq_question_click")
        .gte("created_at", range.since)
        .lte("created_at", range.until)
        .order("created_at", { ascending: false })
        .limit(FAQ_EVENTS_LIMIT),
      supabase
        .from("leads")
        .select("form_path, created_at, gclid, fbclid")
        .gte("created_at", range.since)
        .lte("created_at", range.until)
        .order("created_at", { ascending: false })
        .limit(LEADS_LIMIT),
      supabase
        .from("analytics_events")
        .select("value, created_at, session_id")
        .eq("event_type", "ad_event")
        .gte("created_at", range.since)
        .lte("created_at", range.until)
        .order("created_at", { ascending: false })
        .limit(AD_EVENTS_LIMIT),
      supabase.rpc("tracking_hits_summary", {
        p_since: range.since,
        p_until: range.until,
      }),
      supabase.rpc("analytics_breakdown" as never, {
        p_since: range.since,
        p_until: range.until,
        p_dim: "utm_source",
        p_limit: 100,
      }),
      supabase.rpc("analytics_breakdown" as never, {
        p_since: range.since,
        p_until: range.until,
        p_dim: "referrer_host",
        p_limit: 100,
      }),
    ]);
    if (id !== requestId.current) return;

    if (gscRes.error) {
      setGscErro(
        "Não foi possível ler os dados do Google agora. Verifique a conexão com o Search Console.",
      );
      setGsc(null);
    } else {
      const data = gscRes.data as GscResponse;
      if (data?.error) {
        setGscErro(data.error);
        setGsc(null);
      } else {
        setGscErro(null);
        setGsc(data);
      }
    }

    if (pathsRes.error) {
      setPathsErro(`Não foi possível ler as visitas por página: ${pathsRes.error.message}`);
      setPaths([]);
    } else {
      setPathsErro(null);
      setPaths((pathsRes.data ?? []) as PathRow[]);
    }

    if (faqRes.error) {
      // Antes o erro virava "nenhum clique registrado".
      setFaqErro(`Não foi possível ler os cliques do FAQ: ${faqRes.error.message}`);
      setFaq([]);
      setFaqTruncado(false);
    } else {
      setFaqErro(null);
      const eventos = (faqRes.data ?? []) as Array<{ value: unknown }>;
      setFaqTruncado(eventos.length >= FAQ_EVENTS_LIMIT);
      const contagem = new Map<string, number>();
      for (const ev of eventos) {
        const v = (ev.value ?? {}) as { pergunta?: string };
        const nome = typeof v.pergunta === "string" && v.pergunta ? v.pergunta : "(sem título)";
        contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
      }
      setFaq(
        [...contagem.entries()]
          .map(([pergunta, cliques]) => ({ pergunta, cliques }))
          .sort((a, b) => b.cliques - a.cliques),
      );
    }

    if (leadsRes.error) {
      setLeadsErro(`Não foi possível ler os leads: ${leadsRes.error.message}`);
      setLeads([]);
      setLeadsTruncado(false);
    } else {
      setLeadsErro(null);
      const rows = (leadsRes.data ?? []) as Array<{
        form_path: string | null;
        gclid: string | null;
        fbclid: string | null;
      }>;
      setLeadsTruncado(rows.length >= LEADS_LIMIT);
      const porForm = new Map<string, LeadRow>();
      for (const l of rows) {
        const key = l.form_path ?? "";
        const row = porForm.get(key) ?? {
          formulario: formLabel(l.form_path),
          leads: 0,
          viaGoogle: 0,
          viaMeta: 0,
        };
        row.leads += 1;
        if (l.gclid) row.viaGoogle += 1;
        if (l.fbclid) row.viaMeta += 1;
        porForm.set(key, row);
      }
      setLeads([...porForm.values()].sort((a, b) => b.leads - a.leads));
    }

    if (adEventsRes.error) {
      setAdEventsErro(`Não foi possível ler os eventos de mídia: ${adEventsRes.error.message}`);
      setAdEvents([]);
      setAdEventsTruncado(false);
    } else {
      setAdEventsErro(null);
      const eventos = (adEventsRes.data ?? []) as Array<{ value: unknown; session_id: string | null }>;
      setAdEventsTruncado(eventos.length >= AD_EVENTS_LIMIT);
      const contagem = new Map<string, number>();
      // Sessões com aceite de cookies = sessões que dispararam ao menos um
      // evento de mídia (o Pixel/Google só dispara após o aceite).
      const sessoesAceite = new Set<string>();
      for (const ev of eventos) {
        if (ev.session_id) sessoesAceite.add(ev.session_id);
        const v = (ev.value ?? {}) as { name?: string };
        const nome = typeof v.name === "string" && v.name ? v.name : "(sem nome)";
        contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
      }
      setSessoesComAceite(sessoesAceite.size);
      setAdEvents(
        [...contagem.entries()]
          .map(([evento, quantidade]) => ({ evento, quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade),
      );
    }

    if (adClicksRes.error) {
      setAdClicksErro(`Não foi possível ler os cliques de anúncios: ${adClicksRes.error.message}`);
      setAdClicks([]);
    } else {
      setAdClicksErro(null);
      // Só campanhas com pelo menos 1 clique (aberturas de e-mail sem clique
      // não interessam neste bloco).
      setAdClicks(
        ((adClicksRes.data ?? []) as AdClickRow[]).filter((r) => Number(r.clicks) > 0),
      );
    }

    if (utmRes.error || refRes.error) {
      const msg = (utmRes.error ?? refRes.error)?.message;
      setOrigensErro(`Não foi possível ler a origem dos visitantes: ${msg}`);
      setOrigens([]);
    } else {
      setOrigensErro(null);
      setOrigens(
        mergeOrigins([
          ...((utmRes.data ?? []) as unknown as BreakdownRow[]),
          ...((refRes.data ?? []) as unknown as BreakdownRow[]),
        ]),
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const totalFaq = faq.reduce((acc, r) => acc + r.cliques, 0);
  const totalVisitas = paths.reduce((acc, r) => acc + r.pageviews, 0);
  const totalLeads = leads.reduce((acc, r) => acc + r.leads, 0);
  const totalAdEvents = adEvents.reduce((acc, r) => acc + r.quantidade, 0);
  const totalAdClicks = adClicks.reduce((acc, r) => acc + Number(r.clicks), 0);

  return (
    <AdminLayout
      active="rastreamento"
      title="Rastreamento"
      description="Impressões no Google, leads enviados, eventos de mídia, cliques de anúncios e visitas por página."
      actions={
        <>
          <nav className="seo-tabs" role="tablist" aria-label="Período">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                type="button"
                role="tab"
                aria-selected={days === p.days}
                className={`seo-tab ${days === p.days ? "is-active" : ""}`}
                onClick={() => setDays(p.days)}
              >
                {p.label}
              </button>
            ))}
          </nav>
          <button className="admin-btn" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={14} /> {loading ? "atualizando…" : "atualizar"}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 28 }}>
        {/* "—" (e não 0) quando a fonte falhou: zero seria uma informação falsa. */}
        <Stat label="Impressões no Google" value={gsc ? gsc.totals.impressions : "—"} />
        <Stat label="Cliques no Google" value={gsc ? gsc.totals.clicks : "—"} />
        <Stat label="Taxa de clique" value={gsc ? pct(gsc.totals.ctr) : "—"} />
        <Stat
          label="Posição média"
          value={gsc ? gsc.totals.position.toFixed(1).replace(".", ",") : "—"}
        />
        <Stat
          label={leadsTruncado ? `Leads enviados (últimos ${LEADS_LIMIT})` : "Leads enviados"}
          value={leadsErro ? "—" : totalLeads}
        />
        <Stat
          label={
            adEventsTruncado ? `Eventos de mídia (últimos ${AD_EVENTS_LIMIT})` : "Eventos de mídia"
          }
          value={adEventsErro ? "—" : totalAdEvents}
        />
        <Stat label="Cliques em anúncios" value={adClicksErro ? "—" : totalAdClicks} />
        <Stat label="Visitas medidas no site" value={pathsErro ? "—" : totalVisitas} />
        <Stat
          label={faqTruncado ? `Cliques no FAQ (últimos ${FAQ_EVENTS_LIMIT})` : "Cliques no FAQ"}
          value={faqErro ? "—" : totalFaq}
        />
      </div>

      <Section title="Impressões e cliques por página (Google)">
        {gscErro ? (
          <p className="admin-flash admin-flash--err mono" role="alert">{gscErro}</p>
        ) : loading ? (
          <p className="mono">carregando…</p>
        ) : !gsc || gsc.rows.length === 0 ? (
          <p className="mono">sem dados do Google neste período.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Página</th>
                  <th>Impressões</th>
                  <th>Cliques</th>
                  <th>Taxa de clique</th>
                  <th>Posição média</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {gsc.rows.map((r) => (
                  <tr key={r.key}>
                    <td className="mono">{pathOf(r.key)}</td>
                    <td className="mono">{r.impressions}</td>
                    <td className="mono">{r.clicks}</td>
                    <td className="mono">{pct(r.ctr)}</td>
                    <td className="mono">{r.position.toFixed(1).replace(".", ",")}</td>
                    <td>
                      <a
                        href={r.key}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir página"
                        aria-label={`Abrir ${pathOf(r.key)}`}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Leads enviados, por formulário">
        {leadsErro ? (
          <p className="admin-flash admin-flash--err mono" role="alert">{leadsErro}</p>
        ) : loading ? (
          <p className="mono">carregando…</p>
        ) : leads.length === 0 ? (
          <p className="mono">nenhum lead enviado neste período.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Formulário</th>
                  <th>Leads</th>
                  <th>Vieram de clique no Google</th>
                  <th>Vieram de clique na Meta</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((r) => (
                  <tr key={r.formulario}>
                    <td>{r.formulario}</td>
                    <td className="mono">{r.leads}</td>
                    <td className="mono">{r.viaGoogle}</td>
                    <td className="mono">{r.viaMeta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Eventos de mídia disparados (Pixel da Meta e Google)">
        {adEventsErro ? (
          <p className="admin-flash admin-flash--err mono" role="alert">{adEventsErro}</p>
        ) : loading ? (
          <p className="mono">carregando…</p>
        ) : adEvents.length === 0 ? (
          <p className="mono">
            nenhum evento registrado neste período. Eventos só contam de visitantes que aceitaram
            os cookies.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {adEvents.map((r) => (
                  <tr key={r.evento}>
                    <td className="mono">{r.evento}</td>
                    <td className="mono">{r.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Cliques em links de anúncio (campanhas rastreadas)">
        {adClicksErro ? (
          <p className="admin-flash admin-flash--err mono" role="alert">{adClicksErro}</p>
        ) : loading ? (
          <p className="mono">carregando…</p>
        ) : adClicks.length === 0 ? (
          <p className="mono">nenhum clique em link rastreado neste período.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Origem</th>
                  <th>Meio</th>
                  <th>Cliques</th>
                  <th>Aberturas</th>
                </tr>
              </thead>
              <tbody>
                {adClicks.map((r, i) => (
                  <tr key={`${r.campaign ?? ""}|${r.source ?? ""}|${r.medium ?? ""}|${i}`}>
                    <td>{r.campaign ?? "—"}</td>
                    <td>{r.source ?? "—"}</td>
                    <td>{r.medium ?? "—"}</td>
                    <td className="mono">{r.clicks}</td>
                    <td className="mono">{r.opens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Cliques nas perguntas do FAQ">
        {faqErro ? (
          <p className="admin-flash admin-flash--err mono" role="alert">{faqErro}</p>
        ) : loading ? (
          <p className="mono">carregando…</p>
        ) : faq.length === 0 ? (
          <p className="mono">nenhum clique registrado neste período.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pergunta</th>
                  <th>Cliques</th>
                </tr>
              </thead>
              <tbody>
                {faq.map((r) => (
                  <tr key={r.pergunta}>
                    <td>{r.pergunta}</td>
                    <td className="mono">{r.cliques}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Visitas por página (medição do site)">
        {pathsErro ? (
          <p className="admin-flash admin-flash--err mono" role="alert">{pathsErro}</p>
        ) : loading ? (
          <p className="mono">carregando…</p>
        ) : paths.length === 0 ? (
          <p className="mono">nenhuma visita registrada neste período.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Página</th>
                  <th>Visitas</th>
                  <th>Sessões</th>
                </tr>
              </thead>
              <tbody>
                {paths.map((r) => (
                  <tr key={r.path}>
                    <td className="mono">{r.path}</td>
                    <td className="mono">{r.pageviews}</td>
                    <td className="mono">{r.sessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </AdminLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ minWidth: 150 }}>
      <div className="mono" style={{ opacity: 0.6, fontSize: 12 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
