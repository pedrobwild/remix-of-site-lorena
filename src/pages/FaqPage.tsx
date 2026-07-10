import { useSeo, breadcrumbJsonLd, faqJsonLd } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import { useFaq } from "../lib/useFaq";
import BewildSiteNav from "@/components/BewildSiteNav";
import SiteFooter from "@/components/SiteFooter";
import { whatsappHref } from "@/components/landing/content";
import "@/styles/bwh-tokens.css";
import "@/styles/faq.css";

/**
 * Página pública /faq — reskin sob o DS `bwh-` (tokens compartilhados).
 * Copy, perguntas, JSON-LD FAQPage + BreadcrumbList e microdata Schema.org
 * preservados sem qualquer alteração. Apenas troca de pele visual.
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
    <div className="bwh">
      <BewildSiteNav />

      <main id="main" tabIndex={-1}>
        {/* HERO editorial claro */}
        <section className="bwh-sec" style={{ paddingBottom: 0 }}>
          <div className="bwh-wrap">
            <div className="bwh-srlabel" style={{ borderTop: 0, paddingTop: 0 }}>
              <span className="bwh-mono">FAQ · Antes de investir</span>
              <span className="bwh-mono">
                {String(items.length).padStart(2, "0")} perguntas
              </span>
            </div>
            <h1
              className="bwh-h2"
              style={{ fontSize: "clamp(38px, 5.6vw, 78px)", marginBottom: 24 }}
            >
              Perguntas frequentes.
            </h1>
            <p
              style={{
                color: "var(--ink2)",
                fontSize: "clamp(16px,1.5vw,19px)",
                lineHeight: 1.55,
                maxWidth: 640,
                margin: 0,
              }}
            >
              As dúvidas mais comuns de quem vai transformar um studio em ativo de short stay:
              prazo, garantia, processo e o que está incluso, da obra à entrega pronta pra anunciar.
            </p>
          </div>
        </section>

        {/* BODY — acordeão bwh-faq */}
        <section className="bwh-sec">
          <div className="bwh-wrap" style={{ maxWidth: 920 }}>
            <div className="bwh-srlabel">
              <span className="bwh-mono">001 · Tudo que perguntam antes de começar</span>
            </div>

            <div className="bwh-faq" itemScope itemType="https://schema.org/FAQPage">
              {items.map((item, i) => (
                <details
                  key={item.id}
                  open={i === 0}
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

        {/* CTA final */}
        <section className="bwh-sec bwh-sec--dark">
          <div className="bwh-wrap" style={{ maxWidth: 900, textAlign: "center" }}>
            <div
              className="bwh-mono"
              style={{ color: "var(--dink2)", marginBottom: 24 }}
            >
              Diagnóstico gratuito · sem compromisso
            </div>
            <h2
              className="bwh-h2"
              style={{
                margin: "0 auto 24px",
                color: "#fff",
                fontSize: "clamp(30px,5vw,56px)",
              }}
            >
              Não encontrou sua resposta? <em>Vamos conversar.</em>
            </h2>
            <p
              style={{
                color: "var(--dink2)",
                fontSize: "clamp(16px,1.5vw,19px)",
                lineHeight: 1.55,
                maxWidth: 560,
                margin: "0 auto 32px",
              }}
            >
              Manda os dados do seu studio e a gente devolve uma leitura de escopo, projeto e próximos passos.
            </p>
            <div
              style={{
                display: "flex",
                gap: 14,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <a href="/diagnostico" className="bwh-btn bwh-btn--invert">
                Solicitar diagnóstico <span className="bwh-ar">→</span>
              </a>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="bwh-btn bwh-btn--ghostdark"
              >
                Falar no WhatsApp <span className="bwh-ar">→</span>
              </a>
            </div>
            <div
              className="bwh-mono"
              style={{ color: "var(--dink2)", marginTop: 24 }}
            >
              +150 studios entregues em São Paulo
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
