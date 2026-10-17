import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Copy, KeyRound, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/guia/components/ui/button";
import { buildExportUrl, createExportKey, datasetLabel, DATASETS, EXPORT_DATASETS, fetchExportKeys, revokeExportKey, exportBase, type CreatedExportKey, type ExportDataset, type ExportKeyRow } from "@/lib/dataExport";

export default function ExportKeysPanel() {
  const [keys, setKeys] = useState<ExportKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<ExportDataset[]>([]);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedExportKey | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchExportKeys();
      setKeys(res.keys); setError(res.error ? "Não foi possível consultar as chaves." : null);
    } catch { setError("Não foi possível consultar as chaves."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function submit(e: FormEvent) {
    e.preventDefault(); setCreating(true); setError(null);
    try {
      const res = await createExportKey(name, picked);
      if (!res.key || res.error) { setError(res.error ?? "Não foi possível criar a chave."); return; }
      setCreated(res.key); setName(""); setPicked([]); await load();
    } catch { setError("Não foi possível criar a chave."); }
    finally { setCreating(false); }
  }
  async function revoke(key: ExportKeyRow) {
    if (!window.confirm(`Revogar o acesso de “${key.name}”? O sistema deixará de consultar os dados.`)) return;
    setRevoking(key.id); setError(null);
    try {
      const res = await revokeExportKey(key.id);
      if (res.error) { setError("Não foi possível revogar a chave."); return; }
      if (created?.id === key.id) setCreated(null);
      await load();
    } catch { setError("Não foi possível revogar a chave."); }
    finally { setRevoking(null); }
  }
  async function copy(id: string, value: string) {
    try { await navigator.clipboard.writeText(value); setCopied(id); }
    catch { setError("Não foi possível copiar. Selecione o campo e copie manualmente."); }
  }
  return <section aria-label="Integração via API" className="min-w-0 space-y-8" data-testid="export-keys">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="bw-admin__section-title">Chaves de API</h2><p className="text-sm text-muted-foreground">Consulta somente leitura · permissões por conjunto de dados</p></div>
      <Button variant="outline" className="min-h-11" disabled={loading} onClick={() => void load()}><RefreshCw aria-hidden="true" />Atualizar chaves</Button>
    </header>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {created && <div data-testid="created-key" className="min-w-0 space-y-4 border border-border bg-muted p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><strong>Chave criada — copie agora</strong><Button variant="outline" className="min-h-11" onClick={() => setCreated(null)}>Já copiei</Button></div>
      <p className="text-sm">A chave completa aparece apenas uma vez. Guarde-a no sistema autorizado; não compartilhe em mensagens ou endereços públicos.</p>
      <label className="grid gap-2">Chave API<div className="flex min-w-0 gap-2"><input aria-label="Chave API" readOnly value={created.token} type="password" className="min-h-11 min-w-0 flex-1 border border-border bg-background px-3" /><Button variant="outline" className="min-h-11" onClick={() => void copy("key", created.token)}><Copy aria-hidden="true" />{copied === "key" ? "Copiado" : "Copiar"}</Button></div></label>
      {created.datasets.map(d => <div key={d} className="min-w-0 space-y-2 border-t border-border pt-3"><strong>{DATASETS[d].label}</strong><div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-11" onClick={() => void copy(d, buildExportUrl(d, created.token, "json"))}><Copy aria-hidden="true" />{copied === d ? "Copiado" : "Copiar endereço JSON"}</Button><Button variant="outline" className="min-h-11" onClick={() => void copy(`${d}-csv`, buildExportUrl(d, created.token, "csv"))}><Copy aria-hidden="true" />{copied === `${d}-csv` ? "Copiado" : "Copiar endereço CSV"}</Button></div></div>)}
    </div>}
    <form onSubmit={e => void submit(e)} aria-label="Nova chave de API" className="grid min-w-0 gap-5 border-t border-border pt-6">
      <label className="grid gap-2">Nome do sistema<input className="min-h-11 w-full min-w-0 border border-border bg-background px-3" value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder="Ex.: Painel de indicadores" required /></label>
      <fieldset className="grid min-w-0 gap-3"><legend className="mb-3 font-semibold">Dados autorizados</legend>
        {EXPORT_DATASETS.map(d => <label key={d} className="flex min-h-11 min-w-0 items-start gap-3"><input type="checkbox" className="mt-1" checked={picked.includes(d)} onChange={() => setPicked(current => current.includes(d) ? current.filter(x => x !== d) : [...current, d])} /><span className="min-w-0"><strong className="block">{DATASETS[d].label}</strong><span className="block text-sm text-muted-foreground">{DATASETS[d].description}</span></span></label>)}
      </fieldset>
      <div><Button type="submit" className="min-h-11" disabled={creating || !name.trim() || !picked.length}><KeyRound aria-hidden="true" />{creating ? "Criando…" : "Criar chave API"}</Button></div>
    </form>
    <section aria-label="Chaves cadastradas" className="min-w-0 border-t border-border pt-6"><h3 className="mb-4 font-semibold">Acessos cadastrados</h3>
      {loading ? <p role="status">Consultando chaves…</p> : keys.length === 0 ? <p>Nenhuma chave cadastrada.</p> : <ul className="grid min-w-0 gap-4">{keys.map(key => <li key={key.id} className="min-w-0 border-b border-border pb-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><strong className="break-words">{key.name}</strong><p className="text-sm">{key.revoked_at ? "Revogada" : "Ativa"} · Somente leitura</p></div>{!key.revoked_at && <Button variant="outline" className="min-h-11" disabled={revoking === key.id} onClick={() => void revoke(key)}><Trash2 aria-hidden="true" />{revoking === key.id ? "Revogando…" : "Revogar"}</Button>}</div><p className="mt-2 break-words text-sm text-muted-foreground">{key.datasets.map(datasetLabel).join(" · ")}</p><p className="mt-2 text-sm tabular-nums">Último uso: {key.last_used_at ? new Date(key.last_used_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "Nunca"} · {key.use_count} consultas</p></li>)}</ul>}
    </section>
    <section aria-label="Consulta externa" className="min-w-0 space-y-3 border-t border-border pt-6"><h3 className="flex items-center gap-2 font-semibold"><ShieldCheck aria-hidden="true" />Consulta externa</h3><dl className="grid min-w-0 gap-3 text-sm"><div><dt className="font-semibold">Método e endereço</dt><dd className="break-all font-mono">GET {exportBase()}?dataset=leads&amp;format=json</dd></div><div><dt className="font-semibold">Autorização</dt><dd className="break-all font-mono">Authorization: Bearer SUA_CHAVE_API</dd></div><div><dt className="font-semibold">Formato</dt><dd>JSON ou CSV</dd></div><div><dt className="font-semibold">Webhook</dt><dd>Não habilitado: esta integração permite consultar, não enviar nem alterar dados.</dd></div></dl><p className="text-sm text-muted-foreground">Contatos pessoais não são exportados em texto puro. Conversões do Google Ads incluem identificadores de clique e contatos protegidos por hash; autorize esse conjunto apenas para essa finalidade.</p></section>
  </section>;
}
