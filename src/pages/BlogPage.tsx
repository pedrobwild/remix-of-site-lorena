import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { Container, CTAButton, LandingImage } from "../components/landing/primitives";
import { useBlogPosts } from "../lib/useBlog";
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

export default function BlogPage() {
  const { posts, loading, error } = useBlogPosts();
  const { settings } = useSiteSettings();
  const [activeCat, setActiveCat] = useState<string>("Todos");

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.category && set.add(p.category));
    return ["Todos", ...Array.from(set)];
  }, [posts]);

  const filtered = useMemo(
    () => (activeCat === "Todos" ? posts : posts.filter((p) => p.category === activeCat)),
    [posts, activeCat]
  );

  useSeo({
    title: "Conteúdos — BeWild · Reforma turn-key de studios em São Paulo",
    description:
      "Guias, bastidores e cases sobre como transformar imóveis crus em studios prontos para operar em São Paulo. Conteúdo prático para investidores e proprietários.",
    canonicalPath: "/conteudos",
    ogType: "website",
    jsonLd: settings
      ? [
          organizationJsonLd(settings),
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Conteúdos", path: "/conteudos" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Conteúdos · BeWild",
            url: `${(settings.seo_canonical_base || "https://bewild.com.br").replace(/\/$/, "")}/conteudos`,
            description:
              "Guias e cases sobre reforma turn-key de studios em São Paulo.",
            publisher: { "@type": "Organization", name: "BeWild" },
            blogPost: posts.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: `${(settings.seo_canonical_base || "https://bewild.com.br").replace(/\/$/, "")}/conteudos/${p.slug}`,
              datePublished: p.published_at ?? p.created_at,
              image: p.cover_url ?? undefined,
            })),
          },
        ]
      : undefined,
  });

  useEffect(() => {
    track("blog_index_view");
  }, []);

  const [lead, ...rest] = filtered;

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="bg-[#FBFAF8] text-bewild-ink">
        {/* HERO */}
        <section className="border-b border-bewild-ink/10 bg-white">
          <Container className="pb-14 pt-32 sm:pb-20 sm:pt-40">
            <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.28em] text-bewild-blue-600">
              <span className="mr-2 inline-block h-px w-6 align-middle bg-bewild-blue-600 opacity-60" />
              Conteúdos BeWild
            </p>
            <h1 className="mt-5 max-w-[15em] font-display text-[clamp(2.3rem,5vw,4rem)] font-semibold leading-[1.06] tracking-tight">
              Como transformar imóveis crus em
              <br />
              <span className="italic text-bewild-blue">studios prontos para operar.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-bewild-steel sm:text-lg">
              Guias práticos, bastidores de obra e cases reais do nosso processo turn-key em
              São Paulo. Conteúdo escrito para quem decide projetos, não para preencher página.
            </p>
          </Container>
        </section>

        {/* FILTROS DE CATEGORIA */}
        {!loading && !error && posts.length > 0 && (
          <section className="border-b border-bewild-ink/10 bg-[#FBFAF8]">
            <Container className="py-5">
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((c) => {
                  const active = c === activeCat;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveCat(c)}
                      className={`rounded-full border px-4 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.22em] transition-all ${
                        active
                          ? "border-bewild-blue bg-bewild-blue text-white"
                          : "border-bewild-ink/15 bg-white text-bewild-ink hover:border-bewild-blue/50 hover:text-bewild-blue"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
                <a
                  href={routes.blogTags}
                  className="ml-auto font-mono text-[0.6rem] uppercase tracking-[0.22em] text-bewild-blue-600 hover:text-bewild-blue"
                >
                  Navegar por tags →
                </a>
              </div>
            </Container>
          </section>
        )}

        {/* GRID */}
        <section aria-label="Artigos" className="py-[clamp(3rem,8vh,5rem)]">
          <Container>
            {loading && (
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-bewild-ink/45">
                carregando…
              </p>
            )}

            {!loading && error && (
              <p role="alert" className="font-mono text-xs uppercase tracking-[0.2em] text-bewild-ink/70">
                Não foi possível carregar os artigos agora.{" "}
                <button
                  type="button"
                  className="underline decoration-bewild-blue/40 underline-offset-4 hover:text-bewild-blue"
                  onClick={() => window.location.reload()}
                >
                  Tentar novamente →
                </button>
              </p>
            )}

            {!loading && !error && filtered.length === 0 && (
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-bewild-ink/55">
                Em breve, novos artigos nesta categoria.
              </p>
            )}

            {/* LEAD card */}
            {lead && (
              <a
                href={routes.conteudosPost(lead.slug)}
                className="group block overflow-hidden rounded-3xl bg-white shadow-[0_30px_60px_-40px_rgba(10,37,64,0.35)] transition-shadow hover:shadow-[0_40px_80px_-30px_rgba(0,76,127,0.45)]"
              >
                <div className="grid md:grid-cols-[1.2fr_1fr]">
                  <div className="aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[420px]">
                    <LandingImage
                      src={lead.cover_url || undefined}
                      alt={lead.cover_alt || lead.title}
                      rounded=""
                      loading="eager"
                      className="transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-5 p-8 sm:p-12">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-bewild-ink/55">
                      {lead.category && (
                        <span className="rounded-full border border-bewild-blue/30 px-2.5 py-1 text-bewild-blue">
                          {lead.category}
                        </span>
                      )}
                      {lead.published_at && (
                        <time dateTime={lead.published_at}>{formatDate(lead.published_at)}</time>
                      )}
                      {lead.reading_minutes && <span>· {lead.reading_minutes} min</span>}
                    </div>
                    <h2 className="font-display text-[clamp(1.7rem,3vw,2.4rem)] font-semibold leading-[1.1] tracking-tight">
                      {lead.title}
                      {lead.subtitle && (
                        <em className="block text-xl font-normal italic text-bewild-blue sm:text-2xl">
                          {lead.subtitle}
                        </em>
                      )}
                    </h2>
                    {lead.excerpt && (
                      <p className="text-base leading-relaxed text-bewild-steel">{lead.excerpt}</p>
                    )}
                    <span className="inline-flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-bewild-blue">
                      Ler artigo
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </a>
            )}

            {/* GRID restante */}
            {rest.length > 0 && (
              <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
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
                        </div>
                        <h3 className="font-display text-xl font-semibold leading-snug tracking-tight">
                          {p.title}
                        </h3>
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

        {/* CTA FINAL */}
        <section className="bg-bewild-ink py-[clamp(3.5rem,8vh,5.5rem)] text-white">
          <Container className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-bewild-blue-400">
                Próximo passo
              </p>
              <p className="mt-3 font-display text-2xl font-semibold leading-tight sm:text-3xl">
                Tem um imóvel em mente? <em className="italic text-bewild-blue-400">Vamos diagnosticar.</em>
              </p>
            </div>
            <CTAButton href={routes.diagnostico} variant="primary" onClick={() => track("click_cta", { value: { label: "diagnostico", from: "blog-index" } })}>
              Solicitar diagnóstico <ArrowRight className="h-4 w-4" />
            </CTAButton>
          </Container>
        </section>
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </>
  );
}
