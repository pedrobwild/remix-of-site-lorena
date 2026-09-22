/**
 * /admin/conteudos/novo  e  /admin/conteudos/{slug}
 *
 * Criar/editar posts da página pública /conteudos (tabela `bewild_posts`).
 * Formulário mínimo e direto — sem upload de imagem (cover_image é URL),
 * sem editor rico (body é markdown/HTML em textarea). O FAQ é editado
 * inline (pergunta + resposta) e vira FAQPage no JSON-LD do post: é o
 * padrão de post citável do plano SEO + IA (4 a 6 perguntas, respostas de
 * 40 a 70 palavras).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { supabase } from "@/integrations/supabase/client";
import { navigate } from "@/lib/useHashRoute";
import { uploadImageGeneric, type UploadResult } from "@/lib/uploadImage";

type Props = { slug?: string };

type PostRow = {
  id: string;
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  category: string | null;
  excerpt: string | null;
  cover_image: string | null;
  body: string;
  reading_time: number;
  author: string;
  featured: boolean;
  published: boolean;
  published_at: string | null;
  faq: unknown;
};

type FaqItem = { question: string; answer: string };

/** Aceita o JSONB como veio ({question, answer} ou o formato antigo {q, a}). */
function toFaqList(raw: unknown): FaqItem[] {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const question = String(o.question ?? o.q ?? "").trim();
      const answer = String(o.answer ?? o.a ?? "").trim();
      return question || answer ? { question, answer } : null;
    })
    .filter((x): x is FaqItem => !!x);
}

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

const CATEGORIES = [
  { value: "", label: "Sem categoria" },
  { value: "mercado", label: "Mercado" },
  { value: "investimento", label: "Investimento" },
  { value: "reforma", label: "Reforma" },
  { value: "operacao", label: "Operação" },
  { value: "fiscal", label: "Fiscal" },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function estimateReading(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const SIZES_ATTR = '(max-width: 880px) 100vw, 880px';

/** Monta o bloco <figure><picture>… a inserir no corpo do post. */
function buildFigureHtml(up: UploadResult, alt: string, caption: string): string {
  const lines: string[] = ["<figure>", "  <picture>"];
  if (up.avif) {
    lines.push(
      `    <source type="image/avif" srcset="${up.avif.sm} 640w, ${up.avif.md} 1280w, ${up.avif.lg} 1920w" sizes="${SIZES_ATTR}">`
    );
  }
  lines.push(
    `    <source type="image/webp" srcset="${up.webp.sm} 640w, ${up.webp.md} 1280w, ${up.webp.lg} 1920w" sizes="${SIZES_ATTR}">`
  );
  const w = Math.min(1920, up.width || 1920);
  const h = up.width ? Math.round((up.height * w) / up.width) : up.height;
  lines.push(
    `    <img src="${up.jpeg.lg}" alt="${escapeAttr(alt)}" width="${w}" height="${h}" loading="lazy" decoding="async">`
  );
  lines.push("  </picture>");
  if (caption.trim()) {
    lines.push(`  <figcaption>${escapeAttr(caption.trim())}</figcaption>`);
  }
  lines.push("</figure>");
  return lines.join("\n");
}

export default function BewildPostFormPage({ slug }: Props) {
  const isNew = !slug;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [currentSlug, setCurrentSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("Equipe Bewild");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [faq, setFaq] = useState<FaqItem[]>([]);

  // --- upload de imagem no corpo do post ---
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const bodyFileRef = useRef<HTMLInputElement | null>(null);
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<UploadResult[]>([]);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");

  const folder = currentSlug || "rascunho";

  async function handleBodyFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setError(null);
    setUploading(true);
    try {
      const results: UploadResult[] = [];
      for (const file of images) {
        results.push(await uploadImageGeneric(file, "blog-images", folder));
      }
      setPendingUploads(results);
      setAltText("");
      setCaption("");
    } catch (err) {
      setError(
        `Falha ao enviar a imagem: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setUploading(false);
    }
  }

  function insertPendingUploads() {
    if (!pendingUploads.length || !altText.trim()) return;
    const blocks = pendingUploads
      .map((up) => buildFigureHtml(up, altText.trim(), caption))
      .join("\n\n");
    const el = bodyRef.current;
    const hasCursor = el && document.activeElement === el;
    const pos = hasCursor ? (el as HTMLTextAreaElement).selectionStart : body.length;
    const before = body.slice(0, pos);
    const after = body.slice(pos);
    const snippet = `\n\n${blocks}\n\n`;
    const next = before + snippet + after;
    setBody(next);
    const cursor = before.length + snippet.length;
    setPendingUploads([]);
    setAltText("");
    setCaption("");
    requestAnimationFrame(() => {
      const t = bodyRef.current;
      if (!t) return;
      t.focus();
      t.setSelectionRange(cursor, cursor);
    });
  }

  async function handleCoverFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploadingCover(true);
    try {
      const up = await uploadImageGeneric(file, "blog-images", folder);
      // JPEG grande: og:image precisa de formato que todo crawler lê.
      setCoverImage(up.jpeg.lg);
    } catch (err) {
      setError(
        `Falha ao enviar a imagem de capa: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setUploadingCover(false);
    }
  }

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("bewild_posts" as never)
        .select("*")
        .eq("slug", slug as string)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setError(error?.message ?? "Post não encontrado.");
        setLoading(false);
        return;
      }
      const p = data as PostRow;
      setPostId(p.id);
      setTitle(p.title);
      setCurrentSlug(p.slug);
      setSlugTouched(true);
      setCategory(p.category ?? "");
      setExcerpt(p.excerpt ?? "");
      setCoverImage(p.cover_image ?? "");
      setBody(p.body ?? "");
      setAuthor(p.author ?? "Equipe Bewild");
      setMetaTitle(p.meta_title ?? "");
      setMetaDescription(p.meta_description ?? "");
      setFeatured(!!p.featured);
      setPublished(!!p.published);
      setPublishedAt(p.published_at);
      setFaq(toFaqList(p.faq));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, isNew]);

  // auto-slug a partir do título se ainda não foi tocado manualmente
  useEffect(() => {
    if (!isNew) return;
    if (!slugTouched) setCurrentSlug(slugify(title));
  }, [title, slugTouched, isNew]);

  const readingTime = useMemo(() => estimateReading(body), [body]);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Título é obrigatório.");
      return;
    }
    if (!currentSlug.trim()) {
      setError("Slug é obrigatório.");
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = {
      slug: currentSlug.trim(),
      title: title.trim(),
      category: category || null,
      excerpt: excerpt.trim() || null,
      cover_image: coverImage.trim() || null,
      body,
      author: author.trim() || "Equipe Bewild",
      meta_title: metaTitle.trim() || null,
      meta_description: metaDescription.trim() || null,
      featured,
      published,
      reading_time: readingTime,
      faq: faq
        .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
        .filter((f) => f.question && f.answer),
    };
    if (published && !publishedAt) {
      payload.published_at = new Date().toISOString();
    }

    let result;
    if (isNew) {
      result = await supabase.from("bewild_posts" as never).insert(payload as never).select("slug").single();
    } else if (postId) {
      result = await supabase
        .from("bewild_posts" as never)
        .update(payload as never)
        .eq("id", postId)
        .select("slug")
        .single();
    }

    setSaving(false);
    if (result?.error) {
      setError(result.error.message);
      return;
    }
    navigate("/admin/conteudos");
  }

  return (
    <BewildAdminShell
      active="conteudos"
      eyebrow={isNew ? "Novo post" : "Editar post"}
      title={isNew ? "Novo post" : title || "Editar post"}
      description="Conteúdo que aparece em /conteudos e nas páginas individuais /conteudos/{slug}."
      actions={
        <a className="bw-admin__btn" href="/admin/conteudos">
          <ArrowLeft aria-hidden /> Voltar
        </a>
      }
    >
      {loading ? (
        <p className="bw-admin__loading">Carregando…</p>
      ) : (
        <form className="bw-admin__form" onSubmit={save}>
          {error && (
            <div
              role="alert"
              style={{
                background: "#FBECEE",
                color: "#8C2230",
                border: "1px solid #ECCCD2",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <div className="bw-admin__form-row">
            <div className="bw-admin__field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="post-title">Título</label>
              <input
                id="post-title"
                className="bw-admin__input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={160}
              />
            </div>
          </div>

          <div className="bw-admin__form-row">
            <div className="bw-admin__field">
              <label htmlFor="post-slug">Slug (URL)</label>
              <input
                id="post-slug"
                className="bw-admin__input"
                type="text"
                value={currentSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setCurrentSlug(slugify(e.target.value));
                }}
                required
              />
              <span className="hint">/conteudos/{currentSlug || "..."}</span>
            </div>
            <div className="bw-admin__field">
              <label htmlFor="post-category">Categoria</label>
              <select
                id="post-category"
                className="bw-admin__select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="bw-admin__field">
              <label htmlFor="post-author">Autor</label>
              <input
                id="post-author"
                className="bw-admin__input"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={120}
              />
            </div>
          </div>

          <div className="bw-admin__field">
            <label htmlFor="post-excerpt">Resumo (excerpt)</label>
            <textarea
              id="post-excerpt"
              className="bw-admin__textarea"
              style={{ minHeight: 70, fontFamily: "inherit", fontSize: 14 }}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              maxLength={280}
              placeholder="1–2 frases que aparecem na listagem."
            />
            <span className="hint">{excerpt.length}/280</span>
          </div>

          <div className="bw-admin__field">
            <label htmlFor="post-cover">URL da imagem de capa</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                id="post-cover"
                className="bw-admin__input"
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://… ou /__l5e/assets-v1/…"
              />
              <button
                type="button"
                className="bw-admin__btn"
                onClick={() => coverFileRef.current?.click()}
                disabled={uploadingCover}
              >
                {uploadingCover ? "Enviando…" : "Enviar imagem"}
              </button>
              <input
                ref={coverFileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  void handleCoverFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            {coverImage && (
              <img
                src={coverImage}
                alt=""
                style={{
                  marginTop: 8,
                  maxWidth: 240,
                  borderRadius: 8,
                  border: "1px solid var(--bw-line)",
                }}
              />
            )}
          </div>

          <div className="bw-admin__field">
            <label htmlFor="post-body">Conteúdo (markdown ou HTML)</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <button
                type="button"
                className="bw-admin__btn"
                onClick={() => bodyFileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Enviando…" : "Inserir imagem"}
              </button>
              <span className="hint">
                Você também pode colar (Ctrl+V) ou arrastar a imagem para dentro do texto.
              </span>
              <input
                ref={bodyFileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  void handleBodyFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
            </div>
            <textarea
              id="post-body"
              ref={bodyRef}
              className="bw-admin__textarea"
              style={{ minHeight: 360 }}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onPaste={(e) => {
                const files = Array.from(e.clipboardData?.files ?? []).filter((f) =>
                  f.type.startsWith("image/")
                );
                if (!files.length) return;
                e.preventDefault();
                void handleBodyFiles(files);
              }}
              onDragOver={(e) => {
                if (Array.from(e.dataTransfer?.types ?? []).includes("Files")) e.preventDefault();
              }}
              onDrop={(e) => {
                const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
                  f.type.startsWith("image/")
                );
                if (!files.length) return;
                e.preventDefault();
                void handleBodyFiles(files);
              }}
              placeholder="# Título da seção&#10;&#10;Corpo do artigo…"
            />
            <span className="hint">
              Tempo de leitura estimado: {readingTime} min
            </span>
          </div>

          {pendingUploads.length > 0 && (
            <div
              className="bw-admin__field"
              style={{
                border: "1px solid var(--bw-line)",
                borderRadius: 8,
                padding: 12,
                background: "#F7F8FA",
              }}
            >
              <strong style={{ fontSize: 14 }}>
                {pendingUploads.length > 1
                  ? `${pendingUploads.length} imagens enviadas`
                  : "Imagem enviada"}
              </strong>
              <img
                src={pendingUploads[0].jpeg.sm}
                alt=""
                style={{ maxWidth: 200, borderRadius: 8, margin: "8px 0" }}
              />
              <label htmlFor="post-img-alt">Texto alternativo (obrigatório)</label>
              <input
                id="post-img-alt"
                className="bw-admin__input"
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                maxLength={160}
                placeholder="Descreva o que aparece na imagem."
              />
              <span className="hint">
                Descreve a imagem para quem usa leitor de tela e para o Google entender o conteúdo:
                é acessibilidade e SEO.
              </span>
              <label htmlFor="post-img-caption" style={{ marginTop: 8 }}>
                Legenda (opcional)
              </label>
              <input
                id="post-img-caption"
                className="bw-admin__input"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={200}
                placeholder="Texto que aparece abaixo da imagem."
              />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  className="bw-admin__btn bw-admin__btn--primary"
                  onClick={insertPendingUploads}
                  disabled={!altText.trim()}
                >
                  Inserir no texto
                </button>
                <button
                  type="button"
                  className="bw-admin__btn"
                  onClick={() => {
                    setPendingUploads([]);
                    setAltText("");
                    setCaption("");
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="bw-admin__field">
            <label>FAQ do post</label>
            <span className="hint" style={{ display: "block", marginBottom: 8 }}>
              4 a 6 perguntas tiradas do que o leitor pergunta ao Google; respostas de 40 a 70 palavras.
              Aparecem no fim do artigo e viram FAQPage nos dados estruturados. Pergunta ou resposta em
              branco é descartada ao salvar.
            </span>
            {faq.map((item, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid var(--bw-line)",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 8,
                  display: "grid",
                  gap: 6,
                }}
              >
                <input
                  className="bw-admin__input"
                  type="text"
                  value={item.question}
                  onChange={(e) =>
                    setFaq((list) => list.map((f, k) => (k === i ? { ...f, question: e.target.value } : f)))
                  }
                  placeholder={`Pergunta ${i + 1}`}
                  aria-label={`Pergunta ${i + 1}`}
                  maxLength={160}
                />
                <textarea
                  className="bw-admin__textarea"
                  style={{ minHeight: 64, fontFamily: "inherit", fontSize: 14 }}
                  value={item.answer}
                  onChange={(e) =>
                    setFaq((list) => list.map((f, k) => (k === i ? { ...f, answer: e.target.value } : f)))
                  }
                  placeholder="Resposta direta, com o número ou o critério que decide."
                  aria-label={`Resposta ${i + 1}`}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="hint">{wordCount(item.answer)} palavras</span>
                  <button
                    type="button"
                    className="bw-admin__btn"
                    onClick={() => setFaq((list) => list.filter((_, k) => k !== i))}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
            <div>
              <button
                type="button"
                className="bw-admin__btn"
                onClick={() => setFaq((list) => [...list, { question: "", answer: "" }])}
                disabled={faq.length >= 8}
              >
                + adicionar pergunta
              </button>
            </div>
          </div>

          <details>
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 600,
                color: "var(--bw-navy)",
                fontSize: 14,
                margin: "4px 0",
              }}
            >
              SEO (opcional)
            </summary>
            <div className="bw-admin__form-row" style={{ marginTop: 12 }}>
              <div className="bw-admin__field">
                <label htmlFor="post-meta-title">Meta title</label>
                <input
                  id="post-meta-title"
                  className="bw-admin__input"
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  maxLength={70}
                />
                <span className="hint">{metaTitle.length}/70 — usa o título se vazio.</span>
              </div>
              <div className="bw-admin__field">
                <label htmlFor="post-meta-desc">Meta description</label>
                <input
                  id="post-meta-desc"
                  className="bw-admin__input"
                  type="text"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  maxLength={170}
                />
                <span className="hint">{metaDescription.length}/170 — usa o resumo se vazio.</span>
              </div>
            </div>
          </details>

          <div className="bw-admin__form-foot">
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <label className="bw-admin__check">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                Publicar
              </label>
              <label className="bw-admin__check">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
                Marcar como destaque
              </label>
            </div>
            <button
              type="submit"
              className="bw-admin__btn bw-admin__btn--primary"
              disabled={saving}
            >
              <Save aria-hidden /> {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      )}
    </BewildAdminShell>
  );
}
