/**
 * HomePage — Nova Home Bewild (spec v4).
 *
 * Página totalmente autocontida: nav + 14 seções + footer, fiéis ao HTML
 * de referência. Todo o CSS vive em `src/styles/home.css` prefixado por
 * `.bw-home` para não vazar para outras páginas.
 *
 * Interações:
 * - Hero parallax suave (translate Y do background) via scroll listener,
 *   desligado em `prefers-reduced-motion`.
 * - Scroll-reveal via IntersectionObserver — adiciona `.in` aos filhos
 *   diretos de `.container` ao entrar na viewport.
 * - "O que fazemos": accordion horizontal — hover no desktop, click no
 *   touch; primeiro painel ativo por padrão; vira pilha vertical ≤760px.
 * - FAQ: `<details>/<summary>` nativo com primeiro item aberto.
 */
import { useEffect, useRef } from "react";
import { useHomeFx } from "@/lib/useHomeFx";
import {
  Network,
  Building2,
  Target,
  ClipboardList,
  MonitorCheck,
  Sparkles,
  Globe2,
  BedDouble,
  Compass,
  Briefcase,
  Plane,
  Building,
  Handshake,
  Check,
  X,
  CircleDot,
  Calendar,
  Circle,
  Quote,
  type LucideIcon,
} from "lucide-react";
import { useSeo, faqJsonLd } from "@/lib/useSeo";
import { trackEvent } from "@/lib/ga4";
import { whatsappHref } from "@/components/landing/content";
import "@/styles/home.css";
import BewildSiteNav from "@/components/BewildSiteNav";
import SiteFooter from "@/components/SiteFooter";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import depoimentoVideo from "@/assets/testimonials/depoimento-cliente.mp4.asset.json";
import studioAntes from "@/assets/portfolio/studio-zip-brooklin-antes.jpg.asset.json";
import studioDepois from "@/assets/portfolio/studio-zip-brooklin-depois.jpg.asset.json";
import studioPronto from "@/assets/portfolio/studio-pronto.jpg.asset.json";
import plantaHumanizada from "@/assets/portfolio/planta-humanizada.png.asset.json";
import rafaelOcupacao from "@/assets/testimonials/rafael/rafael-ocupacao-novembro.jpeg.asset.json";
import rafaelAirbnb from "@/assets/testimonials/rafael/rafael-airbnb-butanta.jpeg.asset.json";



/* ---------------- data ---------------- */

const JOURNEY: {
  num: string;
  title: string;
  text: string;
  img: string | null;
  alt?: string;
  pos?: string;
  slot?: string;
}[] = [
  { num: "01", title: "Diagnóstico e estratégia", text: "Avaliamos o imóvel e definimos o uso: short stay, long stay ou misto.", img: studioAntes.url, alt: "Studio antes da reforma, na etapa de diagnóstico", pos: "50% 50%" },
  { num: "02", title: "Projeto personalizado", text: "Layout, marcenaria, iluminação e acabamentos desenhados para cada metro. Nada genérico.", img: "/hero-studio-desktop.webp", alt: "Render de studio projetado pela Bewild", pos: "50% 45%" },
  { num: "03", title: "Escopo e orçamento fechados", text: "Você sabe o que está incluso e o que mexe no preço antes de a obra começar.", img: null, slot: "Documento · escopo" },
  { num: "04", title: "Obra e marcenaria sob medida", text: "Execução acompanhada, marcenaria feita para durar, cada decisão registrada.", img: null, slot: "Foto · obra" },
  { num: "05", title: "Acompanhamento no portal", text: "Cronograma e fotos da obra. Você vê andar sem precisar ir até lá.", img: null, slot: "Print · portal" },
  { num: "06", title: "Entrega pronta para operar", text: "Mobiliado, com enxoval, pronto para foto, anúncio e diária.", img: studioPronto.url, alt: "Studio entregue pela Bewild, pronto para operar", pos: "50% 50%" },
];

const PROBLEMS = [
  "Orçamentos que começam baixos e crescem no meio da obra.",
  "Fornecedores que não conversam entre si.",
  "Projeto bonito, mas difícil de executar.",
  "Studio pronto visualmente, mas ruim de operar.",
  "Cliente acompanhando tudo por WhatsApp, sem rastreabilidade.",
  "Imóvel parado enquanto deveria estar gerando receita.",
];


const ARCH = [
  { idx: "01", title: "Layout inteligente", text: "Cama, bancada, cozinha, armários, TV, circulação e apoio de malas para o espaço parecer maior e funcionar melhor." },
  { idx: "02", title: "Marcenaria sob medida", text: "Armazenamento, painéis, bancadas e nichos que aumentam a percepção de qualidade e reduzem improvisos." },
  { idx: "03", title: "Iluminação e percepção de valor", text: "A luz certa melhora a foto, a experiência do hóspede e a sensação de cuidado no imóvel." },
  { idx: "04", title: "Materiais para uso real", text: "A escolha não é só estética. Consideramos limpeza, manutenção, resistência, reposição e custo total." },
  { idx: "05", title: "Personalização sem perder eficiência", text: "O projeto respeita o imóvel e o perfil do investidor, sem escolhas que encarecem, atrasam ou prejudicam a operação." },
];

export const DIFFS: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: Network, title: "Operação ponta a ponta", text: "Um único time integra arquitetura, obra, compras, fornecedores, marcenaria e entrega." },
  { Icon: Building2, title: "Especialização em studios compactos", text: "Conhecemos as decisões críticas de imóveis pequenos: layout, armazenamento, eletros, circulação, iluminação e operação." },
  { Icon: Target, title: "Foco em investidor", text: "Cada escolha considera prazo, custo, percepção de valor, manutenção e potencial de rentabilização." },
  { Icon: ClipboardList, title: "Transparência de escopo", text: "O cliente entende o que está incluso, o que é opcional e quais escolhas impactam preço ou prazo." },
  { Icon: MonitorCheck, title: "Portal de acompanhamento", text: "Fotos, relatórios, cronograma e atualizações para acompanhar a obra sem depender de mensagens soltas." },
  { Icon: Sparkles, title: "Acabamentos pensados para operação", text: "Bonito na foto, resistente no uso, simples de limpar e mais fácil de manter." },
  { Icon: Globe2, title: "Experiência remota", text: "Ideal para quem comprou imóvel em São Paulo, mas mora em outra cidade, estado ou país." },
];

const COMPARE = [
  { label: "Arquitetura", trad: "Projeto isolado, nem sempre conectado à obra.", bw: "Projeto personalizado já pensado para execução, uso e operação." },
  { label: "Orçamento", trad: "Múltiplos fornecedores e risco de lacunas.", bw: "Escopo centralizado e itens organizados por etapa." },
  { label: "Obra", trad: "Cliente cobra e coordena.", bw: "Gestão técnica e acompanhamento estruturado." },
  { label: "Marcenaria", trad: "Fornecedor separado.", bw: "Integrada ao projeto e à sequência da obra." },
  { label: "Comunicação", trad: "Mensagens soltas.", bw: "Portal, registros e atualizações." },
  { label: "Entrega", trad: "Imóvel reformado, mas nem sempre pronto para operar.", bw: "Imóvel pensado para uso, foto, anúncio e operação." },
];

const WHO: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: BedDouble, title: "Investidor de short stay", text: "Para quem quer preparar o imóvel para Airbnb, Booking ou locação por temporada." },
  { Icon: Compass, title: "Investidor iniciante", text: "Para quem comprou o primeiro studio e quer fazer certo desde o começo." },
  { Icon: Briefcase, title: "Investidor de portfólio", text: "Para quem tem múltiplas unidades e precisa de padrão, processo e escala." },
  { Icon: Plane, title: "Cliente remoto", text: "Para quem mora fora de São Paulo, em outro estado ou fora do Brasil." },
  { Icon: Building, title: "Proprietário de uso misto", text: "Para quem quer usar o imóvel em parte do ano e rentabilizar no restante." },
  { Icon: Handshake, title: "Parceiros imobiliários", text: "Para corretores e incorporadoras que querem entregar uma solução mais completa ao comprador." },
];

const FAQS_HOME = [
  { q: "A Bewild faz só projeto ou também executa a obra?", a: "A Bewild atua no modelo turn-key: projeto de arquitetura personalizado, planejamento, execução, compras, marcenaria, mobiliário e entrega final, conforme o escopo contratado." },
  { q: "O projeto de arquitetura é personalizado?", a: "Sim. Cada imóvel recebe um estudo próprio de layout, circulação, marcenaria, iluminação e acabamentos. Nada de copiar e colar projeto genérico." },
  { q: "Vocês trabalham com studios pequenos?", a: "É a nossa especialidade. Studios compactos de 19, 22 ou 28 m² exigem decisões precisas, e é exatamente nesse tipo de imóvel que a Bewild se concentra." },
  { q: "Consigo acompanhar a obra à distância?", a: "Sim. Pelo portal de acompanhamento você vê cronograma, fotos de evolução, relatórios e decisões, sem depender de mensagens soltas no WhatsApp." },
  { q: "Vocês ajudam com móveis, eletros e enxoval?", a: "Sim. A entrega turn-key inclui mobiliário, eletros e enxoval, conforme o escopo. O imóvel sai pronto para receber o primeiro hóspede." },
  { q: "A Bewild atende imóveis para Airbnb?", a: "Sim. O projeto é pensado para short stay: diária, ocupação, foto e operação. O imóvel sai pronto para anunciar." },
  { q: "O orçamento é fechado?", a: "O escopo é definido e organizado por etapa antes de a obra começar, para evitar surpresas no meio do caminho." },
  { q: "Posso ver exemplos antes de fechar?", a: "Sim. Apresentamos cases de reformas entregues e o detalhamento do processo no diagnóstico inicial." },
  { q: "Vocês atendem fora de São Paulo?", a: "O foco hoje é São Paulo, onde está a operação. Para imóveis em SP de clientes que moram em outra cidade, estado ou país, o acompanhamento remoto pelo portal foi feito sob medida." },
  { q: "Como começo?", a: "Solicite o diagnóstico. Você envia os dados do imóvel e recebe uma análise inicial de escopo, projeto e próximos passos, sem compromisso." },
];

/* ---------------- component ---------------- */


export default function HomePage() {
  useSeo({
    title: "Bewild | Studios prontos para Airbnb e short stay",
    description:
      "Design, obra, mobiliário e setup para transformar studios em imóveis prontos para short stay em SP, sem você virar gerente de obra.",
    canonicalPath: "/",
    ogType: "website",
    jsonLd: [faqJsonLd(FAQS_HOME)],
  });

  const rootRef = useRef<HTMLDivElement | null>(null);

  // Marca html.js (alguns seletores do spec dependem disso, mas o CSS aqui
  // não usa — mantido por compatibilidade).
  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  // Scroll reveal
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const root = rootRef.current;
    const targets: HTMLElement[] = root
      ? Array.from(root.querySelectorAll(".section > .container > *"))
      : [];

    if (reduce) {
      targets.forEach((el) => el.classList.add("in"));
      return;
    }
    if (typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io.unobserve(e.target);
            }
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
      );
      targets.forEach((el) => io.observe(el));
      return () => io.disconnect();
    }
    targets.forEach((el) => el.classList.add("in"));
  }, []);

  // Sistema de direção de arte (smooth scroll, cursor crosshair, magnético, reveals masked).
  useHomeFx(rootRef);




  return (
    <div className="bw-home" ref={rootRef}>
      {/* NAV — unificada para todas as páginas */}
      <BewildSiteNav />


      {/* HERO — full-bleed: render de fundo, texto sobre gradiente */}
      <section className="hero" id="top" aria-label="Bewild — reforma turn-key de studios">
        <picture className="hero-bg-pic">
          <source media="(max-width: 760px)" srcSet="/hero-studio-mobile.webp" type="image/webp" />
          <source srcSet="/hero-studio-desktop.webp" type="image/webp" />
          <img
            className="hero-bg"
            src="/hero-studio-desktop.webp"
            alt="Studio compacto reformado pela Bewild, pronto para operar no short stay"
            width={1600}
            height={900}
            fetchPriority="high"
            loading="eager"
            decoding="async"
          />
        </picture>
        <div className="hero-shade" />
        <div className="hero-shade-bottom" />
        <div className="container">
          <div className="hero-text">
            <div className="eyebrow" style={{ color: "var(--sky)" }}>
              Reforma turn-key de studios · São Paulo
            </div>
            <h1>
              Seu studio pronto para render,{" "}
              <span className="accent">sem você virar gerente de obra.</span>
            </h1>
            <p className="sub">
              Projeto, obra, marcenaria, mobiliário e acompanhamento num processo único. Você acompanha; a Bewild executa.
            </p>
            <p className="micro">
              Da entrega das chaves ao imóvel pronto para foto, anúncio e operação
            </p>
            <div className="hero-cta">
              <a href="/diagnostico" className="btn btn-cyan">
                Solicitar diagnóstico <span className="arrow">→</span>
              </a>
              <a href="/portfolio" className="btn btn-ghost-light">
                Ver reformas entregues
              </a>
            </div>
            <p className="hero-reassure">Resposta rápida</p>
            <ul className="hero-proof" aria-label="Provas Bewild">
              <li><b>+150</b><span>studios entregues</span></li>
              <li><b>a partir de 60</b><span>dias úteis de obra</span></li>
              <li><b>5</b><span>anos de garantia</span></li>
            </ul>
            <a
              href="#resultado"
              className="hero-social-proof"
              data-cta="hero-prova-rafael"
              aria-label="Caso real: 70% de ocupação em novembro num studio no Butantã — ver detalhes do resultado"
              onClick={(e) => {
                e.preventDefault();
                const target = document.getElementById("resultado");
                if (target) {
                  target.scrollIntoView({ behavior: "smooth" });
                }
                trackEvent("click_prova_hero", { category: "rafael_butanta", label: "rafael_butanta" });
              }}
            >
              {"Caso real:\u00a0"}
              <span className="highlight">70% de ocupação</span>
              {"\u00a0em novembro num studio no Butantã —\u00a0"}
              <span className="action">ver →</span>
            </a>
          </div>
        </div>
      </section>

      {/* MANIFESTO — revelação Build→Bewild + descida "não é sua" (escura) */}
      <section className="section bw-dark" id="manifesto" aria-label="Bewild — manifesto">
        <div className="container">
          <div className="bw-manifesto">
            <h2 className="bw-name">
              <span className="pre">Você nunca leu</span>
              <span className="build">Build.</span>
              <span className="bewild">Você leu Be<em>wild.</em></span>
            </h2>
            <p className="bw-lede">
              <strong>Comprar um imóvel pra render não deveria virar um emprego.</strong>
            </p>
            <p className="bw-lede">
              Ser <em>wild</em> é ter o ativo sem ser dominado por ele. A Bewild entrega o studio pronto pra render, sem você entrar na obra.
            </p>

            <div className="bw-manifesto-body">
              <h2>Uma a uma, as responsabilidades <em>deixam de ser suas.</em></h2>
              <div className="bw-descida">
                <div className="bw-solta">
                  <span className="num">01</span>
                  <div className="txt">
                    <div className="o">A arquitetura</div>
                    <div className="d">Projeto e layout pensados pra render no short stay.</div>
                  </div>
                  <span className="selo">não é sua</span>
                </div>
                <div className="bw-solta">
                  <span className="num">02</span>
                  <div className="txt">
                    <div className="o">A obra</div>
                    <div className="d">Marcenaria, acabamento, fornecedores e prazo.</div>
                  </div>
                  <span className="selo">não é sua</span>
                </div>
                <div className="bw-solta">
                  <span className="num">03</span>
                  <div className="txt">
                    <div className="o">A mobília</div>
                    <div className="d">Móveis, enxoval, eletro e decoração.</div>
                  </div>
                  <span className="selo">não é sua</span>
                </div>
              </div>
              <div className="bw-resto">
                <p className="big">Fica o studio pronto.<br />Fica o seu tempo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="section" id="problema">
        <div className="container split">
          <div>
            <div className="eyebrow">O problema</div>
            <h2>
              Reformar um studio para renda{" "}
              <span className="accent">não precisa ser sua segunda profissão.</span>
            </h2>
            <p className="lead">
              A Bewild integra arquitetura, engenharia, obra e inteligência de mercado em
              um único processo, para quem precisa reformar e não quer carregar o pesadelo
              de cuidar de uma obra sozinho, muitas vezes à distância.
            </p>
            <p className="stmt">Você acompanha. A gente executa.</p>
          </div>
          <div className="prob-list">
            {PROBLEMS.map((p) => (
              <div key={p} className="prob-item">
                <span className="dot" />
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JORNADA — o que fazemos + como funciona, fundidos */}
      <section className="section" id="fazemos" style={{ background: "var(--sand)" }}>
        <div className="container">
          <div className="eyebrow">Como funciona</div>
          <h2>
            Da planta crua ao studio <span className="accent">pronto para operar.</span>
          </h2>
          <p className="lead">
            Reforma turn-key: um único time cuida de projeto, obra, marcenaria, mobiliário
            e entrega. Você acompanha cada etapa, sem virar gerente de obra.
          </p>
          <div className="jstack">
            {JOURNEY.map((j, i) => (
              <div
                className="jstack__item"
                style={{ ["--i" as string]: i } as React.CSSProperties}
                key={j.num}
              >
                <article className="jcard">
                  {j.img ? (
                    <img
                      className="jcard__img"
                      src={j.img}
                      alt={j.alt}
                      loading="lazy"
                      decoding="async"
                      style={{ objectPosition: j.pos }}
                    />
                  ) : (
                    <span className="jcard__tag">{j.slot}</span>
                  )}
                  <div className="jcard__scrim" />
                  <span className="jcard__ghost">{j.num}</span>
                  <div className="jcard__content">
                    <span className="jcard__num">{j.num}</span>
                    <h3>{j.title}</h3>
                    <p>{j.text}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VÍDEOS — quem mede / quem executa (escura) */}
      <section className="section bw-dark bw-videos" id="bastidores" aria-label="Bewild — quem projeta e quem executa">
        <div className="container">
          <div className="video-bloco">
            <div className="video-texto">
              <p className="vt-tag">antes de qualquer parede</p>
              <h3 className="vt-h">Quem projeta o seu studio mede ele <em>pessoalmente.</em></h3>
              <p>
                A arquiteta vai até o imóvel e decide ali o que muda na diária: circulação, ponto de luz, onde a cama rende foto. Cada milímetro pensado pro studio operar bem, não só pra ficar bonito.
              </p>
            </div>
            <div className="video-moldura">
              <video
                src="/videos/arquiteta-medicao.mp4"
                poster="/videos/arquiteta-medicao-poster.jpg"
                muted
                loop
                autoPlay
                playsInline
                preload="metadata"
                aria-label="Arquiteta da Bewild fazendo a medição do imóvel"
              />
            </div>
          </div>
          <div className="video-bloco invertido">
            <div className="video-moldura">
              <video
                src="/videos/time-obra.mp4"
                poster="/videos/time-obra-poster.jpg"
                muted
                loop
                autoPlay
                playsInline
                preload="metadata"
                aria-label="Time de obra da Bewild a caminho da reforma"
              />
            </div>
            <div className="video-texto">
              <p className="vt-tag">e quem executa tem rosto</p>
              <h3 className="vt-h">A obra que você não toca tem <em>time próprio.</em></h3>
              <p>
                Quem reforma o seu studio trabalha na Bewild, não é um terceiro que aparece e some. Você acompanha o andamento à distância e recebe o imóvel pronto pra operar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ARQUITETURA */}
      <section className="section" id="arquitetura" style={{ background: "var(--paper)" }}>
        <div className="container split">
          <div>
            <div className="arch-media">
              <img
                src={plantaHumanizada.url}
                alt="Planta humanizada de studio Bewild com layout otimizado: cama, banheiro, cozinha compacta, home office e varanda."
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="arch-caption">Planta humanizada · estudo de layout de um studio compacto</p>
            <p className="arch-quote">
              Um studio de 19, 22 ou 28 m² não permite decisões aleatórias. Cada
              centímetro precisa justificar sua existência. Por isso, a Bewild desenvolve
              projeto de arquitetura personalizado para cada imóvel: layout, circulação,
              iluminação, marcenaria, armazenamento, eletros, pontos técnicos, estética e
              objetivo de uso.
            </p>
            <div className="arch-cta">
              <a href="/diagnostico" className="btn btn-primary">
                Quero um projeto para meu studio <span className="arrow">→</span>
              </a>
            </div>
          </div>
          <div>
            <div className="eyebrow">Projeto personalizado</div>
            <h2>
              Arquitetura para cada metro quadrado{" "}
              <span className="accent">trabalhar melhor.</span>
            </h2>
            <p className="lead" style={{ marginBottom: 20 }}>
              Em studios compactos, o projeto é estratégia de uso, operação e
              rentabilidade.
            </p>
            <div className="arch-list">
              {ARCH.map((a) => (
                <div key={a.idx} className="arch-item">
                  <div className="h">
                    <span className="idx">{a.idx}</span>
                    <h3>{a.title}</h3>
                  </div>
                  <p>{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="section diffs" id="diferenciais">
        <div className="container">
          <div className="diffs-head">
            <div className="eyebrow">Por que a Bewild</div>
            <h2>A obra é com a gente. <span className="accent">A tranquilidade é sua.</span></h2>
            <p className="lead">
              Você não precisa entender de obra, coordenar fornecedor nem acompanhar cada
              detalhe. A Bewild assume o imóvel do projeto à entrega e devolve ele pronto
              para gerar renda.
            </p>
          </div>

          <div className="diffs-leads">
            <article className="diff-lead">
              <span className="diff-tag">Tudo num lugar só</span>
              <h3>Um time cuida de tudo, do começo ao fim</h3>
              <p>Projeto, obra, marcenaria, compras, fornecedores e entrega ficam com a gente. <strong>Você não vira gerente de obra</strong>. Não precisa cobrar prazo, alinhar fornecedor nem resolver imprevisto. Isso é problema nosso.</p>
            </article>
            <article className="diff-lead">
              <span className="diff-tag">Especialistas no seu tipo de imóvel</span>
              <h3>A gente entende de studio compacto como ninguém</h3>
              <p>Em imóvel pequeno, um erro de layout, armazenamento ou circulação custa caro depois. <strong>Studio compacto é o que a Bewild faz todos os dias</strong>, então a gente já sabe o que funciona e o que dá problema.</p>
            </article>
          </div>

          <div className="diffs-support">
            <article className="diff-sup">
              <h3>Pensado para render</h3>
              <p>Cada escolha considera prazo, custo, manutenção e potencial de rentabilização.</p>
            </article>
            <article className="diff-sup">
              <h3>Sem surpresa no orçamento</h3>
              <p>Você sabe o que está incluso, o que é opcional e o que mexe no preço ou no prazo.</p>
            </article>
            <article className="diff-sup">
              <h3>Obra acompanhada de longe</h3>
              <p>Fotos, relatórios e cronograma no portal. Você acompanha sem precisar ir até lá.</p>
            </article>
            <article className="diff-sup">
              <h3>Feito para durar no uso</h3>
              <p>Acabamento bonito na foto, resistente no dia a dia e simples de manter.</p>
            </article>
            <article className="diff-sup">
              <h3>Funciona à distância</h3>
              <p>Ideal para quem comprou em São Paulo, mas mora em outra cidade, estado ou país.</p>
            </article>
          </div>
        </div>
      </section>

      {/* CREDIBILIDADE */}
      <section className="section cred" id="credibilidade">
        <div className="container">
          <div className="eyebrow">Credibilidade</div>
          <h2>
            Credibilidade Bewild <span className="accent">é processo visível.</span>
          </h2>
          <div className="stats">
            <div className="stat">
              <b>+150</b>
              <div className="u">studios entregues</div>
              <p>Experiência real em reforma de studios compactos.</p>
            </div>
            <div className="stat">
              <b>a partir de 60</b>
              <div className="u">dias úteis</div>
              <p>Prazo de referência de uma reforma completa.</p>
            </div>
            <div className="stat">
              <b>5 anos</b>
              <div className="u">de garantia</div>
              <p>Garantia Bewild sobre a reforma entregue.</p>
            </div>
          </div>
          <div className="checks">
            {[
              "Contrato e escopo claros",
              "Compras críticas planejadas",
              "Fotos e relatórios de acompanhamento",
              "Gestão de fornecedores",
              "Projeto aprovado antes da execução",
              "Entrega com checklist final",
            ].map((t) => (
              <div key={t} className="chk">
                <span className="tick"><Check size={12} strokeWidth={2.25} /></span>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFÓLIO */}
      <section className="section" id="portfolio" style={{ background: "var(--paper)" }}>
        <div className="container">
          <div className="eyebrow">Portfólio</div>
          <h2>
            Reformas reais para imóveis{" "}
            <span className="accent">que precisam performar.</span>
          </h2>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 30 }}>
            <div className="case">
              <div className="ph" style={{ overflow: "hidden" }}>
                <img
                  src={studioPronto.url}
                  alt="Studio compacto para short stay, reformado e pronto para operar pela Bewild"
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div className="body">
                <span className="pill">Short stay</span>
                <h3>Studio compacto para short stay</h3>
                <dl>
                  <dt>Desafio</dt>
                  <dd>Transformar uma planta pequena em um imóvel funcional, bonito e fácil de operar.</dd>
                  <dt>Solução</dt>
                  <dd>Marcenaria inteligente, bancada compacta, iluminação estratégica, eletros adequados e acabamento resistente.</dd>
                  <dt>Resultado</dt>
                  <dd>Unidade pronta para fotos, anúncio e operação.</dd>
                </dl>
              </div>
            </div>
            <div className="case">
              <div className="ph ba">
                <figure className="ba__half">
                  <img
                    src={studioAntes.url}
                    alt="Studio na planta, antes da reforma turn-key Bewild"
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption>Antes</figcaption>
                </figure>
                <figure className="ba__half">
                  <img
                    src={studioDepois.url}
                    alt="Studio entregue pela Bewild, pronto para operar"
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption>Depois</figcaption>
                </figure>
              </div>
              <div className="body">
                <span className="pill">Turn-key</span>
                <h3>Studio recém-entregue na planta</h3>
                <dl>
                  <dt>Desafio</dt>
                  <dd>Sair do apartamento cru para uma unidade mobiliada sem o cliente precisar coordenar múltiplos fornecedores.</dd>
                  <dt>Solução</dt>
                  <dd>Projeto personalizado, obra turn-key, compras planejadas e montagem final.</dd>
                  <dt>Resultado</dt>
                  <dd>Imóvel entregue com visual consistente, layout otimizado e pronto para uso.</dd>
                </dl>
              </div>
            </div>
          </div>
          <p className="illus-note">
            Cases ilustrativos até a publicação das fotos reais das reformas entregues
          </p>
        </div>
      </section>

      {/* DEPOIMENTO */}
      <section className="section" id="depoimento" style={{ background: "var(--sand)" }}>
        <div className="container testi">
          <div className="video">
            <video
              src={depoimentoVideo.url}
              controls
              playsInline
              preload="metadata"
              aria-label="Depoimento em vídeo de cliente Bewild"
            />
          </div>
          <div className="testi-content">
            <Quote size={44} className="testi-quote-icon" />
            <div className="eyebrow">Depoimento</div>
            <h2>
              Quem já passou pela obra{" "}
              <span className="accent">conta melhor do que a gente.</span>
            </h2>
            <p className="src"><strong>Vivian</strong> · cliente Bewild · depoimento presencial</p>
            <a href="/diagnostico" className="btn btn-cyan">
              Solicitar diagnóstico <span className="arrow">→</span>
            </a>
          </div>
        </div>
      </section>


      {/* PORTAL */}
      <section className="section" id="portal" style={{ background: "var(--paper)" }}>
        <div className="container split">
          <div>
            <div className="eyebrow">Tecnologia · Portal</div>
            <h2>
              Obra com visibilidade. <span className="accent">Gestão sem caixa-preta.</span>
            </h2>
            <p className="lead" style={{ marginBottom: 18 }}>
              Cronograma, decisões e compras organizados para dar mais previsibilidade ao
              cliente e mais controle para a operação.
            </p>
            <div className="checks" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {[
                "Cronograma por etapa",
                "Fotos de evolução",
                "Relatórios de acompanhamento",
                "Registro de decisões",
                "Controle de escopo",
                "Compras e fornecedores",
                "Visão clara do que está em andamento",
              ].map((t) => (
                <div key={t} className="chk">
                  <span className="tick"><Check size={12} strokeWidth={2.25} /></span>
                  {t}
                </div>
              ))}
            </div>
            <div className="portal-cta">
              <a
                className="btn btn-cyan"
                href="https://bwildworkflow.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Acessar área do cliente <span className="arrow">→</span>
              </a>
              <p className="portal-cta-note">Acesso para clientes com obra ativa.</p>
            </div>
          </div>
          <div className="pf-app" role="img" aria-label="Réplica ilustrativa da tela do Bwild Workflow">
            <div className="pf-chrome">
              <div className="pf-brand">
                <span className="pf-brand-dot" aria-hidden="true" />
                <span className="pf-brand-name">Bwild Workflow</span>
              </div>
              <div className="pf-period">
                <Calendar size={12} strokeWidth={2} aria-hidden="true" />
                <span>Jun 2026</span>
              </div>
            </div>
            <div className="pf-tabs" role="tablist">
              <span className="pf-tab is-active" role="tab" aria-selected="true">Curva S</span>
              <span className="pf-tab" role="tab">Relatórios</span>
              <span className="pf-tab" role="tab">Atividade</span>
            </div>
            <div className="pf-body">
              <div className="pf-head">
                <div className="pf-head-row">
                  <b className="pf-title">Studio Urban Flex · 22 m²</b>
                  <span className="pf-pill pf-pill-info">Em obra</span>
                </div>
                <span className="pf-caption">Semana 6 de 10</span>
              </div>

              <div className="pf-kpis">
                <div className="pf-kpi">
                  <span className="pf-kpi-label">Concluído</span>
                  <span className="pf-kpi-value">52%</span>
                </div>
                <div className="pf-kpi">
                  <span className="pf-kpi-label">Status</span>
                  <span className="pf-kpi-value pf-kpi-row">
                    <span className="pf-dot pf-dot-success" aria-hidden="true" />
                    No prazo
                  </span>
                </div>
                <div className="pf-kpi">
                  <span className="pf-kpi-label">Cronograma</span>
                  <span className="pf-kpi-value">Sem 6/10</span>
                </div>
              </div>

              <div className="pf-chart">
                <div className="pf-chart-legend">
                  <span className="pf-leg"><span className="pf-leg-line pf-leg-real" aria-hidden="true" />Real</span>
                  <span className="pf-leg"><span className="pf-leg-line pf-leg-plan" aria-hidden="true" />Planejado</span>
                </div>
                <svg viewBox="0 0 320 150" className="pf-svg" role="presentation" aria-hidden="true">
                  <defs>
                    <linearGradient id="pfArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(204 100% 25%)" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="hsl(204 100% 25%)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* gridlines */}
                  {[0, 1, 2, 3, 4].map((i) => {
                    const y = 16 + i * 26;
                    return <line key={i} x1="34" y1={y} x2="312" y2={y} stroke="hsl(220 16% 92%)" strokeWidth="1" />;
                  })}
                  {/* y labels */}
                  <text x="26" y="20" textAnchor="end" className="pf-axis">100</text>
                  <text x="26" y="72" textAnchor="end" className="pf-axis">50</text>
                  <text x="26" y="124" textAnchor="end" className="pf-axis">0</text>
                  {/* planejado (tracejado), curva S de (34,120) a (312,16) */}
                  <path
                    d="M34 120 C 110 118, 150 70, 180 56 S 270 22, 312 16"
                    fill="none"
                    stroke="hsl(220 12% 55%)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />
                  {/* real (sólida) até Sem 6 ~ x=200, ~52% -> y=120-(52*1.04)=65.92 */}
                  <path
                    d="M34 120 L34 120 C 90 119, 130 96, 160 82 S 195 70, 200 66 L200 120 L34 120 Z"
                    fill="url(#pfArea)"
                  />
                  <path
                    d="M34 120 C 90 119, 130 96, 160 82 S 195 70, 200 66"
                    fill="none"
                    stroke="hsl(204 100% 25%)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* marker */}
                  <circle cx="200" cy="66" r="5" fill="hsl(204 100% 25%)" stroke="#fff" strokeWidth="2" />
                  {/* x labels */}
                  <text x="34" y="142" className="pf-axis">Início</text>
                  <text x="200" y="142" textAnchor="middle" className="pf-axis">Sem 6</text>
                  <text x="312" y="142" textAnchor="end" className="pf-axis">Entrega</text>
                </svg>
              </div>

              <ul className="pf-stages">
                <li className="pf-stage">
                  <span className="pf-stage-icon pf-stage-icon-success"><Check size={11} strokeWidth={3} /></span>
                  <span className="pf-stage-label">Demolição e remoção</span>
                  <span className="pf-stage-status pf-stage-status-success">Concluída</span>
                </li>
                <li className="pf-stage">
                  <span className="pf-stage-icon pf-stage-icon-success"><Check size={11} strokeWidth={3} /></span>
                  <span className="pf-stage-label">Elétrica e hidráulica</span>
                  <span className="pf-stage-status pf-stage-status-success">Concluída</span>
                </li>
                <li className="pf-stage">
                  <span className="pf-stage-icon pf-stage-icon-warning"><CircleDot size={11} strokeWidth={2.25} /></span>
                  <span className="pf-stage-label">Marcenaria sob medida</span>
                  <span className="pf-stage-meta">
                    <span className="pf-pill pf-pill-warning">em andamento</span>
                    <span className="pf-stage-pct">60%</span>
                  </span>
                </li>
                <li className="pf-stage">
                  <span className="pf-stage-icon pf-stage-icon-todo"><Circle size={11} strokeWidth={2} /></span>
                  <span className="pf-stage-label pf-stage-label-muted">Montagem e enxoval</span>
                  <span className="pf-stage-status pf-stage-status-muted">A iniciar</span>
                </li>
              </ul>
            </div>
            <div className="pf-foot">
              Atualizado hoje. Relatório semanal #6: marcenaria instalada, elétrica revisada.
            </div>
          </div>
        </div>
        <p className="illus-note" style={{ maxWidth: "var(--maxw)", marginLeft: "auto", marginRight: "auto" }}>
          Interface ilustrativa do portal de acompanhamento
        </p>
      </section>

      {/* COMPARATIVO */}
      <section className="section" id="comparativo" style={{ background: "var(--sand)" }}>
        <div className="container">
          <div className="eyebrow">Comparativo</div>
          <h2>
            Reforma tradicional <span className="accent">× Bewild turn-key.</span>
          </h2>
          <div className="compare" style={{ marginTop: 28 }}>
            <div className="chead">
              <div>&nbsp;</div>
              <div className="trad">Reforma tradicional</div>
              <div className="bw">Bewild turn-key</div>
            </div>
            {COMPARE.map((r) => (
              <div className="crow" key={r.label}>
                <div className="rh">{r.label}</div>
                <div className="trad" data-label="Reforma tradicional"><span className="xmark"><X size={14} strokeWidth={2.25} /></span><span>{r.trad}</span></div>
                <div className="bw" data-label="Bewild turn-key"><span className="vmark"><Check size={14} strokeWidth={2.25} /></span><span>{r.bw}</span></div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* PARA QUEM */}
      <section className="section" id="paraquem" style={{ background: "var(--paper)" }}>
        <div className="container">
          <div className="eyebrow">Para quem é</div>
          <h2>
            Para quem quer reformar{" "}
            <span className="accent">sem virar gerente de obra.</span>
          </h2>
          <div className="grid g3" style={{ marginTop: 30 }}>
            {WHO.map((w) => (
              <div key={w.title} className="who-card">
                <div className="ic" aria-hidden="true"><w.Icon size={18} strokeWidth={1.75} /></div>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq" style={{ background: "var(--sand)" }}>
        <div className="container">
          <div className="eyebrow" style={{ textAlign: "center" }}>FAQ</div>
          <h2 style={{ textAlign: "center", marginBottom: 34 }}>Perguntas frequentes</h2>
          <div className="faq-list">
            {FAQS_HOME.map((f, i) => (
              <details key={f.q} open={i === 0}>
                <summary>
                  {f.q} <span className="pm">+</span>
                </summary>
                <div className="ans">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTADO REAL — case Rafael */}
      <section className="section" id="resultado" style={{ background: "var(--paper)" }}>
        <div className="container">
          <div className="eyebrow">Resultado real</div>
          <h2 style={{ maxWidth: "22ch" }}>
            Um studio no Butantã com <span className="accent">70% de ocupação</span> em novembro.
          </h2>
          <p className="lead" style={{ maxWidth: "62ch" }}>
            O Rafael tinha um studio no Butantã e queria transformar em renda. A Bewild reformou
            e entregou pronto pra operar no short stay. Ele anunciou no Airbnb. Em novembro, o
            calendário fechou com 70% de ocupação.
          </p>

          <figure className="bw-home__rafquote">
            <Quote className="bw-home__rafquote-icon" aria-hidden="true" />
            <blockquote>
              Esses studios serão um negócio pra mim. Renda vitalícia.
            </blockquote>
            <figcaption>Rafael · cliente Bewild · studio no Butantã</figcaption>
          </figure>

          <div className="bw-home__rafproof">
            <figure className="bw-home__rafproof-item">
              <div className="bw-home__rafproof-frame">
                <img src={rafaelOcupacao.url} alt="Print do calendário do anúncio mostrando novembro com 70% de ocupação." loading="lazy" />
              </div>
              <figcaption>Novembro: 70% de ocupação</figcaption>
            </figure>
            <figure className="bw-home__rafproof-item">
              <div className="bw-home__rafproof-frame">
                <img src={rafaelAirbnb.url} alt="Print do anúncio no Airbnb: Studio no Butantã, 400m da estação." loading="lazy" />
              </div>
              <figcaption>Anúncio no ar no Airbnb</figcaption>
            </figure>
          </div>

          <p className="illus-note" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12.5 }}>
            Resultado de um cliente real. Ocupação e diária variam conforme imóvel, região e operação.
          </p>

          <div className="cta-btns" style={{ justifyContent: "center", marginTop: 28 }}>
            <a href="/diagnostico" className="btn btn-cyan">
              Solicitar diagnóstico <span className="arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section cta" id="cta">
        <div className="container">
          <div className="eyebrow" style={{ color: "var(--sky)", textAlign: "center" }}>
            Diagnóstico
          </div>
          <h2>
            Você não comprou um imóvel para <span className="accent">virar gerente de obra.</span>
          </h2>
          <p>
            Comprou para gerar renda. A Bewild reforma seu studio e entrega pronto para operar: projeto, obra, mobiliário e acompanhamento, com prazo e escopo fechados antes de começar.
          </p>
          <div className="cta-signature">Built by the wild ones.</div>
          <div className="cta-btns">
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

      <StickyMobileCTA />
      <SiteFooter />
    </div>
  );
}
