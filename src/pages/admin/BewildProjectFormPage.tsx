import { useEffect, useMemo, useState } from "react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { supabase } from "@/integrations/supabase/client";
import { navigate } from "@/lib/useHashRoute";
import { slugify, isValidSlug } from "@/lib/bewildAdmin";
import BewildImageField from "@/components/admin/BewildImageField";
import BewildGalleryField from "@/components/admin/BewildGalleryField";
import DriveImportDialog from "@/components/admin/DriveImportDialog";
import type { BewildProjectType } from "@/lib/useBewildProjects";

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
  published: false,
  sort_order: 0,
};

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

export default function BewildProjectFormPage({ slug }: Props) {
  const isEdit = !!slug;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [scopeInput, setScopeInput] = useState("");

  const folder = useMemo(() => form.slug || "rascunho", [form.slug]);

  // Novo projeto: já sugere o próximo número da ordem (último + 1).
  useEffect(() => {
    if (isEdit) return;
    let mounted = true;
    supabase
      .from("projects")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        setForm((f) =>
          f.sort_order ? f : { ...f, sort_order: (data?.sort_order ?? 0) + 1 },
        );
      });
    return () => {
      mounted = false;
    };
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || !slug) return;

    let mounted = true;
    setLoading(true);
    supabase
      .from("projects")
      .select(
        "id, title, slug, project_type, neighborhood, area_m2, duration, summary, challenge, solution, result_text, scope, testimonial, testimonial_author, cover_url, before_image_url, after_image_url, gallery_urls, published, sort_order",
      )
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error || !data) {
          setError("Projeto não encontrado.");
          setLoading(false);
          return;
        }
        setSlugTouched(true);
        setForm({
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
          published: !!data.published,
          sort_order: data.sort_order ?? 0,
        });
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isEdit, slug]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
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
    set("scope", [...form.scope, v]);
    setScopeInput("");
  }

  function removeScope(i: number) {
    set("scope", form.scope.filter((_, k) => k !== i));
  }

  async function save(publish?: boolean) {
    setError(null);

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

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
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
      published: publish ?? form.published,
      sort_order: form.sort_order,
    };

    setSaving(true);
    try {
      if (form.id) {
        const { error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("projects")
          .insert({ ...payload, tag: TAG_FALLBACK });
        if (error) throw error;
      }
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
            <label className="admin-field__label">Título *</label>
            <input
              className="admin-field__input"
              value={form.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Studio compacto para short stay"
            />
          </div>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label">Slug (URL) *</label>
            <input
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
          </div>

          <div className="admin-field">
            <label className="admin-field__label">Tipo</label>
            <select
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
            <label className="admin-field__label">Ordem de exibição</label>
            <input
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
            <label className="admin-field__label">Bairro</label>
            <input
              className="admin-field__input"
              value={form.neighborhood}
              onChange={(e) => set("neighborhood", e.target.value)}
              placeholder="Pinheiros"
            />
          </div>

          <div className="admin-field">
            <label className="admin-field__label">Área (m²) — opcional</label>
            <input
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
            <label className="admin-field__label">Duração da obra</label>
            <input
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
            <label className="admin-field__label">Resumo</label>
            <textarea
              className="admin-field__input"
              rows={2}
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              placeholder="Um studio de 22 m² em Pinheiros, reformado do projeto à entrega."
            />
          </div>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label">Desafio</label>
            <textarea
              className="admin-field__input"
              rows={3}
              value={form.challenge}
              onChange={(e) => set("challenge", e.target.value)}
            />
          </div>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label">Solução</label>
            <textarea
              className="admin-field__input"
              rows={3}
              value={form.solution}
              onChange={(e) => set("solution", e.target.value)}
            />
          </div>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label">Resultado</label>
            <textarea
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
            <label className="admin-field__label">Itens do escopo</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
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
            </p>
          </header>

          <div className="admin-field admin-field--full">
            <button type="button" className="admin-btn" onClick={() => setDriveOpen(true)}>
              Importar fotos do Google Drive
            </button>
            <p className="mono admin-hint" style={{ marginTop: 6 }}>
              Abre a pasta do cliente no Drive; as fotos escolhidas entram na galeria.
            </p>
          </div>

          <DriveImportDialog
            open={driveOpen}
            folder={folder}
            onClose={() => setDriveOpen(false)}
            onImported={(urls: string[]) => {
              const gallery = [...form.gallery_urls, ...urls];
              set("gallery_urls", gallery);
              if (!form.cover_url && urls[0]) set("cover_url", urls[0]);
            }}
          />


          <BewildImageField
            label="Capa"
            value={form.cover_url}
            folder={folder}
            onChange={(url) => set("cover_url", url)}
            onBusyChange={setUploading}
            hint="Recomendado: foto horizontal do apartamento entregue."
          />

          {form.gallery_urls.length > 0 && (
            <div className="admin-field admin-field--full">
              <label className="admin-field__label">Escolher a capa entre as fotos do projeto</label>
              <p className="mono admin-hint" style={{ marginTop: 0, marginBottom: 8 }}>
                Clique em uma foto da galeria para usá-la como capa.
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
                {form.gallery_urls.map((url) => {
                  const selected = form.cover_url === url;
                  return (
                    <li key={url}>
                      <button
                        type="button"
                        onClick={() => set("cover_url", url)}
                        aria-pressed={selected}
                        title={selected ? "Capa atual" : "Usar como capa"}
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
          )}


          <BewildImageField
            label="Antes (opcional)"
            value={form.before_image_url}
            folder={folder}
            onChange={(url) => set("before_image_url", url)}
            onBusyChange={setUploading}
            hint="A seção antes/depois só aparece se houver as duas fotos."
          />

          <BewildImageField
            label="Depois (opcional)"
            value={form.after_image_url}
            folder={folder}
            onChange={(url) => set("after_image_url", url)}
            onBusyChange={setUploading}
          />

          <BewildGalleryField
            label="Galeria"
            value={form.gallery_urls}
            folder={folder}
            onChange={(urls) => set("gallery_urls", urls)}
            onBusyChange={setUploading}
          />
        </section>

        {/* 6. DEPOIMENTO */}
        <section className="admin-section">
          <header className="admin-section__head">
            <h2 className="admin-section__title">Depoimento</h2>
            <p className="mono admin-hint">A seção inteira some se o depoimento estiver vazio.</p>
          </header>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label">Texto do depoimento</label>
            <textarea
              className="admin-field__input"
              rows={3}
              value={form.testimonial}
              onChange={(e) => set("testimonial", e.target.value)}
            />
          </div>

          <div className="admin-field admin-field--full">
            <label className="admin-field__label">Autor</label>
            <input
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
