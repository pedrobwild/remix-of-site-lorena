import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { LEGAL_PAGES, type LegalSlug } from "@/content/pages/legal";
import type { LegalLoaderData } from "@/lib/contentLoaders";
import { useSeo } from "@/lib/useSeo";
/* Só post.css: a página usa exclusivamente as classes .bw-post/.pt-*
   (mesmo padrão de /politica-de-cookies e das licenças). */
import "@/styles/post.css";

/**
 * /privacidade e /termos-de-uso — textos editáveis no painel
 * /admin/privacidade-termos, já renderizados no servidor pelo loader da rota.
 */
export default function LegalPage({ slug, content }: { slug: LegalSlug; content?: LegalLoaderData }) {
  const padrao = LEGAL_PAGES[slug];
  useSeo({ ...padrao.seo, canonicalPath: padrao.path, ogType: "website" });

  const title = content?.title ?? padrao.title;
  const intro = content?.intro ?? padrao.intro;

  return (
    <div className="bw-home bw-post">
      <BwaNav />
      <main id="main" tabIndex={-1}>
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">{padrao.eyebrow}</div>
            <h1 className="pt-title">{title}</h1>
            {intro.split(/\n\s*\n/).map((t, i) => (
              <p key={i} className="pt-excerpt">{t}</p>
            ))}
            <div className="pt-meta">
              <span>Última atualização: {padrao.updatedAt}</span>
            </div>
          </div>
        </section>
        <section className="pt-body-section">
          <div className="container">
            {content && content.bodyHtml !== null ? (
              <div className="pt-body" dangerouslySetInnerHTML={{ __html: content.bodyHtml }} />
            ) : (
              <div className="pt-body">
                <p>{padrao.intro}</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <BwaFooter />
    </div>
  );
}
