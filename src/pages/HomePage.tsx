/**
 * HomePage — Bewild Home v6 ("editorial claro de arquitetura").
 *
 * Redesenho completo aprovado. Escopo isolado sob `.bw-home` com
 * navegação, seções e footer próprios da home (as demais rotas
 * seguem usando BewildSiteNav e SiteFooter globais).
 *
 * Copy: EXATAMENTE conforme spec — não editar textos sem alinhamento.
 * Marca: sempre "Bewild"; portal chama "Bwild Workflow". Sem travessão.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useSeo, faqJsonLd, professionalServiceJsonLd } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { useBewildProjects } from "@/lib/useBewildProjects";
import { trackEvent } from "@/lib/ga4";
import "@/styles/home.css";

// Assets — reuso do que já existe no repo
import slide1 from "@/assets/hero-slides/erik-03-8-1.png.asset.json";
import slide2 from "@/assets/hero-slides/marcos-6-2.png.asset.json";
import slide3 from "@/assets/hero-slides/rodrigo-1-1.png.asset.json";
import slide4 from "@/assets/hero-slides/premium-11-2.png.asset.json";
import projFallback1 from "@/assets/hero-slides/rodrigo-8.png.asset.json";
import projFallback2 from "@/assets/hero-slides/marcos-10-4.png.asset.json";
import projFallback3 from "@/assets/hero-slides/premium-7-4.png.asset.json";
import finalBg from "@/assets/hero-slides/erik-03-11.png.asset.json";
import depoimentoVideo from "@/assets/testimonials/depoimento-cliente.mp4.asset.json";
import rafaelOcupacao from "@/assets/testimonials/rafael/rafael-ocupacao-novembro.jpeg.asset.json";

/* ============ Dados ============ */
const HERO_SLIDES = [
  { src: slide1.url, alt: "Studio reformado pela Bewild em São Paulo" },
  { src: slide2.url, alt: "Interior de studio compacto com marcenaria sob medida" },
  { src: slide3.url, alt: "Studio pronto para short stay em São Paulo" },
  { src: slide4.url, alt: "Studio entregue turn-key pela Bewild" },
];

const FAZEMOS = [
  ["01", "Projeto de arquitetura personalizado", "Consultoria, projeto em 3D com revisões até a aprovação, projeto executivo e toda a documentação técnica. Você vê o resultado antes de a obra começar."],
  ["02", "Obra com time próprio", "Engenheiro dedicado, gestão e logística centralizadas, equipe própria de empreita, elétrica, vidraçaria e ar-condicionado. ART, CREA e liberação no condomínio por nossa conta."],
  ["03", "Marcenaria própria", "Móveis planejados fabricados pela gente, sob medida para espaços compactos."],
  ["04", "Mobília e equipamentos", "Escolhemos, compramos e instalamos tudo o que o imóvel precisa, dos eletros à cafeteira."],
  ["05", "Entrega das chaves", "Vistoria de entrega com engenheiro, termo de finalização assinado por você e fotos profissionais do imóvel pronto. Para morar, receber inquilino ou ir à venda."],
];

const INCLUSO = [
  "Vistoria de entrega com engenheiro Bewild, com você ou por procuração",
  "Se você não mora em São Paulo, a gente vai à ENEL por você e liga a energia da unidade",
  "Manutenção preventiva de ar-condicionado e elétrica: 2 visitas a cada 3 meses",
  "2 chamados de emergência por semestre, atendidos em até 4 horas",
  "Contratação e instalação da internet, testada e documentada, sem você se deslocar",
  "Acesso ao Bwild Workflow durante toda a obra",
];

const COMPARE_ROWS: Array<[string, string, string, string, string]> = [
  ["Quem gerencia", "Você", "Você", "Vocês dividem", "A Bewild"],
  ["Projeto personalizado", "Não", "Não", "Sim", "Sim"],
  ["Preço final", "Imprevisível", "Costuma estourar", "Depende dos fornecedores", "Fechado em contrato"],
  ["Prazo", "Por sua conta", "Instável", "Variável", "Definido em contrato"],
  ["Mobília e eletros", "Você compra", "Não incluso", "Raramente", "Inclusos e instalados"],
  ["Acompanhamento", "Visitas", "WhatsApp", "Reuniões", "Bwild Workflow"],
  ["Pós-entrega", "Ninguém", "Ninguém", "Raro", "5 anos de garantia"],
];

const FAQS: Array<{ q: string; a: string }> = [
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
];
// TODO: adicionar quando o produto tiver resposta definitiva:
// { q: "Quanto tempo leva uma reforma?", a: "..." },
// { q: "Vocês atendem quais regiões?", a: "..." },

/* ============ NAV ============ */
function HomeNav() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 80);
      const goingDown = y > lastY.current && y > 200;
      setHidden(goingDown);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const cls = [
    "bwnav",
    solid ? "is-solid" : "",
    hidden ? "is-hidden" : "",
  ].filter(Boolean).join(" ");

  const links = (
    <>
      <a href="/portfolio">Projetos</a>
      <a href="/conteudos">Conteúdos</a>
      <a href="/faq">FAQ</a>
      <a href="https://bwildworkflow.com" target="_blank" rel="noopener noreferrer">Área do cliente</a>
    </>
  );

  return (
    <>
      <header className={cls}>
        <a href="/" className="bwnav__brand" aria-label="Bewild — início">Bewild</a>
        <nav className="bwnav__links" aria-label="Navegação principal">{links}</nav>
        <a
          href="/diagnostico"
          className="bwnav__cta"
          onClick={() => trackEvent("cta_click", { location: "nav", label: "solicitar_diagnostico" })}
        >
          Solicitar diagnóstico <span aria-hidden>→</span>
        </a>
        <button
          type="button"
          className="bwnav__toggle"
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu size={22} />
        </button>
      </header>

      {open && (
        <div className="bwnav__mobile" role="dialog" aria-modal="true">
          <div className="bwnav__mobile-top">
            <a href="/" className="bwnav__brand" onClick={() => setOpen(false)}>Bewild</a>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu" style={{ background: "transparent", border: 0, cursor: "pointer" }}>
              <X size={22} />
            </button>
          </div>
          <nav className="bwnav__mobile-links" onClick={() => setOpen(false)}>{links}</nav>
          <div className="bwnav__mobile-foot">
            <a href="/diagnostico" className="btn" onClick={() => setOpen(false)}>
              Solicitar diagnóstico <span className="ar" aria-hidden>→</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}

/* ============ HERO ============ */
function Hero() {
  const [i, setI] = useState(0);
  const total = HERO_SLIDES.length;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % total), 4000);
    return () => window.clearInterval(id);
  }, [total]);

  const next = () => setI((v) => (v + 1) % total);
  const prev = () => setI((v) => (v - 1 + total) % total);

  return (
    <section className="hero" aria-label="Bewild — reforma de studios em São Paulo">
      <div className="hero__slides" aria-hidden="true">
        {HERO_SLIDES.map((s, idx) => (
          <div key={s.src} className={"hero__slide" + (idx === i ? " is-on" : "")}>
            <img
              src={s.src}
              alt=""
              loading={idx === 0 ? "eager" : "lazy"}
              decoding={idx === 0 ? "sync" : "async"}
              {...(idx === 0 ? ({ fetchpriority: "high" } as { fetchpriority: string }) : {})}
            />
          </div>
        ))}
        <div className="hero__scrim" />
      </div>

      <div className="hero__ticker">São Paulo · 2026</div>

      <div className="hero__inner">
        <div className="hero__col">
          <div className="hero__eyebrow">Reforma turn-key · Studios</div>
          <h1 className="hero__h1">
            Reformamos seu studio <em>por completo</em>. Você não vira <em>gerente de obra</em>.
          </h1>
          <p className="hero__sub">
            Projeto, obra, marcenaria e mobília. Entregamos pronto para morar, alugar ou vender.
          </p>
          <a
            href="/diagnostico"
            className="btn btn-light"
            onClick={() => trackEvent("cta_click", { location: "hero", label: "solicitar_diagnostico" })}
          >
            Solicitar diagnóstico <span className="ar" aria-hidden>→</span>
          </a>
        </div>
      </div>

      <div className="hero__controls" aria-label="Controles do slider">
        <button type="button" className="hero__nav" aria-label="Slide anterior" onClick={prev}>
          <ChevronLeft size={18} />
        </button>
        <div className="hero__count">
          {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
        <div className="hero__dots" role="tablist">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={"hero__dot" + (idx === i ? " is-on" : "")}
              aria-label={`Ir ao slide ${idx + 1}`}
              aria-selected={idx === i}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
        <button type="button" className="hero__nav" aria-label="Próximo slide" onClick={next}>
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}

/* ============ Portfolio slot (3 cards) ============ */
type Card = { href: string; img: string; title: string; area: string; meta: string };
function usePortfolioCards(): Card[] {
  const { projects } = useBewildProjects();
  const list = projects.slice(0, 3);
  if (list.length === 3) {
    return list.map((p) => ({
      href: `/portfolio/${p.slug}`,
      img: p.cover_url ?? projFallback1.url,
      title: `Studio ${p.neighborhood ?? p.location ?? p.title}`,
      area: p.area_m2 ? `${p.area_m2} m²` : "",
      meta: `${projectTypeLabel(p.project_type)} · 2026`,
    }));
  }
  return [
    { href: "/portfolio", img: projFallback1.url, title: "Studio Vila Olímpia", area: "24 m²", meta: "Turn-key · 2026" },
    { href: "/portfolio", img: projFallback2.url, title: "Studio Pinheiros", area: "28 m²", meta: "Short stay · 2025" },
    { href: "/portfolio", img: projFallback3.url, title: "Studio Brooklin", area: "32 m²", meta: "Turn-key · 2025" },
  ];
}
function projectTypeLabel(t: string | null | undefined) {
  if (t === "short_stay") return "Short stay";
  if (t === "turn_key") return "Turn-key";
  if (t === "planta") return "Planta";
  return "Projeto";
}

/* ============ Reveals ============ */
function useReveals(root: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(".rv"));
    if (items.length === 0) return;
    if (typeof IntersectionObserver === "undefined") {
      items.forEach((it) => it.classList.add("in"));
      return;
    }
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
    items.forEach((it) => io.observe(it));
    // Safety net: se nada revelou em 2s, mostra tudo.
    const safety = window.setTimeout(() => items.forEach((it) => it.classList.add("in")), 2000);
    return () => { io.disconnect(); window.clearTimeout(safety); };
  }, [root]);
}

/* ============ Página ============ */
export default function HomePage() {
  const { settings } = useSiteSettings();
  useSeo({
    title: "Reforma completa de studios em São Paulo | Bewild",
    description:
      "A Bewild reforma seu studio por completo: projeto de arquitetura, obra, marcenaria e mobília em um único contrato. Entrega pronta para morar, alugar ou vender.",
    canonicalPath: "/",
    ogType: "website",
    jsonLd: settings
      ? [faqJsonLd(FAQS), professionalServiceJsonLd(settings)]
      : [faqJsonLd(FAQS)],
  });

  const rootRef = useRef<HTMLDivElement>(null);
  useReveals(rootRef);

  const cards = usePortfolioCards();

  return (
    <div className="bw-home" ref={rootRef}>
      <HomeNav />
      <Hero />

      {/* 01 O que fazemos */}
      <section className="section" id="fazemos" aria-labelledby="s01-h">
        <div className="wrap">
          <div className="sec-label">
            <span className="lbl">O que fazemos · 01</span>
            <span className="lbl">Um contrato · preço e prazo fechados</span>
          </div>
          <h2 id="s01-h" className="h rv">
            Você assina <em>um único contrato</em>, com preço e prazo definidos antes de a obra começar. Daí em diante, o trabalho é <em>nosso</em>.
          </h2>
          <ol className="list-num" role="list">
            {FAZEMOS.map(([n, t, d]) => (
              <li className="list-num__item rv" key={n}>
                <span className="list-num__num">{n}</span>
                <span className="list-num__t">{t}</span>
                <span className="list-num__d">{d}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 02 Projetos */}
      <section className="section" id="projetos" aria-labelledby="s02-h">
        <div className="wrap">
          <div className="sec-label">
            <span className="lbl">Projetos entregues · 02</span>
            <span className="lbl">Selecionados · 2024–2026</span>
          </div>
          <h2 id="s02-h" className="h rv">Alguns dos studios que a Bewild já entregou em São Paulo.</h2>
          <div className="projects">
            {cards.map((c, i) => (
              <a className="proj rv" href={c.href} key={c.href + i}>
                <div className="proj__media">
                  <img src={c.img} alt={c.title} loading="lazy" />
                  <span className="proj__count">{String(i + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}</span>
                  <span className="proj__link">ver projeto →</span>
                </div>
                <div className="proj__t">{c.title} {c.area && <em>{c.area}</em>}</div>
                <div className="proj__meta">{c.meta}</div>
              </a>
            ))}
          </div>
          <div className="projects-cta rv">
            <a href="/portfolio" className="btn">
              Visitar portfólio completo <span className="ar" aria-hidden>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* 03 Sem dor de cabeça */}
      <section className="section section--alt" id="sem-dor" aria-labelledby="s03-h">
        <div className="wrap">
          <div className="sec-label"><span className="lbl">Sem dor de cabeça · 03</span></div>
          <h2 id="s03-h" className="h rv">
            Quem reforma por conta própria vira <em>comprador de material</em>, <em>fiscal de pedreiro</em> e <em>despachante de condomínio</em>. Na Bewild, isso tudo fica do nosso lado do contrato.
          </h2>

          <div className="split2 rv">
            <div>
              <h3>Com você ficam três coisas</h3>
              <ul>
                <li>Aprovar o projeto.</li>
                <li>Acompanhar pelo celular, se quiser.</li>
                <li>Receber as chaves.</li>
              </ul>
            </div>
            <div>
              <h3>Com a gente fica o resto</h3>
              <ul>
                <li>Gestão da equipe e do canteiro.</li>
                <li>Compra e conferência de material.</li>
                <li>Documentação, ART e CREA.</li>
                <li>Liberação no condomínio.</li>
                <li>Vistoria do imóvel.</li>
                <li>Prazo, logística e imprevistos.</li>
              </ul>
            </div>
          </div>

          <div className="incluso rv">
            <h3>Já incluso no contrato, sem custo extra</h3>
            <ul>
              {INCLUSO.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>

          <div className="pillars">
            <div className="pillar rv">
              <div className="pillar__n">01</div>
              <div className="pillar__t">Preço fechado</div>
              <div className="pillar__d">Se a obra custar mais do que o combinado, a diferença é por nossa conta.</div>
            </div>
            <div className="pillar rv">
              <div className="pillar__n">02</div>
              <div className="pillar__t">Prazo em contrato</div>
              <div className="pillar__d">Você sabe a data de entrega no dia da assinatura.</div>
            </div>
            <div className="pillar rv">
              <div className="pillar__n">03</div>
              <div className="pillar__t">5 anos de garantia</div>
              <div className="pillar__d">Obra e marcenaria com garantia Bewild, conforme termo contratual.</div>
            </div>
          </div>

          <div className="norms rv">
            ART · CREA · NBR 16280 · NBR 5410 · NBR 16401 · NBR 14917 · NBR 13749 · NBR 14033
          </div>
        </div>
      </section>

      {/* 04 Workflow (dark) */}
      <section className="section section--dark" id="workflow" aria-labelledby="s04-h">
        <div className="wrap">
          <div className="sec-label"><span className="lbl">Obra sem caixa preta · 04</span></div>
          <div className="wf">
            <div>
              <h2 id="s04-h" className="wf__t">Sua obra inteira <em>na tela do celular</em>.</h2>
              <p className="wf__p">
                O Bwild Workflow é o portal onde você acompanha tudo: cronograma por etapa, fotos da evolução, decisões registradas, compras e fornecedores organizados. Você abre e sabe em que pé a obra está, sem precisar cobrar ninguém no WhatsApp.
              </p>
              <a
                href="https://bwildworkflow.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-dark-ghost"
                onClick={() => trackEvent("cta_click", { location: "workflow", label: "ver_demonstracao" })}
              >
                Ver demonstração <span className="ar" aria-hidden>→</span>
              </a>
            </div>

            <div className="wf__demo rv" role="img" aria-label="Tela do Bwild Workflow com cronograma e etapas">
              <div className="wf__demo-head">
                <span className="wf__demo-brand"><i /> Bwild Workflow</span>
                <span className="wf__demo-per">Jun 2026</span>
              </div>
              <div className="wf__demo-tabs">
                <span className="on">Curva S</span>
                <span>Relatórios</span>
                <span>Atividade</span>
              </div>
              <div className="wf__demo-title">Studio Urban Flex · 22 m²</div>
              <div className="wf__demo-cap">Semana 6 de 10</div>
              <div className="wf__demo-kpis">
                <div className="wf__demo-kpi"><span className="lab">Concluído</span><span className="val">52%</span></div>
                <div className="wf__demo-kpi"><span className="lab">Status</span><span className="val"><span className="dot" /> No prazo</span></div>
                <div className="wf__demo-kpi"><span className="lab">Cronograma</span><span className="val">Sem 6/10</span></div>
              </div>
              <ul>
                <li><i>✓</i> Demolição e remoção <span className="st ok">Concluída</span></li>
                <li><i>✓</i> Elétrica e hidráulica <span className="st ok">Concluída</span></li>
                <li><i>◐</i> Marcenaria sob medida <span className="st">Em andamento · 60%</span></li>
                <li><i>○</i> Montagem e enxoval <span className="st">A iniciar</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 05 Prova — 2 blocos editoriais */}
      <section className="section" id="prova" aria-labelledby="s05-h">
        <div className="wrap">
          <div className="sec-label"><span className="lbl">Prova · 05</span></div>
          <h2 id="s05-h" className="h rv" style={{ marginBottom: 0 }}>Quem já reformou com a Bewild.</h2>
        </div>

        <div className="proof" style={{ marginTop: 48 }}>
          <div className="proof__media">
            <video
              src={depoimentoVideo.url}
              muted
              playsInline
              loop
              autoPlay
              preload="metadata"
              aria-label="Depoimento em vídeo de cliente da Bewild"
            />
          </div>
          <div className="proof__panel">
            <span className="proof__word" aria-hidden>confiança</span>
            <div className="proof__inner rv">
              <div className="proof__count">Depoimento · 01 / 02</div>
              {/* TODO: substituir pela frase real extraída do vídeo da Vivian. */}
              <p className="proof__quote">“Uma empresa <em>humana</em>, do começo ao fim.”</p>
              <p className="proof__desc">
                A Vivian reformou o studio dela com a Bewild e contou como foi acompanhar tudo sem entrar na obra. Depoimento gravado sem roteiro.
              </p>
            </div>
          </div>
        </div>

        <div className="proof reverse">
          <div className="proof__media">
            <img src={rafaelOcupacao.url} alt="Print do calendário do Airbnb do studio do Rafael com novembro cheio" loading="lazy" />
          </div>
          <div className="proof__panel">
            <span className="proof__word" aria-hidden>renda</span>
            <div className="proof__inner rv">
              <div className="proof__count">Resultado · 02 / 02</div>
              <div className="proof__stat">70%</div>
              <div className="proof__stat-sub">de ocupação em novembro</div>
              <p className="proof__desc">
                O Rafael tinha um studio parado no Butantã. A Bewild reformou e entregou pronto para operar. Ele anunciou no Airbnb e fechou novembro com 70% de ocupação. “Esses studios serão um negócio para mim. Renda vitalícia.” Com prints reais do calendário e do anúncio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 06 Objetivos */}
      <section className="section" id="objetivos" aria-labelledby="s06-h">
        <div className="wrap">
          <div className="sec-label"><span className="lbl">Para cada objetivo · 05</span></div>
          <h2 id="s06-h" className="h rv">
            O contrato é o mesmo. O projeto muda <em>conforme o seu objetivo</em>.
          </h2>
          <div className="goals">
            <div className="goal rv">
              <div className="goal__n">01</div>
              <div className="goal__t">Morar</div>
              <div className="goal__d">Seu apê do seu jeito, sem viver dentro de uma obra. Projeto pensado para a sua rotina, entrega com tudo instalado. É só mudar.</div>
            </div>
            <div className="goal rv">
              <div className="goal__n">02</div>
              <div className="goal__t">Alugar</div>
              <div className="goal__d">Studios desenhados para performar na locação, de curta ou longa temporada. O projeto já nasce pensando em conforto, foto de anúncio e ocupação.</div>
            </div>
            <div className="goal rv">
              <div className="goal__n">03</div>
              <div className="goal__t">Vender</div>
              <div className="goal__d">Reforma com foco em valorização e liquidez. Projeto e materiais para o comprador daquela região, imóvel fotografável e pronto para anunciar.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 07 Compare */}
      <section className="section section--alt" id="compare" aria-labelledby="s07-h">
        <div className="wrap">
          <div className="sec-label"><span className="lbl">Compare · 06</span></div>
          <h2 id="s07-h" className="h rv">Uma comparação honesta.</h2>
          <div className="compare rv">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Sozinho</th>
                  <th>Reformeiro</th>
                  <th>Arquiteto + empreiteiro</th>
                  <th className="us">Bewild</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>
                    <td>{row[3]}</td>
                    <td className="us">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="compare-cards">
              {[
                { label: "Sozinho", idx: 1 },
                { label: "Reformeiro", idx: 2 },
                { label: "Arquiteto + empreiteiro", idx: 3 },
                { label: "Bewild", idx: 4, us: true },
              ].map(({ label, idx, us }) => (
                <div key={label} className={"compare-card" + (us ? " us" : "")}>
                  <h4>{label}</h4>
                  <dl>
                    {COMPARE_ROWS.map((r) => (
                      <div key={r[0]}>
                        <dt>{r[0]}</dt>
                        <dd>{r[idx as 1 | 2 | 3 | 4]}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
          <p className="compare-note rv">
            Se a sua prioridade é o orçamento mais barato da lista, ou se você prefere tocar a obra e contratar cada fornecedor por conta própria, a gente provavelmente não é a melhor escolha. Nosso trabalho é para quem quer assinar com uma empresa só e receber o imóvel pronto.
          </p>
        </div>
      </section>

      {/* 08 Manifesto */}
      <section className="section" id="manifesto" aria-labelledby="s08-h">
        <div className="wrap">
          <div className="sec-label"><span className="lbl" style={{ margin: "0 auto" } as CSSProperties}>Manifesto · 07</span></div>
          <div className="manifesto">
            <p className="rv" id="s08-h">
              A Bewild nasceu <em>inconformada</em> com o padrão do mercado. Com obra que atrasa, orçamento que estoura e cliente tratado como visita no próprio imóvel. Por isso medimos <em>cada centímetro</em> antes do primeiro corte, desenhamos como quem assina e entregamos <em>mais do que o combinado</em>.
            </p>
            <div className="tag rv">Ambição selvagem · Processo disciplinado</div>
            <div className="close rv">Be wild. <em>Built by the wild ones.</em></div>
          </div>
        </div>
      </section>

      {/* 09 FAQ */}
      <section className="section section--alt" id="faq" aria-labelledby="s09-h">
        <div className="wrap">
          <div className="sec-label"><span className="lbl">FAQ · 08</span></div>
          <h2 id="s09-h" className="h rv">Perguntas mais comuns.</h2>
          <div className="faq-list">
            {FAQS.map((f) => (
              <details className="faq-item rv" key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="final" id="contato" aria-labelledby="sfin-h">
        <div className="final__bg" aria-hidden>
          <img src={finalBg.url} alt="" loading="lazy" />
        </div>
        <div className="final__inner">
          <div className="lbl">Contato · 09</div>
          <h2 id="sfin-h">Vamos avaliar <em>o seu studio?</em></h2>
          <p>
            Conta para a gente o que você tem e o que quer fazer com ele. A gente analisa o potencial do imóvel e volta com um caminho claro, sem compromisso.
          </p>
          <a
            href="/diagnostico"
            className="btn btn-invert"
            onClick={() => trackEvent("cta_click", { location: "final", label: "solicitar_diagnostico" })}
          >
            Solicitar diagnóstico <span className="ar" aria-hidden>→</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-foot">
        <div className="site-foot__big" aria-hidden>BE WILD</div>
        <div className="site-foot__row">
          <div className="site-foot__brand">Bewild</div>
          <div className="site-foot__meta">
            <span>Arquitetura e reforma de studios</span>
            <span>São Paulo</span>
            <a href="https://bwildworkflow.com" target="_blank" rel="noopener noreferrer">Área do cliente</a>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
