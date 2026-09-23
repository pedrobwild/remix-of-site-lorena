import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, ExternalLink } from "lucide-react";

/**
 * /admin/rastreamento — acompanhamento de tráfego.
 *
 * Três blocos:
 *  1. Impressões e cliques no Google (Search Console, por URL).
 *  2. Cliques no FAQ (eventos `faq_question_click` gravados em analytics_events).
 *  3. Visitas por URL (pageviews da própria medição do site).
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

export default function RastreamentoPage() {
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(true);
  const [gsc, setGsc] = useState<GscResponse | null>(null);
  const [gscErro, setGscErro] = useState<string | null>(null);
  const [paths, setPaths] = useState<PathRow[]>([]);
  const [faq, setFaq] = useState<FaqRow[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const range = useMemo(() => {
    const until = new Date();
    const since = new Date(until.getTime() - days * 86_400_000);
    return { since: since.toISOString(), until: until.toISOString() };
  }, [days]);

  async function load() {
    setLoading(true);
    setErro(null);
    setGscErro(null);

    const [gscRes, pathsRes, faqRes] = await Promise.all([
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
        .limit(1000),
    ]);

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
        setGsc(data);
      }
    }

    if (pathsRes.error) setErro(pathsRes.error.message);
    setPaths((pathsRes.data ?? []) as PathRow[]);

    const contagem = new Map<string, number>();
    for (const ev of (faqRes.data ?? []) as Array<{ value: unknown }>) {
      const v = (ev.value ?? {}) as { pergunta?: string };
      const nome = typeof v.pergunta === "string" && v.pergunta ? v.pergunta : "(sem título)";
      contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
    }
    setFaq(
      [...contagem.entries()]
        .map(([pergunta, cliques]) => ({ pergunta, cliques }))
        .sort((a, b) => b.cliques - a.cliques),
    );

    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const totalFaq = faq.reduce((acc, r) => acc + r.cliques, 0);
  const totalVisitas = paths.reduce((acc, r) => acc + r.pageviews, 0);

  return (
    <AdminLayout
      active="rastreamento"
      title="Rastreamento"
      description="Impressões no Google, cliques no FAQ e visitas por página."
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
      {erro && (
        <div className="admin-flash admin-flash--err mono" style={{ marginBottom: 16 }}>
          {erro}
        </div>
      )}

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 28 }}>
        <Stat label="Impressões no Google" value={gsc?.totals.impressions ?? 0} />
        <Stat label="Cliques no Google" value={gsc?.totals.clicks ?? 0} />
        <Stat label="Taxa de clique" value={gsc ? pct(gsc.totals.ctr) : "—"} />
        <Stat
          label="Posição média"
          value={gsc ? gsc.totals.position.toFixed(1).replace(".", ",") : "—"}
        />
        <Stat label="Visitas medidas no site" value={totalVisitas} />
        <Stat label="Cliques no FAQ" value={totalFaq} />
      </div>

      <Section title="Impressões e cliques por página (Google)">
        {gscErro ? (
          <p className="mono">{gscErro}</p>
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
                      <a href={r.key} target="_blank" rel="noopener noreferrer" title="Abrir página">
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

      <Section title="Cliques nas perguntas do FAQ">
        {loading ? (
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
        {loading ? (
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
