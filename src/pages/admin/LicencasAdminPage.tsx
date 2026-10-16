import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { LICENCAS, LICENCA_SLUGS, mergeLicenca, type LicencaSlug } from "@/content/pages/licencas";

type Draft = { title: string; intro: string; body: string };
type Row = { slug: string; title: string | null; intro: string | null; body: string | null; updated_at: string };

function dataBr(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}

/** /admin/licencas — edita o texto das páginas de licença (vai ao ar em minutos, sem publicar o site). */
export default function LicencasAdminPage() {
  const [slug, setSlug] = useState<LicencaSlug>("cc-by-4-0");
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("site_licenses").select("slug, title, intro, body, updated_at");
    if (error) {
      setLoadError("Não foi possível carregar as licenças. Tente de novo em instantes.");
      return;
    }
    setLoadError(null);
    setRows(Object.fromEntries((data ?? []).map((r) => [r.slug, r as Row])));
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setDraft(mergeLicenca(slug, rows[slug] ?? null)); setMsg(null); }, [slug, rows]);

  async function salvar(valores: Draft | null) {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase
      .from("site_licenses")
      .update({
        title: valores?.title ?? null,
        intro: valores?.intro ?? null,
        body: valores?.body ?? null,
      })
      .eq("slug", slug);
    setBusy(false);
    if (error) {
      setMsg({ kind: "err", text: "Não foi possível salvar. Confira se você está logado como administrador." });
      return;
    }
    setMsg({ kind: "ok", text: valores ? "Salvo. A página atualiza no site em alguns minutos." : "Texto padrão restaurado." });
    void load();
  }

  const L = LICENCAS[slug];
  const row = rows[slug];

  return (
    <AdminLayout active="licencas" title="Licenças" description="Texto das páginas de licença do site. Salvar já atualiza a página no ar — não precisa publicar.">
      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Licenças">
        {LICENCA_SLUGS.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={s === slug}
            onClick={() => setSlug(s)}
            className={`min-h-[44px] px-4 rounded-md border text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring ${s === slug ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"}`}
          >
            {LICENCAS[s].nome}
          </button>
        ))}
      </div>

      {loadError && <p role="alert" className="text-destructive text-sm mb-4">{loadError}</p>}
      {!draft ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <form
          className="space-y-4 max-w-3xl"
          onSubmit={(e) => { e.preventDefault(); void salvar(draft); }}
        >
          <p className="text-sm text-muted-foreground">
            Página: <a className="underline" href={L.path} target="_blank" rel="noopener">{L.path} (abre em nova aba)</a>
            {row?.updated_at && <> · última alteração {dataBr(row.updated_at)}</>}
          </p>
          <label className="block">
            <span className="block text-sm font-medium mb-1">Título</span>
            <input className="w-full min-h-[44px] rounded-md border border-border bg-background px-3" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1">Texto de abertura</span>
            <textarea rows={4} className="w-full rounded-md border border-border bg-background p-3" value={draft.intro} onChange={(e) => setDraft({ ...draft, intro: e.target.value })} />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1">Texto da página</span>
            <span className="block text-xs text-muted-foreground mb-2">
              Linha começando com “## ” vira subtítulo; “- ” vira item de lista; **texto** fica em negrito; [texto](endereço) vira link. Deixe uma linha em branco entre parágrafos.
            </span>
            <textarea rows={24} className="w-full rounded-md border border-border bg-background p-3 font-mono text-sm" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </label>
          {msg && <p role="status" className={msg.kind === "ok" ? "text-sm text-success" : "text-sm text-destructive"}>{msg.text}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className="min-h-[44px] px-5 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
              {busy ? "Salvando…" : "Salvar"}
            </button>
            <button type="button" disabled={busy} onClick={() => { if (confirm("Voltar ao texto padrão desta licença?")) void salvar(null); }} className="min-h-[44px] px-5 rounded-md border border-border bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
              Restaurar texto padrão
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
