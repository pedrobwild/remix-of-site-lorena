import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { Button } from "@/guia/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/guia/components/ui/tabs";
import { getOpenContracts } from "@/lib/openContracts.functions";
import type { OpenContractRow } from "@/lib/openContracts";
import "@/styles/form-leads.css";

export default function OpenContractsPage() {
  const read = useServerFn(getOpenContracts);
  const report = useQuery({ queryKey: ["open-contracts"], queryFn: () => read(), refetchInterval: 60_000 });
  const [search, setSearch] = useState("");
  const filter = (rows: OpenContractRow[]) => rows.filter(r => `${r.name} ${r.bairro ?? ""}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")));
  const list = (rows: OpenContractRow[], signed: boolean) => <>
    <p className="num">{rows.length} {signed ? "assinatura(s) registrada(s)" : "negócio(s) aguardando assinatura"}</p>
    {!rows.length ? <p>Nenhum registro disponível para esta seleção.</p> : rows.map(row => <article key={row.id} className="form-leads__row">
      <div><h2>{row.name}</h2><p>{row.bairro ?? "Bairro não informado"}</p></div>
      <div><span className="form-leads__mobile-label">Situação</span>{row.status}{signed && <p>Andamento: {row.progress}</p>}</div>
      <div className="num"><span className="form-leads__mobile-label">{signed ? "Valor do contrato" : "Valor da proposta"}</span>{row.total === null ? "Não informado pelo CRM" : row.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}{!signed && <p>Valor da proposta, ainda não assinado</p>}</div>
      <div className="num"><span className="form-leads__mobile-label">Data de assinatura</span>{row.signedAt ? <time dateTime={row.signedAt}>{new Date(row.signedAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time> : "Não informada"}</div>
    </article>)}
  </>;
  return <BewildAdminShell active="contratosabertos" title="Contratos em aberto" actions={<Button variant="outline" className="min-h-11" disabled={report.isFetching} onClick={() => void report.refetch()}><RefreshCw aria-hidden />Atualizar</Button>}>
    <section className="form-leads" aria-label="Acompanhamento de contratos">
      <div className="form-leads__filters"><label>Cliente ou bairro<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label></div>
      {report.isPending ? <p role="status">Consultando negócios e contratos…</p> : report.isError ? <p role="alert">Não foi possível consultar os contratos. Tente atualizar.</p> : <Tabs defaultValue="awaiting">
        <TabsList className="h-auto min-h-11 max-w-full flex-wrap"><TabsTrigger value="awaiting" className="min-h-11 whitespace-normal">Aguardando assinatura</TabsTrigger><TabsTrigger value="signed" className="min-h-11 whitespace-normal">Assinados · andamento</TabsTrigger></TabsList>
        <TabsContent value="awaiting">
          {!report.data.stagesAvailable && <p role="status">Consulta de etapas indisponível ou incompleta no CRM.</p>}
          {!report.data.proposalsAvailable && <p role="status">Valores das propostas indisponíveis ou incompletos no CRM.</p>}
          <div className="form-leads__header" aria-hidden><span>Cliente / bairro</span><span>Etapa no CRM</span><span>Valor da proposta</span><span>Data de assinatura</span></div>
          {list(filter(report.data.awaiting), false)}
        </TabsContent>
        <TabsContent value="signed">
          {!report.data.contractsAvailable && <p role="status">O CRM ainda não disponibilizou os contratos detalhados. Valores e assinaturas permanecem indisponíveis.</p>}
          <p>O andamento e a conclusão dos contratos não são enviados pelo CRM; não é possível confirmar quais seguem em aberto.</p>
          <div className="form-leads__header" aria-hidden><span>Cliente / bairro</span><span>Situação / andamento</span><span>Valor do contrato</span><span>Data de assinatura</span></div>
          {list(filter(report.data.signed), true)}
        </TabsContent>
      </Tabs>}
    </section>
  </BewildAdminShell>;
}