import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { applyOrderChanges, moveItem, renumber } from "@/lib/adminOrdering";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableRow, DragHandle } from "@/components/admin/SortableRow";
import FaqKbManager from "@/components/admin/FaqKbManager";

type Row = {
  id: string;
  question: string;
  answer: string;
  visible: boolean;
  order_index: number;
};

type Draft = {
  question: string;
  answer: string;
  visible: boolean;
};

const EMPTY_DRAFT: Draft = { question: "", answer: "", visible: true };

export default function FaqAdminPage() {
  const [aba, setAba] = useState<"site" | "home">("site");
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Edição inline: id em foco + draft
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  // Criação
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState<Draft>(EMPTY_DRAFT);
  const [creatingBusy, setCreatingBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("faq_items")
      .select("id, question, answer, visible, order_index")
      .order("order_index", { ascending: true });
    if (error) {
      setLoadError(`Não foi possível carregar as perguntas: ${error.message}`);
      return;
    }
    setLoadError(null);
    setRows((data ?? []) as Row[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleVisible(id: string, current: boolean) {
    setBusy(id);
    setMsg(null);
    const { data, error } = await supabase
      .from("faq_items")
      .update({ visible: !current })
      .eq("id", id)
      .select("id");
    setBusy(null);
    if (error || !data || data.length === 0) {
      setMsg({
        kind: "err",
        text: `Não foi possível ${current ? "ocultar" : "mostrar"} a pergunta: ${error?.message ?? "nenhuma linha foi alterada."}`,
      });
    }
    await load();
  }

  async function remove(id: string, q: string) {
    if (!confirm(`Excluir a pergunta "${q}"? Essa ação não pode ser desfeita.`))
      return;
    setBusy(id);
    setMsg(null);
    const { data, error } = await supabase.from("faq_items").delete().eq("id", id).select("id");
    setBusy(null);
    if (error || !data || data.length === 0) {
      setMsg({
        kind: "err",
        text: `Não foi possível excluir a pergunta: ${error?.message ?? "nada foi excluído."}`,
      });
    }
    await load();
  }

  function startEdit(r: Row) {
    setEditingId(r.id);
    setDraft({ question: r.question, answer: r.answer, visible: r.visible });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  async function saveEdit(id: string) {
    const q = draft.question.trim();
    const a = draft.answer.trim();
    if (!q || !a) {
      alert("Pergunta e resposta não podem ficar vazias.");
      return;
    }
    if (q.length > 300) {
      alert("Pergunta excede 300 caracteres.");
      return;
    }
    if (a.length > 4000) {
      alert("Resposta excede 4000 caracteres.");
      return;
    }
    setBusy(id);
    const { error } = await supabase
      .from("faq_items")
      .update({ question: q, answer: a, visible: draft.visible })
      .eq("id", id);
    setBusy(null);
    if (error) {
      alert("Não foi possível salvar: " + error.message);
      return;
    }
    cancelEdit();
    await load();
  }

  async function createItem() {
    const q = newDraft.question.trim();
    const a = newDraft.answer.trim();
    if (!q || !a) {
      alert("Pergunta e resposta são obrigatórias.");
      return;
    }
    if (q.length > 300) {
      alert("Pergunta excede 300 caracteres.");
      return;
    }
    if (a.length > 4000) {
      alert("Resposta excede 4000 caracteres.");
      return;
    }
    setCreatingBusy(true);
    const nextOrder = (rows[rows.length - 1]?.order_index ?? 0) + 10;
    const { error } = await supabase.from("faq_items").insert({
      question: q,
      answer: a,
      visible: newDraft.visible,
      order_index: nextOrder,
    });
    setCreatingBusy(false);
    if (error) {
      alert("Não foi possível criar: " + error.message);
      return;
    }
    setCreating(false);
    setNewDraft(EMPTY_DRAFT);
    await load();
  }

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.question.toLowerCase().includes(s) ||
      r.answer.toLowerCase().includes(s)
    );
  });

  // Sem reordenar durante busca (lista parcial) nem enquanto grava a ordem
  // anterior — dois arrastos seguidos intercalavam as gravações.
  const canReorder = search.trim() === "" && !savingOrder;

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || savingOrder) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const { list, changes } = renumber(moveItem(rows, oldIndex, newIndex), "order_index");
    setRows(list); // otimista
    if (changes.length === 0) return;

    setSavingOrder(true);
    setMsg(null);
    // Uma gravação por vez, conferindo cada erro. Se algo falhar, recarrega
    // do banco para a tela mostrar a ordem real.
    const { error } = await applyOrderChanges(changes, (c) =>
      supabase.from("faq_items").update({ order_index: c.value }).eq("id", c.id),
    );
    if (error) {
      setMsg({ kind: "err", text: `A nova ordem não foi salva: ${error}. A lista foi recarregada.` });
      await load();
    }
    setSavingOrder(false);
  }

  return (
    <AdminLayout
      active="faq"
      title="FAQ"
      description="Gerencie as perguntas frequentes da home e da página /faq."
    >
      <div className="admin-toolbar" style={{ gap: 8 }}>
        <button
          type="button"
          className={`admin-btn${aba === "site" ? " admin-btn--primary" : ""}`}
          onClick={() => setAba("site")}
        >
          Página /faq
        </button>
        <button
          type="button"
          className={`admin-btn${aba === "home" ? " admin-btn--primary" : ""}`}
          onClick={() => setAba("home")}
        >
          FAQ da home
        </button>
      </div>

      {aba === "site" && <FaqKbManager />}

      {aba === "home" && (
        <>
      {loadError && (
        <p className="admin-flash admin-flash--err mono" role="alert">
          {loadError}{" "}
          <button type="button" className="admin-link" onClick={() => void load()}>
            tentar de novo
          </button>
        </p>
      )}
      {msg && (
        <p
          className={`admin-flash admin-flash--${msg.kind} mono`}
          role={msg.kind === "err" ? "alert" : "status"}
        >
          {msg.text}
        </p>
      )}
      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <input
            type="search"
            aria-label="Buscar pergunta ou resposta"
            placeholder="buscar pergunta ou resposta…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-field__input admin-toolbar__search"
          />
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => {
            setCreating((c) => !c);
            setNewDraft(EMPTY_DRAFT);
          }}
        >
          {creating ? "× cancelar" : "+ nova pergunta"}
        </button>
      </div>

      {creating && (
        <div className="admin-card admin-card--inset" style={{ marginBottom: "1rem" }}>
          <div className="admin-field">
            <label className="admin-field__label" htmlFor="faq-home-new-question">
              Pergunta
            </label>
            <input
              id="faq-home-new-question"
              className="admin-field__input"
              maxLength={300}
              value={newDraft.question}
              onChange={(e) =>
                setNewDraft((d) => ({ ...d, question: e.target.value }))
              }
              placeholder="Ex.: Quanto custa um projeto de arquitetura?"
            />
          </div>
          <div className="admin-field">
            <label className="admin-field__label" htmlFor="faq-home-new-answer">
              Resposta
            </label>
            <textarea
              id="faq-home-new-answer"
              className="admin-field__input"
              rows={5}
              maxLength={4000}
              value={newDraft.answer}
              onChange={(e) =>
                setNewDraft((d) => ({ ...d, answer: e.target.value }))
              }
            />
          </div>
          <label
            className="admin-field"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <input
              type="checkbox"
              checked={newDraft.visible}
              onChange={(e) =>
                setNewDraft((d) => ({ ...d, visible: e.target.checked }))
              }
            />
            <span className="mono">publicar imediatamente</span>
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={createItem}
              disabled={creatingBusy}
            >
              {creatingBusy ? "criando…" : "criar pergunta"}
            </button>
            <button
              type="button"
              className="admin-btn"
              onClick={() => {
                setCreating(false);
                setNewDraft(EMPTY_DRAFT);
              }}
            >
              cancelar
            </button>
          </div>
        </div>
      )}

      {search.trim() !== "" && (
        <p className="mono admin-hint">
          arraste para reordenar é desabilitado durante uma busca.
        </p>
      )}
      {savingOrder && <p className="mono admin-hint">salvando nova ordem…</p>}

      <div className="admin-table-wrap">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filtered.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>Pergunta</th>
                  <th style={{ width: 90 }}>Visível</th>
                  <th style={{ width: 160 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <SortableRow key={r.id} id={r.id}>
                    {({ listeners, attributes, isDragging }) => (
                      <>
                        <td>
                          {canReorder ? (
                            <DragHandle
                              listeners={listeners}
                              attributes={attributes}
                            />
                          ) : (
                            <span
                              className="admin-drag-handle is-disabled"
                              aria-hidden
                            >
                              ≡
                            </span>
                          )}
                        </td>
                        <td>
                          {editingId === r.id ? (
                            <div className="admin-field" style={{ margin: 0 }}>
                              <label className="admin-field__label" htmlFor={`faq-home-edit-q-${r.id}`}>
                                Pergunta
                              </label>
                              <input
                                id={`faq-home-edit-q-${r.id}`}
                                className="admin-field__input"
                                maxLength={300}
                                value={draft.question}
                                onChange={(e) =>
                                  setDraft((d) => ({
                                    ...d,
                                    question: e.target.value,
                                  }))
                                }
                              />
                              <label
                                className="admin-field__label"
                                htmlFor={`faq-home-edit-a-${r.id}`}
                                style={{ marginTop: 8 }}
                              >
                                Resposta
                              </label>
                              <textarea
                                id={`faq-home-edit-a-${r.id}`}
                                className="admin-field__input"
                                rows={5}
                                maxLength={4000}
                                value={draft.answer}
                                onChange={(e) =>
                                  setDraft((d) => ({
                                    ...d,
                                    answer: e.target.value,
                                  }))
                                }
                              />
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  marginTop: 8,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={draft.visible}
                                  onChange={(e) =>
                                    setDraft((d) => ({
                                      ...d,
                                      visible: e.target.checked,
                                    }))
                                  }
                                />
                                <span className="mono">visível no site</span>
                              </label>
                            </div>
                          ) : (
                            <>
                              <strong>{r.question}</strong>
                              <div
                                className="admin-table__sub"
                                style={{
                                  marginTop: 4,
                                  opacity: 0.7,
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {r.answer.length > 220
                                  ? r.answer.slice(0, 220) + "…"
                                  : r.answer}
                              </div>
                            </>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`admin-toggle ${r.visible ? "is-on" : ""}`}
                            onClick={() => toggleVisible(r.id, r.visible)}
                            disabled={busy === r.id || isDragging}
                            aria-label={
                              r.visible ? "ocultar do site" : "mostrar no site"
                            }
                          >
                            <span />
                          </button>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {editingId === r.id ? (
                            <>
                              <button
                                className="admin-link"
                                onClick={() => saveEdit(r.id)}
                                disabled={busy === r.id}
                              >
                                salvar
                              </button>
                              {"  ·  "}
                              <button
                                className="admin-link"
                                onClick={cancelEdit}
                                disabled={busy === r.id}
                              >
                                cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="admin-link"
                                onClick={() => startEdit(r)}
                              >
                                editar
                              </button>
                              {"  ·  "}
                              <button
                                className="admin-link admin-link--danger"
                                onClick={() => remove(r.id, r.question)}
                                disabled={busy === r.id || isDragging}
                              >
                                excluir
                              </button>
                            </>
                          )}
                        </td>
                      </>
                    )}
                  </SortableRow>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="mono" style={{ opacity: 0.6 }}>
                      nenhuma pergunta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>
        </>
      )}
    </AdminLayout>
  );
}
