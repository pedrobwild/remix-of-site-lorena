/**
 * BewildPostPage — /conteudos/:slug (novo, Bewild).
 *
 * Render do post individual de `bewild_posts`. Body em markdown,
 * parseado com `marked` e sanitizado por `sanitizeBlogHtml` antes
 * de injetar via `dangerouslySetInnerHTML`. Independente do
 * BlogPostPage antigo (Lorena/blog_posts).
 */
import { useMemo } from "react";
import { marked } from "marked";
import { useSeo } from "@/lib/useSeo";
import BewildSiteNav from "@/components/BewildSiteNav";
import SiteFooter from "@/components/SiteFooter";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";
import { whatsappHref } from "@/components/landing/content";
import {
  bewildCategoryLabel,
  formatBewildDate,
  type BewildPost,
} from "@/lib/useBewildPosts";
import { useBewildPost, useBewildRelatedPosts } from "@/lib/useBewildPost";
import { navigate } from "@/lib/useHashRoute";
import "@/styles/home.css";
import "@/styles/conteudos.css";
import "@/styles/post.css";

type Props = { slug: string };

// Configuração estável do marked (sem opções deprecadas em v18).
marked.setOptions({ gfm: true, breaks: false });


function RelatedCard({ p }: { p: BewildPost }) {
  return (
    <a href={`/conteudos/${p.slug}`} className="ct-card" aria-label={`Ler: ${p.title}`}>
      <div className={"ct-card__media" + (!p.cover_image ? " ct-card__media--empty" : "")}>
        {p.cover_image ? (
          <img src={p.cover_image} alt={p.title} loading="lazy" decoding="async" />
        ) : (
          <span>Capa em breve</span>
        )}
      </div>
      <div className="ct-card__body">
        <div className="ct-card__cat">{bewildCategoryLabel(p.category)}</div>
        <h3 className="ct-card__title">{p.title}</h3>
        {p.excerpt ? <p className="ct-card__excerpt">{p.excerpt}</p> : null}
        <div className="ct-card__meta">
          {p.reading_time ? <span>{p.reading_time} min de leitura</span> : null}
        </div>
      </div>
    </a>
  );
}

export default function BewildPostPage({ slug }: Props) {
  const { post, loading, notFound } = useBewildPost(slug);
  const { related } = useBewildRelatedPosts(post?.category, post?.id, 3);

  const bodyHtml = useMemo(() => {
    if (!post?.body) return "";
    try {
      const raw = marked.parse(post.body, { async: false }) as string;
      return sanitizeBlogHtml(raw);
    } catch {
      return "";
    }
  }, [post?.body]);

  const baseUrl = "https://bewild.com.br";
  const articleUrl = post ? `${baseUrl}/conteudos/${post.slug}` : `${baseUrl}/conteudos/${slug}`;
  const dateIso = post?.published_at ?? post?.created_at ?? null;

  const jsonLd = useMemo(() => {
    if (!post) return undefined;
    const arr: Array<Record<string, unknown>> = [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.meta_description || post.excerpt || post.title,
        image: post.cover_image ? [post.cover_image] : undefined,
        author: { "@type": "Organization", name: post.author || "Bewild" },
        publisher: {
          "@type": "Organization",
          name: "Bewild",
          logo: { "@type": "ImageObject", url: `${baseUrl}/images/og-bewild.jpg` },
        },
        datePublished: dateIso,
        dateModified: dateIso,
        mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
        inLanguage: "pt-BR",
        articleSection: bewildCategoryLabel(post.category),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Conteúdos", item: `${baseUrl}/conteudos` },
          { "@type": "ListItem", position: 3, name: post.title, item: articleUrl },
        ],
      },
    ];
    if (post.faq && post.faq.length > 0) {
      arr.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faq.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: { "@type": "Answer", text: q.answer },
        })),
      });
    }
    return arr;
  }, [post, articleUrl, dateIso]);

  useSeo({
    title: post
      ? post.meta_title || `${post.title} · Bewild`
      : notFound
        ? "Conteúdo não encontrado · Bewild"
        : "Carregando · Bewild",
    description:
      post?.meta_description ||
      post?.excerpt ||
      "Conteúdos Bewild sobre reforma turn-key e operação de studios em São Paulo.",
    canonicalPath: post ? `/conteudos/${post.slug}` : `/conteudos/${slug}`,
    ogType: "article",
    ogImage: post?.cover_image ?? undefined,
    noindex: notFound,
    jsonLd,
  });

  // 404 — slug inválido ou rascunho
  if (notFound) {
    return (
      <div className="bw-home bw-post">
        <BewildSiteNav />
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">404</div>
            <h1 className="pt-title">Conteúdo não encontrado.</h1>
            <p className="pt-excerpt">
              O artigo que você procura pode ter sido movido ou ainda não foi publicado.
            </p>
            <button
              type="button"
              onClick={() => navigate("/conteudos")}
              className="btn btn-primary"
            >
              Voltar para Conteúdos <span className="arrow">→</span>
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Loading — skeleton enxuto
  if (loading || !post) {
    return (
      <div className="bw-home bw-post">
        <BewildSiteNav />
        <section className="pt-hero" aria-busy="true" aria-live="polite">
          <div className="container">
            <div className="pt-cat">Carregando…</div>
            <h1 className="pt-title">&nbsp;</h1>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bw-home bw-post">
      {/* NAV */}
      <BewildSiteNav />

      <article>
        {/* HERO */}
        <section className="pt-hero">
          <div className="container">
            <nav className="pt-breadcrumb" aria-label="Você está em">
              <a href="/conteudos">Conteúdos</a>
              <span aria-hidden="true">›</span>
              <span className="pt-current">{bewildCategoryLabel(post.category)}</span>
            </nav>
            <div className="pt-cat">{bewildCategoryLabel(post.category)}</div>
            <h1 className="pt-title">{post.title}</h1>
            {post.excerpt ? <p className="pt-excerpt">{post.excerpt}</p> : null}
            <div className="pt-meta">
              {post.author ? <span>{post.author}</span> : null}
              {post.author && dateIso ? <span className="pt-dot">·</span> : null}
              {dateIso ? (
                <time dateTime={dateIso}>{formatBewildDate(dateIso)}</time>
              ) : null}
              {post.reading_time ? <span className="pt-dot">·</span> : null}
              {post.reading_time ? <span>{post.reading_time} min de leitura</span> : null}
            </div>
          </div>
        </section>

        {/* COVER */}
        {post.cover_image ? (
          <section className="pt-cover-section">
            <div className="container">
              <figure className="pt-cover">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  loading="eager"
                  decoding="sync"
                  {...({ fetchpriority: "high" } as { fetchpriority: string })}
                />
              </figure>
            </div>
          </section>
        ) : null}

        {/* BODY */}
        <section className="pt-body-section">
          <div className="container">
            <div
              className="pt-body"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </div>
        </section>

        {/* FAQ */}
        {post.faq && post.faq.length > 0 ? (
          <section className="pt-faq">
            <div className="container">
              <div className="pt-faq__inner">
                <h2>Perguntas frequentes</h2>
                {post.faq.map((q, i) => (
                  <details key={i}>
                    <summary>{q.question}</summary>
                    <p>{q.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* RELATED */}
        {related.length > 0 ? (
          <section className="pt-related">
            <div className="container">
              <h2>Continue lendo</h2>
              <div className="pt-related__grid">
                {related.map((p) => <RelatedCard key={p.id} p={p} />)}
              </div>
            </div>
          </section>
        ) : null}
      </article>

      {/* CTA */}
      <section className="ct-cta">
        <div className="container">
          <div className="eyebrow" style={{ color: "var(--sky, #5FB2DD)" }}>Diagnóstico</div>
          <h2>Da leitura à decisão: avalie o seu studio.</h2>
          <p>
            Envie os dados do imóvel e receba uma análise inicial de escopo,
            projeto e próximos passos. Sem compromisso.
          </p>
          <div className="ct-cta__btns">
            <a href="/diagnostico" className="btn btn-cyan">
              Solicitar diagnóstico <span className="arrow">→</span>
            </a>
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost-light"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
