import { useEffect, useState } from "react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import DriveBatchImportDialog from "@/components/admin/DriveBatchImportDialog";
import { supabase } from "@/integrations/supabase/client";
// routes helper não é necessário — links Bewild usam paths literais.
import { bewildTypeLabel, type BewildProjectType } from "@/lib/useBewildProjects";


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
  const [loading, setLoading] = useState(true);
  const [batchOpen, setBatchOpen] = useState(false);


  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("id, slug, title, project_type, neighborhood, area_m2, cover_url, published, sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePublished(id: string, current: boolean) {
    setBusy(id);
    await supabase.from("projects").update({ published: !current }).eq("id", id);
    setBusy(null);
    load();
  }

  async function remove(id: string, slug: string) {
    if (!confirm(`Excluir o projeto "${slug}"? Essa ação não pode ser desfeita.`)) return;
    setBusy(id);
    await supabase.from("projects").delete().eq("id", id);
    setBusy(null);
    load();
  }

  async function nudge(id: string, current: number, dir: -1 | 1) {
    setBusy(id);
    await supabase.from("projects").update({ sort_order: current + dir }).eq("id", id);
    setBusy(null);
    load();
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
        onDone={load}
      />

      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <span className="mono admin-hint">
            {loading ? "carregando…" : `${rows.length} projeto(s)`}
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
            {rows.map((r) => (
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
                    onClick={() => nudge(r.id, r.sort_order, -1)}
                    disabled={busy === r.id}
                    aria-label="Subir"
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
                    onClick={() => nudge(r.id, r.sort_order, 1)}
                    disabled={busy === r.id}
                    aria-label="Descer"
                    style={{ padding: "2px 8px" }}
                  >
                    ↓
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className={`admin-toggle ${r.published ? "is-on" : ""}`}
                    onClick={() => togglePublished(r.id, r.published)}
                    disabled={busy === r.id}
                    aria-label={r.published ? "Despublicar" : "Publicar"}
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
                    onClick={() => remove(r.id, r.slug)}
                    disabled={busy === r.id}
                  >
                    excluir
                  </button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
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
