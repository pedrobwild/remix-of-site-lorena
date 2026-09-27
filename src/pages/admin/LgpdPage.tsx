/**
 * /admin/lgpd — auditoria de consentimento de cookies (LGPD).
 *
 * Lê a trilha gravada por logConsentAudit (analytics_events, tipos
 * `consent_accept` / `consent_decline`). Por decisão de privacidade esses
 * registros NÃO carregam visitor_id nem session_id, então o "histórico por
 * visitante" é o registro individual de cada decisão (data/hora, página,
 * versão do texto e origem), anônimo — não dá para ligar decisões entre si.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  event_type: string;
  path: string | null;
  created_at: string;
  value: { action?: string; source?: string; version?: number | string; ts?: string } | null;
};

type Periodo = 7 | 28 | 90;
const PAGE = 1000;
const TZ = "America/Sao_Paulo";

const dia = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(iso),
  );
const fmtDia = (d: string) => d.split("-").reverse().join("/");
const fmtDataHora = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "medium" }).format(new Date(iso));
const taxa = (a: number, r: number) => (a + r > 0 ? `${((a / (a + r)) * 100).toFixed(1).replace(".", ",")}%` : "—");

export default function LgpdPage() {
  const [periodo, setPeriodo] = useState<Periodo>(28);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"todos" | "consent_accept" | "consent_decline">("todos");
  const req = useRef(0);

  const load = useCallback(async () => {
    const id = ++req.current;
    setLoading(true);
    setErro(null);
    const since = new Date(Date.now() - periodo * 86400000).toISOString();
    const all: Row[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("id, event_type, path, created_at, value")
        .in("event_type", ["consent_accept", "consent_decline"])
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + PAGE - 1);
      if (id !== req.current) return;
      if (error) {
        setErro(error.message);
        setLoading(false);
        return;
      }
      all.push(...((data ?? []) as Row[]));
      if (!data || data.length < PAGE) break;
    }
    setRows(all);
    setLoading(false);
  }, [periodo]);

  useEffect(() => {
    void load();
  }, [load]);

  const { aceites, recusas, porDia, porVersao } = useMemo(() => {
    let a = 0;
    let r = 0;
    const d = new Map<string, { a: number; r: number }>();
    const v = new Map<string, { a: number; r: number }>();
    for (const x of rows) {
      const ok = x.event_type === "consent_accept";
      ok ? a++ : r++;
      const k = dia(x.created_at);
      const cd = d.get(k) ?? { a: 0, r: 0 };
      ok ? cd.a++ : cd.r++;
      d.set(k, cd);
      const kv = String(x.value?.version ?? "—");
      const cv = v.get(kv) ?? { a: 0, r: 0 };
      ok ? cv.a++ : cv.r++;
      v.set(kv, cv);
    }
    return {
      aceites: a,
      recusas: r,
      porDia: [...d.entries()].sort((x, y) => y[0].localeCompare(x[0])),
      porVersao: [...v.entries()].sort((x, y) => y[0].localeCompare(x[0])),
    };
  }, [rows]);

  const historico = useMemo(
    () => (filtro === "todos" ? rows : rows.filter((x) => x.event_type === filtro)).slice(0, 500),
    [rows, filtro],
  );

  const exportarCsv = () => {
    const linhas = [
      ["data_hora", "decisao", "pagina", "versao_texto", "origem"].join(";"),
      ...rows.map((x) =>
        [
          fmtDataHora(x.created_at),
          x.event_type === "consent_accept" ? "aceite" : "recusa",
          x.path ?? "",
          x.value?.version ?? "",
          x.value?.source ?? "",
        ].join(";"),
      ),
    ];
    const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-lgpd-${periodo}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const card = "rounded-lg border bg-card p-4";

  return (
    <AdminLayout
      active="lgpd"
      title="LGPD"
      description="Aceites e recusas do banner de cookies, para auditoria de consentimento."
      actions={
        <div className="flex flex-wrap gap-2">
          {([7, 28, 90] as Periodo[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodo(p)}
              aria-pressed={periodo === p}
              className={`min-h-[44px] rounded-md border px-3 text-sm ${periodo === p ? "bg-primary text-primary-foreground" : "bg-background"}`}
            >
              {p} dias
            </button>
          ))}
          <button
            type="button"
            onClick={exportarCsv}
            disabled={!rows.length}
            className="min-h-[44px] rounded-md border bg-background px-3 text-sm disabled:opacity-50"
          >
            Exportar CSV
          </button>
        </div>
      }
    >
      {erro ? (
        <div role="alert" className={`${card} text-destructive`}>
          Não foi possível carregar os registros: {erro}{" "}
          <button type="button" className="underline" onClick={() => void load()}>
            Tentar de novo
          </button>
        </div>
      ) : loading ? (
        <p className="text-muted-foreground">Carregando registros…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={card}>
              <p className="text-sm text-muted-foreground">Aceites</p>
              <p className="num text-2xl font-semibold">{aceites.toLocaleString("pt-BR")}</p>
            </div>
            <div className={card}>
              <p className="text-sm text-muted-foreground">Recusas</p>
              <p className="num text-2xl font-semibold">{recusas.toLocaleString("pt-BR")}</p>
            </div>
            <div className={card}>
              <p className="text-sm text-muted-foreground">Taxa de aceite</p>
              <p className="num text-2xl font-semibold">{taxa(aceites, recusas)}</p>
              <p className="text-xs text-muted-foreground">aceites ÷ (aceites + recusas)</p>
            </div>
          </div>

          {!rows.length ? (
            <p className={`${card} text-muted-foreground`}>Nenhuma decisão registrada nos últimos {periodo} dias.</p>
          ) : (
            <>
              <section className={card}>
                <h2 className="mb-3 font-semibold">Por dia</h2>
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="py-1">Dia</th>
                        <th>Aceites</th>
                        <th>Recusas</th>
                        <th>Taxa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {porDia.map(([d, c]) => (
                        <tr key={d} className="border-t">
                          <td className="py-1">{fmtDia(d)}</td>
                          <td className="num">{c.a}</td>
                          <td className="num">{c.r}</td>
                          <td className="num">{taxa(c.a, c.r)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className={card}>
                <h2 className="mb-3 font-semibold">Por versão do texto do aviso</h2>
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-1">Versão</th>
                      <th>Aceites</th>
                      <th>Recusas</th>
                      <th>Taxa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porVersao.map(([v, c]) => (
                      <tr key={v} className="border-t">
                        <td className="py-1">v{v}</td>
                        <td className="num">{c.a}</td>
                        <td className="num">{c.r}</td>
                        <td className="num">{taxa(c.a, c.r)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className={card}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">Histórico de decisões</h2>
                  <select
                    aria-label="Filtrar decisões"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value as typeof filtro)}
                    className="min-h-[44px] rounded-md border bg-background px-2 text-sm"
                  >
                    <option value="todos">Todas</option>
                    <option value="consent_accept">Só aceites</option>
                    <option value="consent_decline">Só recusas</option>
                  </select>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Cada linha é uma decisão registrada de forma anônima (sem identificar o visitante). Mostrando até
                  500; o CSV traz todas do período.
                </p>
                <div className="max-h-[32rem] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="py-1">Data e hora</th>
                        <th>Decisão</th>
                        <th className="hidden sm:table-cell">Página</th>
                        <th>Versão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historico.map((x) => (
                        <tr key={x.id} className="border-t">
                          <td className="num py-1">{fmtDataHora(x.created_at)}</td>
                          <td>{x.event_type === "consent_accept" ? "✓ Aceite" : "✕ Recusa"}</td>
                          <td className="hidden max-w-[16rem] truncate sm:table-cell">{x.path ?? "—"}</td>
                          <td>v{x.value?.version ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
