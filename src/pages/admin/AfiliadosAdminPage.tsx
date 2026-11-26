import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/bewildAdmin";
import { PRODUTO_AFILIADO_COLS, type PerfilAfiliado, type ProdutoAfiliado } from "@/lib/afiliados";
import { mensagemDeErroAoSalvar, validarProduto, type ProdutoDraft as Draft } from "@/lib/afiliadosAdmin";

/**
 * /admin/afiliados — catálogo de produtos afiliados do Mercado Livre.
 * Uma lista só alimenta o cartão dentro dos artigos (linha `[[produto:slug]]`
 * no texto) e a página /produtos-recomendados. Desligar um produto tira o
 * cartão dele de todos os artigos; o site reflete em cerca de um minuto.
 */
type Uso = { slug: string; title: string; published: boolean };

const EMPTY: Draft = {
  nome: "",
  slug: "",
  motivo: "",
  categoria: "",
  perfil: "ambos",
  link_afiliado: "",
  imagem_url: "",
  imagem_alt: "",
  projeto_slug: "",
  ativo: true,
};

const PERFIS: { value: PerfilAfiliado; label: string }[] = [
  { value: "ambos", label: "Investidor e moradia" },
  { value: "investidor", label: "Só investidor" },
  { value: "moradia", label: "Só moradia" },
];

// A tabela é nova e ainda não está nos tipos gerados do banco.
const tabela = () => supabase.from("produtos_afiliados" as never);

function paraBanco(d: Draft) {
  return {
    nome: d.nome.trim(),
    slug: d.slug,
    motivo: d.motivo.trim(),
    categoria: d.categoria.trim(),
    perfil: d.perfil,
    link_afiliado: d.link_afiliado.trim(),
    imagem_url: d.imagem_url.trim() || null,
    imagem_alt: d.imagem_alt.trim() || null,
    projeto_slug: d.projeto_slug.trim() || null,
    ativo: d.ativo,
  };
}

export default function AfiliadosAdminPage() {
  const [rows, setRows] = useState<ProdutoAfiliado[] | null>(null);
  /** `null` = a consulta dos artigos falhou: não dá para saber onde cada produto aparece. */
  const [usos, setUsos] = useState<Map<string, Uso[]> | null>(new Map());
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  /** `"novo"`, o id em edição ou `null` (formulário fechado). */
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [slugManual, setSlugManual] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await tabela().select(PRODUTO_AFILIADO_COLS).order("sort_order", { ascending: true }).order("nome", { ascending: true });
    if (error) {
      setLoadError("Não foi possível carregar os produtos. Tente de novo em instantes.");
      return;
    }
    setLoadError(null);
    setRows((data ?? []) as unknown as ProdutoAfiliado[]);
    // Em quais artigos cada produto aparece (linha [[produto:slug]] no texto).
    const posts = await supabase.from("bewild_posts" as never).select("slug,title,body,published").ilike("body", "%[[produto:%");
    if (posts.error) {
      setUsos(null);
      return;
    }
    const mapa = new Map<string, Uso[]>();
    for (const p of (posts.data ?? []) as unknown as { slug: string; title: string; body: string | null; published: boolean | null }[]) {
      for (const m of (p.body ?? "").matchAll(/\[\[produto:([a-z0-9-]+)\]\]/g)) {
        const lista = mapa.get(m[1]) ?? [];
        if (!lista.some((u) => u.slug === p.slug)) lista.push({ slug: p.slug, title: p.title, published: p.published === true });
        mapa.set(m[1], lista);
      }
    }
    setUsos(mapa);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!rows) return [];
    if (!s) return rows;
    return rows.filter((r) => r.nome.toLowerCase().includes(s) || r.categoria.toLowerCase().includes(s) || r.slug.includes(s));
  }, [rows, search]);

  function abrirNovo() {
    setEditing("novo");
    setDraft(EMPTY);
    setSlugManual(false);
    setMsg(null);
  }

  function abrirEdicao(r: ProdutoAfiliado) {
    setEditing(r.id);
    setSlugManual(true);
    setMsg(null);
    setDraft({
      nome: r.nome,
      slug: r.slug,
      motivo: r.motivo ?? "",
      categoria: r.categoria,
      perfil: r.perfil,
      link_afiliado: r.link_afiliado,
      imagem_url: r.imagem_url ?? "",
      imagem_alt: r.imagem_alt ?? "",
      projeto_slug: r.projeto_slug ?? "",
      ativo: r.ativo,
    });
  }

  async function salvar() {
    const erro = validarProduto(draft);
    if (erro) {
      setMsg({ kind: "err", text: erro });
      return;
    }
    // Trocar o identificador de um produto já usado tira o cartão dos artigos.
    const original = editing !== "novo" ? rows?.find((r) => r.id === editing) : undefined;
    if (original && original.slug !== draft.slug) {
      const artigos = usos === null ? null : (usos.get(original.slug)?.length ?? 0);
      const aviso =
        artigos === null
          ? `Não foi possível verificar se "${original.slug}" aparece em algum artigo. Trocar o identificador tira o cartão de onde ele estiver. Continuar?`
          : artigos > 0
            ? `"${original.slug}" aparece em ${artigos} artigo(s). Trocar o identificador tira o cartão deles até o texto ser corrigido. Continuar?`
            : null;
      if (aviso && !confirm(aviso)) return;
    }
    setBusy("form");
    setMsg(null);
    const valores = paraBanco(draft);
    const res =
      editing === "novo"
        ? await tabela().insert({ ...valores, sort_order: ((rows?.[rows.length - 1]?.sort_order ?? 0) as number) + 10 } as never).select("id")
        : await tabela().update(valores as never).eq("id", editing as string).select("id");
    setBusy(null);
    if (res.error || !res.data || (res.data as unknown[]).length === 0) {
      setMsg({ kind: "err", text: mensagemDeErroAoSalvar(res.error?.code) });
      return;
    }
    setEditing(null);
    setMsg({ kind: "ok", text: "Salvo. O site reflete em cerca de um minuto." });
    await load();
  }

  async function alternar(r: ProdutoAfiliado) {
    if (r.ativo) {
      const artigos = usos === null ? null : (usos.get(r.slug)?.length ?? 0);
      const aviso =
        artigos === null
          ? `Não foi possível verificar em quais artigos "${r.nome}" aparece. Desligar tira o cartão de todos. Continuar?`
          : artigos > 0
            ? `"${r.nome}" aparece em ${artigos} artigo(s). Desligar tira o cartão deles. Continuar?`
            : null;
      if (aviso && !confirm(aviso)) return;
    }
    setBusy(r.id);
    setMsg(null);
    const { data, error } = await tabela().update({ ativo: !r.ativo } as never).eq("id", r.id).select("id");
    setBusy(null);
    if (error || !data || (data as unknown[]).length === 0) {
      setMsg({ kind: "err", text: `Não foi possível ${r.ativo ? "desligar" : "ligar"} o produto.` });
    }
    await load();
  }

  const campo = (id: keyof Draft, label: string, extra?: { placeholder?: string; hint?: string; rows?: number; maxLength?: number }) => (
    <div className="admin-field">
      <label className="admin-field__label" htmlFor={`afiliado-${id}`}>
        {label}
      </label>
      {extra?.rows ? (
        <textarea
          id={`afiliado-${id}`}
          className="admin-field__input"
          rows={extra.rows}
          maxLength={extra.maxLength}
          value={draft[id] as string}
          onChange={(e) => setDraft((d) => ({ ...d, [id]: e.target.value }))}
        />
      ) : (
        <input
          id={`afiliado-${id}`}
          className="admin-field__input"
          maxLength={extra?.maxLength}
          placeholder={extra?.placeholder}
          value={draft[id] as string}
          onChange={(e) => {
            const value = e.target.value;
            if (id === "slug") setSlugManual(true);
            setDraft((d) => ({
              ...d,
              [id]: id === "slug" ? value.toLowerCase() : value,
              ...(id === "nome" && !slugManual ? { slug: slugify(value) } : {}),
            }));
          }}
        />
      )}
      {extra?.hint && <p className="mono admin-hint">{extra.hint}</p>}
    </div>
  );

  return (
    <AdminLayout
      active="afiliados"
      title="Afiliados"
      description="Produtos do Mercado Livre que aparecem nos artigos e em /produtos-recomendados. Para mostrar um produto num artigo, escreva [[produto:identificador]] numa linha sozinha do texto."
    >
      {loadError && (
        <p className="admin-flash admin-flash--err mono" role="alert">
          {loadError}{" "}
          <button type="button" className="admin-link" onClick={() => void load()}>
            tentar de novo
          </button>
        </p>
      )}
      {msg && (
        <p className={`admin-flash admin-flash--${msg.kind} mono`} role={msg.kind === "err" ? "alert" : "status"}>
          {msg.text}
        </p>
      )}

      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          <input
            type="search"
            aria-label="Buscar produto"
            placeholder="buscar por nome, categoria ou identificador…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-field__input admin-toolbar__search"
          />
        </div>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => (editing ? setEditing(null) : abrirNovo())}>
          {editing ? "× fechar" : "+ novo produto"}
        </button>
      </div>

      {editing && (
        <div className="admin-card admin-card--inset" style={{ marginBottom: "1rem" }}>
          {campo("nome", "Nome", { maxLength: 120, placeholder: 'Ex.: Smart TV 43"' })}
          {campo("slug", "Identificador", { maxLength: 80, hint: `No artigo: [[produto:${draft.slug || "identificador"}]]` })}
          {campo("link_afiliado", "Link de afiliado", { placeholder: "https://meli.la/…", hint: "Gere na Central de Afiliados do Mercado Livre (botão Compartilhar ou gerador de links)." })}
          {campo("categoria", "Categoria", { maxLength: 60, placeholder: "Ex.: Eletros grandes", hint: "Produtos da mesma categoria ficam juntos na página." })}
          <div className="admin-field">
            <label className="admin-field__label" htmlFor="afiliado-perfil">
              Para quem
            </label>
            <select
              id="afiliado-perfil"
              className="admin-field__input"
              value={draft.perfil}
              onChange={(e) => setDraft((d) => ({ ...d, perfil: e.target.value as PerfilAfiliado }))}
            >
              {PERFIS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          {campo("motivo", "Por que a Bewild recomenda", { rows: 3, maxLength: 280, hint: "Uma ou duas frases. Não escreva preço: ele muda todo dia." })}
          {campo("imagem_url", "Foto (opcional)", { placeholder: "https://…", hint: "Use foto de um projeto da Bewild em que o item aparece, não a foto do anúncio." })}
          {campo("imagem_alt", "Descrição da foto (opcional)", { maxLength: 160 })}
          {campo("projeto_slug", "Projeto do portfólio (opcional)", { placeholder: "final do endereço em /portfolio/" })}
          <label className="admin-field" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" checked={draft.ativo} onChange={(e) => setDraft((d) => ({ ...d, ativo: e.target.checked }))} />
            <span className="mono">mostrar no site</span>
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => void salvar()} disabled={busy === "form"}>
              {busy === "form" ? "salvando…" : editing === "novo" ? "criar produto" : "salvar"}
            </button>
            <button type="button" className="admin-btn" onClick={() => setEditing(null)}>
              cancelar
            </button>
          </div>
        </div>
      )}

      {rows === null && !loadError && <p className="mono admin-hint">carregando…</p>}
      {rows !== null && rows.length === 0 && <p className="mono admin-hint">Nenhum produto cadastrado ainda.</p>}
      {rows !== null && rows.length > 0 && filtered.length === 0 && <p className="mono admin-hint">Nenhum produto com esse termo.</p>}

      {filtered.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Para quem</th>
                <th>Onde aparece</th>
                <th style={{ width: 110 }}>No site</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.nome}</strong>
                    <br />
                    <span className="mono admin-hint">[[produto:{r.slug}]]</span>
                  </td>
                  <td>{r.categoria}</td>
                  <td>{PERFIS.find((p) => p.value === r.perfil)?.label ?? r.perfil}</td>
                  <td>
                    {usos === null ? (
                      <span className="mono admin-hint">não foi possível verificar</span>
                    ) : (usos.get(r.slug) ?? []).length === 0 ? (
                      <span className="mono admin-hint">só na página</span>
                    ) : (
                      (usos.get(r.slug) ?? []).map((u) => (
                        <div key={u.slug}>
                          {u.published ? (
                            <a className="admin-link" href={`/conteudos/${u.slug}`} target="_blank" rel="noopener noreferrer">
                              {u.title}
                            </a>
                          ) : (
                            <span>{u.title} (rascunho)</span>
                          )}
                        </div>
                      ))
                    )}
                  </td>
                  <td>
                    <button type="button" className="admin-btn" aria-pressed={r.ativo} disabled={busy === r.id} onClick={() => void alternar(r)}>
                      {r.ativo ? "ligado" : "desligado"}
                    </button>
                  </td>
                  <td>
                    <button type="button" className="admin-link" onClick={() => abrirEdicao(r)}>
                      editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
