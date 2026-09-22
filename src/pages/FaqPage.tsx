import { useSeo, breadcrumbJsonLd, faqJsonLd } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import { useFaq } from "../lib/useFaq";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import { whatsappHref } from "@/components/landing/content";
import "@/styles/bwh-tokens.css";
import "@/styles/bwh-sol-fusion.css";

/**
 * Página pública /faq — copy original preservada, pele do DS bwh.
 * Lê FAQs da tabela `faq_items` (gerenciada via /admin/faq), com fallback.
 * Preserva JSON-LD FAQPage + BreadcrumbList e microdata Schema.org inline.
 */
export default function FaqPage() {
  const { settings } = useSiteSettings();
  const { items } = useFaq();

  useSeo({
    title: "Dúvidas sobre reforma de apartamentos | Bewild",
    description:
      "Tire dúvidas sobre prazo, garantia, contrato e as etapas da reforma completa até a entrega do apartamento pronto pela Bewild.",

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
      <BwaNav />

      <main id="main" tabIndex={-1}>
        {/* padding-top vem do .bwh-sec:first-child (folga da nav fixa) */}
        <section className="bwh-sec" style={{ paddingBottom: 0 }}>
          <div className="bwh-wrap">
            <p className="bwh-mono bwh-label bwh-label--accent" style={{ margin: "0 0 20px" }}>Antes de investir</p>
            <h1 className="bwh-h2" style={{ marginBottom: 24 }}>
              Perguntas frequentes.
            </h1>
            <p className="bwh-lead" style={{ margin: 0 }}>
              As dúvidas mais comuns de quem vai reformar um apartamento com a Bewild:
              prazo, garantia, processo e o que está incluso, da obra à entrega das chaves.
            </p>
          </div>
        </section>

        <section className="bwh-sec" style={{ paddingTop: "clamp(48px,6vw,80px)" }}>
          <div className="bwh-wrap">
            <div className="bwh-srlabel">
              <span className="bwh-mono bwh-label bwh-label--accent">001 · Tudo que perguntam antes de começar</span>
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

      <section className="bwh-sec bwh-sec--dark" aria-label="Solicitar orçamento">
        <div className="bwh-wrap" style={{ maxWidth: 900, textAlign: "center" }}>
          <p className="bwh-mono bwh-label" style={{ color: "var(--dink2)", margin: "0 0 24px", justifyContent: "center" }}>Diagnóstico gratuito · sem compromisso</p>
          <h2 className="bwh-h2" style={{ margin: "0 auto 24px", color: "#fff" }}>
            Não encontrou sua resposta? <em>Vamos conversar.</em>
          </h2>
          <p className="bwh-lead" style={{ margin: "0 auto 32px" }}>
            Manda os dados do seu studio e a gente devolve uma leitura de escopo, projeto e próximos passos.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/diagnostico" className="bwh-btn bwh-btn--invert">Solicitar orçamento <span className="bwh-ar">→</span></a>
            <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="bwh-btn bwh-btn--ghostdark">Falar no WhatsApp <span className="bwh-ar">→</span></a>
          </div>
          <p className="bwh-mono" style={{ color: "var(--dink2)", marginTop: 24 }}>+160 reformas entregues · +200 projetos</p>
        </div>
      </section>

      <BwaFooter />
    </div>
  );
}
