import { useEffect, useMemo, useRef, useState } from "react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { supabase } from "@/integrations/supabase/client";
import { navigate } from "@/lib/useHashRoute";
import { slugify, isValidSlug } from "@/lib/bewildAdmin";
import BewildImageField from "@/components/admin/BewildImageField";
import BewildGalleryField, { type GalleryUpdate } from "@/components/admin/BewildGalleryField";
import DriveImportDialog from "@/components/admin/DriveImportDialog";
import type { BewildProjectType } from "@/lib/useBewildProjects";
import { cleanupRemovedProjectImages, projectImageUrls } from "@/lib/projectImageCleanup";
import {
  needsSlugRedirect,
  publicPathFor,
  slugChangeConfirmMessage,
  upsertSlugRedirect,
} from "@/lib/seoRedirects";
import { useUnsavedChangesGuard } from "@/lib/useUnsavedChangesGuard";
import { devWarn } from "@/lib/devLog";

interface Props {
  slug?: string;
}

type FormState = {
  id: string | null;
  title: string;
  slug: string;
  project_type: BewildProjectType | "";
  neighborhood: string;
  area_m2: string;
  duration: string;
  summary: string;
  challenge: string;
  solution: string;
  result_text: string;
  scope: string[];
  testimonial: string;
  testimonial_author: string;
  cover_url: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  gallery_urls: string[];
  /** Fotos da obra pronta; gallery_urls = projeto 3D (renders). */
  ready_gallery_urls: string[];
  published: boolean;
  sort_order: number;
};

const EMPTY: FormState = {
  id: null,
  title: "",
  slug: "",
  project_type: "",
  neighborhood: "",
  area_m2: "",
  duration: "",
  summary: "",
  challenge: "",
  solution: "",
  result_text: "",
  scope: [],
  testimonial: "",
  testimonial_author: "",
  cover_url: null,
  before_image_url: null,
  after_image_url: null,
  gallery_urls: [],
  ready_gallery_urls: [],
  published: false,
  sort_order: 0,
};

type CoverOption = { url: string; kind: "3D" | "Obra" };

/** Escolha da capa entre as fotos das duas galerias, cada uma identificada. */
function CoverPicker({
  gallery,
  ready,
  cover,
  onPick,
}: {
  gallery: string[];
  ready: string[];
  cover: string | null;
  onPick: (url: string) => void;
}) {
  const options: CoverOption[] = [
    ...gallery.map((url) => ({ url, kind: "3D" as const })),
    ...ready.map((url) => ({ url, kind: "Obra" as const })),
  ];
  if (options.length === 0) return null;
  return (
    <div className="admin-field admin-field--full">
      <label className="admin-field__label">Escolher a capa entre as fotos do projeto</label>
      <p className="mono admin-hint" style={{ marginTop: 0, marginBottom: 8 }}>
        Clique em uma foto (3D ou obra pronta) para usá-la como capa.
      </p>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
          gap: 8,
        }}
      >
        {options.map(({ url, kind }) => {
          const selected = cover === url;
          return (
            <li key={kind + url}>
              <button
                type="button"
                onClick={() => onPick(url)}
                aria-pressed={selected}
                title={selected ? "Capa atual" : `Usar como capa (${kind === "3D" ? "projeto 3D" : "obra pronta"})`}
                style={{
                  display: "block",
                  width: "100%",
                  padding: 0,
                  border: selected ? "2px solid #11355B" : "1px solid #d9d4cb",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "none",
                  cursor: "pointer",
                  position: "relative",
                  lineHeight: 0,
                }}
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }}
                />
                <span
                  className="mono"
                  style={{
                    position: "absolute",
                    right: 6,
                    top: 6,
                    background: kind === "Obra" ? "#11355B" : "rgba(10,20,40,.6)",
                    color: "#fff",
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 999,
                    lineHeight: 1.4,
                  }}
                >
                  {kind === "Obra" ? "obra pronta" : "3D"}
                </span>
                {selected && (
                  <span
                    className="mono"
                    style={{
                      position: "absolute",
                      left: 6,
                      bottom: 6,
                      background: "#11355B",
                      color: "#fff",
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 999,
                      lineHeight: 1.4,
                    }}
                  >
                    capa
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type SaveError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function getSaveError(error: unknown): SaveError {
  if (error instanceof Error) return { message: error.message };
  if (typeof error !== "object" || error === null) return {};

  const value = error as Record<string, unknown>;
  return {
    code: typeof value.code === "string" ? value.code : undefined,
    message: typeof value.message === "string" ? value.message : undefined,
    details: typeof value.details === "string" ? value.details : undefined,
    hint: typeof value.hint === "string" ? value.hint : undefined,
  };
}

function saveErrorMessage(error: unknown): string {
  const { code, message = "", details = "", hint = "" } = getSaveError(error);
  const combined = `${message} ${details} ${hint}`.toLowerCase();

  if (code === "23505" || combined.includes("duplicate") || combined.includes("projects_slug_key")) {
    return "Já existe um projeto com esse endereço (slug). Altere o slug e tente novamente.";
  }
  if (code === "23514" || combined.includes("check constraint")) {
    return "Um dos campos contém uma opção inválida. Revise o tipo do projeto e tente novamente.";
  }
  if (code === "42501" || combined.includes("row-level security") || combined.includes("permission")) {
    return "Sua sessão não tem permissão para salvar. Entre novamente no painel e tente de novo.";
  }
  if (combined.includes("network") || combined.includes("fetch")) {
    return "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.";
  }
  if (message) return `Não foi possível salvar: ${message}`;
  return "Não foi possível salvar o projeto. Tente novamente.";
}

/** Estado do projeto como está no banco (para slug antigo e "publicado"). */
type Original = { slug: string; published: boolean };

export default function BewildProjectFormPage({ slug }: Props) {
  const isEdit = !!slug;
  const [form, setForm] = useState<FormState>(EMPTY);
  // Linha de base para "há alterações não salvas".
  const [baseline, setBaseline] = useState<FormState>(EMPTY);
  const [original, setOriginal] = useState<Original | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Para qual galeria a importação do Drive vai: renders (3D) ou obra pronta.
  const [driveTarget, setDriveTarget] = useState<"gallery" | "ready" | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [scopeInput, setScopeInput] = useState("");

  /**
   * Toda URL de imagem que passou pelo formulário (carregada, enviada,
   * importada). Depois de salvar, as que não ficaram no registro são
   * apagadas do storage — nunca antes (ver projectImageCleanup.ts).
   */
  const knownImageUrls = useRef(new Set<string>());
  useEffect(() => {
    for (const u of projectImageUrls(form)) knownImageUrls.current.add(u);
  }, [form]);

  const folder = useMemo(() => form.slug || "rascunho", [form.slug]);
  const dirty = useMemo(
    () => !loading && !loadError && JSON.stringify(form) !== JSON.stringify(baseline),
    [form, baseline, loading, loadError],
  );
  useUnsavedChangesGuard(dirty && !saving);

  // Novo projeto: já sugere a próxima posição (depois do último).
  useEffect(() => {
    if (isEdit) return;
    let mounted = true;
    supabase
      .from("projects")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted || error) return;
        const next = (data?.sort_order ?? 0) + 10;
        // Sugestão automática não conta como alteração do admin.
        setForm((f) => (f.sort_order ? f : { ...f, sort_order: next }));
        setBaseline((b) => (b.sort_order ? b : { ...b, sort_order: next }));
      });
    return () => {
      mounted = false;
    };
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || !slug) return;

    let mounted = true;
    setLoading(true);
    setLoadError(null);
    supabase
      .from("projects")
      .select(
        "id, title, slug, project_type, neighborhood, area_m2, duration, summary, challenge, solution, result_text, scope, testimonial, testimonial_author, cover_url, before_image_url, after_image_url, gallery_urls, ready_gallery_urls, published, sort_order",
      )
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error || !data) {
          // Sem o projeto carregado NÃO mostramos o formulário: salvar a partir
          // de um formulário vazio criaria um projeto novo por engano.
          setLoadError(
            error
              ? `Não foi possível carregar o projeto: ${error.message}`
              : "Projeto não encontrado. Ele pode ter sido excluído ou ter mudado de endereço.",
          );
          setLoading(false);
          return;
        }
        const loaded: FormState = {
          id: data.id,
          title: data.title ?? "",
          slug: data.slug ?? "",
          project_type: (data.project_type ?? "") as BewildProjectType | "",
          neighborhood: data.neighborhood ?? "",
          area_m2: data.area_m2 != null ? String(data.area_m2) : "",
          duration: data.duration ?? "",
          summary: data.summary ?? "",
          challenge: data.challenge ?? "",
          solution: data.solution ?? "",
          result_text: data.result_text ?? "",
          scope: Array.isArray(data.scope) ? data.scope : [],
          testimonial: data.testimonial ?? "",
          testimonial_author: data.testimonial_author ?? "",
          cover_url: data.cover_url ?? null,
          before_image_url: data.before_image_url ?? null,
          after_image_url: data.after_image_url ?? null,
          gallery_urls: Array.isArray(data.gallery_urls) ? data.gallery_urls : [],
          ready_gallery_urls: Array.isArray(data.ready_gallery_urls) ? data.ready_gallery_urls : [],
          published: !!data.published,
          sort_order: data.sort_order ?? 0,
        };
        setSlugTouched(true);
        setForm(loaded);
        setBaseline(loaded);
        setOriginal({ slug: loaded.slug, published: loaded.published });
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isEdit, slug]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /** Atualização funcional de uma galeria (uploads longos não perdem fotos). */
  function updateGallery(key: "gallery_urls" | "ready_gallery_urls", update: GalleryUpdate) {
    setForm((f) => ({ ...f, [key]: update(f[key]) }));
  }

  function onTitleChange(value: string) {
    setForm((f) => ({
      ...f,
      title: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  }

  function addScope() {
    const v = scopeInput.trim();
    if (!v) return;
    setForm((f) => ({ ...f, scope: [...f.scope, v] }));
    setScopeInput("");
  }

  function removeScope(i: number) {
    setForm((f) => ({ ...f, scope: f.scope.filter((_, k) => k !== i) }));
  }

  /** Foto de projeto publicado: remover pede confirmação. */
  const confirmRemoval = !!original?.published;

  async function save(publish?: boolean) {
    setError(null);

    if (isEdit && !form.id) {
      setError("O projeto não foi carregado; recarregue a página antes de salvar.");
      return;
    }
    if (!form.title.trim()) {
      setError("O título é obrigatório.");
      return;
    }
    if (!form.slug.trim() || !isValidSlug(form.slug)) {
      setError("Slug inválido. Use só letras minúsculas, números e hífens.");
      return;
    }
    // Aceita "45", "45,5", "45.5 m²" etc. — arredonda para inteiro.
    const areaRaw = form.area_m2.replace(/[^\d,.-]/g, "").replace(",", ".").trim();
    const areaNum = areaRaw ? Number(areaRaw) : null;
    if (areaRaw && (!Number.isFinite(areaNum as number) || (areaNum as number) <= 0)) {
      setError("Informe a área em metros quadrados, por exemplo 45. Deixe em branco se ainda não souber.");
      return;
    }
    const area = areaNum === null ? null : Math.round(areaNum);
    // Tag (legado) é NOT NULL com CHECK — preenchemos um valor padrão para
    // projetos Bewild novos, já que esta área não usa o campo "tag" antigo.
    const TAG_FALLBACK = "Interiores";

    const newSlug = form.slug.trim();
    const redirect = needsSlugRedirect({
      wasPublished: !!original?.published,
      oldSlug: original?.slug,
      newSlug,
    });
    const oldPath = original ? publicPathFor("project", original.slug) : "";
    const newPath = publicPathFor("project", newSlug);
    if (redirect && !window.confirm(slugChangeConfirmMessage("project", oldPath, newPath))) {
      return;
    }

    const payload = {
      title: form.title.trim(),
      slug: newSlug,
      project_type: form.project_type || null,
      neighborhood: form.neighborhood.trim() || null,
      area_m2: area,
      duration: form.duration.trim() || null,
      summary: form.summary.trim() || null,
      challenge: form.challenge.trim() || null,
      solution: form.solution.trim() || null,
      result_text: form.result_text.trim() || null,
      scope: form.scope,
      testimonial: form.testimonial.trim() || null,
      testimonial_author: form.testimonial_author.trim() || null,
      cover_url: form.cover_url,
      before_image_url: form.before_image_url,
      after_image_url: form.after_image_url,
      gallery_urls: form.gallery_urls,
      ready_gallery_urls: form.ready_gallery_urls,
      published: publish ?? form.published,
      sort_order: form.sort_order,
    };

    setSaving(true);
    try {
      let projectId: string;
      if (form.id) {
        const { data, error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", form.id)
          .select("id");
        if (error) throw error;
        // Com RLS, um update sem permissão não dá erro: só não altera nada.
        if (!data || data.length === 0) {
          throw { code: "42501", message: "Nenhuma linha foi atualizada." };
        }
        projectId = form.id;
      } else {
        const { data, error } = await supabase
          .from("projects")
          .insert({ ...payload, tag: TAG_FALLBACK })
          .select("id")
          .single();
        if (error) throw error;
        projectId = data.id;
      }

      // A partir daqui o projeto está salvo.
      setForm((f) => ({ ...f, id: projectId, published: payload.published }));

      if (redirect) {
        const { error: redirectError } = await upsertSlugRedirect(oldPath, newPath);
        if (redirectError) {
          setBaseline({ ...form, id: projectId, published: payload.published });
          setError(
            `Projeto salvo, mas o redirecionamento de ${oldPath} para ${newPath} não foi criado (${redirectError}). ` +
              "Clique em salvar de novo para tentar outra vez ou crie o redirecionamento em SEO › URLs 404.",
          );
          return;
        }
      }

      // Só agora, com o registro salvo, apaga do storage o que saiu do formulário.
      const cleanup = await cleanupRemovedProjectImages(projectId, knownImageUrls.current, payload);
      if (cleanup.error) devWarn("[admin/projetos] limpeza de fotos não concluída:", cleanup.error);

      navigate("/admin/projetos");
    } catch (e) {
      setError(saveErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <BewildAdminShell active="projetos" title={isEdit ? "Editar projeto" : "Novo projeto"}>
        <p className="mono admin-hint">carregando…</p>
      </BewildAdminShell>
    );
  }

  if (loadError) {
    return (
      <BewildAdminShell
        active="projetos"
        title="Editar projeto"
        actions={
          <a className="admin-btn" href="/admin/projetos">
            Voltar para a lista
          </a>
        }
      >
        <div
          className="mono"
          role="alert"
          style={{
            background: "#fff0f0",
            border: "1px solid #f5c2c7",
            color: "#842029",
            padding: "10px 14px",
            borderRadius: 6,
          }}
        >
          {loadError}
        </div>
      </BewildAdminShell>
    );
  }

  return (
    <BewildAdminShell
      active="projetos"
      title={isEdit ? "Editar projeto" : "Novo projeto"}
      description="Os campos vazios não aparecem na página pública — projetos em obra renderizam coerentes."
      actions={
        <>
          <a className="admin-btn" href="/admin/projetos">
            Cancelar
          </a>
          <button
            type="button"
            className="admin-btn"
            onClick={() => save()}
            disabled={saving || uploading}
          >
            {saving ? "Salvando…" : "Salvar rascunho"}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => save(true)}
            disabled={saving || uploading}
          >
            {saving ? "Salvando…" : "Salvar e publicar"}
          </button>
        </>
      }
    >
      {error && (
        <div
          className="mono"
          role="alert"
          aria-live="assertive"
          style={{
            background: "#fff0f0",
            border: "1px solid #f5c2c7",
            color: "#842029",
            padding: "10px 14px",
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        {/* 1. IDENTIFICAÇÃO */}
        <section className="admin-section">
          <header className="admin-section__head">
            <h2 className="admin-section__title">Identificação</h2>
          </header>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label" htmlFor="pf-title">Título *</label>
            <input
              id="pf-title"
              className="admin-field__input"
              value={form.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Studio compacto para short stay"
            />
          </div>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label" htmlFor="pf-slug">Slug (URL) *</label>
            <input
              id="pf-slug"
              className="admin-field__input"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
              placeholder="studio-compacto-pinheiros"
            />
            <p className="mono admin-hint" style={{ marginTop: 6 }}>
              Aparece em /portfolio/{form.slug || "<slug>"}.
            </p>
            {original?.published && form.slug && form.slug !== original.slug && (
              <p className="mono admin-hint" role="status" style={{ marginTop: 4, color: "#8A5A00" }}>
                Projeto publicado: ao salvar, /portfolio/{original.slug} passa a redirecionar para o
                novo endereço.
              </p>
            )}
          </div>

          <div className="admin-field">
            <label className="admin-field__label" htmlFor="pf-type">Tipo</label>
            <select
              id="pf-type"
              className="admin-field__input"
              value={form.project_type}
              onChange={(e) => set("project_type", e.target.value as BewildProjectType | "")}
            >
              <option value="">— escolher —</option>
              <option value="short_stay">Short stay</option>
              <option value="turn_key">Turn-key</option>
              <option value="planta">Studio na planta</option>
            </select>
          </div>

          <div className="admin-field">
            <label className="admin-field__label" htmlFor="pf-order">Ordem de exibição</label>
            <input
              id="pf-order"
              type="number"
              className="admin-field__input"
              value={form.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
            />
          </div>

          <div className="admin-field admin-field--full" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              className={`admin-toggle ${form.published ? "is-on" : ""}`}
              onClick={() => set("published", !form.published)}
              aria-label={form.published ? "Despublicar" : "Publicar"}
              aria-pressed={form.published}
            >
              <span />
            </button>
            <span className="mono">
              {form.published ? "Publicado — visível em /portfolio" : "Rascunho — invisível"}
            </span>
          </div>
        </section>

        {/* 2. LOCALIZAÇÃO E DADOS */}
        <section className="admin-section">
          <header className="admin-section__head">
            <h2 className="admin-section__title">Dados do imóvel</h2>
          </header>

          <div className="admin-field">
            <label className="admin-field__label" htmlFor="pf-neighborhood">Bairro</label>
            <input
              id="pf-neighborhood"
              className="admin-field__input"
              value={form.neighborhood}
              onChange={(e) => set("neighborhood", e.target.value)}
              placeholder="Pinheiros"
            />
          </div>

          <div className="admin-field">
            <label className="admin-field__label" htmlFor="pf-area">Área (m²) — opcional</label>
            <input
              id="pf-area"
              className="admin-field__input"
              value={form.area_m2}
              onChange={(e) => set("area_m2", e.target.value)}
              placeholder="ex: 45"
            />
            <p className="mono admin-hint" style={{ marginTop: 6 }}>
              Deixe em branco se ainda não souber a metragem.
            </p>
          </div>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label" htmlFor="pf-duration">Duração da obra</label>
            <input
              id="pf-duration"
              className="admin-field__input"
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
              placeholder="60 dias úteis"
            />
          </div>
        </section>

        {/* 3. HISTÓRIA */}
        <section className="admin-section">
          <header className="admin-section__head">
            <h2 className="admin-section__title">História do projeto</h2>
            <p className="mono admin-hint">Tudo opcional. Campos vazios não aparecem na página pública.</p>
          </header>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label" htmlFor="pf-summary">Resumo</label>
            <textarea
              id="pf-summary"
              className="admin-field__input"
              rows={2}
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              placeholder="Um studio de 22 m² em Pinheiros, reformado do projeto à entrega."
            />
          </div>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label" htmlFor="pf-challenge">Desafio</label>
            <textarea
              id="pf-challenge"
              className="admin-field__input"
              rows={3}
              value={form.challenge}
              onChange={(e) => set("challenge", e.target.value)}
            />
          </div>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label" htmlFor="pf-solution">Solução</label>
            <textarea
              id="pf-solution"
              className="admin-field__input"
              rows={3}
              value={form.solution}
              onChange={(e) => set("solution", e.target.value)}
            />
          </div>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label" htmlFor="pf-result">Resultado</label>
            <textarea
              id="pf-result"
              className="admin-field__input"
              rows={3}
              value={form.result_text}
              onChange={(e) => set("result_text", e.target.value)}
            />
          </div>
        </section>

        {/* 4. ESCOPO */}
        <section className="admin-section">
          <header className="admin-section__head">
            <h2 className="admin-section__title">O que foi feito</h2>
          </header>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label" htmlFor="pf-scope">Itens do escopo</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                id="pf-scope"
                className="admin-field__input"
                value={scopeInput}
                onChange={(e) => setScopeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addScope();
                  }
                }}
                placeholder="Projeto de arquitetura"
              />
              <button type="button" className="admin-btn" onClick={addScope}>
                + adicionar
              </button>
            </div>
            {form.scope.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {form.scope.map((item, i) => (
                  <li
                    key={item + i}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      background: "#f4efe5",
                      borderRadius: 999,
                      fontSize: 13,
                    }}
                  >
                    <span>✓ {item}</span>
                    <button
                      type="button"
                      onClick={() => removeScope(i)}
                      aria-label="Remover"
                      style={{
                        border: 0,
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 16,
                        lineHeight: 1,
                        color: "#666",
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 5. MÍDIA */}
        <section className="admin-section">
          <header className="admin-section__head">
            <h2 className="admin-section__title">Fotos</h2>
            <p className="mono admin-hint">
              As fotos são subidas para o bucket project-images. Capa é o destaque do card e do topo da página.
              Há duas galerias: <strong>Projeto 3D</strong> (renders) e <strong>Obra pronta</strong> (fotos do
              apartamento entregue). O site identifica cada bloco; com ao menos uma foto da obra, o projeto
              recebe a tag "Obra pronta" no portfólio e entra no filtro de mesmo nome.
            </p>
          </header>

          <div className="admin-field admin-field--full">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="admin-btn" onClick={() => setDriveTarget("gallery")}>
                Importar do Google Drive → Projeto 3D
              </button>
              <button type="button" className="admin-btn" onClick={() => setDriveTarget("ready")}>
                Importar do Google Drive → Obra pronta
              </button>
            </div>
            <p className="mono admin-hint" style={{ marginTop: 6 }}>
              Abre a pasta do cliente no Drive; as fotos escolhidas entram na galeria indicada.
            </p>
          </div>

          <DriveImportDialog
            open={driveTarget !== null}
            folder={driveTarget === "ready" ? `${folder}-obra` : folder}
            onClose={() => setDriveTarget(null)}
            onImported={(urls: string[]) => {
              // Funcional: a importação demora e o formulário pode ter mudado no meio.
              const key = driveTarget === "ready" ? "ready_gallery_urls" : "gallery_urls";
              setForm((f) => ({
                ...f,
                [key]: [...f[key], ...urls],
                cover_url: f.cover_url || urls[0] || null,
              }));
            }}
          />

          <BewildImageField
            label="Capa"
            value={form.cover_url}
            folder={folder}
            onChange={(url) => set("cover_url", url)}
            onBusyChange={setUploading}
            confirmRemoval={confirmRemoval}
            hint="Recomendado: foto horizontal do apartamento entregue."
          />

          <CoverPicker
            gallery={form.gallery_urls}
            ready={form.ready_gallery_urls}
            cover={form.cover_url}
            onPick={(url) => set("cover_url", url)}
          />

          <BewildImageField
            label="Antes (opcional)"
            value={form.before_image_url}
            folder={folder}
            onChange={(url) => set("before_image_url", url)}
            onBusyChange={setUploading}
            confirmRemoval={confirmRemoval}
            hint="A seção antes/depois só aparece se houver as duas fotos."
          />

          <BewildImageField
            label="Depois (opcional)"
            value={form.after_image_url}
            folder={folder}
            onChange={(url) => set("after_image_url", url)}
            onBusyChange={setUploading}
            confirmRemoval={confirmRemoval}
          />

          <BewildGalleryField
            label="Projeto 3D (renders)"
            hint="Imagens do projeto. Aparecem na seção “Projeto 3D” da página."
            value={form.gallery_urls}
            folder={folder}
            onChange={(update) => updateGallery("gallery_urls", update)}
            onBusyChange={setUploading}
            confirmRemoval={confirmRemoval}
          />

          <BewildGalleryField
            label="Obra pronta (fotos do apartamento entregue)"
            hint="Aparecem na seção “Obra pronta” da página e marcam o projeto como Obra pronta no portfólio."
            value={form.ready_gallery_urls}
            folder={`${folder}-obra`}
            onChange={(update) => updateGallery("ready_gallery_urls", update)}
            onBusyChange={setUploading}
            confirmRemoval={confirmRemoval}
          />
        </section>

        {/* 6. DEPOIMENTO */}
        <section className="admin-section">
          <header className="admin-section__head">
            <h2 className="admin-section__title">Depoimento</h2>
            <p className="mono admin-hint">A seção inteira some se o depoimento estiver vazio.</p>
          </header>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label" htmlFor="pf-testimonial">Texto do depoimento</label>
            <textarea
              id="pf-testimonial"
              className="admin-field__input"
              rows={3}
              value={form.testimonial}
              onChange={(e) => set("testimonial", e.target.value)}
            />
          </div>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label" htmlFor="pf-testimonial-author">Autor</label>
            <input
              id="pf-testimonial-author"
              className="admin-field__input"
              value={form.testimonial_author}
              onChange={(e) => set("testimonial_author", e.target.value)}
              placeholder="Cliente · Pinheiros"
            />
          </div>
        </section>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <a className="admin-btn" href="/admin/projetos">Cancelar</a>
          <button
            type="button"
            className="admin-btn"
            onClick={() => save()}
            disabled={saving || uploading}
          >
            {saving ? "Salvando…" : "Salvar rascunho"}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => save(true)}
            disabled={saving || uploading}
          >
            {saving ? "Salvando…" : "Salvar e publicar"}
          </button>
        </div>
      </form>
    </BewildAdminShell>
  );
}
