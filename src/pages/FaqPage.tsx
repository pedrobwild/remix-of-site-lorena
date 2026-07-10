import { useSeo, breadcrumbJsonLd, faqJsonLd } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import { useFaq } from "../lib/useFaq";
import BewildSiteNav from "@/components/BewildSiteNav";
import SiteFooter from "@/components/SiteFooter";
import { whatsappHref } from "@/components/landing/content";
import "@/styles/bwh-tokens.css";

/**
 * Página pública /faq — copy original preservada, pele do DS bwh.
 * Lê FAQs da tabela `faq_items` (gerenciada via /admin/faq), com fallback.
 * Preserva JSON-LD FAQPage + BreadcrumbList e microdata Schema.org inline.
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
        <section className="bwh-sec" style={{ paddingTop: "clamp(56px,7vw,96px)", paddingBottom: 0 }}>
          <div className="bwh-wrap">
            <p className="bwh-mono" style={{ color: "var(--navyacc)", margin: "0 0 20px" }}>Antes de investir</p>
            <h1 className="bwh-h2" style={{ fontSize: "clamp(38px,5.6vw,78px)", marginBottom: 24 }}>
              Perguntas frequentes.
            </h1>
            <p style={{ color: "var(--ink2)", fontSize: "clamp(16px,1.5vw,19px)", lineHeight: 1.55, maxWidth: 640, margin: 0 }}>
              As dúvidas mais comuns de quem vai transformar um studio em ativo de short stay:
              prazo, garantia, processo e o que está incluso, da obra à entrega pronta pra anunciar.
            </p>
          </div>
        </section>

        <section className="bwh-sec" style={{ paddingTop: "clamp(48px,6vw,80px)" }}>
          <div className="bwh-wrap" style={{ maxWidth: 960 }}>
            <div className="bwh-srlabel">
              <span className="bwh-mono">001 · Tudo que perguntam antes de começar</span>
            </div>
            <div className="bwh-faq" itemScope itemType="https://schema.org/FAQPage">
              {items.map((item, i) => (
                <details key={item.id} open={i === 0} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                  <summary itemProp="name">{item.question}</summary>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text">{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <section className="bwh-sec bwh-sec--dark" aria-label="Solicitar diagnóstico">
        <div className="bwh-wrap" style={{ maxWidth: 900, textAlign: "center" }}>
          <p className="bwh-mono" style={{ color: "var(--dink2)", margin: "0 0 24px" }}>Diagnóstico gratuito · sem compromisso</p>
          <h2 className="bwh-h2" style={{ margin: "0 auto 24px", color: "#fff" }}>
            Não encontrou sua resposta? <em>Vamos conversar.</em>
          </h2>
          <p style={{ color: "var(--dink2)", fontSize: "clamp(16px,1.5vw,19px)", lineHeight: 1.55, maxWidth: 560, margin: "0 auto 32px" }}>
            Manda os dados do seu studio e a gente devolve uma leitura de escopo, projeto e próximos passos.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/diagnostico" className="bwh-btn bwh-btn--invert">Solicitar diagnóstico <span className="bwh-ar">→</span></a>
            <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="bwh-btn bwh-btn--ghostdark">Falar no WhatsApp <span className="bwh-ar">→</span></a>
          </div>
          <p className="bwh-mono" style={{ color: "var(--dink2)", marginTop: 24 }}>+150 studios entregues em São Paulo</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
