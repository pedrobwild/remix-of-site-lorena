import { useSeo, breadcrumbJsonLd, faqJsonLd } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import { useFaq } from "../lib/useFaq";
import BewildSiteNav from "@/components/BewildSiteNav";
import SiteFooter from "@/components/SiteFooter";
import { whatsappHref } from "@/components/landing/content";
import "@/styles/faq.css";

/**
 * Página pública /faq — "índice de dúvidas" (prancha 05).
 * - Acordeão numerado, CSS isolado em .bw-faq.
 * - Lê FAQs da tabela `faq_items` (gerenciada via /admin/faq), com fallback.
 * - Preserva JSON-LD FAQPage + BreadcrumbList e microdata Schema.org inline.
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
    <div className="bw-faq">
      <BewildSiteNav />

      <div className="bw-faq__frame" aria-hidden="true">
        <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
      </div>
      <div className="bw-faq__titleblock" aria-hidden="true">BEWILD · GRUPO BWILD<br /><b>BW—005 / FAQ</b><br />SÃO PAULO · BR</div>
      <div className="bw-faq__sheetno" aria-hidden="true">SHEET 05 / DÚVIDAS</div>

      <main id="main" tabIndex={-1}>
        {/* HERO */}
        <section className="fq-hero">
          <div className="fq-wrap">
            <p className="fq-eyb">Antes de investir</p>
            <h1>Perguntas frequentes.</h1>
            <p className="fq-lead">
              As dúvidas mais comuns de quem vai transformar um studio em ativo de short stay:
              prazo, garantia, processo e o que está incluso, da obra à entrega pronta pra anunciar.
            </p>
          </div>
        </section>

        {/* BODY */}
        <section className="fq-body">
          <div className="fq-wrap">
            <div className="fq-secmark">
              <span className="n">001</span>
              <span className="t">Tudo que perguntam antes de começar</span>
              <span className="ln" />
            </div>

            <div className="fq-list" itemScope itemType="https://schema.org/FAQPage">
              {items.map((item, i) => (
                <details
                  key={item.id}
                  className="fq-item"
                  open={i === 0}
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                >
                  <summary className="fq-q" itemProp="name">{item.question}</summary>
                  <div
                    className="fq-a"
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

      {/* CTA */}
      <section className="fq-cta">
        <div className="gridbg" aria-hidden="true" />
        <div className="fq-wrap">
          <div className="fq-cta__inner">
            <span className="fq-eyb center">Diagnóstico gratuito · sem compromisso</span>
            <h2>Não encontrou sua resposta? <i>Vamos conversar.</i></h2>
            <p>Manda os dados do seu studio e a gente devolve uma leitura de escopo, projeto e próximos passos.</p>
            <div className="fq-cta__act">
              <a href="/diagnostico" className="fq-btn cyan">Solicitar diagnóstico <span className="ar">→</span></a>
              <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="fq-btn ghost">Falar no WhatsApp</a>
            </div>
            <div className="fq-cta__rea">+150 studios entregues em São Paulo</div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
