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
import { useEffect, useRef, useState } from "react";
import { useSeo } from "@/lib/useSeo";
import { CONTACT, whatsappHref } from "@/components/landing/content";
import "@/styles/home.css";

const SITE_URL = "https://bewild.com.br";

/* ---------------- data ---------------- */

const SERVICES = [
  {
    slot: "Foto · obra",
    title: "Reforma turn-key",
    desc: "Projeto, obra, marcenaria, mobiliário e entrega em um único processo, sob um único responsável.",
  },
  {
    slot: "Foto · studio",
    title: "Studios para short stay",
    desc: "Imóveis pensados desde o projeto para diária, ocupação, foto e operação no Airbnb e na Booking.",
  },
  {
    slot: "Foto · marcenaria",
    title: "Marcenaria inteligente",
    desc: "Armazenamento, painéis e bancadas sob medida para ganhar espaço, durabilidade e percepção de valor.",
  },
  {
    slot: "Foto · interiores",
    title: "Mobiliário, eletros e enxoval",
    desc: "Imóvel entregue completo, pronto para receber o primeiro hóspede.",
  },
  {
    slot: "Foto · portal",
    title: "Acompanhamento sem caixa-preta",
    desc: "Cronograma, fotos e decisões registradas no portal. Você vê a obra andar.",
  },
  {
    slot: "Slot · prancha / estudo real Bewild",
    title: "Arquitetura personalizada",
    desc: "Cada imóvel recebe um estudo próprio de layout, circulação, marcenaria, iluminação, acabamentos e uso. Nada de copiar e colar projeto genérico.",
  },
];

const PROBLEMS = [
  "Orçamentos que começam baixos e crescem no meio da obra.",
  "Fornecedores que não conversam entre si.",
  "Projeto bonito, mas difícil de executar.",
  "Studio pronto visualmente, mas ruim de operar.",
  "Cliente acompanhando tudo por WhatsApp, sem rastreabilidade.",
  "Imóvel parado enquanto deveria estar gerando receita.",
];

const STEPS = [
  { n: "01", title: "Diagnóstico do imóvel", text: "Analisamos metragem, planta, padrão do prédio, objetivo de uso, região, restrições e potencial do imóvel." },
  { n: "02", title: "Briefing e estratégia", text: "Entendemos se o imóvel será usado para short stay, long stay, uso misto ou moradia. A estratégia define o nível de investimento e as escolhas do projeto." },
  { n: "03", title: "Projeto de arquitetura personalizado", text: "Desenvolvemos layout, conceito, marcenaria, iluminação, acabamentos e soluções para performar melhor no uso e na foto." },
  { n: "04", title: "Orçamento e escopo", text: "Escopo fechado e itens organizados por etapa, para você saber o que está incluso antes de a obra começar." },
  { n: "05", title: "Compras e fornecedores", text: "Compras críticas planejadas e fornecedores coordenados pela Bewild, dentro do cronograma." },
  { n: "06", title: "Obra e marcenaria", text: "Execução acompanhada, com gestão técnica e registro de cada decisão no portal." },
  { n: "07", title: "Entrega e checklist", text: "Montagem, enxoval e checklist final. Imóvel pronto para foto, anúncio e operação." },
];

const ARCH = [
  { idx: "01", title: "Layout inteligente", text: "Cama, bancada, cozinha, armários, TV, circulação e apoio de malas para o espaço parecer maior e funcionar melhor." },
  { idx: "02", title: "Marcenaria sob medida", text: "Armazenamento, painéis, bancadas e nichos que aumentam a percepção de qualidade e reduzem improvisos." },
  { idx: "03", title: "Iluminação e percepção de valor", text: "A luz certa melhora a foto, a experiência do hóspede e a sensação de cuidado no imóvel." },
  { idx: "04", title: "Materiais para uso real", text: "A escolha não é só estética. Consideramos limpeza, manutenção, resistência, reposição e custo total." },
  { idx: "05", title: "Personalização sem perder eficiência", text: "O projeto respeita o imóvel e o perfil do investidor, sem escolhas que encarecem, atrasam ou prejudicam a operação." },
];

const DIFFS = [
  { ic: "◇", title: "Operação ponta a ponta", text: "Um único time integra arquitetura, obra, compras, fornecedores, marcenaria e entrega." },
  { ic: "▣", title: "Especialização em studios compactos", text: "Conhecemos as decisões críticas de imóveis pequenos: layout, armazenamento, eletros, circulação, iluminação e operação." },
  { ic: "◎", title: "Foco em investidor", text: "Cada escolha considera prazo, custo, percepção de valor, manutenção e potencial de rentabilização." },
  { ic: "▤", title: "Transparência de escopo", text: "O cliente entende o que está incluso, o que é opcional e quais escolhas impactam preço ou prazo." },
  { ic: "▢", title: "Portal de acompanhamento", text: "Fotos, relatórios, cronograma e atualizações para acompanhar a obra sem depender de mensagens soltas." },
  { ic: "⚙", title: "Gestão técnica", text: "Cronograma, compras, lead times, fornecedores e execução tratados como partes do mesmo sistema." },
  { ic: "✦", title: "Acabamentos pensados para operação", text: "Bonito na foto, resistente no uso, simples de limpar e mais fácil de manter." },
  { ic: "◉", title: "Experiência remota", text: "Ideal para quem comprou imóvel em São Paulo, mas mora em outra cidade, estado ou país." },
];

const COMPARE = [
  { label: "Arquitetura", trad: "Projeto isolado, nem sempre conectado à obra.", bw: "Projeto personalizado já pensado para execução, uso e operação." },
  { label: "Orçamento", trad: "Múltiplos fornecedores e risco de lacunas.", bw: "Escopo centralizado e itens organizados por etapa." },
  { label: "Obra", trad: "Cliente cobra e coordena.", bw: "Gestão técnica e acompanhamento estruturado." },
  { label: "Marcenaria", trad: "Fornecedor separado.", bw: "Integrada ao projeto e à sequência da obra." },
  { label: "Comunicação", trad: "Mensagens soltas.", bw: "Portal, registros e atualizações." },
  { label: "Entrega", trad: "Imóvel reformado, mas nem sempre pronto para operar.", bw: "Imóvel pensado para uso, foto, anúncio e operação." },
];

const WHO = [
  { ic: "⌂", title: "Investidor de short stay", text: "Para quem quer preparar o imóvel para Airbnb, Booking ou locação por temporada." },
  { ic: "◔", title: "Investidor iniciante", text: "Para quem comprou o primeiro studio e quer fazer certo desde o começo." },
  { ic: "▦", title: "Investidor de portfólio", text: "Para quem tem múltiplas unidades e precisa de padrão, processo e escala." },
  { ic: "➤", title: "Cliente remoto", text: "Para quem mora fora de São Paulo, em outro estado ou fora do Brasil." },
  { ic: "⌗", title: "Proprietário de uso misto", text: "Para quem quer usar o imóvel em parte do ano e rentabilizar no restante." },
  { ic: "⚑", title: "Parceiros imobiliários", text: "Para corretores e incorporadoras que querem entregar uma solução mais completa ao comprador." },
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

function BrandLockup() {
  return (
    <span className="brand" aria-label="Bewild · Grupo Bwild">
      <span className="be">Be</span>
      <span className="wild">wild</span>
      <span className="sub">Grupo Bwild</span>
    </span>
  );
}

export default function HomePage() {
  useSeo({
    title: "Bewild — Reforma turn-key de studios em São Paulo",
    description:
      "Projeto, obra, marcenaria, mobiliário e tecnologia de acompanhamento em um processo único. Studios prontos para foto, anúncio e operação em São Paulo.",
    canonical: SITE_URL + "/",
    ogType: "website",
  });

  const [activePanel, setActivePanel] = useState(0);
  const heroBgRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Marca html.js (alguns seletores do spec dependem disso, mas o CSS aqui
  // não usa — mantido por compatibilidade).
  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  // Hero parallax + scroll reveal
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const heroBg = heroBgRef.current;
    let raf = 0;
    const onScroll = () => {
      if (reduce || !heroBg) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        heroBg.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Scroll reveal
    const root = rootRef.current;
    const targets: HTMLElement[] = root
      ? Array.from(root.querySelectorAll(".section > .container > *"))
      : [];

    if (reduce) {
      targets.forEach((el) => el.classList.add("in"));
    } else if (typeof IntersectionObserver !== "undefined") {
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
      return () => {
        window.removeEventListener("scroll", onScroll);
        cancelAnimationFrame(raf);
        io.disconnect();
      };
    } else {
      targets.forEach((el) => el.classList.add("in"));
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const isTouch =
    typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

  return (
    <div className="bw-home" ref={rootRef}>
      {/* NAV */}
      <header className="nav">
        <div className="nav-inner">
          <a href="#top" aria-label="Bewild — início">
            <BrandLockup />
          </a>
          <nav className="nav-links" aria-label="Navegação principal">
            <a href="#fazemos">O que fazemos</a>
            <a href="#processo">Como funciona</a>
            <a href="#portfolio">Portfólio</a>
            <a href="#diferenciais">Diferenciais</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="nav-cta">
            <a href="/diagnostico" className="btn btn-primary">
              Solicitar diagnóstico <span className="arrow">→</span>
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero" id="top" aria-label="Bewild — reforma turn-key de studios">
        <div className="hero-bg" ref={heroBgRef} />
        <div className="hero-shade" />
        <div className="container">
          <div className="hero-text">
            <div className="eyebrow" style={{ color: "var(--sky)" }}>
              Bewild · Reforma turn-key de studios · São Paulo
            </div>
            <h1>
              Reforma turn-key de studios,{" "}
              <span className="accent">do projeto ao pronto para rentabilizar.</span>
            </h1>
            <p className="sub">
              Projeto de arquitetura, obra, marcenaria, mobiliário e tecnologia de
              acompanhamento em um processo único, para você não precisar virar gerente da
              própria reforma.
            </p>
            <p className="micro">
              Da entrega das chaves ao imóvel pronto para foto, anúncio e operação
            </p>
            <div className="hero-cta">
              <a href="/diagnostico" className="btn btn-cyan">
                Solicitar diagnóstico <span className="arrow">→</span>
              </a>
              <a href="#portfolio" className="btn btn-ghost-light">
                Ver reformas entregues
              </a>
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

      {/* O QUE FAZEMOS */}
      <section className="section" id="fazemos" style={{ background: "var(--paper)" }}>
        <div className="container">
          <div className="eyebrow">O que fazemos</div>
          <h2>
            Mais que uma reforma. <span className="accent">Um imóvel pronto para operar.</span>
          </h2>
          <p className="lead">
            Arquitetura, obra, interiores, tecnologia e inteligência de investimento em
            uma entrega única.
          </p>
          <div className="fz-acc" role="tablist" aria-label="Serviços Bewild">
            {SERVICES.map((s, i) => (
              <button
                type="button"
                key={s.title}
                className={`fz-panel ${activePanel === i ? "active" : ""}`}
                role="tab"
                aria-selected={activePanel === i}
                aria-label={s.title}
                onMouseEnter={() => !isTouch && setActivePanel(i)}
                onFocus={() => setActivePanel(i)}
                onClick={() => setActivePanel(i)}
              >
                <span className="slot-mini">{s.slot}</span>
                <span className="vlabel">{s.title}</span>
                <div className="content">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="fz-hint">
            Passe o mouse ou toque para abrir cada serviço. As fotos reais das obras
            entram em cada card.
          </p>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="section" id="processo" style={{ background: "var(--sand)" }}>
        <div className="container">
          <div className="eyebrow">Como funciona</div>
          <h2>
            Um processo claro, <span className="accent">do diagnóstico à entrega.</span>
          </h2>
          <p className="lead">
            Cada etapa tem começo, meio e fim. A obra anda sem você precisar empurrar.
          </p>
          <div className="psteps">
            {STEPS.map((s) => (
              <div key={s.n} className="pstep">
                <span className="ghost">{s.n}</span>
                <span className="pnum">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ARQUITETURA */}
      <section className="section" id="arquitetura" style={{ background: "var(--paper)" }}>
        <div className="container split">
          <div>
            <div className="arch-media slot">
              <span className="tag">Slot · planta humanizada / estudo Bewild</span>
            </div>
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
              Em studios compactos, projeto não é decoração. É estratégia de uso, operação
              e rentabilidade.
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
      <section className="section dark" id="diferenciais">
        <div className="container">
          <div className="eyebrow">Diferenciais</div>
          <h2>
            Por que a Bewild <span className="accent">é diferente.</span>
          </h2>
          <p className="lead">
            O trabalho não termina no desenho bonito. Ele precisa fechar tecnicamente,
            caber no orçamento, andar na obra e funcionar depois da entrega.
          </p>
          <div className="diff-grid">
            {DIFFS.map((d) => (
              <div key={d.title} className="diff">
                <div className="ic" aria-hidden="true">
                  {d.ic}
                </div>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CREDIBILIDADE */}
      <section className="section cred" id="credibilidade">
        <div className="container">
          <div className="eyebrow">Credibilidade</div>
          <h2>
            Credibilidade não é promessa. <span className="accent">É processo visível.</span>
          </h2>
          <div className="stats">
            <div className="stat">
              <b>+150</b>
              <div className="u">studios entregues</div>
              <p>Experiência real em reforma de studios compactos.</p>
            </div>
            <div className="stat">
              <b>55</b>
              <div className="u">dias úteis</div>
              <p>Prazo de entrega de uma reforma completa.</p>
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
                <span className="tick">✓</span>
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
              <div className="ph slot">
                <span className="tag">Slot · foto real do studio entregue</span>
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
              <div className="ph slot">
                <span className="tag">Slot · antes / depois mesmo ângulo</span>
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
          <div className="video slot">
            <div className="play" aria-hidden="true">▶</div>
            <span className="tag">Slot · vídeo do depoimento da cliente · legendado</span>
          </div>
          <div>
            <div className="eyebrow">Depoimento</div>
            <h2>
              Quem já passou pela obra{" "}
              <span className="accent">conta melhor do que a gente.</span>
            </h2>
            <blockquote className="ph-quote">
              [ Transcrever aqui a frase mais forte do depoimento em vídeo da cliente. ]
            </blockquote>
            <p className="src">Depoimento real · vídeo na íntegra ao lado</p>
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
                  <span className="tick">✓</span>
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="portal-card">
            <div className="portal-head">
              <b>Studio Urban Flex · 22 m²</b>
              <span className="badge">Em obra</span>
            </div>
            <div className="pline"><span className="pt done">✓</span>Demolição e remoção</div>
            <div className="pline"><span className="pt done">✓</span>Elétrica e hidráulica</div>
            <div className="pline"><span className="pt now">●</span>Marcenaria sob medida</div>
            <div className="pline"><span className="pt todo">○</span>Montagem e enxoval</div>
            <div className="pbar"><i /></div>
            <div className="pmeta">
              52% concluído · Relatório semanal #6: marcenaria instalada, elétrica revisada.
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
                <div className="trad"><span className="xmark">✕</span>{r.trad}</div>
                <div className="bw"><span className="vmark">✓</span>{r.bw}</div>
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
                <div className="ic" aria-hidden="true">{w.ic}</div>
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
          <div className="faq">
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

      {/* CTA FINAL */}
      <section className="section cta" id="cta">
        <div className="container">
          <div className="eyebrow" style={{ color: "var(--sky)", textAlign: "center" }}>
            Diagnóstico
          </div>
          <h2>
            Quer transformar seu studio{" "}
            <span className="accent">em um ativo pronto para operar?</span>
          </h2>
          <p>
            Envie os dados do seu imóvel e receba uma análise inicial de escopo, projeto e
            próximos passos. Sem compromisso.
          </p>
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

      {/* FOOTER */}
      <footer className="foot">
        <div className="foot-grid">
          <div>
            <a href="#top">
              <BrandLockup />
            </a>
            <p style={{ marginTop: 14 }}>
              Reforma turn-key de studios em São Paulo. Projeto, obra, marcenaria,
              mobiliário e entrega em um processo único.
            </p>
            <p style={{ marginTop: 10 }}>{CONTACT.city}</p>
          </div>
          <nav aria-label="Rodapé — navegação">
            <h3 className="foot-col">Navegação</h3>
            <ul>
              <li><a href="#fazemos">O que fazemos</a></li>
              <li><a href="#processo">Como funciona</a></li>
              <li><a href="#portfolio">Portfólio</a></li>
              <li><a href="/conteudos">Conteúdos</a></li>
              <li><a href="/diagnostico">Diagnóstico</a></li>
            </ul>
          </nav>
          <div>
            <h3 className="foot-col">Contato</h3>
            <ul>
              <li><a href={whatsappHref()} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
              <li><a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
              <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
              <li><a href="/privacidade">Política de privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <p>Bewild · Reforma turn-key de studios em São Paulo</p>
          <p>© {new Date().getFullYear()} Bewild · Grupo Bwild</p>
        </div>
      </footer>
    </div>
  );
}
