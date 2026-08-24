import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Folder = { id: string; name: string };
type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
};

interface Props {
  /** Pasta lógica no storage (slug do projeto). */
  folder: string;
  open: boolean;
  onClose: () => void;
  /** Recebe as URLs públicas já importadas para o site. */
  onImported: (urls: string[]) => void;
}

async function callDrive<T>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("drive-import", {
    body: payload,
  });
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

export default function DriveImportDialog({ folder, open, onClose, onImported }: Props) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [trail, setTrail] = useState<Folder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const currentId = trail.length > 0 ? trail[trail.length - 1].id : "root";

  const byNaturalName = (a: { name?: string }, b: { name?: string }) =>
    (a.name ?? "").localeCompare(b.name ?? "", "pt-BR", {
      numeric: true,
      sensitivity: "base",
    });

  async function loadFolder(parentId: string, term = "") {
    setLoading(true);
    setError(null);
    try {
      const res = await callDrive<{ folders: Folder[] }>({
        action: "folders",
        parentId,
        search: term,
      });
      setFolders([...res.folders].sort(byNaturalName));
      if (parentId !== "root" && !term) {
        const f = await callDrive<{ files: DriveFile[] }>({ action: "files", folderId: parentId });
        setFiles([...f.files].sort(byNaturalName));
      } else {
        setFiles([]);
      }
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
    setSearch("");
    loadFolder("root");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function enter(f: Folder) {
    const next = [...trail, f];
    setTrail(next);
    setSearch("");
    setSelected(new Set());
    loadFolder(f.id);
  }

  function goTo(index: number) {
    const next = trail.slice(0, index + 1);
    setTrail(next);
    setSearch("");
    setSelected(new Set());
    loadFolder(next.length ? next[next.length - 1].id : "root");
  }

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function runImport() {
    if (selected.size === 0) return;
    setImporting(true);
    setError(null);
    try {
      const res = await callDrive<{
        imported: { url: string }[];
        failed: { name?: string; error: string }[];
      }>({ action: "import", fileIds: [...selected], folder });
      if (res.imported.length > 0) onImported(res.imported.map((i) => i.url));
      if (res.failed.length > 0) {
        setError(
          `${res.failed.length} foto(s) não vieram: ${res.failed[0].error}`,
        );
      } else {
        onClose();
      }
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao importar as fotos.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Importar fotos do Google Drive"
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
        if (e.target === e.currentTarget && !importing) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "min(880px, 100%)",
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
            <h2 style={{ margin: 0, fontSize: 18 }}>Importar do Google Drive</h2>
            <p className="mono admin-hint" style={{ margin: "4px 0 0" }}>
              Abra a pasta do cliente e escolha as fotos.
            </p>
          </div>
          <button type="button" className="admin-btn" onClick={onClose} disabled={importing}>
            Fechar
          </button>
        </header>

        <div style={{ padding: "12px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" className="admin-btn" onClick={() => goTo(-1)} disabled={loading}>
            Meu Drive
          </button>
          {trail.map((f, i) => (
            <span key={f.id} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <span aria-hidden="true">/</span>
              <button type="button" className="admin-btn" onClick={() => goTo(i)} disabled={loading}>
                {f.name}
              </button>
            </span>
          ))}
          <form
            style={{ marginLeft: "auto", display: "flex", gap: 6 }}
            onSubmit={(e) => {
              e.preventDefault();
              loadFolder(currentId, search);
            }}
          >
            <label className="admin-field__label" htmlFor="drive-search" style={{ position: "absolute", left: -9999 }}>
              Buscar pasta
            </label>
            <input
              id="drive-search"
              className="admin-field__input"
              placeholder="Buscar pasta pelo nome"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 200 }}
            />
            <button type="submit" className="admin-btn" disabled={loading}>
              Buscar
            </button>
          </form>
        </div>

        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          {loading && <p className="mono admin-hint">Carregando…</p>}

          {error && (
            <p className="mono" style={{ color: "#b00020", marginTop: 0 }}>
              {error}
            </p>
          )}

          {!loading && folders.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
              {folders.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className="admin-btn"
                    style={{ width: "100%", textAlign: "left" }}
                    onClick={() => enter(f)}
                  >
                    📁 {f.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && trail.length > 0 && files.length === 0 && folders.length === 0 && (
            <p className="mono admin-hint">Esta pasta não tem imagens nem subpastas.</p>
          )}

          {files.length > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span className="mono admin-hint">
                  {files.length} foto(s) · {selected.size} selecionada(s)
                </span>
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() =>
                    setSelected(
                      selected.size === files.length ? new Set() : new Set(files.map((f) => f.id)),
                    )
                  }
                >
                  {selected.size === files.length ? "Limpar seleção" : "Selecionar todas"}
                </button>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                {files.map((f) => {
                  const on = selected.has(f.id);
                  return (
                    <li key={f.id}>
                      <label
                        style={{
                          display: "block",
                          border: on ? "2px solid #2F86B8" : "1px solid #e5e7eb",
                          borderRadius: 8,
                          overflow: "hidden",
                          cursor: "pointer",
                          background: "#fff",
                        }}
                      >
                        {f.thumbnailLink ? (
                          <img
                            src={f.thumbnailLink}
                            alt=""
                            referrerPolicy="no-referrer"
                            style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <div style={{ height: 110, background: "#f4efe5" }} />
                        )}
                        <span style={{ display: "flex", gap: 8, alignItems: "center", padding: 8, fontSize: 12 }}>
                          <input type="checkbox" checked={on} onChange={() => toggle(f.id)} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.name}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <footer
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button type="button" className="admin-btn" onClick={onClose} disabled={importing}>
            Cancelar
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={runImport}
            disabled={importing || selected.size === 0}
          >
            {importing ? "Importando…" : `Importar ${selected.size || ""} foto(s)`}
          </button>
        </footer>
      </div>
    </div>
  );
}
