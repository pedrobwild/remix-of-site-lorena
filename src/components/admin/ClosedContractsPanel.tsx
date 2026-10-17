import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/guia/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { selectClosedContracts, type ContractLead } from "@/lib/closedContracts";

export default function ClosedContractsPanel() {
  const [rows, setRows] = useState<ContractLead[] | null>(null);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [bairro, setBairro] = useState("");
  useEffect(() => {
    let active = true;
    setRows(null); setError(false);
    async function read() {
      const result: ContractLead[] = [];
      for (let offset = 0; ; offset += 1000) {
        const page = await supabase.from("leads")
          .select("id,location,created_at,crm_won,crm_stage_name")
          .eq("crm_won", true).order("created_at", { ascending: false }).order("id")
          .range(offset, offset + 999);
        if (page.error) throw page.error;
        result.push(...(page.data ?? []));
        if (!active) return;
        if (!page.data || page.data.length < 1000) break;
      }
      if (active) setRows(result);
    }
    void read().catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [refresh]);
  const neighborhoods = useMemo(() => [...new Set((rows ?? []).map((row) => row.location).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "pt-BR")), [rows]);
  const contracts = selectClosedContracts(rows ?? [], bairro);
  const loading = rows === null && !error;
  return <section aria-label="Contratos fechados" className="min-w-0 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2>Contratos fechados</h2>
      <Button variant="outline" className="min-h-11" disabled={loading} onClick={() => setRefresh((value) => value + 1)}>
        <RefreshCw aria-hidden="true" className={loading ? "animate-spin motion-reduce:animate-none" : ""} />Atualizar contratos
      </Button>
    </div>
    <p className="text-sm text-muted-foreground">Pedidos marcados como ganhos no Bwild Engine. A integração não informa valor, data de fechamento nem recebimentos; o faturamento está indisponível, não zerado.</p>
    <label className="flex flex-wrap items-center gap-3">Bairro
      <select className="min-h-11 max-w-full" value={bairro} disabled={loading} onChange={(event) => setBairro(event.target.value)}>
        <option value="">Todos os bairros</option>
        {neighborhoods.map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
    </label>
    {loading ? <p role="status">Consultando contratos…</p> : error ? <p role="alert">Não foi possível consultar os contratos. Tente atualizar novamente.</p> : <div className="space-y-4" aria-live="polite">
      <p><strong className="tabular-nums">{contracts.length}</strong> {contracts.length === 1 ? "pedido com contrato confirmado" : "pedidos com contrato confirmado"}</p>
      {contracts.length === 0 ? <p>Nenhum contrato confirmado para este bairro.</p> : <ul className="space-y-4">
        {contracts.map((contract) => <li key={contract.id} className="min-w-0 border-t border-border pt-4">
          <h3 className="break-words">{contract.location || "Bairro não informado"}</h3>
          <dl className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-sm text-muted-foreground">Data de fechamento</dt><dd>Não informada</dd></div>
            <div><dt className="text-sm text-muted-foreground">Valor do contrato</dt><dd>Não informado</dd></div>
            <div><dt className="text-sm text-muted-foreground">Status</dt><dd>Contrato confirmado</dd><dd className="break-words text-sm text-muted-foreground">{contract.crm_stage_name || "Etapa não informada no CRM"}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Data do pedido</dt><dd className="tabular-nums">{new Date(contract.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</dd></div>
          </dl>
        </li>)}
      </ul>}
    </div>}
  </section>;
}