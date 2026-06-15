/**
 * /admin/conteudos — Lista e gerencia posts da página pública /conteudos.
 *
 * Fonte: tabela `bewild_posts` (a mesma consumida por useBewildPosts e
 * BewildConteudosPage). Não duplica em "posts" nem mexe em blog_posts.
 *
 * Capacidades:
 *  - Listagem ordenada por publicado/data
 *  - Toggle publicar / despublicar
 *  - Toggle destaque
 *  - Excluir
 *  - Links para novo post e edição (BewildPostFormPage)
 */
import { useEffect, useState } from "react";
import { Plus, ExternalLink } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  published: boolean;
  featured: boolean;
  published_at: string | null;
  updated_at: string;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function BewildConteudosAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("bewild_posts" as never)
      .select("id, slug, title, category, published, featured, published_at, updated_at")
      .order("published", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePublished(r: Row) {
    setBusy(r.id);
    const next = !r.published;
    const patch: Record<string, unknown> = { published: next };
    if (next && !r.published_at) patch.published_at = new Date().toISOString();
    await supabase.from("bewild_posts" as never).update(patch as never).eq("id", r.id);
    setBusy(null);
    load();
  }

  async function toggleFeatured(r: Row) {
    setBusy(r.id);
    await supabase
      .from("bewild_posts" as never)
      .update({ featured: !r.featured } as never)
      .eq("id", r.id);

    setBusy(null);
    load();
  }

  async function remove(r: Row) {
    if (!confirm(`Excluir o post "${r.title}"? Essa ação não pode ser desfeita.`)) return;
    setBusy(r.id);
    await supabase.from("bewild_posts" as never).delete().eq("id", r.id);
    setBusy(null);
    load();
  }

  const totalPublished = rows.filter((r) => r.published).length;
  const totalDraft = rows.length - totalPublished;

  return (
    <BewildAdminShell
      active="conteudos"
      eyebrow="Painel"
      title="Conteúdos"
      description="Artigos exibidos em /conteudos. Crie, edite, publique e destaque posts."
      actions={
        <a className="bw-admin__btn bw-admin__btn--primary" href="/admin/conteudos/novo">
          <Plus aria-hidden /> Novo post
        </a>
      }
    >
      <div className="bw-admin__kpi-grid">
        <KpiSimple label="Publicados" value={totalPublished} />
        <KpiSimple label="Em rascunho" value={totalDraft} />
        <KpiSimple label="Em destaque" value={rows.filter((r) => r.featured && r.published).length} />
      </div>

      <div className="bw-admin__section" style={{ padding: 0 }}>
        {loading ? (
          <p className="bw-admin__empty">Carregando…</p>
        ) : rows.length === 0 ? (
          <p className="bw-admin__empty">
            Nenhum post ainda. Clique em <strong>Novo post</strong> para começar.
          </p>
        ) : (
          <table className="bw-admin__table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Categoria</th>
                <th>Status</th>
                <th>Destaque</th>
                <th>Atualizado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.title}</strong>
                    <div className="muted" style={{ fontSize: 12, fontFamily: "ui-monospace, monospace" }}>
                      /conteudos/{r.slug}
                    </div>
                  </td>
                  <td className="muted">{r.category ?? "—"}</td>
                  <td>
                    <button
                      type="button"
                      className={
                        "bw-admin__tag " +
                        (r.published ? "bw-admin__tag--ok" : "bw-admin__tag--off")
                      }
                      style={{ cursor: "pointer" }}
                      onClick={() => togglePublished(r)}
                      disabled={busy === r.id}
                      aria-label={r.published ? "Despublicar" : "Publicar"}
                    >
                      {r.published ? "Publicado" : "Rascunho"}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={
                        "bw-admin__tag " +
                        (r.featured ? "bw-admin__tag--warn" : "bw-admin__tag--off")
                      }
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleFeatured(r)}
                      disabled={busy === r.id}
                      aria-label={r.featured ? "Remover destaque" : "Destacar"}
                    >
                      {r.featured ? "Em destaque" : "—"}
                    </button>
                  </td>
                  <td className="muted">{fmtDate(r.updated_at)}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {r.published && (
                      <>
                        <a
                          className="bw-admin__section-link"
                          href={`/conteudos/${r.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Abrir post público"
                        >
                          ver <ExternalLink style={{ display: "inline", width: 12, height: 12, verticalAlign: "-2px" }} />
                        </a>
                        {"   ·   "}
                      </>
                    )}
                    <a
                      className="bw-admin__section-link"
                      href={`/admin/conteudos/${r.slug}`}
                    >
                      editar
                    </a>
                    {"   ·   "}
                    <button
                      type="button"
                      className="bw-admin__section-link"
                      style={{ background: "none", border: 0, padding: 0, color: "#B0303A", cursor: "pointer" }}
                      onClick={() => remove(r)}
                      disabled={busy === r.id}
                    >
                      excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </BewildAdminShell>
  );
}

function KpiSimple({ label, value }: { label: string; value: number }) {
  return (
    <div className="bw-admin__kpi-card">
      <p className="bw-admin__kpi-label">{label}</p>
      <div className="bw-admin__kpi-value">{value}</div>
    </div>
  );
}
