import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
import { whatsappHref } from "@/components/landing/content";
import { MANUTENCAO, FAQ } from "@/content/pages/servicos";
import { MANUTENCAO_DESCRIPTION, MANUTENCAO_PATH, MANUTENCAO_TITLE } from "@/content/pages/manutencao.seo";
import { useSeo } from "@/lib/useSeo";
import { useCtaClickTracking } from "@/lib/trackCta";
import "./servico-reforma.css";
import "./servicos.css";
import "./manutencao.css";

export default function ManutencaoPreventivaPage() {
  useCtaClickTracking(MANUTENCAO_PATH);
  useSeo({ title: MANUTENCAO_TITLE, description: MANUTENCAO_DESCRIPTION, canonicalPath: MANUTENCAO_PATH, ogType: "website" });
  const perguntas = FAQ.filter((item) => /plano/i.test(item.q));
  const contato = whatsappHref(MANUTENCAO.whatsappTexto);
  return (
    <div className="bw-home bwa-servico">
      <BwaNav />
      <main id="main" tabIndex={-1}>
        <section className="bwa-manut-intro" aria-labelledby="manutencao-titulo">
          <div className="bwa-shell">
            <p className="bwa-label bwa-label-accent">Bewild · {MANUTENCAO.nome}</p>
            <h1 className="bwa-title" id="manutencao-titulo">Manutenção preventiva de studios em São Paulo</h1>
            <p className="bwa-servico-lead">{MANUTENCAO.resumo}</p>
            <p className="bwa-manut-price">{MANUTENCAO.precoTexto}</p>
            <p className="bwa-svcs-manut-regras">{MANUTENCAO.regras}</p>
            <a className="bwa-button" href={contato} target="_blank" rel="noopener noreferrer" data-cta="manutencao-topo-whatsapp">
              Proteger meu studio <span aria-hidden="true">→</span><span className="sr-only"> (abre o WhatsApp em nova aba)</span>
            </a>
          </div>
        </section>
        <figure className="bwa-shell bwa-manut-media">
          <img src="/images/hero-slides/varanda-barril-md.jpg" alt="Studio com poltronas de couro caramelo, barril de madeira, parede de tijolinhos e varanda envidraçada" width="1280" height="720" decoding="async" />
          <figcaption>Studio em São Paulo · ambientes Bewild</figcaption>
        </figure>
        <section className="bwa-servico-block" aria-labelledby="plano-escopo">
          <div className="bwa-shell">
            <p className="bwa-label bwa-label-accent">O que entra no plano</p>
            <h2 className="bwa-servico-h2" id="plano-escopo">Ar-condicionado, elétrica, hidráulica e vedações</h2>
            <div className="bwa-manut-frentes">
              {MANUTENCAO.frentes.map((frente) => <div key={frente.n}><span className="bwa-label">{frente.n}</span><h3>{frente.titulo}</h3><p className="bwa-servico-text">{frente.t}</p></div>)}
            </div>
            <p className="bwa-servico-text">{MANUTENCAO.apoio}</p>
            <dl className="bwa-svcs-provas bwa-svcs-manut-condicoes" aria-label="Condições do plano">
              {MANUTENCAO.condicoes.map((condicao) => <div key={condicao.valor}><dt>{condicao.valor}</dt><dd>{condicao.rotulo}</dd></div>)}
            </dl>
          </div>
        </section>
        <section className="bwa-servico-block" aria-labelledby="plano-conta">
          <div className="bwa-shell bwa-svcs-manut-conta">
            <h2 className="bwa-servico-h2" id="plano-conta">{MANUTENCAO.simulacao.titulo}</h2>
            <dl>{MANUTENCAO.simulacao.itens.map((item) => <div key={item.valor}><dt>{item.valor}</dt><dd>{item.rotulo}</dd></div>)}</dl>
            <p className="bwa-svcs-manut-regras">{MANUTENCAO.simulacao.nota}</p>
          </div>
        </section>
        <section className="bwa-servico-block" aria-labelledby="plano-perguntas">
          <div className="bwa-shell bwa-svcs-faq-grid">
            <h2 className="bwa-servico-h2" id="plano-perguntas">Perguntas sobre o plano</h2>
            <div className="bwa-servico-faq bwa-manut-faq">{perguntas.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
          </div>
        </section>
        <section className="bwa-servico-block" aria-labelledby="plano-contato">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="plano-contato">Plano Studio Protegido</h2>
            <p className="bwa-manut-price">{MANUTENCAO.precoTexto}</p>
            <p className="bwa-svcs-manut-regras">{MANUTENCAO.regras}</p>
            <a className="bwa-button" href={contato} target="_blank" rel="noopener noreferrer" data-cta="manutencao-final-whatsapp">Conversar sobre o plano <span aria-hidden="true">→</span><span className="sr-only"> (abre o WhatsApp em nova aba)</span></a>
            <div className="bwa-servico-text bwa-manut-footer-links"><a href="/servicos">Todos os serviços</a><a href="/reforma-de-studio-sao-paulo">Reforma de studio em São Paulo</a></div>
          </div>
        </section>
      </main>
      <BwaFooter />
    </div>
  );
}