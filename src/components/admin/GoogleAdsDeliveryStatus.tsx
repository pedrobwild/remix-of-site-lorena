import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getGoogleAdsDeliveryStatus } from "@/lib/googleAdsDelivery.functions";
export default function GoogleAdsDeliveryStatus() {
  const load = useServerFn(getGoogleAdsDeliveryStatus);
  const result = useQuery({ queryKey: ["google-ads-delivery-status"], queryFn: () => load(), refetchInterval: 60000 });
  return <section className="border-t border-border pt-5 space-y-3" aria-label="Envio automático Google Ads"><h3 className="font-semibold">Envio automático Google Ads</h3>
    {result.isPending ? <p role="status">Consultando envios…</p> : result.isError ? <p role="alert">Não foi possível consultar os envios.</p> : result.data && <>
      <p>{result.data.enabled ? "Ativo para novos eventos autorizados" : "Não ativado — importação e teste ainda precisam ser conferidos"}</p>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 num">{[["Pendentes", result.data.counts.pending + result.data.counts.processing], ["Recebidos pelo Google", result.data.counts.accepted], ["Bloqueados", result.data.counts.blocked], ["Falhas", result.data.counts.failed]].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl>
      <p className="text-sm text-muted-foreground">Recebido significa aguardando processamento, não conversão atribuída à campanha.</p>
    </>}
  </section>;
}