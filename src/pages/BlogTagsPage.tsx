import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { Container, CTAButton } from "../components/landing/primitives";
import { useBlogTags } from "../lib/useBlog";
import { useSiteSettings } from "../lib/useSiteSettings";
import { useSeo, breadcrumbJsonLd, organizationJsonLd } from "../lib/useSeo";
import { routes } from "../lib/useHashRoute";
import { track } from "../lib/analytics";

export default function BlogTagsPage() {
  const { tags, loading, error } = useBlogTags();
  const { settings } = useSiteSettings();
  const base = (settings?.seo_canonical_base || "https://bewild.com.br").replace(/\/$/, "");

  useSeo({
    title: "Tags · Conteúdos BeWild — Reforma turn-key de studios em SP",
    description:
      "Explore os conteúdos BeWild organizados por assunto: reforma turn-key, studios, short stay, marcenaria, prazo de obra, orçamento e processo.",
    canonicalPath: "/conteudos/tags",
    ogType: "website",
    jsonLd: settings
      ? [
          organizationJsonLd(settings),
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Conteúdos", path: "/conteudos" },
            { name: "Tags", path: "/conteudos/tags" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Tags · Conteúdos BeWild",
            url: `${base}/conteudos/tags`,
            hasPart: tags.map((t) => ({
              "@type": "DefinedTerm",
              name: t.label,
              url: `${base}/conteudos/tag/${t.slug}`,
            })),
          },
        ]
      : undefined,
  });

  useEffect(() => {
    track("blog_tags_view");
  }, []);

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="bg-[#FBFAF8] text-bewild-ink">
        <section className="border-b border-bewild-ink/10 bg-white">
          <Container className="pb-14 pt-32 sm:pb-20 sm:pt-40">
            <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.28em] text-bewild-blue-600">
              <span className="mr-2 inline-block h-px w-6 align-middle bg-bewild-blue-600 opacity-60" />
              Conteúdos · Tags
            </p>
            <h1 className="mt-5 max-w-[16em] font-display text-[clamp(2.1rem,4.5vw,3.6rem)] font-semibold leading-[1.08] tracking-tight">
              Encontre conteúdos por <em className="italic text-bewild-blue">assunto</em>.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-bewild-steel sm:text-lg">
              Um índice vivo dos temas que atravessam os conteúdos BeWild — de quem está
              avaliando um imóvel para short stay a quem quer entender o passo a passo da obra
              turn-key, prazos, orçamento, marcenaria e operação.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bewild-steel/85">
              Use os atalhos abaixo para começar pelo assunto que mais te interessa — ou volte
              para o{" "}
              <a
                href={routes.conteudos}
                className="text-bewild-blue underline decoration-bewild-blue/40 underline-offset-4 hover:decoration-bewild-blue"
              >
                índice cronológico
              </a>
              .
            </p>
          </Container>
        </section>

        <section aria-label="Tags" className="py-[clamp(3rem,7vh,4.5rem)]">
          <Container>
            {loading && (
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-bewild-ink/45">
                carregando…
              </p>
            )}

            {!loading && error && (
              <p role="alert" className="font-mono text-xs uppercase tracking-[0.2em] text-bewild-ink/70">
                Não foi possível carregar as tags agora.{" "}
                <button
                  type="button"
                  className="underline decoration-bewild-blue/40 underline-offset-4 hover:text-bewild-blue"
                  onClick={() => window.location.reload()}
                >
                  Tentar novamente →
                </button>
              </p>
            )}

            {!loading && !error && tags.length === 0 && (
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-bewild-ink/55">
                Em breve, novos artigos com novos temas.
              </p>
            )}

            <ul className="flex flex-wrap gap-3">
              {tags.map((t) => (
                <li key={t.slug}>
                  <a
                    href={routes.blogTag(t.slug)}
                    aria-label={`Ver artigos com a tag ${t.label} (${t.count})`}
                    onClick={() =>
                      track("blog_tag_click", { value: { from: "tags-index", tag: t.slug } })
                    }
                    className="group inline-flex items-center gap-3 rounded-full border border-bewild-ink/15 bg-white px-5 py-2.5 transition-all hover:-translate-y-0.5 hover:border-bewild-blue/60 hover:shadow-[0_14px_30px_-18px_rgba(0,76,127,0.4)]"
                  >
                    <span className="font-display text-base font-medium text-bewild-ink group-hover:text-bewild-blue">
                      #{t.label}
                    </span>
                    <span className="rounded-full bg-[#F2EEE5] px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-bewild-ink/60">
                      {t.count}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {!loading && tags.length > 0 && (
          <section className="border-y border-bewild-ink/10 bg-white py-[clamp(3rem,7vh,4.5rem)]">
            <Container>
              <h2 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
                Como navegar pelos conteúdos
              </h2>
              <p className="mt-3 max-w-2xl text-bewild-steel">
                Três caminhos comuns para começar — escolha o que mais se aproxima do seu momento.
              </p>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <GuideCard
                  title="Vai investir em short stay?"
                  body={
                    <>
                      Comece pelas tags{" "}
                      <TagLink slug="short-stay" label="short-stay" /> e{" "}
                      <TagLink slug="rentabilidade" label="rentabilidade" /> para entender
                      como decisões de projeto impactam diária e ocupação.
                    </>
                  }
                />
                <GuideCard
                  title="Está pesquisando processo?"
                  body={
                    <>
                      Os textos em <TagLink slug="turn-key" label="turn-key" /> e{" "}
                      <TagLink slug="obra" label="obra" /> mostram prazos, escopo e como
                      funciona o portal de acompanhamento.
                    </>
                  }
                />
                <GuideCard
                  title="Quer entender orçamento?"
                  body={
                    <>
                      Acompanhe <TagLink slug="orcamento" label="orcamento" /> e{" "}
                      <TagLink slug="marcenaria" label="marcenaria" /> — onde o custo
                      realmente mora numa reforma de studio.
                    </>
                  }
                />
              </div>
              <p className="mt-8 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-bewild-ink/55">
                Tem um tema que gostaria de ver?{" "}
                <a href={routes.diagnostico} className="text-bewild-blue underline underline-offset-4">
                  Escreva pra gente
                </a>
                .
              </p>
            </Container>
          </section>
        )}

        <section className="bg-bewild-ink py-[clamp(3.5rem,8vh,5.5rem)] text-white">
          <Container className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl font-display text-2xl font-semibold leading-tight sm:text-3xl">
              Procurando algo específico?{" "}
              <em className="italic text-bewild-blue-400">Conversemos.</em>
            </p>
            <CTAButton href={routes.diagnostico} variant="primary">
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

function GuideCard({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-bewild-ink/10 bg-[#FBFAF8] p-6">
      <h3 className="font-display text-lg font-semibold leading-snug">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-bewild-steel">{body}</p>
    </div>
  );
}

function TagLink({ slug, label }: { slug: string; label: string }) {
  return (
    <a
      href={routes.blogTag(slug)}
      className="font-mono text-[0.78em] uppercase tracking-[0.12em] text-bewild-blue underline decoration-bewild-blue/40 underline-offset-2 hover:decoration-bewild-blue"
    >
      #{label}
    </a>
  );
}
