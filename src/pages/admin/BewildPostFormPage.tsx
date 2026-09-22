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
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import { supabase } from "@/integrations/supabase/client";
import { navigate } from "@/lib/useHashRoute";

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
            <input
              id="post-cover"
              className="bw-admin__input"
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://… ou /__l5e/assets-v1/…"
            />
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
            <textarea
              id="post-body"
              className="bw-admin__textarea"
              style={{ minHeight: 360 }}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="# Título da seção&#10;&#10;Corpo do artigo…"
            />
            <span className="hint">
              Tempo de leitura estimado: {readingTime} min
            </span>
          </div>

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
