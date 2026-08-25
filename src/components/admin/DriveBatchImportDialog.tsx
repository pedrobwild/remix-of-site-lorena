import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseDriveFolderName } from "@/lib/driveProjectName";
import { slugify } from "@/lib/bewildAdmin";

type Folder = { id: string; name: string };

interface Props {
  open: boolean;
  onClose: () => void;
  /** Chamado quando ao menos um projeto foi criado. */
  onDone: () => void;
}

async function callDrive<T>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("drive-import", { body: payload });
  if (error) {
    let details = error.message;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.text === "function") {
      const raw = await ctx.text().catch(() => "");
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.error) details = parsed.error;
      } catch {
        if (raw) details = raw;
      }
    }
    throw new Error(details);
  }
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as T;
}

const byNaturalName = (a: { name?: string }, b: { name?: string }) =>
  (a.name ?? "").localeCompare(b.name ?? "", "pt-BR", { numeric: true, sensitivity: "base" });

export default function DriveBatchImportDialog({ open, onClose, onDone }: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [trail, setTrail] = useState<Folder[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState(34);
  const [maxImages, setMaxImages] = useState(200);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [createdAny, setCreatedAny] = useState(false);
  const [summary, setSummary] = useState<{ created: number; failed: number } | null>(null);

  async function loadFolder(parentId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await callDrive<{ folders: Folder[] }>({ action: "folders", parentId });
      setFolders([...res.folders].sort(byNaturalName));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível ler o Google Drive.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setTrail([]);
    setSelected(new Set());
    setLog([]);
    setCreatedAny(false);
    setSummary(null);
    loadFolder("root");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function enter(f: Folder) {
    const next = [...trail, f];
    setTrail(next);
    setSelected(new Set());
    loadFolder(f.id);
  }

  function goTo(index: number) {
    const next = trail.slice(0, index + 1);
    setTrail(next);
    setSelected(new Set());
    loadFolder(next.length ? next[next.length - 1].id : "root");
  }

  function selectFrom() {
    const start = Math.max(1, from) - 1;
    setSelected(new Set(folders.slice(start).map((f) => f.id)));
  }

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function run() {
    const queue = folders.filter((f) => selected.has(f.id));
    if (queue.length === 0) return;
    setRunning(true);
    setError(null);
    setLog([]);
    setSummary(null);
    let order = Math.max(1, from);
    let created = 0;
    let failed = 0;
    for (const f of queue) {
      const { title } = parseDriveFolderName(f.name);
      setLog((l) => [...l, `⏳ ${title} — importando…`]);
      try {
        const res = await Promise.race([
          callDrive<{ project: { slug: string }; images: number; warning?: string | null }>({
            action: "create_from_folder",
            folderId: f.id,
            title,
            slug: slugify(title),
            sortOrder: order,
            max: maxImages,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("demorou demais (tente menos fotos por projeto)")), 480000),
          ),
        ]);
        setCreatedAny(true);
        created += 1;
        setLog((l) => [
          ...l.slice(0, -1),
          res.warning
            ? `⚠️ ${title} — ${res.warning} · /admin/projetos/${res.project.slug}`
            : `✅ ${title} — criado com ${res.images} foto(s) · /admin/projetos/${res.project.slug}`,
        ]);
      } catch (e) {
        console.error("batch import falhou", f.name, e);
        failed += 1;
        setLog((l) => [...l.slice(0, -1), `⚠️ ${title} — ${e instanceof Error ? e.message : "falhou"}`]);
      }
      order += 1;
    }
    setRunning(false);
    setSummary({ created, failed });
    if (created > 0) onDone();
  }

  const queue = folders.filter((f) => selected.has(f.id));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Importar projetos em lote do Google Drive"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(17,53,91,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !running) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "min(900px, 100%)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>Importar projetos em lote</h2>
            <p className="mono admin-hint" style={{ margin: "4px 0 0" }}>
              Selecione as pastas dos clientes: cada uma vira um projeto (rascunho) “iniciais ·
              prédio” e as fotos são buscadas também nas subpastas (ex.: Imagens Projeto PNG).
            </p>
          </div>
          <button type="button" className="admin-btn" onClick={onClose} disabled={running}>
            Fechar
          </button>
        </header>

        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button type="button" className="admin-btn" onClick={() => goTo(-1)} disabled={loading || running}>
            Meu Drive
          </button>
          {trail.map((f, i) => (
            <span key={f.id} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <span aria-hidden="true">/</span>
              <button type="button" className="admin-btn" onClick={() => goTo(i)} disabled={loading || running}>
                {f.name}
              </button>
            </span>
          ))}
        </div>

        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <span style={{ display: "grid", gap: 4 }}>
            <label className="admin-field__label" htmlFor="batch-from">
              Começar a partir da pasta nº
            </label>
            <input
              id="batch-from"
              className="admin-field__input"
              type="number"
              min={1}
              value={from}
              onChange={(e) => setFrom(Number(e.target.value) || 1)}
              style={{ width: 120 }}
              disabled={running}
            />
          </span>
          <span style={{ display: "grid", gap: 4 }}>
            <label className="admin-field__label" htmlFor="batch-max">
              Fotos por projeto
            </label>
            <input
              id="batch-max"
              className="admin-field__input"
              type="number"
              min={1}
              max={200}
              value={maxImages}
              onChange={(e) => setMaxImages(Number(e.target.value) || 200)}
              style={{ width: 120 }}
              disabled={running}
            />
          </span>
          <button type="button" className="admin-btn" onClick={selectFrom} disabled={loading || running}>
            Selecionar da {Math.max(1, from)}ª em diante
          </button>
          <button type="button" className="admin-btn" onClick={() => setSelected(new Set())} disabled={running}>
            Limpar seleção
          </button>
        </div>

        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          {loading && <p className="mono admin-hint">Carregando…</p>}
          {error && (
            <p className="mono" style={{ color: "#b00020", marginTop: 0 }}>
              {error}
            </p>
          )}

          {summary && (
            <div
              role="status"
              aria-live="polite"
              style={{
                margin: "0 0 16px",
                padding: "12px 14px",
                border: summary.failed === 0 ? "1px solid #15803d" : "1px solid #b45309",
                borderRadius: 8,
                background: summary.failed === 0 ? "#f0fdf4" : "#fffbeb",
                color: summary.failed === 0 ? "#166534" : "#92400e",
              }}
            >
              <strong>
                {summary.failed === 0
                  ? `Importação concluída com sucesso: ${summary.created} projeto(s) criado(s).`
                  : `Importação concluída: ${summary.created} projeto(s) criado(s) e ${summary.failed} com erro.`}
              </strong>
            </div>
          )}

          {!loading && (
            <p className="mono admin-hint" style={{ margin: "0 0 8px" }}>
              {folders.length} pasta(s) · {selected.size} selecionada(s)
            </p>
          )}

          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
            {folders.map((f, i) => {
              const on = selected.has(f.id);
              const { title } = parseDriveFolderName(f.name);
              return (
                <li
                  key={f.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    border: on ? "1px solid #2F86B8" : "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "8px 10px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(f.id)}
                    disabled={running}
                    aria-label={`Selecionar ${f.name}`}
                  />
                  <span className="mono admin-hint" style={{ minWidth: 32 }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: "block" }}>{title}</strong>
                    <span className="mono admin-hint">{f.name}</span>
                  </span>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => enter(f)}
                    disabled={loading || running}
                  >
                    abrir
                  </button>
                </li>
              );
            })}
          </ul>

          {log.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <h3 style={{ fontSize: 14, margin: "0 0 6px" }}>Resultado</h3>
              <ul className="mono" style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4, fontSize: 12 }}>
                {log.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            alignItems: "center",
          }}
        >
          {running && (
            <span className="mono admin-hint" style={{ marginRight: "auto" }}>
              Importando… {Math.min(log.length, queue.length)} de {queue.length}
            </span>
          )}
          <button type="button" className="admin-btn" onClick={onClose} disabled={running}>
            {createdAny ? "Concluir" : "Cancelar"}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={run}
            disabled={running || queue.length === 0}
          >
            {running ? "Importando…" : `Criar ${queue.length || ""} projeto(s)`}
          </button>
        </footer>
      </div>
    </div>
  );
}
