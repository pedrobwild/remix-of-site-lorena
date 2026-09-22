import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, ExternalLink, Check } from "lucide-react";

/**
 * /admin/indexacao — Rastreador de indexação.
 *
 * Mostra, para cada URL do sitemap, se o Google já indexou a página, quando
 * ela entrou no índice e quando foi verificada pela última vez. A verificação
 * roda todo dia (cron) na edge function `index-tracker`, que consulta a URL
 * Inspection API do Search Console. O botão "verificar agora" roda um lote
 * menor sob demanda.
 */

type Row = {
  id: number;
  url: string;
  last_checked_at: string | null;
  coverage_state: string | null;
  verdict: string | null;
  last_crawl_at: string | null;
  indexed: boolean;
  indexed_at: string | null;
  acknowledged_at: string | null;
  error: string | null;
  removed: boolean;
};

type Run = {
  id: number;
  ran_at: string;
  source: string;
  checked: number;
  newly_indexed: number;
  errors: number;
};

type Filter = "novas" | "nao" | "sim" | "todas" | "erro";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "novas", label: "Novidades" },
  { key: "nao", label: "Não indexadas" },
  { key: "sim", label: "Indexadas" },
  { key: "erro", label: "Com erro" },
  { key: "todas", label: "Todas" },
];

function fmt(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function pathOf(url: string) {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url;
  }
}

export default function SeoIndexacaoPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState<Filter>("novas");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    const [list, runList] = await Promise.all([
      supabase
        .from("seo_index_status")
        .select("*")
        .eq("removed", false)
        .order("indexed_at", { ascending: false, nullsFirst: false })
        .limit(1000),
      supabase.from("seo_index_runs").select("*").order("ran_at", { ascending: false }).limit(5),
    ]);
    if (list.error) setMsg({ kind: "err", text: `Erro ao carregar: ${list.error.message}` });
    setRows((list.data ?? []) as Row[]);
    setRuns((runList.data ?? []) as Run[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const novas = useMemo(
    () => rows.filter((r) => r.indexed && r.indexed_at && !r.acknowledged_at),
    [rows],
  );

  const filtered = useMemo(() => {
    if (filter === "novas") return novas;
    if (filter === "sim") return rows.filter((r) => r.indexed);
    if (filter === "nao") return rows.filter((r) => !r.indexed);
    if (filter === "erro") return rows.filter((r) => Boolean(r.error));
    return rows;
  }, [rows, novas, filter]);

  const indexedCount = rows.filter((r) => r.indexed).length;
  const neverChecked = rows.filter((r) => !r.last_checked_at).length;

  async function runNow() {
    setRunning(true);
    setMsg(null);
    const { data, error } = await supabase.functions.invoke("index-tracker", {
      body: { limit: 25 },
    });
    setRunning(false);
    if (error) {
      setMsg({ kind: "err", text: `Falha na verificação: ${error.message}` });
      return;
    }
    const r = data as { checked?: number; newly_indexed?: number };
    setMsg({
      kind: "ok",
      text: `${r?.checked ?? 0} página(s) verificadas · ${r?.newly_indexed ?? 0} nova(s) no índice.`,
    });
    await load();
  }

  async function acknowledge(ids: number[]) {
    if (ids.length === 0) return;
    await supabase
      .from("seo_index_status")
      .update({ acknowledged_at: new Date().toISOString() })
      .in("id", ids);
    await load();
  }

  return (
    <AdminLayout
      active="seo-indexacao"
      title="Indexação"
      description="Acompanha quais páginas do site já aparecem no Google."
      actions={
        <>
          {msg && <span className={`admin-flash admin-flash--${msg.kind} mono`}>{msg.text}</span>}
          <button className="admin-btn" onClick={runNow} disabled={running}>
            <RefreshCw size={14} /> {running ? "verificando…" : "verificar agora"}
          </button>
        </>
      }
    >
      <div className="admin-cards" style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <Stat label="Páginas acompanhadas" value={rows.length} />
        <Stat label="Indexadas" value={indexedCount} />
        <Stat label="Fora do índice" value={rows.length - indexedCount} />
        <Stat label="Nunca verificadas" value={neverChecked} />
        <Stat label="Novidades" value={novas.length} />
      </div>

      {novas.length > 0 && (
        <div className="admin-flash admin-flash--ok mono" style={{ marginBottom: 16 }}>
          {novas.length} página(s) entraram no índice desde o último aviso.{" "}
          <button className="admin-btn" onClick={() => acknowledge(novas.map((n) => n.id))}>
            <Check size={14} /> marcar como visto
          </button>
        </div>
      )}

      <nav className="seo-tabs" role="tablist" aria-label="Filtros">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            className={`seo-tab ${filter === f.key ? "is-active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <p className="mono">carregando…</p>
      ) : filtered.length === 0 ? (
        <p className="mono">nenhuma página nesta lista.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Página</th>
                <th>Situação no Google</th>
                <th>Entrou no índice</th>
                <th>Última verificação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{pathOf(r.url)}</td>
                  <td>
                    <span
                      className="mono"
                      style={{ color: r.indexed ? "#10b981" : r.error ? "#ef4444" : "#a3a3a3" }}
                    >
                      {r.error
                        ? "erro ao verificar"
                        : r.coverage_state ?? (r.last_checked_at ? "sem dados" : "aguardando 1ª verificação")}
                    </span>
                  </td>
                  <td className="mono">{fmt(r.indexed_at)}</td>
                  <td className="mono">{fmt(r.last_checked_at)}</td>
                  <td>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" title="Abrir página">
                      <ExternalLink size={14} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {runs.length > 0 && (
        <p className="mono" style={{ marginTop: 20, opacity: 0.7 }}>
          Última verificação automática: {fmt(runs[0].ran_at)} · {runs[0].checked} páginas ·{" "}
          {runs[0].newly_indexed} nova(s) · {runs[0].errors} erro(s).
        </p>
      )}
    </AdminLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ minWidth: 150 }}>
      <div className="mono" style={{ opacity: 0.6, fontSize: 12 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
