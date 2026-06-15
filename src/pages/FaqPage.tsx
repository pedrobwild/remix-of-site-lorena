import { useSeo, breadcrumbJsonLd, faqJsonLd } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import { useFaq } from "../lib/useFaq";
import BewildSiteNav from "@/components/BewildSiteNav";
import SiteFooter from "@/components/SiteFooter";
import { whatsappHref } from "@/components/landing/content";
import "@/styles/home.css";
import "@/styles/conteudos.css";
import "@/styles/post.css";

/**
 * Página dedicada /faq — design Bewild (wrapper .bw-home.bw-post).
 * - Reaproveita pt-hero / pt-faq / ct-cta do design system de posts.
 * - Lê FAQs da tabela `faq_items` (gerenciada via /admin/faq).
 * - Mantém JSON-LD FAQPage + BreadcrumbList.
 */
export default function FaqPage() {
  const { settings } = useSiteSettings();
  const { items } = useFaq();

  useSeo({
    title: "Perguntas frequentes sobre reforma turn-key de studios | Bewild",
    description:
      "Tire suas dúvidas sobre a reforma turn-key de studios para short stay em São Paulo: prazos, garantias, como funciona o processo do projeto à entrega pronta para rentabilizar, e contratação.",
    canonicalPath: "/faq",
    ogType: "website",
    jsonLd:
      settings && items.length > 0
        ? [
            breadcrumbJsonLd(settings, [
              { name: "Início", path: "/" },
              { name: "Perguntas frequentes", path: "/faq" },
            ]),
            faqJsonLd(items.map((i) => ({ q: i.question, a: i.answer }))),
          ]
        : undefined,
  });

  return (
    <div className="bw-home bw-post">
      <BewildSiteNav />

      <main id="main" tabIndex={-1}>
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">FAQ · Bewild</div>
            <h1 className="pt-title">Perguntas frequentes.</h1>
            <p className="pt-excerpt">
              Reunimos as dúvidas mais comuns sobre a reforma turn-key de
              studios da Bewild: do projeto à entrega pronta para anunciar,
              prazos, garantias e como funciona o processo, da obra à operação.
            </p>
          </div>
        </section>

        <section className="pt-faq">
          <div className="container">
            <div
              className="pt-faq__inner"
              itemScope
              itemType="https://schema.org/FAQPage"
            >
              {items.map((item) => (
                <details
                  key={item.id}
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                >
                  <summary itemProp="name">{item.question}</summary>
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p itemProp="text">{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <section className="ct-cta">
        <div className="container">
          <div className="eyebrow" style={{ color: "var(--sky, #5FB2DD)" }}>
            Diagnóstico
          </div>
          <h2>Não encontrou sua resposta? Vamos conversar.</h2>
          <p>
            Envie os dados do seu studio e receba uma análise inicial de
            escopo, projeto e próximos passos. Sem compromisso.
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
