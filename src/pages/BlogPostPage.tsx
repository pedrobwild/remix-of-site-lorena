import { useEffect, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { Container, CTAButton } from "../components/landing/primitives";
import { useBlogPost } from "../lib/useBlog";
import { useSiteSettings } from "../lib/useSiteSettings";
import { useSeo, breadcrumbJsonLd, organizationJsonLd } from "../lib/useSeo";
import { routes, navigate } from "../lib/useHashRoute";
import { track } from "../lib/analytics";
import { derivePictureSources, setToSrcset } from "../lib/derivePicture";
import { sanitizeBlogHtml } from "../lib/sanitizeHtml";
import RelatedPosts from "../components/RelatedPosts";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

type Props = { slug: string };

export default function BlogPostPage({ slug }: Props) {
  const { post, loading, notFound } = useBlogPost(slug);
  const { settings } = useSiteSettings();
  const base = (settings?.seo_canonical_base || "https://bewild.com.br").replace(/\/$/, "");

  const ogImage = post?.og_image_url || post?.cover_url || `${base}/images/og-bewild.jpg`;

  const absUrl = (u: string | null | undefined): string | undefined => {
    if (!u) return undefined;
    if (/^https?:\/\//i.test(u)) return u;
    return `${base}${u.startsWith("/") ? "" : "/"}${u}`;
  };

  const headline = post?.title
    ? post.title.length > 110
      ? post.title.slice(0, 107) + "…"
      : post.title
    : "";
  const articleUrl = post ? `${base}/conteudos/${post.slug}` : `${base}/conteudos`;
  const publisherLogo = absUrl(settings?.seo_og_image || settings?.default_og_image);

  useSeo({
    title:
      post?.seo_title ||
      (post ? `${post.title} | Conteúdos · BeWild` : "Conteúdos · BeWild"),
    description:
      post?.seo_description || post?.excerpt || "Conteúdo BeWild sobre reforma turn-key de studios.",
    canonicalPath: post ? `/conteudos/${post.slug}` : "/conteudos",
    ogType: "article",
    ogImage: absUrl(ogImage),
    jsonLd:
      settings && post
        ? [
            organizationJsonLd(settings),
            breadcrumbJsonLd(settings, [
              { name: "Início", path: "/" },
              { name: "Conteúdos", path: "/conteudos" },
              { name: post.title, path: `/conteudos/${post.slug}` },
            ]),
            {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "@id": `${articleUrl}#article`,
              headline,
              name: post.title,
              description:
                post.excerpt || post.seo_description || `${post.title} — Conteúdos BeWild.`,
              image: absUrl(ogImage)
                ? [{ "@type": "ImageObject", url: absUrl(ogImage)!, width: 1200, height: 630 }]
                : undefined,
              url: articleUrl,
              datePublished: post.published_at ?? post.created_at,
              dateModified: post.updated_at || post.published_at || post.created_at,
              author: {
                "@type": post.author_name === "BeWild" ? "Organization" : "Person",
                name: post.author_name || "BeWild",
                url: base,
                jobTitle: post.author_role || undefined,
              },
              publisher: {
                "@type": "Organization",
                "@id": `${base}/#organization`,
                name: settings.site_title || "BeWild",
                logo: publisherLogo
                  ? { "@type": "ImageObject", url: publisherLogo, width: 1200, height: 630 }
                  : undefined,
              },
              mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
              isPartOf: {
                "@type": "Blog",
                "@id": `${base}/conteudos#blog`,
                name: "Conteúdos · BeWild",
                url: `${base}/conteudos`,
              },
              articleSection: post.category || "Reforma turn-key",
              keywords: post.seo_keywords || (post.tags ?? []).join(", ") || undefined,
              inLanguage: "pt-BR",
              wordCount: post.content_html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length,
            },
          ]
        : undefined,
  });

  // Pós-processa o `content_html` antes de injetar no DOM (rebaixa h1→h2,
  // normaliza pulos de heading, otimiza <img> e gera <picture>). Mantido
  // igual à versão anterior — apenas a pele mudou.
  const enhancedHtml = useMemo(() => {
    if (!post?.content_html) return "";
    if (typeof window === "undefined") return sanitizeBlogHtml(post.content_html);
    const safeHtml = sanitizeBlogHtml(post.content_html);
    try {
      const doc = new DOMParser().parseFromString(
        `<div id="root">${safeHtml}</div>`,
        "text/html"
      );
      const root = doc.getElementById("root");
      if (!root) return safeHtml;

      const renameHeading = (el: Element, newTag: string) => {
        const next = doc.createElement(newTag);
        for (const a of Array.from(el.attributes)) next.setAttribute(a.name, a.value);
        next.innerHTML = el.innerHTML;
        el.parentNode?.replaceChild(next, el);
        return next;
      };

      Array.from(root.querySelectorAll("h1")).forEach((h) => renameHeading(h, "h2"));

      let prevLevel = 1;
      const headings = Array.from(root.querySelectorAll("h2, h3, h4, h5, h6"));
      for (const h of headings) {
        const current = parseInt(h.tagName.charAt(1), 10);
        const target = current > prevLevel + 1 ? prevLevel + 1 : current;
        if (target !== current) {
          const renamed = renameHeading(h, `h${target}`);
          prevLevel = parseInt(renamed.tagName.charAt(1), 10);
        } else {
          prevLevel = current;
        }
      }

      const imgs = Array.from(root.querySelectorAll("img"));
      imgs.forEach((img, idx) => {
        const isAboveFold = idx === 0;
        if (!img.hasAttribute("loading")) img.setAttribute("loading", isAboveFold ? "eager" : "lazy");
        if (!img.hasAttribute("decoding")) img.setAttribute("decoding", isAboveFold ? "sync" : "async");
        if (!img.hasAttribute("fetchpriority")) img.setAttribute("fetchpriority", isAboveFold ? "high" : "low");

        const inPicture = img.parentElement?.tagName.toLowerCase() === "picture";
        if (inPicture) return;
        const src = img.getAttribute("src") || "";
        const derived = derivePictureSources(src);
        if (!derived) return;
        const sizes = img.getAttribute("sizes") || "(max-width: 900px) 100vw, 900px";
        const picture = doc.createElement("picture");
        const mkSource = (type: string, set: { sm: string; md: string; lg: string }) => {
          const s = doc.createElement("source");
          s.setAttribute("type", type);
          s.setAttribute("srcset", setToSrcset(set));
          s.setAttribute("sizes", sizes);
          return s;
        };
        picture.appendChild(mkSource("image/avif", derived.avif));
        picture.appendChild(mkSource("image/webp", derived.webp));
        picture.appendChild(mkSource("image/jpeg", derived.jpeg));
        img.setAttribute("src", derived.fallbackSrc);
        img.setAttribute("srcset", setToSrcset(derived.jpeg));
        img.setAttribute("sizes", sizes);
        img.parentNode?.insertBefore(picture, img);
        picture.appendChild(img);
      });
      return root.innerHTML;
    } catch {
      return safeHtml;
    }
  }, [post?.content_html]);

  useEffect(() => {
    if (!post) return;
    track("blog_post_view", { value: { slug: post.slug } });
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".bw-post-hero > *",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, ease: "power3.out" }
      );
      gsap.utils.toArray<HTMLElement>(".bw-post-content > *").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 95%",
              once: true,
              onRefresh: (self) => {
                if (self.progress > 0) gsap.set(el, { opacity: 1, y: 0 });
              },
            },
          }
        );
      });
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => ctx.revert();
  }, [post]);

  if (loading) {
    return (
      <>
        <Header />
        <main id="main" tabIndex={-1} className="bg-[#FBFAF8] text-bewild-ink">
          <Container className="py-32">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-bewild-ink/45" role="status" aria-live="polite">
              carregando…
            </p>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  if (notFound || !post) {
    return (
      <>
        <Header />
        <main id="main" tabIndex={-1} className="bg-[#FBFAF8] text-bewild-ink">
          <Container className="py-32">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-bewild-blue-600">
              404 · Artigo não encontrado
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight">
              Esse texto <em className="italic text-bewild-blue">não existe (ainda)</em>.
            </h1>
            <p className="mt-4 max-w-xl text-bewild-steel">
              O artigo que você procura pode ter sido movido ou removido.
            </p>
            <button
              type="button"
              onClick={() => navigate(routes.conteudos)}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-bewild-blue px-6 py-3 text-sm font-semibold text-white hover:bg-[#005C99]"
            >
              Ver todos os conteúdos <ArrowRight className="h-4 w-4" />
            </button>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="bg-[#FBFAF8] text-bewild-ink">
        <article>
          {/* HERO */}
          <header className="bw-post-hero border-b border-bewild-ink/10 bg-white">
            <Container className="pb-12 pt-32 sm:pb-16 sm:pt-40">
              <nav aria-label="Trilha" className="flex flex-wrap items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-bewild-ink/55">
                <a href={routes.conteudos} className="hover:text-bewild-blue">Conteúdos</a>
                {post.category && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="text-bewild-blue">{post.category}</span>
                  </>
                )}
                {post.published_at && (
                  <>
                    <span aria-hidden>·</span>
                    <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                  </>
                )}
                {post.reading_minutes && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{post.reading_minutes} min</span>
                  </>
                )}
              </nav>

              <h1 className="mt-6 max-w-[18ch] font-display text-[clamp(2.2rem,4.5vw,3.8rem)] font-semibold leading-[1.06] tracking-tight">
                {post.title}
                {post.subtitle && (
                  <>
                    <br />
                    <em className="italic text-bewild-blue text-[0.7em] font-normal">
                      {post.subtitle}
                    </em>
                  </>
                )}
              </h1>

              {post.excerpt && (
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bewild-steel">
                  {post.excerpt}
                </p>
              )}

              {(post.author_name || post.author_role) && (
                <p className="mt-8 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-bewild-ink/55">
                  {post.author_name}
                  {post.author_role && (
                    <>
                      <span aria-hidden> · </span>
                      <span>{post.author_role}</span>
                    </>
                  )}
                </p>
              )}
            </Container>
          </header>

          {/* COVER */}
          {post.cover_url && (() => {
            const cover = derivePictureSources(post.cover_url);
            const sizes = "(max-width: 1100px) 100vw, 1100px";
            return (
              <Container className="-mt-4 sm:-mt-6">
                <figure className="overflow-hidden rounded-3xl shadow-[0_40px_80px_-40px_rgba(10,37,64,0.45)]">
                  {cover ? (
                    <picture>
                      <source type="image/avif" srcSet={setToSrcset(cover.avif)} sizes={sizes} />
                      <source type="image/webp" srcSet={setToSrcset(cover.webp)} sizes={sizes} />
                      <source type="image/jpeg" srcSet={setToSrcset(cover.jpeg)} sizes={sizes} />
                      <img
                        src={cover.fallbackSrc}
                        srcSet={setToSrcset(cover.jpeg)}
                        sizes={sizes}
                        alt={post.cover_alt || post.title}
                        width={1920}
                        height={1080}
                        loading="eager"
                        decoding="sync"
                        className="block h-full w-full object-cover"
                        {...({ fetchpriority: "high" } as { fetchpriority: string })}
                      />
                    </picture>
                  ) : (
                    <img
                      src={post.cover_url_md || post.cover_url}
                      srcSet={
                        post.cover_url_sm && post.cover_url_md && post.cover_url
                          ? `${post.cover_url_sm} 640w, ${post.cover_url_md} 1280w, ${post.cover_url} 1920w`
                          : undefined
                      }
                      sizes={sizes}
                      alt={post.cover_alt || post.title}
                      width={1920}
                      height={1080}
                      loading="eager"
                      decoding="sync"
                      className="block h-full w-full object-cover"
                      {...({ fetchpriority: "high" } as { fetchpriority: string })}
                    />
                  )}
                </figure>
              </Container>
            );
          })()}

          {/* CONTENT */}
          <section className="py-[clamp(3rem,8vh,5rem)]">
            <Container>
              <div
                className="bw-post-content prose-bewild mx-auto max-w-[68ch] font-body text-[1.02rem] leading-[1.75] text-bewild-ink/90"
                dangerouslySetInnerHTML={{ __html: enhancedHtml }}
              />

              {/* TAGS */}
              {post.tags && post.tags.length > 0 && (
                <nav
                  aria-label="Tags do artigo"
                  className="mx-auto mt-12 flex max-w-[68ch] flex-wrap items-center gap-2"
                >
                  {post.tags.map((t) => {
                    const tagSlug = t
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9\s-]/g, "")
                      .trim()
                      .replace(/\s+/g, "-");
                    return (
                      <a
                        key={t}
                        href={routes.blogTag(tagSlug)}
                        className="rounded-full border border-bewild-ink/15 bg-white px-3 py-1 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-bewild-ink/70 hover:border-bewild-blue/50 hover:text-bewild-blue"
                        onClick={() =>
                          track("blog_tag_click", {
                            value: { from: "post", tag: tagSlug, slug: post.slug },
                          })
                        }
                      >
                        #{t}
                      </a>
                    );
                  })}
                  <a
                    href={routes.blogTags}
                    className="rounded-full px-3 py-1 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-bewild-blue underline underline-offset-4"
                  >
                    ver todas as tags →
                  </a>
                </nav>
              )}
            </Container>
          </section>

          {/* RELACIONADOS */}
          <Container>
            <RelatedPosts currentPost={post} />
          </Container>

          {/* CTA FINAL */}
          <section className="mt-12 bg-bewild-ink py-[clamp(3.5rem,8vh,5.5rem)] text-white">
            <Container className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-bewild-blue-400">
                  Próximo passo
                </p>
                <p className="mt-3 font-display text-2xl font-semibold leading-tight sm:text-3xl">
                  Esse conteúdo te fez pensar no seu imóvel?{" "}
                  <em className="italic text-bewild-blue-400">Vamos diagnosticar.</em>
                </p>
              </div>
              <CTAButton
                href={routes.diagnostico}
                variant="primary"
                onClick={() =>
                  track("click_cta", { value: { label: "diagnostico", from: "blog-post", slug: post.slug } })
                }
              >
                Solicitar diagnóstico <ArrowRight className="h-4 w-4" />
              </CTAButton>
            </Container>
          </section>
        </article>
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </>
  );
}
