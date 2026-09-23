import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ============================================================
 * FaqKbManager — gerencia a tabela `assistant_kb`, que é a
 * fonte da página pública /faq e do JSON-LD (FAQPage) dela.
 * Qualquer alteração aqui aparece na /faq no próximo carregamento.
 * ============================================================ */

type Acao = { tipo: "whatsapp" | "link"; rotulo: string; url?: string };

type Row = {
  id: string;
  tema: string;
  pergunta: string;
  resposta: string;
  ordem: number;
  ativo: boolean;
  acoes: Acao[];
};

type Draft = {
  tema: string;
  pergunta: string;
  resposta: string;
  ordem: number;
  ativo: boolean;
  acaoTipo: "nenhuma" | "whatsapp" | "link";
  acaoRotulo: string;
  acaoUrl: string;
};

const EMPTY_DRAFT: Draft = {
  tema: "Sobre a Bewild",
  pergunta: "",
  resposta: "",
  ordem: 100,
  ativo: true,
  acaoTipo: "whatsapp",
  acaoRotulo: "Falar no WhatsApp",
  acaoUrl: "",
};

function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function draftFromRow(r: Row): Draft {
  const acao = r.acoes?.[0];
  return {
    tema: r.tema,
    pergunta: r.pergunta,
    resposta: r.resposta,
    ordem: r.ordem,
    ativo: r.ativo,
    acaoTipo: acao ? acao.tipo : "nenhuma",
    acaoRotulo: acao?.rotulo ?? "",
    acaoUrl: acao?.url ?? "",
  };
}

function acoesFromDraft(d: Draft): Acao[] {
  if (d.acaoTipo === "nenhuma") return [];
  const rotulo = d.acaoRotulo.trim() || (d.acaoTipo === "whatsapp" ? "Falar no WhatsApp" : "Saiba mais");
  if (d.acaoTipo === "whatsapp") return [{ tipo: "whatsapp", rotulo }];
  return [{ tipo: "link", rotulo, url: d.acaoUrl.trim() }];
}

function validar(d: Draft): string | null {
  if (!d.tema.trim()) return "Informe o tema (grupo) da pergunta.";
  if (!d.pergunta.trim()) return "A pergunta é obrigatória.";
  if (!d.resposta.trim()) return "A resposta é obrigatória.";
  if (d.pergunta.length > 300) return "Pergunta excede 300 caracteres.";
  if (d.resposta.length > 4000) return "Resposta excede 4000 caracteres.";
  if (d.acaoTipo === "link" && !d.acaoUrl.trim()) return "Informe o endereço do link da ação.";
  return null;
}

export default function FaqKbManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  const [criando, setCriando] = useState(false);
  const [novo, setNovo] = useState<Draft>(EMPTY_DRAFT);
  const [criandoBusy, setCriandoBusy] = useState(false);

  async function load() {
    setCarregando(true);
    const { data, error } = await supabase
      .from("assistant_kb")
      .select("id, tema, pergunta, resposta, ordem, ativo, acoes")
      .order("tema", { ascending: true })
      .order("ordem", { ascending: true });
    setCarregando(false);
    if (error) {
      setErro("Não foi possível carregar as perguntas: " + error.message);
      return;
    }
    setErro(null);
    setRows((data ?? []) as unknown as Row[]);
  }

  useEffect(() => {
    load();
  }, []);

  const temas = useMemo(
    () => [...new Set(rows.map((r) => r.tema))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [rows],
  );

  const filtradas = useMemo(() => {
    const s = busca.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.pergunta.toLowerCase().includes(s) ||
        r.resposta.toLowerCase().includes(s) ||
        r.tema.toLowerCase().includes(s),
    );
  }, [rows, busca]);

  async function toggleAtivo(r: Row) {
    setBusy(r.id);
    const { error } = await supabase
      .from("assistant_kb")
      .update({ ativo: !r.ativo, updated_at: new Date().toISOString() })
      .eq("id", r.id);
    setBusy(null);
    if (error) {
      alert("Não foi possível salvar: " + error.message);
      return;
    }
    load();
  }

  async function remover(r: Row) {
    if (!confirm(`Excluir a pergunta "${r.pergunta}"? Essa ação não pode ser desfeita.`)) return;
    setBusy(r.id);
    const { error } = await supabase.from("assistant_kb").delete().eq("id", r.id);
    setBusy(null);
    if (error) {
      alert("Não foi possível excluir: " + error.message);
      return;
    }
    load();
  }

  async function salvarEdicao(id: string) {
    const problema = validar(draft);
    if (problema) {
      alert(problema);
      return;
    }
    setBusy(id);
    const { error } = await supabase
      .from("assistant_kb")
      .update({
        tema: draft.tema.trim(),
        pergunta: draft.pergunta.trim(),
        resposta: draft.resposta.trim(),
        ordem: Number(draft.ordem) || 100,
        ativo: draft.ativo,
        acoes: acoesFromDraft(draft),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    setBusy(null);
    if (error) {
      alert("Não foi possível salvar: " + error.message);
      return;
    }
    setEditandoId(null);
    load();
  }

  async function criar() {
    const problema = validar(novo);
    if (problema) {
      alert(problema);
      return;
    }
    const base = slugify(novo.pergunta) || "pergunta";
    let id = base;
    let n = 2;
    while (rows.some((r) => r.id === id)) {
      id = `${base}-${n}`;
      n += 1;
    }
    setCriandoBusy(true);
    const { error } = await supabase.from("assistant_kb").insert({
      id,
      tema: novo.tema.trim(),
      pergunta: novo.pergunta.trim(),
      resposta: novo.resposta.trim(),
      ordem: Number(novo.ordem) || 100,
      ativo: novo.ativo,
      acoes: acoesFromDraft(novo) as unknown as never,
      updated_at: new Date().toISOString(),
    });
    setCriandoBusy(false);
    if (error) {
      alert("Não foi possível criar: " + error.message);
      return;
    }
    setCriando(false);
    setNovo(EMPTY_DRAFT);
    load();
  }

  function campos(d: Draft, set: (fn: (prev: Draft) => Draft) => void, prefixo: string) {
    return (
      <>
        <div className="admin-field">
          <label className="admin-field__label" htmlFor={`${prefixo}-tema`}>
            Tema (grupo na página)
          </label>
          <input
            id={`${prefixo}-tema`}
            className="admin-field__input"
            list="faq-kb-temas"
            maxLength={80}
            value={d.tema}
            onChange={(e) => set((p) => ({ ...p, tema: e.target.value }))}
            placeholder="Ex.: Sobre a Bewild"
          />
          <datalist id="faq-kb-temas">
            {temas.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div className="admin-field">
          <label className="admin-field__label" htmlFor={`${prefixo}-pergunta`}>
            Pergunta
          </label>
          <input
            id={`${prefixo}-pergunta`}
            className="admin-field__input"
            maxLength={300}
            value={d.pergunta}
            onChange={(e) => set((p) => ({ ...p, pergunta: e.target.value }))}
            placeholder="Ex.: Quanto tempo leva uma reforma?"
          />
        </div>
        <div className="admin-field">
          <label className="admin-field__label" htmlFor={`${prefixo}-resposta`}>
            Resposta
          </label>
          <textarea
            id={`${prefixo}-resposta`}
            className="admin-field__input"
            rows={5}
            maxLength={4000}
            value={d.resposta}
            onChange={(e) => set((p) => ({ ...p, resposta: e.target.value }))}
          />
        </div>
        <div className="admin-field">
          <label className="admin-field__label" htmlFor={`${prefixo}-ordem`}>
            Ordem (menor aparece primeiro)
          </label>
          <input
            id={`${prefixo}-ordem`}
            type="number"
            className="admin-field__input"
            value={d.ordem}
            onChange={(e) => set((p) => ({ ...p, ordem: Number(e.target.value) }))}
          />
        </div>
        <div className="admin-field">
          <label className="admin-field__label" htmlFor={`${prefixo}-acao`}>
            Botão ao final da resposta
          </label>
          <select
            id={`${prefixo}-acao`}
            className="admin-field__input"
            value={d.acaoTipo}
            onChange={(e) =>
              set((p) => ({
                ...p,
                acaoTipo: e.target.value as Draft["acaoTipo"],
                acaoRotulo:
                  e.target.value === "whatsapp"
                    ? p.acaoRotulo || "Falar no WhatsApp"
                    : p.acaoRotulo,
              }))
            }
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="link">Link interno</option>
            <option value="nenhuma">Nenhum</option>
          </select>
        </div>
        {d.acaoTipo !== "nenhuma" && (
          <div className="admin-field">
            <label className="admin-field__label" htmlFor={`${prefixo}-rotulo`}>
              Texto do botão
            </label>
            <input
              id={`${prefixo}-rotulo`}
              className="admin-field__input"
              maxLength={80}
              value={d.acaoRotulo}
              onChange={(e) => set((p) => ({ ...p, acaoRotulo: e.target.value }))}
            />
          </div>
        )}
        {d.acaoTipo === "link" && (
          <div className="admin-field">
            <label className="admin-field__label" htmlFor={`${prefixo}-url`}>
              Endereço do link
            </label>
            <input
              id={`${prefixo}-url`}
              className="admin-field__input"
              value={d.acaoUrl}
              onChange={(e) => set((p) => ({ ...p, acaoUrl: e.target.value }))}
              placeholder="/autorizacao-condominio"
            />
          </div>
        )}
        <label className="admin-field" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="checkbox"
            checked={d.ativo}
            onChange={(e) => set((p) => ({ ...p, ativo: e.target.checked }))}
          />
          <span className="mono">publicada em /faq</span>
        </label>
      </>
    );
  }

  return (
    <>
      <p className="mono admin-hint">
        Estas perguntas alimentam a página pública /faq e os dados estruturados
        (FAQ) enviados ao Google. A atualização é automática.
      </p>

      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <input
            type="search"
            placeholder="buscar pergunta, resposta ou tema…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="admin-field__input admin-toolbar__search"
          />
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => {
            setCriando((c) => !c);
            setNovo(EMPTY_DRAFT);
          }}
        >
          {criando ? "× cancelar" : "+ nova pergunta"}
        </button>
      </div>

      {criando && (
        <div className="admin-card admin-card--inset" style={{ marginBottom: "1rem" }}>
          {campos(novo, setNovo, "novo")}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={criar}
              disabled={criandoBusy}
            >
              {criandoBusy ? "criando…" : "criar pergunta"}
            </button>
            <button type="button" className="admin-btn" onClick={() => setCriando(false)}>
              cancelar
            </button>
          </div>
        </div>
      )}

      {erro && <p className="mono admin-hint">{erro}</p>}
      {carregando && <p className="mono admin-hint">carregando perguntas…</p>}
      {!carregando && !erro && rows.length === 0 && (
        <p className="mono admin-hint">
          nenhuma pergunta cadastrada ainda — a /faq usa a lista padrão do site.
        </p>
      )}

      {editandoId && (
        <div className="admin-card admin-card--inset" style={{ marginBottom: "1rem" }}>
          {campos(draft, setDraft, "edit")}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => salvarEdicao(editandoId)}
              disabled={busy === editandoId}
            >
              {busy === editandoId ? "salvando…" : "salvar alterações"}
            </button>
            <button type="button" className="admin-btn" onClick={() => setEditandoId(null)}>
              cancelar
            </button>
          </div>
        </div>
      )}

      {filtradas.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 160 }}>Tema</th>
                <th>Pergunta</th>
                <th style={{ width: 70 }}>Ordem</th>
                <th style={{ width: 90 }}>Publicada</th>
                <th style={{ width: 170 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.tema}</td>
                  <td>{r.pergunta}</td>
                  <td className="mono">{r.ordem}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-btn"
                      disabled={busy === r.id}
                      onClick={() => toggleAtivo(r)}
                    >
                      {r.ativo ? "sim" : "não"}
                    </button>
                  </td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() => {
                        setEditandoId(r.id);
                        setDraft(draftFromRow(r));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      editar
                    </button>
                    <button
                      type="button"
                      className="admin-btn"
                      disabled={busy === r.id}
                      onClick={() => remover(r)}
                    >
                      excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
