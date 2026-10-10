/**
 * Read-only Ads reporting. Dates and landing_path scope performance, not the
 * current account audience inventory. Never display an unacknowledged filter.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtLocalDay } from "@/lib/analyticsTimeseries";
import { previousRange, trend } from "@/lib/analyticsCompare";
import type { DateRange, Segment } from "./types";

type List = {
  id: string;
  name: string;
  type: string;
  sizeSearch: number | null;
  sizeDisplay: number | null;
  lifeSpanDays: number;
  eligibleSearch: boolean;
  eligibleDisplay: boolean;
};
type Conv = {
  id: string;
  name: string;
  category: string;
  status: string;
  primary: boolean;
  conversions: number;
  allConversions: number;
};
type Camp = {
  id: string;
  name: string;
  status: string;
  channel: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
};
type Days = { from: string; to: string };
type Request = Days & { segments: Segment[]; previous: Days | null };
type Period = {
  range: Days;
  conversions: Conv[];
  campaigns: Camp[];
  totals: { clicks: number; cost: number; impressions: number; conversions: number };
};
type Payload = Period & {
  connected: true;
  version: 2;
  request: Request;
  fetchedAt: string;
  lists: List[];
  scope: {
    landingPath: string | null;
    lists: string;
    timeZone: string;
    currency: string;
    today: string;
  };
  previous: Period | null;
};
type Props = { range: DateRange; segments: Segment[]; comparePrev: boolean };
const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const fmtDay = (day: string) => day.split("-").reverse().join("/");
const fmtRange = (range: Days) => `${fmtDay(range.from)} a ${fmtDay(range.to)}`;
const fmtSize = (value: number | null) => (value == null ? "não informado" : nf.format(value));
const TYPE_LABEL: Record<string, string> = {
  RULE_BASED: "visitantes do site",
  CRM_BASED: "lista de clientes",
  LOGICAL: "combinada",
  SIMILAR: "semelhante",
  BASIC: "básica",
  EXTERNAL_REMARKETING: "remarketing externo",
};
const STATUS_LABEL: Record<string, string> = {
  ENABLED: "ativa",
  PAUSED: "pausada",
  HIDDEN: "oculta",
  REMOVED: "removida",
};

export default function GoogleAdsAudiencesTab({ range, segments, comparePrev }: Props) {
  const prev = previousRange(range);
  const request: Request = {
    from: fmtLocalDay(range.from),
    to: fmtLocalDay(range.to),
    segments,
    previous: comparePrev ? { from: fmtLocalDay(prev.from), to: fmtLocalDay(prev.to) } : null,
  };
  const requestKey = JSON.stringify(request);
  const unsupported = segments.some((s) => s.dim !== "landing_path") || segments.length > 1;
  const query = useQuery({
    queryKey: ["google-ads-audiences", requestKey],
    enabled: !unsupported,
    retry: false,
    staleTime: 60_000,
    queryFn: async ({ signal }): Promise<Payload> => {
      const { data, error } = await supabase.functions.invoke("google-ads-audiences", {
        body: request,
        signal,
      });
      if (error) {
        let message = "Não foi possível carregar este recorte do Google Ads. Tente novamente.";
        if (error.context instanceof Response) {
          const detail = await error.context
            .clone()
            .json()
            .catch(() => null);
          if (typeof detail?.reason === "string") message = detail.reason;
        }
        throw new Error(message);
      }
      if (!data?.connected) throw new Error(data?.reason ?? "Google Ads indisponível.");
      if (data.version !== 2 || JSON.stringify(data.request) !== requestKey)
        throw new Error(
          "O servidor ainda não confirmou os filtros. Publique a versão atualizada de google-ads-audiences para exibir este recorte."
        );
      return data as Payload;
    },
  });

  if (unsupported)
    return (
      <div className="aa-card">
        <div className="aa-empty" role="alert">
          Nesta aba, use somente o segmento landing_path. Remova os demais filtros do site para
          consultar o Google Ads.
        </div>
      </div>
    );
  if (query.isPending)
    return (
      <div className="aa-card" aria-busy="true">
        <div className="aa-empty" role="status">
          carregando o recorte selecionado do Google Ads…
        </div>
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className="aa-card">
        <div className="aa-empty" role="alert">
          {query.error?.message ?? "Sem dados disponíveis."}{" "}
          <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching}>
            tentar de novo
          </button>
        </div>
      </div>
    );
  const data = query.data;
  const money = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: data.scope.currency,
    }).format(value);
  const totals = data.totals;
  const previous = data.previous?.totals;
  const cpa = (t: typeof totals | undefined) =>
    t && t.conversions > 0 ? t.cost / t.conversions : null;
  const kpis = [
    {
      label: "cliques no período",
      value: nf.format(totals.clicks),
      cur: totals.clicks,
      prev: previous?.clicks,
    },
    {
      label: "conversões do Ads",
      value: nf.format(totals.conversions),
      cur: totals.conversions,
      prev: previous?.conversions,
    },
    {
      label: "investimento no período",
      value: money(totals.cost),
      cur: totals.cost,
      prev: previous?.cost,
    },
    {
      label: "custo por conversão",
      value: cpa(totals) == null ? "não disponível" : money(cpa(totals)!),
      cur: cpa(totals),
      prev: cpa(previous),
    },
  ];
  return (
    <div
      style={{ display: "grid", gap: 16 }}
      data-testid="google-ads-report"
      aria-busy={query.isFetching}
    >
      <div className="aa-card">
        <div className="aa-card__head" style={{ flexWrap: "wrap", gap: 12 }}>
          <h3 className="aa-card__title">Google Ads · {fmtRange(data.range)}</h3>
          <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching}>
            {query.isFetching ? "atualizando…" : "atualizar"}
          </button>
        </div>
        <div style={{ padding: "0 16px 16px", overflowWrap: "anywhere" }}>
          <p data-testid="google-ads-scope">
            {data.scope.landingPath
              ? `Destino dos anúncios: ${data.scope.landingPath}. Métricas das URLs históricas correspondentes, sem parâmetros de rastreamento.`
              : "Todas as páginas de destino da conta."}
          </p>
          <p className="aa-faint">
            Datas inclusivas no fuso {data.scope.timeZone}. Conversões atribuídas pelo Google Ads,
            não leads únicos do CRM nem todas as visitas do site.
          </p>
          {data.previous && <p>Comparação: {fmtRange(data.previous.range)}.</p>}
          {data.range.to >= data.scope.today && (
            <p role="status">
              Período atual em andamento. A comparação usa dias de calendário; o período anterior
              pode conter dias completos.
            </p>
          )}
          <p className="aa-faint">
            Atualizado {new Date(data.fetchedAt).toLocaleString("pt-BR")}. Status das campanhas e
            configuração das ações são atuais.
          </p>
        </div>
      </div>
      <div className="aa-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="aa-kpi">
            <span className="aa-kpi__label">{k.label}</span>
            <span className="aa-kpi__value num">{k.value}</span>
            {data.previous && (
              <span className="aa-kpi__delta">
                {k.cur == null || k.prev == null
                  ? "sem base comparável"
                  : trend(k.cur, k.prev).label}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="aa-card">
        <div className="aa-card__head">
          <h3 className="aa-card__title">campanhas no recorte</h3>
        </div>
        {data.campaigns.length === 0 ? (
          <div className="aa-empty">
            Nenhum dado de campanhas para este período e página. Os totais da conta não substituem
            este resultado.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="aa-table">
              <thead>
                <tr>
                  <th>campanha</th>
                  <th>status atual</th>
                  <th>cliques</th>
                  <th>conversões</th>
                  <th>investimento</th>
                  <th>custo por conversão</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{STATUS_LABEL[c.status] ?? c.status.toLowerCase()}</td>
                    <td className="num">{nf.format(c.clicks)}</td>
                    <td className="num">{nf.format(c.conversions)}</td>
                    <td className="num">{money(c.cost)}</td>
                    <td className="num">
                      {c.conversions > 0 ? money(c.cost / c.conversions) : "não disponível"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="aa-card">
        <div className="aa-card__head">
          <h3 className="aa-card__title">ações de conversão no recorte</h3>
        </div>
        <p className="aa-faint" style={{ padding: "0 16px 12px" }}>
          “Todas” inclui as ações secundárias. Não some esta coluna para estimar pessoas únicas.
        </p>
        {data.conversions.length === 0 ? (
          <div className="aa-empty">nenhuma ação de conversão configurada</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="aa-table">
              <thead>
                <tr>
                  <th>ação</th>
                  <th>principal hoje</th>
                  <th>status atual</th>
                  <th>conversões</th>
                  <th>todas</th>
                </tr>
              </thead>
              <tbody>
                {data.conversions.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.primary ? "sim" : "não"}</td>
                    <td>{STATUS_LABEL[c.status] ?? c.status.toLowerCase()}</td>
                    <td className="num">{nf.format(c.conversions)}</td>
                    <td className="num">{nf.format(c.allConversions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="aa-card">
        <div className="aa-card__head">
          <h3 className="aa-card__title">públicos · catálogo atual da conta</h3>
        </div>
        <p className="aa-faint" style={{ padding: "0 16px 12px" }}>
          {data.lists.length} listas. Tamanho e elegibilidade são atuais, não filtráveis por período
          ou página de entrada. Esta lista não representa somente visitantes da página selecionada
          nem comprova associação a campanhas.
        </p>
        {data.lists.length === 0 ? (
          <div className="aa-empty">nenhuma lista de público na conta</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="aa-table">
              <thead>
                <tr>
                  <th>lista</th>
                  <th>tipo</th>
                  <th>tamanho display</th>
                  <th>tamanho pesquisa</th>
                  <th>duração</th>
                  <th>elegível em</th>
                </tr>
              </thead>
              <tbody>
                {data.lists.map((l) => (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td>{TYPE_LABEL[l.type] ?? l.type.toLowerCase()}</td>
                    <td className="num">{fmtSize(l.sizeDisplay)}</td>
                    <td className="num">{fmtSize(l.sizeSearch)}</td>
                    <td>{l.lifeSpanDays ? `${l.lifeSpanDays} dias` : "não informado"}</td>
                    <td>
                      {[l.eligibleDisplay && "display", l.eligibleSearch && "pesquisa"]
                        .filter(Boolean)
                        .join(", ") || "nenhuma rede informada"}
                    </td>
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
