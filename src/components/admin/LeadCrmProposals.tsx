import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/guia/components/ui/button";
import { getCrmLeadDetails } from "@/lib/crmLeadDetails.functions";

type Details = Awaited<ReturnType<typeof getCrmLeadDetails>>;
export function LeadCrmProposals({ leadId }: { leadId: string }) {
  const read = useServerFn(getCrmLeadDetails);
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) setRevision((value) => value + 1);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let alive = true;
    setBusy(true);
    setError(false);
    setDetails(null);
    void read({ data: { leadId } }).then((result) => {
      if (alive) setDetails(result);
    }).catch(() => {
      if (alive) setError(true);
    }).finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [leadId, read, revision]);
  return <section className="mt-4 grid gap-2" aria-label="Propostas do CRM">
    <div className="flex flex-wrap items-center gap-3">
      <h3 className="font-semibold">Propostas publicadas</h3>
      <Button variant="outline" className="min-h-11" disabled={busy} onClick={() => setRevision((value) => value + 1)}>
        <RefreshCw aria-hidden="true" /> Atualizar propostas
      </Button>
    </div>
    {busy ? <p role="status">Consultando o BWild Engine…</p>
      : error ? <p role="alert" className="text-destructive">Não foi possível consultar o CRM.</p>
      : details && <>
        <h3 className="font-semibold">Perfil qualitativo</h3>
        <p>{details.profilesAvailable ? details.profile?.profile_name ?? "Sem perfil vinculado no CRM" : "Consulta de perfil indisponível"}</p>
        <p className="text-muted-foreground">Etapa atual: {details.stagesAvailable ? details.stage ?? "Sem negócio no CRM" : "Consulta indisponível"}</p>
        {!details.proposalsAvailable ? <p role="alert" className="text-destructive">Consulta de propostas indisponível.</p>
          : !details.proposals.length ? <p className="text-muted-foreground">Nenhuma proposta publicada para este pedido.</p>
          : <ul className="grid gap-2">
            {details.proposals.map((proposal) => <li key={proposal.public_id} className="flex flex-wrap items-center gap-3">
              <Button asChild variant="link" className="min-h-11 max-w-full whitespace-normal text-left">
                <a href={proposal.url} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" /> Proposta · versão {proposal.version_number}</a>
              </Button>
              <span className="tabular-nums">{proposal.total == null ? "Valor não informado" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(proposal.total)}</span>
            </li>)}
          </ul>}
      </>}
  </section>;
}