/**
 * BewildPostPage — /conteudos/:slug (Bewild).
 *
 * Render do post individual de `bewild_posts`. Body em markdown,
 * parseado com `marked` e sanitizado por `sanitizeBlogHtml` antes
 * de injetar via `dangerouslySetInnerHTML`.
 *
 * SEO/AEO: gera JSON-LD Article + BreadcrumbList + FAQPage (quando há FAQ),
 * meta_title/description, canonical, ogImage e noindex no 404 — preservado.
 * Visual: "artigo" na prancha 04. CSS isolado em .bw-post.
 */
import { useMemo, type ReactNode } from "react";
import { marked } from "marked";
import { useSeo } from "@/lib/useSeo";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";
import { whatsappHref } from "@/components/landing/content";
import {
  bewildCategoryLabel,
  formatBewildDate,
  type BewildPost,
  type BewildPostCategory,
} from "@/lib/useBewildPosts";
import { useBewildPost, useBewildRelatedPosts } from "@/lib/useBewildPost";
import { navigate } from "@/lib/useHashRoute";
import "@/styles/post.css";
import "@/styles/conteudos.css";

type Props = { slug: string };

// Configuração estável do marked (sem opções deprecadas em v18).
marked.setOptions({ gfm: true, breaks: false });

type CtaContent = {
  eyebrow: string;
  title: ReactNode;
  body: string;
  buttonLabel: string;
};

const CTA_FALLBACK: CtaContent = {
  eyebrow: "Diagnóstico gratuito · sem compromisso",
  title: (
    <>
      Da leitura à decisão: <i>avalie o seu studio.</i>
    </>
  ),
  body: "Envie os dados do imóvel e receba uma análise inicial de escopo, projeto e próximos passos.",
  buttonLabel: "Solicitar Orçamento",
};

const CTA_BY_CATEGORY: Record<BewildPostCategory, CtaContent> = {
  fiscal: {
    eyebrow: "Análise gratuita · sem compromisso",
    title: (
      <>
        Regra é uma coisa. <i>O seu caso é outra.</i>
      </>
    ),
    body: "Envie os dados do imóvel e receba uma leitura de escopo, prazo e investimento. Para decidir com número, não com manchete.",
    buttonLabel: "Avaliar meu studio",
  },
  investimento: {
    eyebrow: "Diagnóstico gratuito · sem compromisso",
    title: (
      <>
        Da leitura à decisão: <i>avalie o seu studio.</i>
      </>
    ),
    body: "Envie os dados do imóvel e receba uma análise inicial de escopo, projeto e próximos passos.",
    buttonLabel: "Solicitar diagnóstico",
  },
  mercado: {
    eyebrow: "Diagnóstico gratuito · sem compromisso",
    title: (
      <>
        Média de mercado não paga conta. <i>A do seu imóvel, sim.</i>
      </>
    ),
    body: "Envie os dados do studio e receba uma leitura do potencial dele, não do mercado inteiro.",
    buttonLabel: "Avaliar meu imóvel",
  },
  reforma: {
    eyebrow: "Orçamento sem compromisso",
    title: (
      <>
        Sabe o que quer. <i>Falta saber quanto e quando.</i>
      </>
    ),
    body: "Envie a planta ou os dados do imóvel e receba escopo, prazo e investimento estimados.",
    buttonLabel: "Solicitar orçamento",
  },
  operacao: {
    eyebrow: "Diagnóstico gratuito · sem compromisso",
    title: (
      <>
        Operar bem começa <i>antes de anunciar.</i>
      </>
    ),
    body: "Envie os dados do imóvel e receba uma leitura do que ajustar para performar desde a primeira diária.",
    buttonLabel: "Avaliar meu studio",
  },
};

function getCtaContent(category: BewildPostCategory | null | undefined): CtaContent {
  if (!category) return CTA_FALLBACK;
  return CTA_BY_CATEGORY[category] ?? CTA_FALLBACK;
}

function RelatedCard({ p }: { p: BewildPost }) {
  return (
    <a href={`/conteudos/${p.slug}`} className="ct-card" aria-label={`Ler: ${p.title}`}>
      <div className={"ct-card__media" + (!p.cover_image ? " ct-card__media--empty" : "")}>
        {p.cover_image ? (
          <img src={p.cover_image} alt={p.title} loading="lazy" decoding="async" />
        ) : (
          <span>Capa em breve</span>
        )}
        <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
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
      ? post.meta_title || `${post.title} | Bewild`
      : notFound
        ? "Conteúdo não encontrado | Bewild"
        : "Carregando | Bewild",
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
      <div className="bw-post">
        <BwaNav />
        <main id="main" tabIndex={-1}>
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">404</div>
            <h1 className="pt-title">Conteúdo não encontrado.</h1>
            <p className="pt-excerpt">
              O artigo que você procura pode ter sido movido ou ainda não foi publicado.
            </p>
            <button type="button" onClick={() => navigate("/conteudos")} className="pt-btn cyan">
              Voltar para Conteúdos <span className="ar">→</span>
            </button>
          </div>
        </section>
        </main>
        <BwaFooter />
      </div>
    );
  }

  // Loading — skeleton enxuto
  if (loading || !post) {
    return (
      <div className="bw-post">
        <BwaNav />
        <main id="main" tabIndex={-1}>
          <section className="pt-hero" aria-busy="true" aria-live="polite">
            <div className="container">
              <div className="pt-cat">Carregando…</div>
              <h1 className="pt-title">&nbsp;</h1>
            </div>
          </section>
        </main>
        <BwaFooter />
      </div>
    );
  }

  return (
    <div className="bw-post">
      <BwaNav />

      <div className="bw-post__frame" aria-hidden="true">
        <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
      </div>
      <div className="bw-post__titleblock" aria-hidden="true">BEWILD<br /><b>BW—004 / CONTEÚDOS</b><br />SÃO PAULO · BR</div>
      <div className="bw-post__sheetno" aria-hidden="true">ARTIGO · {bewildCategoryLabel(post.category)}</div>

      <article id="main" tabIndex={-1}>
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
              {dateIso ? <time dateTime={dateIso}>{formatBewildDate(dateIso)}</time> : null}
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
                <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
              </figure>
            </div>
          </section>
        ) : null}

        {/* BODY */}
        <section className="pt-body-section">
          <div className="container">
            <div className="pt-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          </div>
        </section>

        {/* FAQ */}
        {post.faq && post.faq.length > 0 ? (
          <section className="pt-faq">
            <div className="container">
              <div className="pt-faq__inner">
                <div className="pt-faq__head">
                  <span className="n">FAQ</span>
                  <h2>Perguntas frequentes</h2>
                  <span className="ln" />
                </div>
                {post.faq.map((q, i) => (
                  <details key={i} open={i === 0}>
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
              <div className="pt-rel-head">
                <span className="n">→</span>
                <h2>Continue lendo</h2>
                <span className="ln" />
              </div>
              <div className="pt-related__grid">
                {related.map((p) => <RelatedCard key={p.id} p={p} />)}
              </div>
            </div>
          </section>
        ) : null}
      </article>

      {/* CTA */}
      <section className="pt-cta">
        <div className="gridbg" aria-hidden="true" />
        <div className="container">
          <div className="pt-cta__inner">
            <span className="pt-eyb">Diagnóstico gratuito · sem compromisso</span>
            <h2>Da leitura à decisão: <i>avalie o seu studio.</i></h2>
            <p>Envie os dados do imóvel e receba uma análise inicial de escopo, projeto e próximos passos.</p>
            <div className="pt-cta__act">
              <a href="/diagnostico" className="pt-btn cyan">Solicitar Orçamento <span className="ar">→</span></a>
              <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="pt-btn ghost">Falar no WhatsApp</a>
            </div>
            <div className="pt-cta__rea">+150 studios entregues em São Paulo</div>
          </div>
        </div>
      </section>

      <BwaFooter />
    </div>
  );
}
