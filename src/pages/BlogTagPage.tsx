import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { Container, CTAButton, LandingImage } from "../components/landing/primitives";
import { useBlogPostsByTag } from "../lib/useBlog";
import { useSiteSettings } from "../lib/useSiteSettings";
import { useSeo, breadcrumbJsonLd, organizationJsonLd } from "../lib/useSeo";
import { routes } from "../lib/useHashRoute";
import { track } from "../lib/analytics";

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

export default function BlogTagPage({ slug }: Props) {
  const { posts, label, loading, error } = useBlogPostsByTag(slug);
  const { settings } = useSiteSettings();
  const base = (settings?.seo_canonical_base || "https://bewild.com.br").replace(/\/$/, "");
  const displayLabel = label || slug.replace(/-/g, " ");
  const titleCased = displayLabel.charAt(0).toUpperCase() + displayLabel.slice(1);

  useSeo({
    title: `${titleCased} · Conteúdos BeWild`,
    description: `Conteúdos BeWild marcados com "${displayLabel}" — guias e cases sobre reforma turn-key de studios em São Paulo.`,
    canonicalPath: `/conteudos/tag/${slug}`,
    ogType: "website",
    jsonLd:
      settings && !loading
        ? [
            organizationJsonLd(settings),
            breadcrumbJsonLd(settings, [
              { name: "Início", path: "/" },
              { name: "Conteúdos", path: "/conteudos" },
              { name: "Tags", path: "/conteudos/tags" },
              { name: titleCased, path: `/conteudos/tag/${slug}` },
            ]),
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: `${titleCased} · Conteúdos BeWild`,
              url: `${base}/conteudos/tag/${slug}`,
              about: { "@type": "Thing", name: displayLabel },
              hasPart: posts.map((p) => ({
                "@type": "BlogPosting",
                headline: p.title,
                url: `${base}/conteudos/${p.slug}`,
                datePublished: p.published_at ?? p.created_at,
                image: p.cover_url ?? undefined,
              })),
            },
          ]
        : undefined,
  });

  useEffect(() => {
    if (!slug) return;
    track("blog_tag_view", { value: { tag: slug } });
  }, [slug]);

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="bg-[#FBFAF8] text-bewild-ink">
        <section className="border-b border-bewild-ink/10 bg-white">
          <Container className="pb-14 pt-32 sm:pb-20 sm:pt-40">
            <a
              href={routes.blogTags}
              className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-bewild-ink/55 hover:text-bewild-blue"
            >
              ← Ver todas as tags
            </a>
            <p className="mt-4 font-mono text-[0.68rem] font-medium uppercase tracking-[0.28em] text-bewild-blue-600">
              <span className="mr-2 inline-block h-px w-6 align-middle bg-bewild-blue-600 opacity-60" />
              Conteúdos · Tag
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.1rem,4.5vw,3.6rem)] font-semibold leading-[1.08] tracking-tight">
              #{displayLabel}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-bewild-steel sm:text-lg">
              {error && !loading
                ? "Não foi possível carregar os artigos agora."
                : posts.length === 0 && !loading
                ? "Nenhum artigo encontrado com esta tag — por enquanto."
                : `${posts.length} ${posts.length === 1 ? "artigo" : "artigos"} marcados com "${displayLabel}".`}
            </p>
          </Container>
        </section>

        <section aria-label={`Artigos com a tag ${displayLabel}`} className="py-[clamp(3rem,8vh,5rem)]">
          <Container>
            {loading && (
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-bewild-ink/45">
                carregando…
              </p>
            )}

            {!loading && error && (
              <p role="alert" className="font-mono text-xs uppercase tracking-[0.2em] text-bewild-ink/70">
                Não foi possível carregar agora.{" "}
                <button
                  type="button"
                  className="underline decoration-bewild-blue/40 underline-offset-4 hover:text-bewild-blue"
                  onClick={() => window.location.reload()}
                >
                  Tentar novamente →
                </button>
              </p>
            )}

            {!loading && !error && posts.length === 0 && (
              <a
                href={routes.blogTags}
                className="font-mono text-xs uppercase tracking-[0.2em] text-bewild-blue underline underline-offset-4"
              >
                Voltar para todas as tags →
              </a>
            )}

            {posts.length > 0 && (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <article
                    key={p.id}
                    className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_18px_40px_-30px_rgba(10,37,64,0.35)] transition-all hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(0,76,127,0.4)]"
                  >
                    <a href={routes.conteudosPost(p.slug)} className="flex h-full flex-col">
                      <div className="aspect-[16/10] overflow-hidden">
                        <LandingImage
                          src={p.cover_url || undefined}
                          alt={p.cover_alt || p.title}
                          rounded=""
                          className="transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-6">
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-bewild-ink/55">
                          {p.category && (
                            <span className="rounded-full border border-bewild-blue/25 px-2 py-0.5 text-bewild-blue">
                              {p.category}
                            </span>
                          )}
                          {p.published_at && (
                            <time dateTime={p.published_at}>{formatDate(p.published_at)}</time>
                          )}
                          {p.reading_minutes && <span>· {p.reading_minutes} min</span>}
                        </div>
                        <h2 className="font-display text-xl font-semibold leading-snug tracking-tight">
                          {p.title}
                        </h2>
                        {p.excerpt && (
                          <p className="line-clamp-3 text-sm leading-relaxed text-bewild-steel">
                            {p.excerpt}
                          </p>
                        )}
                        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-bewild-blue">
                          Ler artigo
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            )}
          </Container>
        </section>

        <section className="bg-bewild-ink py-[clamp(3.5rem,8vh,5.5rem)] text-white">
          <Container className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl font-display text-2xl font-semibold leading-tight sm:text-3xl">
              Quer ver mais assuntos? <em className="italic text-bewild-blue-400">Explore todas as tags.</em>
            </p>
            <CTAButton href={routes.blogTags} variant="primary">
              Ver todas as tags <ArrowRight className="h-4 w-4" />
            </CTAButton>
          </Container>
        </section>
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </>
  );
}
