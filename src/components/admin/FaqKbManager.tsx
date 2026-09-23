import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeHref } from "@/lib/safeUrl";

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

const URL_PERMITIDAS =
  "Use um caminho do site (ex.: /autorizacao-condominio), um endereço https://…, mailto: ou tel:.";

/**
 * Problema no endereço do botão "link", ou `null` se estiver ok.
 *
 * O valor vai para o `href` do botão na /faq pública e o React 18 ainda
 * renderiza `href="javascript:…"`. Por isso a validação é a MESMA lista de
 * permissão usada na renderização (`safeHref`): caminho interno "/…" (nunca
 * "//host"), https: sem usuário/senha, mailto: e tel:.
 */
function problemaUrlAcao(d: Draft): string | null {
  if (d.acaoTipo !== "link") return null;
  const url = d.acaoUrl.trim();
  if (!url) return "Informe o endereço do link da ação.";
  if (!safeHref(url)) return `Endereço não permitido para o botão. ${URL_PERMITIDAS}`;
  return null;
}

/** Ações a gravar. Um link inseguro NUNCA vira dado: devolve erro em vez de gravar. */
function acoesFromDraft(d: Draft): { acoes: Acao[] } | { erro: string } {
  if (d.acaoTipo === "nenhuma") return { acoes: [] };
  const rotulo = d.acaoRotulo.trim() || (d.acaoTipo === "whatsapp" ? "Falar no WhatsApp" : "Saiba mais");
  if (d.acaoTipo === "whatsapp") return { acoes: [{ tipo: "whatsapp", rotulo }] };
  const url = safeHref(d.acaoUrl);
  if (!url) return { erro: problemaUrlAcao(d) ?? `Endereço não permitido. ${URL_PERMITIDAS}` };
  // Grava a forma normalizada que o `safeHref` devolve (ex.: host em minúsculas).
  return { acoes: [{ tipo: "link", rotulo, url }] };
}

function validar(d: Draft): string | null {
  if (!d.tema.trim()) return "Informe o tema (grupo) da pergunta.";
  if (!d.pergunta.trim()) return "A pergunta é obrigatória.";
  if (!d.resposta.trim()) return "A resposta é obrigatória.";
  if (d.pergunta.length > 300) return "Pergunta excede 300 caracteres.";
  if (d.resposta.length > 4000) return "Resposta excede 4000 caracteres.";
  return problemaUrlAcao(d);
}

/** Resumo do botão de uma linha salva, com o link passado por `safeHref`. */
function AcaoResumo({ acoes }: { acoes: Acao[] | null | undefined }) {
  const acao = Array.isArray(acoes) ? acoes[0] : undefined;
  if (!acao) return <span className="mono admin-hint">—</span>;
  if (acao.tipo === "whatsapp") return <span className="mono">WhatsApp</span>;
  const href = safeHref(acao.url);
  if (!href) {
    // Dado antigo gravado antes da validação: a /faq não renderiza esse link.
    return (
      <span className="mono" style={{ color: "#b91c1c" }} title={String(acao.url ?? "")}>
        link bloqueado — edite o endereço
      </span>
    );
  }
  return (
    <a className="admin-link" href={href} target="_blank" rel="noopener noreferrer" title={href}>
      {acao.rotulo || "link"} ↗
    </a>
  );
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

  /** Erros mostrados dentro de cada formulário (em vez de `alert`). */
  const [erroForm, setErroForm] = useState<{ novo: string | null; edit: string | null }>({
    novo: null,
    edit: null,
  });

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
    void load();
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
    // `.select("id")`: com RLS, update sem permissão volta sem erro e sem linhas.
    const { data, error } = await supabase
      .from("assistant_kb")
      .update({ ativo: !r.ativo, updated_at: new Date().toISOString() })
      .eq("id", r.id)
      .select("id");
    setBusy(null);
    if (error || !data || data.length === 0) {
      alert("Não foi possível salvar: " + (error?.message ?? "nenhuma linha foi alterada."));
    }
    await load();
  }

  async function remover(r: Row) {
    if (!confirm(`Excluir a pergunta "${r.pergunta}"? Essa ação não pode ser desfeita.`)) return;
    setBusy(r.id);
    const { data, error } = await supabase.from("assistant_kb").delete().eq("id", r.id).select("id");
    setBusy(null);
    if (error || !data || data.length === 0) {
      alert("Não foi possível excluir: " + (error?.message ?? "nada foi excluído."));
    }
    await load();
  }

  async function salvarEdicao(id: string) {
    const problema = validar(draft);
    const montado = acoesFromDraft(draft);
    if (problema || "erro" in montado) {
      setErroForm((e) => ({ ...e, edit: problema ?? ("erro" in montado ? montado.erro : null) }));
      return;
    }
    setErroForm((e) => ({ ...e, edit: null }));
    setBusy(id);
    const { data, error } = await supabase
      .from("assistant_kb")
      .update({
        tema: draft.tema.trim(),
        pergunta: draft.pergunta.trim(),
        resposta: draft.resposta.trim(),
        ordem: Number(draft.ordem) || 100,
        ativo: draft.ativo,
        acoes: montado.acoes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id");
    setBusy(null);
    if (error || !data || data.length === 0) {
      setErroForm((e) => ({
        ...e,
        edit: "Não foi possível salvar: " + (error?.message ?? "nenhuma linha foi alterada."),
      }));
      return;
    }
    setEditandoId(null);
    await load();
  }

  async function criar() {
    const problema = validar(novo);
    const montado = acoesFromDraft(novo);
    if (problema || "erro" in montado) {
      setErroForm((e) => ({ ...e, novo: problema ?? ("erro" in montado ? montado.erro : null) }));
      return;
    }
    setErroForm((e) => ({ ...e, novo: null }));
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
      acoes: montado.acoes as unknown as never,
      updated_at: new Date().toISOString(),
    });
    setCriandoBusy(false);
    if (error) {
      setErroForm((e) => ({ ...e, novo: "Não foi possível criar: " + error.message }));
      return;
    }
    setCriando(false);
    setNovo(EMPTY_DRAFT);
    await load();
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
            list={`${prefixo}-temas`}
            maxLength={80}
            value={d.tema}
            onChange={(e) => set((p) => ({ ...p, tema: e.target.value }))}
            placeholder="Ex.: Sobre a Bewild"
          />
          <datalist id={`${prefixo}-temas`}>
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
                // Trocar de WhatsApp para link não deve manter o texto padrão
                // "Falar no WhatsApp" num botão que abre outra página.
                acaoRotulo:
                  e.target.value === "whatsapp"
                    ? p.acaoRotulo || "Falar no WhatsApp"
                    : e.target.value === "link" && p.acaoRotulo === "Falar no WhatsApp"
                      ? "Saiba mais"
                      : p.acaoRotulo,
              }))
            }
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="link">Link</option>
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
        {d.acaoTipo === "link" && (() => {
          const typed = d.acaoUrl.trim();
          const href = typed ? safeHref(typed) : null;
          const invalido = !!typed && !href;
          return (
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
                aria-invalid={invalido}
                aria-describedby={`${prefixo}-url-ajuda`}
                spellCheck={false}
              />
              <p
                id={`${prefixo}-url-ajuda`}
                className="mono admin-hint"
                role={invalido ? "alert" : undefined}
                style={{ marginTop: 6, color: invalido ? "#b91c1c" : undefined }}
              >
                {invalido ? (
                  `Endereço não permitido para o botão. ${URL_PERMITIDAS}`
                ) : href ? (
                  <>
                    Prévia:{" "}
                    <a className="admin-link" href={href} target="_blank" rel="noopener noreferrer">
                      {d.acaoRotulo.trim() || "Saiba mais"} ↗
                    </a>
                  </>
                ) : (
                  URL_PERMITIDAS
                )}
              </p>
            </div>
          );
        })()}
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
            aria-label="Buscar pergunta, resposta ou tema"
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
            setErroForm((e) => ({ ...e, novo: null }));
          }}
        >
          {criando ? "× cancelar" : "+ nova pergunta"}
        </button>
      </div>

      {criando && (
        <div className="admin-card admin-card--inset" style={{ marginBottom: "1rem" }}>
          {campos(novo, setNovo, "novo")}
          {erroForm.novo && (
            <p className="admin-flash admin-flash--err mono" role="alert">
              {erroForm.novo}
            </p>
          )}
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

      {erro && (
        <p className="admin-flash admin-flash--err mono" role="alert">
          {erro}{" "}
          <button type="button" className="admin-link" onClick={() => void load()}>
            tentar de novo
          </button>
        </p>
      )}
      {carregando && <p className="mono admin-hint">carregando perguntas…</p>}
      {!carregando && !erro && rows.length === 0 && (
        <p className="mono admin-hint">
          nenhuma pergunta cadastrada ainda — a /faq usa a lista padrão do site.
        </p>
      )}

      {editandoId && (
        <div className="admin-card admin-card--inset" style={{ marginBottom: "1rem" }}>
          {campos(draft, setDraft, "edit")}
          {erroForm.edit && (
            <p className="admin-flash admin-flash--err mono" role="alert">
              {erroForm.edit}
            </p>
          )}
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
                <th style={{ width: 170 }}>Botão</th>
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
                    <AcaoResumo acoes={r.acoes} />
                  </td>
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
                        setErroForm((e) => ({ ...e, edit: null }));
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
