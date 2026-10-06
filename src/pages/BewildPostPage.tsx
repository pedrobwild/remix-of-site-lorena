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
 *
 * O Root (main.tsx) remonta esta página a cada slug (key da rota), e
 * `useBewildPost` zera o estado na troca: nunca há post A sob a URL de B.
 * Falha de leitura mostra erro com "Tentar novamente" (antes: skeleton eterno).
 */
import { useEffect, useMemo, type ReactNode } from "react";
import { marked } from "marked";
import { useSeo } from "@/lib/useSeo";
import { postJsonLd } from "@/lib/contentJsonLd";
import {
  CONTENT_CARD_SIZES,
  POST_COVER_SIZES,
  POST_COVER_WIDTHS,
  THUMB_WIDTHS,
  optimizedImageUrl,
  responsiveImageProps,
} from "@/lib/imageUrl";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import { chartSetForSlug, chartsPagePath } from "@/content/chartSets";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";
import { wrapArticleTables } from "@/lib/articleTables";
import { whatsappHref } from "@/components/landing/content";
import {
  bewildCategoryLabel,
  formatBewildDate,
  type BewildPost,
  type BewildPostCategory,
} from "@/lib/useBewildPosts";
import { useBewildPost, useBewildRelatedPosts } from "@/lib/useBewildPost";
import { postAuthorByline, postAuthorHref, postDates, postTitleFromSlug } from "@/lib/postSeo";
import { navigate } from "@/lib/useHashRoute";
import { keywordsForPost } from "@/lib/postKeywords";
import { internalLinksForPost } from "@/lib/postInternalLinks";
import { structurePostBody, TOC_MIN_SECTIONS } from "@/lib/postStructure";
import { logNotFound, lookupActiveRedirect } from "@/lib/notFoundLog";
import "@/styles/post.css";
import "@/styles/conteudos.css";

type Props = {
  slug: string;
  /** Dados do loader (SSR); ausente = busca no cliente como antes. */
  initial?: { post: BewildPost | null; related: BewildPost[] | null; bodyHtml: string | null } | null;
};

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
  buttonLabel: "Solicitar orçamento",
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
          <img
            {...responsiveImageProps(p.cover_image, THUMB_WIDTHS, 640, CONTENT_CARD_SIZES)}
            alt={p.title}
            loading="lazy"
            decoding="async"
          />
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

export default function BewildPostPage({ slug, initial }: Props) {
  const { post, loading, notFound, error, retry } = useBewildPost(
    slug,
    initial ? { slug, post: initial.post } : null,
  );
  const { related } = useBewildRelatedPosts(
    post?.category,
    post?.id,
    3,
    initial?.post && initial.related ? { excludeId: initial.post.id, related: initial.related } : null,
  );

  const cta = useMemo(() => getCtaContent(post?.category), [post?.category]);
  // Link interno SEM utm_*: UTM fixo aqui sobrescrevia a campanha real do
  // visitante (e perdia gclid/fbclid). A navegação SPA já carrega os
  // parâmetros da URL atual (carryCampaignParams).
  const ctaHref = "/orcamento";
  const ctaWhatsHref = post ? whatsappHref(`Vim do artigo "${post.title}" no site.`) : whatsappHref();

  const sanitizedBody = useMemo(() => {
    if (!post?.body) return "";
    // 1º render: HTML já sanitizado pelo loader (evita diferença de hidratação).
    if (initial?.post && initial.bodyHtml != null && initial.post.body === post.body) {
      return initial.bodyHtml;
    }
    try {
      const raw = marked.parse(post.body, { async: false }) as string;
      return wrapArticleTables(sanitizeBlogHtml(raw));
    } catch {
      return "";
    }
  }, [post?.body, initial]);
  // Linha "Autor/Revisão" sai do corpo (vira dado no cabeçalho) e H2/H3 ganham
  // âncora para o sumário. Função pura: servidor e cliente geram o mesmo HTML.
  const structured = useMemo(() => structurePostBody(sanitizedBody), [sanitizedBody]);
  const bodyHtml = structured.html;
  const tocItems = structured.toc.filter((t) => t.level === 2);
  const reviewer = structured.credits.reviewer;
  const reviewerHref = reviewer ? postAuthorHref(reviewer) : null;
  const reviewerLabel = reviewer && postAuthorByline(reviewer) !== postAuthorByline(post?.author) ? postAuthorByline(reviewer) : null;

  const dates = postDates(post);
  const dateIso = dates.published;
  const authorHref = postAuthorHref(post?.author);
  // Enquanto o banco não responde, título e H1 saem do slug (SEO-14): o
  // snapshot do Googlebot nunca vê "Carregando" sem H1.
  const slugTitle = postTitleFromSlug(slug);

  // JSON-LD (Article/FAQPage) sai no head() da rota, no HTML do servidor.
  // Só quando o loader falhou (sem `initial`) a página publica no cliente.
  const fallbackJsonLd = useMemo(() => (!initial && post ? postJsonLd(post) : undefined), [initial, post]);

  useSeo({
    title: post
      ? post.meta_title || `${post.title} | Bewild`
      : notFound
        ? "Conteúdo não encontrado | Bewild"
        : `${slugTitle} | Bewild`,
    description:
      post?.meta_description ||
      post?.excerpt ||
      "Conteúdos Bewild sobre reformas de apartamentos e entrega de imóveis prontos em São Paulo.",
    keywords: post ? keywordsForPost(post.slug) : undefined,
    canonicalPath: post ? `/conteudos/${post.slug}` : `/conteudos/${slug}`,
    ogType: "article",
    ogImage: post?.og_image
      ? post.og_image
      : post?.cover_image
        ? optimizedImageUrl(post.cover_image)
        : undefined,
    noindex: notFound,
    jsonLd: fallbackJsonLd,
  });

  // Post inexistente: segue o redirect cadastrado no admin (é o que o painel
  // grava quando o slug de um post publicado muda) e registra o 404 para
  // curadoria. Sem redirect, fica a tela de 404 abaixo (noindex).
  useEffect(() => {
    if (!notFound) return;
    const path = window.location.pathname;
    void logNotFound(path, document.referrer || null);
    let cancelled = false;
    void lookupActiveRedirect(path).then((target) => {
      if (!cancelled && target) navigate(target, { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [notFound]);

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

  // Erro de leitura (rede/backend) — mensagem honesta + nova tentativa.
  if (error && !post) {
    return (
      <div className="bw-post">
        <BwaNav />
        <main id="main" tabIndex={-1}>
          <section className="pt-hero" role="alert">
            <div className="container">
              <div className="pt-cat">Conteúdo indisponível</div>
              <h1 className="pt-title">{slugTitle}</h1>
              <p className="pt-excerpt">
                Não foi possível carregar este artigo agora. Verifique sua conexão e tente de novo.
              </p>
              <button type="button" onClick={retry} className="pt-btn cyan">
                Tentar novamente <span className="ar">→</span>
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
              <h1 className="pt-title">{slugTitle}</h1>
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
              {authorHref && authorHref !== `/conteudos/${post.slug}` ? (
                <a href={authorHref} rel="author">{postAuthorByline(post.author)}</a>
              ) : (
                <span>{postAuthorByline(post.author)}</span>
              )}
              {dateIso ? <span className="pt-dot">·</span> : null}
              {dateIso ? <time dateTime={dateIso}>{formatBewildDate(dateIso)}</time> : null}
              {post.reading_time ? <span className="pt-dot">·</span> : null}
              {post.reading_time ? <span>{post.reading_time} min de leitura</span> : null}
              {dates.showUpdated && dates.modified ? <span className="pt-dot">·</span> : null}
              {dates.showUpdated && dates.modified ? (
                <span>
                  Atualizado em <time dateTime={dates.modified}>{formatBewildDate(dates.modified)}</time>
                </span>
              ) : null}
              {reviewerLabel ? <span className="pt-dot">·</span> : null}
              {reviewerLabel ? (
                <span className="pt-reviewer">
                  Revisão{structured.credits.reviewKind ? ` ${structured.credits.reviewKind}` : ""}:{" "}
                  {reviewerHref && reviewerHref !== `/conteudos/${post.slug}` ? (
                    <a href={reviewerHref}>{reviewerLabel}</a>
                  ) : (
                    reviewerLabel
                  )}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        {/* COVER */}
        {post.cover_image ? (
          <section className="pt-cover-section">
            <div className="container">
              <figure className="pt-cover">
                <img
                  {...responsiveImageProps(post.cover_image, POST_COVER_WIDTHS, 1200, POST_COVER_SIZES)}
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
            {tocItems.length >= TOC_MIN_SECTIONS ? (
              <nav className="pt-toc" aria-label="Neste artigo">
                <p className="pt-toc__title">Neste artigo</p>
                <ol>
                  {tocItems.map((t) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`}>{t.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}
            <div className="pt-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          </div>
        </section>

        {/* GRÁFICOS REUTILIZÁVEIS */}
        {chartSetForSlug(post.slug) ? (
          <section className="pt-links">
            <div className="container">
              <p>
                <a href={chartsPagePath(post.slug)}>
                  <strong>Ver todos os gráficos deste artigo</strong>
                </a>{" "}
                — versão larga e para celular, prontas para baixar e reutilizar.
              </p>
            </div>
          </section>
        ) : null}

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

        {/* LINKS INTERNOS */}
        <section className="pt-links">
          <div className="container">
            <div className="pt-rel-head">
              <span className="n">↳</span>
              <h2>Páginas relacionadas</h2>
              <span className="ln" />
            </div>
            <ul className="pt-links__grid">
              {internalLinksForPost(post.slug, post.category).map((l) => (
                <li key={l.href}>
                  <a href={l.href}>
                    <strong>{l.label}</strong>
                    <span>{l.description}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

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
            <span className="pt-eyb">{cta.eyebrow}</span>
            <h2>{cta.title}</h2>
            <p>{cta.body}</p>
            <div className="pt-cta__act">
              <a href={ctaHref} className="pt-btn cyan">{cta.buttonLabel} <span className="ar">→</span></a>
              <a href={ctaWhatsHref} target="_blank" rel="noopener noreferrer" className="pt-btn ghost">Falar no WhatsApp</a>
            </div>
            <div className="pt-cta__rea">+188 reformas entregues · +200 projetos</div>
          </div>
        </div>
      </section>

      <BwaFooter />
    </div>
  );
}
