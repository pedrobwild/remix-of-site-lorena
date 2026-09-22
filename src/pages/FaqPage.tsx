import { useRef, useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/ga4";
import { breadcrumbJsonLd, faqJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./faq-page.css";

type RespostaIa = {
  resposta: string;
  pontos: string[];
  proximo_passo: string;
  fora_do_escopo: boolean;
};

/* ============================================================
 * FaqPage — /faq
 * Mesmas perguntas e respostas do bloco "FAQ · 09" da home,
 * com a mesma linguagem visual (.bwa). Copy travada pelo CEO:
 * qualquer mudança de texto precisa acontecer aqui E na home.
 * ============================================================ */

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "O que é uma reforma turnkey?",
    a: "Turnkey quer dizer chave na mão. Você assina um contrato, a gente executa tudo e devolve o imóvel pronto para usar. É o modelo da Bewild desde o primeiro projeto.",
  },
  {
    q: "O que vocês chamam de contrato fechado?",
    a: "Preço e prazo definidos e assinados antes de a obra começar. Se o valor ultrapassar o combinado, a diferença é por nossa conta.",
  },
  {
    q: "Vocês só reformam para Airbnb?",
    a: "Não. Reformamos para morar, para alugar em curta ou longa temporada e para vender. O projeto muda conforme o objetivo.",
  },
  {
    q: "Preciso ir à obra?",
    a: "Só se você quiser. Todo o acompanhamento acontece pelo Bwild Workflow. E moradores de fora de São Paulo contam com vistoria por procuração, ligação de energia e instalação de internet feitas pela gente.",
  },
  {
    q: "Quanto tempo leva uma reforma?",
    a: "A maioria fica pronta em torno de 60 dias úteis. A sua data exata sai definida no contrato, antes de a obra começar.",
  },
  {
    q: "Onde vocês atuam?",
    a: "Atendemos São Paulo capital, com obras entregues em mais de 27 bairros. Seu imóvel está fora dessa região? Manda mesmo assim: a gente avalia caso a caso.",
  },
];

export default function FaqPage() {
  const { settings } = useSiteSettings();
  const [aberto, setAberto] = useState(0);
  const [pergunta, setPergunta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erroIa, setErroIa] = useState<string | null>(null);
  const [respostaIa, setRespostaIa] = useState<RespostaIa | null>(null);
  const respostaRef = useRef<HTMLDivElement>(null);

  async function perguntar(e: React.FormEvent) {
    e.preventDefault();
    if (carregando) return;
    const texto = pergunta.trim();
    if (texto.length < 8) {
      setErroIa("Escreva sua pergunta com um pouco mais de detalhe.");
      return;
    }
    setErroIa(null);
    setCarregando(true);
    trackEvent("faq_ai_question", { location: "faq" });

    try {
      const { data, error } = await supabase.functions.invoke("faq-answer", {
        body: { pergunta: texto },
      });
      const payload = data as { resposta?: RespostaIa; error?: string } | null;
      if (error || !payload?.resposta) {
        setErroIa(
          payload?.error ||
            "Não conseguimos responder agora. Tente de novo em instantes ou fale com a gente no WhatsApp.",
        );
        return;
      }
      setRespostaIa(payload.resposta);
      trackEvent("faq_ai_answer", { location: "faq" });
      window.setTimeout(() => {
        respostaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 60);
    } catch {
      setErroIa("Não conseguimos responder agora. Tente de novo em instantes.");
    } finally {
      setCarregando(false);
    }
  }


  useSeo({
    title: "Perguntas frequentes sobre reforma de apartamentos | Bewild",
    description:
      "Tire dúvidas sobre prazo, garantia, contrato fechado e as etapas da reforma completa até a entrega do apartamento pronto pela Bewild em São Paulo.",
    canonicalPath: "/faq",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Perguntas frequentes", path: "/faq" },
          ]),
          faqJsonLd(FAQ_ITEMS.map((i) => ({ q: i.q, a: i.a }))),
        ]
      : undefined,
  });

  return (
    <div className="bwa-faqpage">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-faqpage-intro">
          <div className="bwa-shell bwa-faq-head bwa-faqpage-head">
            <p className="bwa-label">FAQ</p>
            <div>
              <h1 className="bwa-title">Perguntas antes de entregar a chave.</h1>
              <p className="bwa-faqpage-lead">
                As dúvidas mais comuns de quem vai reformar um apartamento com a
                Bewild: prazo, garantia, contrato e o que está incluso, da obra
                à entrega das chaves.
              </p>
            </div>
          </div>

          <div className="bwa-shell">
            <div className="bwa-faq-list" itemScope itemType="https://schema.org/FAQPage">
              {FAQ_ITEMS.map((item, i) => {
                const open = aberto === i;
                return (
                  <article
                    key={item.q}
                    className={`bwa-faq-item${open ? " bwa-open" : ""}`}
                    itemScope
                    itemProp="mainEntity"
                    itemType="https://schema.org/Question"
                  >
                    <h2 className="bwa-faqpage-q">
                      <button
                        className="bwa-faq-question"
                        type="button"
                        aria-expanded={open}
                        aria-controls={`faq-resposta-${i}`}
                        onClick={() => setAberto(open ? -1 : i)}
                      >
                        <span className="bwa-faq-num">{String(i + 1).padStart(2, "0")}</span>
                        <strong itemProp="name">{item.q}</strong>
                        <span className="bwa-faq-icon" aria-hidden="true" />
                      </button>
                    </h2>
                    <div
                      id={`faq-resposta-${i}`}
                      className="bwa-faq-answer"
                      itemScope
                      itemProp="acceptedAnswer"
                      itemType="https://schema.org/Answer"
                    >
                      <p itemProp="text">{item.a}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bwa-faqpage-cta" aria-label="Solicitar orçamento">
          <div className="bwa-shell bwa-faqpage-cta-grid">
            <h2>
              Não encontrou sua resposta? <em>Vamos conversar.</em>
            </h2>
            <div className="bwa-faqpage-cta-actions">
              <a className="bwa-button bwa-button-light" href="/diagnostico" data-cta="faq-cta">
                Solicitar orçamento <span aria-hidden="true">→</span>
              </a>
              <a
                className="bwa-faqpage-whats"
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar no WhatsApp <span aria-hidden="true">→</span>
              </a>
              <p className="bwa-faqpage-cta-note">+160 reformas entregues · +200 projetos</p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
