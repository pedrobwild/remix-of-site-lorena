import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import LpStudioLeadForm from "@/components/LpStudioLeadForm";
import MobileQuoteBar from "@/components/MobileQuoteBar";
import { whatsappHref } from "@/components/landing/content";
import { useSeo } from "@/lib/useSeo";
import { useCtaClickTracking } from "@/lib/trackCta";
import { useLpView } from "@/lib/lpView";
import "./servico-reforma.css";
import "./lp-reforma-studio.css";
import {
  LP_CONTRATO,
  LP_DESCRIPTION,
  LP_FOTO_HERO,
  LP_FOTOS,
  LP_HERO,
  LP_NUMEROS,
  LP_PATH,
  LP_PLANTA_ITENS,
  LP_TITLE,
  lpSlide,
  type LpVariante,
} from "@/content/pages/lp-reforma-de-studio-sao-paulo";

/* ============================================================
 * LpReformaStudioPage — /lp/reforma-de-studio-sao-paulo
 * Página de destino dos anúncios do Google (handoff 02/11/2026, opção 1a:
 * formulário no topo). Noindex, fora do sitemap; a página orgânica
 * /reforma-de-studio-sao-paulo continua como está.
 *
 * Cinco blocos: hero com formulário · fotos · o que entra no preço fechado ·
 * a reforma começa antes das chaves (navy) · CTA final. Sem FAQ, tabela de
 * preço, bairros nem imprensa, de propósito.
 *
 * Ordem no DOM = ordem no celular: texto → formulário → foto. No desktop a
 * grade coloca a foto sob o texto e o formulário à direita (sem `order`: a
 * foto não recebe foco, então a ordem de tabulação continua a do DOM).
 * ============================================================ */

const WHATSAPP_TEXT = "Olá! Quero um orçamento de reforma de studio em São Paulo.";

type Props = { variante?: LpVariante };

export default function LpReformaStudioPage({ variante = "investidor" }: Props = {}) {
  useCtaClickTracking("lp-reforma-studio-sp");
  useLpView(variante);
  const hero = LP_HERO[variante];
  const heroFoto = lpSlide(LP_FOTO_HERO.slide);

  useSeo({
    title: LP_TITLE,
    description: LP_DESCRIPTION,
    canonicalPath: LP_PATH,
    ogType: "website",
    noindex: true,
  });

  return (
    <div className="bwa-servico bwa-lp-studio">
      <BwaNav ctaHref="#orcamento" />

      <main id="main" tabIndex={-1}>
        <section className="bwa-lp-hero" aria-labelledby="lp-titulo">
          <div className="bwa-shell bwa-lp-hero-grid">
            <div className="bwa-lp-hero-copy">
              <p className="bwa-label bwa-label-accent">Reforma de studio em São Paulo</p>
              <h1 className="bwa-title" id="lp-titulo">
                {hero.h1} <em>{hero.destaque}</em>
              </h1>
              <p className="bwa-servico-lead">{hero.lead}</p>
              <ul className="bwa-lp-numeros" aria-label="Números da Bewild">
                {LP_NUMEROS.map((n) => (
                  <li key={n.legenda}>
                    <strong>
                      {n.valor}
                      {n.sufixo && <small>{n.sufixo}</small>}
                    </strong>
                    <span>{n.legenda}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bwa-lp-form-card" id="orcamento">
              <LpStudioLeadForm variante={variante} />
            </div>

            <figure className="bwa-lp-hero-foto">
              <img
                src={heroFoto.src}
                srcSet={heroFoto.srcset}
                sizes="(max-width: 999px) calc(100vw - 44px), 56vw"
                width={heroFoto.width}
                height={heroFoto.height}
                alt={LP_FOTO_HERO.alt}
                fetchPriority="high"
                decoding="async"
              />
              <figcaption>{LP_FOTO_HERO.legenda}</figcaption>
            </figure>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="lp-fotos">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="lp-fotos">Studios entregues prontos para anunciar</h2>
            <ul className="bwa-lp-fotos">
              {LP_FOTOS.map((f) => {
                const s = lpSlide(f.slide);
                return (
                  <li key={f.slide}>
                    <figure>
                      <img
                        src={s.src}
                        srcSet={s.srcset}
                        sizes="(max-width: 819px) calc(50vw - 30px), 30vw"
                        width={s.width}
                        height={s.height}
                        alt={f.alt}
                        loading="lazy"
                        decoding="async"
                      />
                      <figcaption>{f.legenda}</figcaption>
                    </figure>
                  </li>
                );
              })}
            </ul>
            <p className="bwa-lp-fotos-link">
              <a href="/portfolio" data-cta="lp-studio-portfolio">
                Ver portfólio completo <span aria-hidden="true">→</span>
              </a>
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="lp-contrato">
          <div className="bwa-shell bwa-lp-split">
            <h2 className="bwa-servico-h2" id="lp-contrato">O que entra no preço fechado</h2>
            <ul className="bwa-servico-list">
              {LP_CONTRATO.map((item) => (
                <li key={item.n}>
                  <span className="bwa-servico-num">{item.n}</span>
                  <span>{item.t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bwa-servico-remoto" aria-labelledby="lp-planta">
          <div className="bwa-shell bwa-lp-split">
            <div>
              <p className="bwa-label bwa-lp-label-light">Comprou na planta?</p>
              <h2 className="bwa-servico-h2" id="lp-planta">A reforma começa antes das chaves</h2>
            </div>
            <div>
              <p className="bwa-servico-text">
                Projeto 3D e proposta são feitos antes da entrega do imóvel. A obra começa 5 dias úteis depois do
                projeto aprovado e da autorização do condomínio, e a data de entrega fica escrita no contrato. Quem
                mora fora de São Paulo acompanha tudo à distância:
              </p>
              <ul className="bwa-servico-list">
                {LP_PLANTA_ITENS.map((item) => (
                  <li key={item.n}>
                    <span className="bwa-servico-num">{item.n}</span>
                    <span>{item.t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bwa-servico-cta" aria-label="Solicitar orçamento">
          <div className="bwa-shell bwa-servico-cta-grid">
            <h2>
              Seu studio é em São Paulo? <em>O resto é com a gente.</em>
            </h2>
            <div className="bwa-servico-cta-actions">
              <a className="bwa-button bwa-button-light" href="#orcamento" data-cta="lp-studio-cta-final">
                Receber orçamento <span aria-hidden="true">→</span>
              </a>
              <a className="bwa-servico-whats" href={whatsappHref(WHATSAPP_TEXT)} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp <span aria-hidden="true">→</span>
              </a>
              <p className="bwa-servico-cta-note">Sem custo e sem compromisso · retorno em até 1 dia útil</p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
      <MobileQuoteBar cta="lp-studio-barra" href="#orcamento" hideWhenVisible="#orcamento" />
    </div>
  );
}
