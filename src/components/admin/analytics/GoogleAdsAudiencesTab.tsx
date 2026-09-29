/**
 * GoogleAdsAudiencesTab — aba "Google Ads" do Analytics.
 * Mostra os públicos reais (listas), ações de conversão e campanhas da conta
 * Google Ads conectada, lidos ao vivo pela edge function `google-ads-audiences`
 * (últimos 30 dias). Só leitura.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type List = {
  id: string; name: string; type: string; sizeSearch: number; sizeDisplay: number;
  lifeSpanDays: number; eligibleSearch: boolean; eligibleDisplay: boolean;
};
type Conv = { id: string; name: string; category: string; status: string; primary: boolean; conversions30d: number; value30d: number };
type Camp = { id: string; name: string; status: string; channel: string; impressions: number; clicks: number; conversions: number; cost: number };
type Payload =
  | { connected: true; fetchedAt: string; lists: List[]; conversions: Conv[]; campaigns: Camp[] }
  | { connected: false; reason: string };

const nf = new Intl.NumberFormat("pt-BR");
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtSize = (v: number) => (v > 0 ? nf.format(v) : "< 1.000");

const TYPE_LABEL: Record<string, string> = {
  RULE_BASED: "visitantes do site",
  CRM_BASED: "lista de clientes",
  LOGICAL: "combinada",
  SIMILAR: "semelhante",
  BASIC: "básica",
  EXTERNAL_REMARKETING: "remarketing externo",
};
const STATUS_LABEL: Record<string, string> = { ENABLED: "ativa", PAUSED: "pausada", HIDDEN: "oculta" };

export default function GoogleAdsAudiencesTab() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: res, error: err } = await supabase.functions.invoke("google-ads-audiences");
    if (err) setError("Não foi possível carregar os dados do Google Ads.");
    else setData(res as Payload);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading && !data) {
    return <div className="aa-card"><div className="aa-empty">carregando dados do Google Ads…</div></div>;
  }
  if (error || !data) {
    return (
      <div className="aa-card">
        <div className="aa-empty">{error ?? "sem dados"} <button type="button" onClick={load}>tentar de novo</button></div>
      </div>
    );
  }
  if (!data.connected) {
    return <div className="aa-card"><div className="aa-empty"><span className="aa-empty__icon">∅</span>{data.reason}</div></div>;
  }

  const eligible = data.lists.filter((l) => l.eligibleDisplay || l.eligibleSearch).length;
  const totalConv = data.conversions.reduce((s, c) => s + c.conversions30d, 0);
  const spend = data.campaigns.reduce((s, c) => s + c.cost, 0);
  const campConv = data.campaigns.reduce((s, c) => s + c.conversions, 0);

  const kpis = [
    { label: "listas de público", value: nf.format(data.lists.length) },
    { label: "prontas para anúncios", value: nf.format(eligible) },
    { label: "conversões (30 dias)", value: nf.format(Math.round(totalConv)) },
    { label: "investimento (30 dias)", value: brl.format(spend) },
    { label: "custo por lead (30 dias)", value: campConv > 0 ? brl.format(spend / campConv) : "—" },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="aa-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="aa-kpi">
            <span className="aa-kpi__label">{k.label}</span>
            <span className="aa-kpi__value num">{k.value}</span>
          </div>
        ))}
      </div>

      <div className="aa-card">
        <div className="aa-card__head" style={{ flexWrap: "wrap" }}>
          <h3 className="aa-card__title">públicos (listas)</h3>
          <span className="aa-faint aa-mono" style={{ fontSize: "var(--aa-text-xs)" }}>
            atualizado {new Date(data.fetchedAt).toLocaleString("pt-BR")} ·{" "}
            <button type="button" onClick={load} disabled={loading}>{loading ? "atualizando…" : "atualizar"}</button>
          </span>
        </div>
        {data.lists.length === 0 ? (
          <div className="aa-empty">nenhuma lista de público na conta</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="aa-table">
              <thead>
                <tr><th>lista</th><th>tipo</th><th>rede de display</th><th>pesquisa</th><th>duração</th><th>uso</th></tr>
              </thead>
              <tbody>
                {data.lists.map((l) => (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td>{TYPE_LABEL[l.type] ?? l.type.toLowerCase()}</td>
                    <td className="num">{fmtSize(l.sizeDisplay)}</td>
                    <td className="num">{fmtSize(l.sizeSearch)}</td>
                    <td className="num">{l.lifeSpanDays ? `${l.lifeSpanDays} dias` : "—"}</td>
                    <td>{l.eligibleDisplay || l.eligibleSearch ? "pronta" : "ainda pequena"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="aa-card">
        <div className="aa-card__head"><h3 className="aa-card__title">conversões (últimos 30 dias)</h3></div>
        {data.conversions.length === 0 ? (
          <div className="aa-empty">nenhuma ação de conversão configurada</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="aa-table">
              <thead><tr><th>ação</th><th>categoria</th><th>principal</th><th>status</th><th>conversões</th></tr></thead>
              <tbody>
                {data.conversions.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.category.toLowerCase().replace(/_/g, " ")}</td>
                    <td>{c.primary ? "sim" : "não"}</td>
                    <td>{STATUS_LABEL[c.status] ?? c.status.toLowerCase()}</td>
                    <td className="num">{nf.format(Math.round(c.conversions30d * 10) / 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="aa-card">
        <div className="aa-card__head"><h3 className="aa-card__title">campanhas (últimos 30 dias)</h3></div>
        {data.campaigns.length === 0 ? (
          <div className="aa-empty">sem campanhas com dados no período</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="aa-table">
              <thead><tr><th>campanha</th><th>status</th><th>cliques</th><th>conversões</th><th>investimento</th><th>custo por lead</th></tr></thead>
              <tbody>
                {data.campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{STATUS_LABEL[c.status] ?? c.status.toLowerCase()}</td>
                    <td className="num">{nf.format(c.clicks)}</td>
                    <td className="num">{nf.format(Math.round(c.conversions * 10) / 10)}</td>
                    <td className="num">{brl.format(c.cost)}</td>
                    <td className="num">{c.conversions > 0 ? brl.format(c.cost / c.conversions) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
