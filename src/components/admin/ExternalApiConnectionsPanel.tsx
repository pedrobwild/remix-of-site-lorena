import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Pencil, Plug, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/guia/components/ui/button";
import { listExternalConnections, removeExternalConnection, saveExternalConnection, testEngineConnection } from "@/lib/externalApi.functions";
import type { ExternalConnection } from "@/lib/externalApi";

export default function ExternalApiConnectionsPanel() {
  const list = useServerFn(listExternalConnections);
  const save = useServerFn(saveExternalConnection);
  const remove = useServerFn(removeExternalConnection);
  const test = useServerFn(testEngineConnection);
  const [connections, setConnections] = useState<ExternalConnection[]>([]);
  const [engineConfigured, setEngineConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [id, setId] = useState<string | undefined>();
  const [provider, setProvider] = useState<"bwild_engine" | "custom">("bwild_engine");
  const [name, setName] = useState("Bwild Engine");
  const [website, setWebsite] = useState("https://bwildengine.com/");
  const [apiKey, setApiKey] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try { const result = await list(); setConnections(result.connections); setEngineConfigured(result.engineConfigured); }
    catch { setError("Não foi possível consultar as conexões."); }
    finally { setLoading(false); }
  }, [list]);
  useEffect(() => { void load(); }, [load]);
  function selectProvider(value: "bwild_engine" | "custom") {
    setProvider(value); setId(undefined); setApiKey("");
    setName(value === "bwild_engine" ? "Bwild Engine" : "");
    setWebsite(value === "bwild_engine" ? "https://bwildengine.com/" : "");
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(null); setMessage(null);
    const key = apiKey; setApiKey("");
    try { await save({ data: { id, provider, name, website_url: website, api_key: key } }); setMessage("Chave salva com segurança."); setId(undefined); await load(); }
    catch { setError("Não foi possível salvar. Confira o endereço e informe a chave novamente."); }
    finally { setBusy(false); }
  }
  async function deleteConnection(row: ExternalConnection) {
    const detail = row.provider === "bwild_engine" && engineConfigured ? " A conexão voltará a usar a chave original já configurada." : "";
    if (!window.confirm(`Remover a chave de ${row.name}?${detail}`)) return;
    setBusy(true); setError(null); setMessage(null);
    try { await remove({ data: { id: row.id } }); setMessage("Chave cadastrada removida."); await load(); }
    catch { setError("Não foi possível remover a chave."); }
    finally { setBusy(false); }
  }
  async function testConnection() {
    setBusy(true); setError(null); setMessage(null);
    try { const result = await test(); if (result.ok) setMessage(result.message); else setError(result.message); }
    catch { setError("Não foi possível testar a conexão."); }
    finally { setBusy(false); }
  }
  return <section aria-label="Chaves de sistemas externos" className="min-w-0 space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><h2 className="bw-admin__section-title">Sistemas externos</h2><Button variant="outline" className="min-h-11" disabled={loading || busy} onClick={() => void load()}><RefreshCw aria-hidden="true" />Atualizar conexões</Button></header>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {message && <p role="status">{message}</p>}
    <form aria-label="Cadastrar chave externa" onSubmit={event => void submit(event)} className="grid min-w-0 gap-5 border-t border-border pt-6">
      <label className="grid gap-2">Sistema<select className="min-h-11 min-w-0 border border-border bg-background px-3" value={provider} onChange={event => selectProvider(event.target.value === "bwild_engine" ? "bwild_engine" : "custom")}><option value="bwild_engine">Bwild Engine</option><option value="custom">Outro sistema</option></select></label>
      <label className="grid gap-2">Nome do sistema<input required maxLength={80} value={name} onChange={event => setName(event.target.value)} className="min-h-11 min-w-0 border border-border bg-background px-3" /></label>
      <label className="grid gap-2">Endereço do sistema<input required type="url" maxLength={500} value={website} onChange={event => setWebsite(event.target.value)} className="min-h-11 min-w-0 border border-border bg-background px-3" placeholder="https://" /></label>
      <label className="grid gap-2">Chave API do sistema<input required type="password" autoComplete="new-password" maxLength={4096} value={apiKey} onChange={event => setApiKey(event.target.value)} className="min-h-11 min-w-0 border border-border bg-background px-3" /></label>
      <div className="flex flex-wrap gap-3"><Button type="submit" className="min-h-11" disabled={busy || !apiKey.trim()}><KeyRound aria-hidden="true" />{busy ? "Aguarde…" : id ? "Substituir chave" : "Salvar chave externa"}</Button>{id && <Button variant="outline" className="min-h-11" onClick={() => selectProvider("bwild_engine")}>Cancelar</Button>}</div>
    </form>
    <div className="min-w-0 space-y-4 border-t border-border pt-6"><h3 className="font-semibold">Conexões cadastradas</h3>
      {loading ? <p role="status">Consultando conexões…</p> : connections.length === 0 ? <p>Nenhuma chave externa cadastrada nesta aba.</p> : <ul className="space-y-4">{connections.map(row => <li key={row.id} className="min-w-0 border-b border-border pb-4"><div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><strong className="break-words">{row.name}</strong><p className="break-all text-sm text-muted-foreground">{row.website_url}</p><p className="text-sm">Chave protegida · {row.provider === "bwild_engine" ? "Consulta do CRM" : "Aguardando configuração da consulta"}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-11" disabled={busy} onClick={() => { setId(row.id); setProvider(row.provider); setName(row.name); setWebsite(row.website_url); setApiKey(""); setMessage(null); }}><Pencil aria-hidden="true" />Substituir</Button><Button variant="outline" className="min-h-11" disabled={busy} onClick={() => void deleteConnection(row)}><Trash2 aria-hidden="true" />Remover</Button></div></div></li>)}</ul>}
      {engineConfigured && !connections.some(row => row.provider === "bwild_engine") && <p>Bwild Engine: chave original já configurada. Salvar uma nova chave substitui seu uso nas consultas.</p>}
      <Button variant="outline" className="min-h-11" disabled={busy || loading} onClick={() => void testConnection()}><Plug aria-hidden="true" />Testar Bwild Engine</Button>
    </div>
  </section>;
}