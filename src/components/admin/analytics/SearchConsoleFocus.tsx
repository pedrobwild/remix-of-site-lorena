import type { CrawlRow, SearchPanel } from "@/lib/searchConsoleSnapshot";

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const timestamp = (v: string | null) => v ? new Date(v).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "Ainda não conferido";
export default function SearchConsoleFocus({ panel, refreshedAt, crawls, error, crawlError }: {
  panel: SearchPanel; refreshedAt: string | null; crawls: CrawlRow[]; error: string | null; crawlError: string | null;
}) {
  return <section className="space-y-5 border-b border-border pb-6">
    <div>
      <h3 className="text-lg font-semibold">Google Search Console</h3>
      <p className="text-sm text-muted-foreground">Última atualização: {timestamp(refreshedAt)} · horário de São Paulo</p>
      <p className="text-sm text-muted-foreground">Cópia diária. O Google publica dados com atraso; dias recentes podem estar incompletos.</p>
      {error && <p role="alert" className="text-destructive">{error} A última cópia disponível foi preservada.</p>}
    </div>
    <div>
      <h4 className="font-semibold">Reforma de studios · busca exata</h4>
      {panel.studio ? <dl className="grid grid-cols-2 gap-4 py-3 md:grid-cols-4">
        {[ ["Impressões", number.format(panel.studio.impressions)], ["Cliques", number.format(panel.studio.clicks)], ["CTR", `${number.format(panel.studio.ctr * 100)}%`], ["Posição média", panel.studio.impressions ? number.format(panel.studio.position) : "—"] ].map(([name, value]) => <div key={name}><dt className="text-sm text-muted-foreground">{name}</dt><dd className="text-xl font-semibold tabular-nums">{value}</dd></div>)}
      </dl> : <p className="py-3 text-muted-foreground">O Google não informou esta busca no período.</p>}
      <p className="text-sm text-muted-foreground">Total por propriedade; as aparições por página abaixo são um recorte separado.</p>
      <ul className="divide-y divide-border">
        {(panel.studio_pages ?? []).map(row => <li key={row.page} className="grid gap-1 py-3 md:grid-cols-2"><a className="break-all text-primary underline" href={row.page} target="_blank" rel="noreferrer">{new URL(row.page).pathname}</a><span className="text-sm tabular-nums">{number.format(row.impressions)} impressões · {number.format(row.clicks)} cliques · posição {number.format(row.position)}</span></li>)}
      </ul>
    </div>
    <div>
      <h4 className="font-semibold">Último rastreio do Google</h4>
      {crawlError && <p role="alert" className="text-destructive">{crawlError}</p>}
      {!crawlError && !crawls.length && <p className="text-muted-foreground">Nenhuma conferência disponível.</p>}
      <ul className="divide-y divide-border">{crawls.map(row => <li key={row.url} className="space-y-1 py-3">
        <a className="break-all text-primary underline" href={row.url} target="_blank" rel="noreferrer">{new URL(row.url).pathname}</a>
        <p className="text-sm">{row.error ?? row.coverage_state ?? "Situação não informada"}</p>
        <p className="text-sm text-muted-foreground">Leitura do Google: {timestamp(row.last_crawl_at)} · conferência: {timestamp(row.last_checked_at)}</p>
      </li>)}</ul>
    </div>
  </section>;
}