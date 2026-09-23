import { useCallback, useEffect, useState } from "react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import AdminAlert from "@/components/admin/AdminAlert";
import DriveBatchImportDialog from "@/components/admin/DriveBatchImportDialog";
import { supabase } from "@/integrations/supabase/client";
// routes helper não é necessário — links Bewild usam paths literais.
import { bewildTypeLabel, type BewildProjectType } from "@/lib/useBewildProjects";
import { applyOrderChanges, moveItem, renumber } from "@/lib/adminOrdering";


type Row = {
  id: string;
  slug: string;
  title: string;
  project_type: BewildProjectType | null;
  neighborhood: string | null;
  area_m2: number | null;
  cover_url: string | null;
  published: boolean;
  sort_order: number;
};

export default function BewildProjectsListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("projects")
      .select("id, slug, title, project_type, neighborhood, area_m2, cover_url, published, sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      setLoadError(error.message);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function togglePublished(r: Row) {
    setBusy(r.id);
    setActionError(null);
    const { data, error } = await supabase
      .from("projects")
      .update({ published: !r.published })
      .eq("id", r.id)
      .select("id");
    setBusy(null);
    if (error || !data || data.length === 0) {
      setActionError(
        `Não foi possível ${r.published ? "despublicar" : "publicar"} "${r.title}": ${error?.message ?? "nenhuma linha foi alterada (sem permissão?)."}`,
      );
    }
    await load();
  }

  async function remove(r: Row) {
    if (!confirm(`Excluir o projeto "${r.slug}"? Essa ação não pode ser desfeita.`)) return;
    setBusy(r.id);
    setActionError(null);
    const { data, error } = await supabase.from("projects").delete().eq("id", r.id).select("id");
    setBusy(null);
    if (error || !data || data.length === 0) {
      setActionError(
        `Não foi possível excluir "${r.title}": ${error?.message ?? "nada foi excluído (sem permissão ou já removido)."}`,
      );
    }
    await load();
  }

  /**
   * Troca a linha com a vizinha e renumera a lista inteira (10, 20, 30…).
   * Antes era só ±1 numa linha: com empates, quem decidia era `created_at`
   * e o clique muitas vezes não mexia nada.
   */
  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (reordering || target < 0 || target >= rows.length) return;
    const { list, changes } = renumber(moveItem(rows, index, target), "sort_order");
    setRows(list); // otimista
    setReordering(true);
    setActionError(null);
    const { error } = await applyOrderChanges(changes, (c) =>
      supabase.from("projects").update({ sort_order: c.value }).eq("id", c.id),
    );
    setReordering(false);
    if (error) setActionError(`Não foi possível salvar a nova ordem: ${error}. A lista foi recarregada.`);
    await load();
  }

  return (
    <BewildAdminShell
      active="projetos"
      title="Projetos"
      description="Projetos do portfólio público em /portfolio."
      actions={
        <>
          <button
            type="button"
            className="admin-btn"
            onClick={() => setBatchOpen(true)}
            style={{ marginRight: 8 }}
          >
            importar do Drive em lote
          </button>
          <a className="admin-btn admin-btn--primary" href="/admin/projetos/novo">
            + novo projeto
          </a>
        </>
      }
    >
      <DriveBatchImportDialog
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        onDone={() => void load()}
      />

      {actionError && (
        <AdminAlert onClose={() => setActionError(null)}>{actionError}</AdminAlert>
      )}
      {loadError && (
        <AdminAlert>
          Erro ao carregar os projetos: {loadError}{" "}
          <button type="button" className="admin-link" onClick={() => void load()}>
            tentar de novo
          </button>
        </AdminAlert>
      )}

      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <span className="mono admin-hint">
            {loading ? "carregando…" : reordering ? "salvando nova ordem…" : `${rows.length} projeto(s)`}
          </span>
        </div>

      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Projeto</th>
              <th>Tipo</th>
              <th>Bairro</th>
              <th>m²</th>
              <th>Ordem</th>
              <th>Publicado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td style={{ width: 64 }}>
                  {r.cover_url ? (
                    <img
                      src={r.cover_url}
                      alt=""
                      className="admin-thumb"
                      loading="lazy"
                      width={64}
                      height={64}
                    />
                  ) : (
                    <div className="admin-thumb admin-thumb--empty" />
                  )}
                </td>
                <td>
                  <strong>{r.title}</strong>
                  <div className="mono admin-table__sub">{r.slug}</div>
                </td>
                <td className="mono">{bewildTypeLabel(r.project_type)}</td>
                <td className="mono">{r.neighborhood ?? "—"}</td>
                <td className="mono">{r.area_m2 ?? "—"}</td>
                <td className="mono" style={{ whiteSpace: "nowrap" }}>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => void move(i, -1)}
                    disabled={reordering || loading || i === 0}
                    aria-label={`Subir "${r.title}"`}
                    style={{ padding: "2px 8px" }}
                  >
                    ↑
                  </button>{" "}
                  <span style={{ display: "inline-block", minWidth: 22, textAlign: "center" }}>
                    {r.sort_order}
                  </span>{" "}
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => void move(i, 1)}
                    disabled={reordering || loading || i === rows.length - 1}
                    aria-label={`Descer "${r.title}"`}
                    style={{ padding: "2px 8px" }}
                  >
                    ↓
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className={`admin-toggle ${r.published ? "is-on" : ""}`}
                    onClick={() => void togglePublished(r)}
                    disabled={busy === r.id}
                    aria-label={r.published ? `Despublicar "${r.title}"` : `Publicar "${r.title}"`}
                    aria-pressed={r.published}
                  >
                    <span />
                  </button>
                </td>
                <td style={{ textAlign: "right" }}>
                  <a className="admin-link" href={`/admin/projetos/${r.slug}`}>
                    editar
                  </a>
                  {"  ·  "}
                  <button
                    className="admin-link admin-link--danger"
                    onClick={() => void remove(r)}
                    disabled={busy === r.id}
                  >
                    excluir
                  </button>
                </td>
              </tr>
            ))}
            {!loading && !loadError && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="mono" style={{ opacity: 0.6, padding: 24 }}>
                  Nenhum projeto Bewild ainda. Clique em "+ novo projeto" para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </BewildAdminShell>
  );
}
