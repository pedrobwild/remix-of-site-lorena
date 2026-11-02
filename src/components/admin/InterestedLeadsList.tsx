import { Mail, MessageCircle } from "lucide-react";
import { Button } from "@/guia/components/ui/button";
import { mailtoHref, waLink } from "@/lib/adminLeads";

type ContactLead = {
  id: string;
  name: string | null;
  whatsapp: string | null;
  email: string | null;
  created_at: string;
};

function receivedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export default function InterestedLeadsList({ rows }: { rows: ContactLead[] }) {
  return (
    <div role="table" aria-label="Interessados: nome, contato e data" className="min-w-0">
      <div role="row" className="hidden gap-4 border-b border-border px-4 py-3 text-sm font-semibold md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]">
        <span role="columnheader">Nome</span>
        <span role="columnheader">Contato</span>
        <span role="columnheader">Recebido em</span>
      </div>
      <div role="rowgroup">
        {rows.map(lead => {
          const whatsapp = waLink(lead.whatsapp);
          const email = mailtoHref(lead.email);
          return (
            <div role="row" key={lead.id} className="grid min-w-0 gap-2 border-b border-border px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] md:gap-4">
              <div role="cell" className="min-w-0 break-words font-semibold">{lead.name?.trim() || "Nome não informado"}</div>
              <div role="cell" className="flex min-w-0 flex-col items-start gap-1">
                {lead.whatsapp && (whatsapp ? (
                  <Button asChild variant="link" className="h-auto min-h-11 max-w-full justify-start whitespace-normal px-0 text-left">
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" /><span className="break-all">{lead.whatsapp}</span></a>
                  </Button>
                ) : <span className="break-all">{lead.whatsapp}</span>)}
                {lead.email && (email ? (
                  <Button asChild variant="link" className="h-auto min-h-11 max-w-full justify-start whitespace-normal px-0 text-left">
                    <a href={email}><Mail aria-hidden="true" /><span className="break-all">{lead.email}</span></a>
                  </Button>
                ) : <span className="break-all">{lead.email}</span>)}
                {!lead.whatsapp && !lead.email && <span className="text-muted-foreground">Contato não informado</span>}
              </div>
              <div role="cell" className="text-sm text-muted-foreground"><span className="md:hidden">Recebido em </span><time dateTime={lead.created_at}>{receivedDate(lead.created_at)}</time></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}