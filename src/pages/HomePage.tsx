/**
 * HomePage — Bewild Home (porte literal do HTML aprovado).
 *
 * Estrutura, copy, espaçamentos e hierarquia idênticos ao HTML fonte.
 * Classes com prefixo `bwh-` para isolar do CSS global (evita o
 * `.projects { background: var(--ink) }` de src/index.css pintar o
 * bloco de projetos de navy).
 *
 * Nav global: `BewildSiteNav` (variante home). Footer global:
 * `SiteFooter`, com faixa BE WILD imediatamente acima.
 * "turn-key/turnkey" só aparece na resposta 1 do FAQ.
 */
import { useEffect, useRef, useState } from "react";
import { useSeo, faqJsonLd, professionalServiceJsonLd } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { useBewildProjects } from "@/lib/useBewildProjects";
import { trackEvent } from "@/lib/ga4";
import BewildSiteNav from "@/components/BewildSiteNav";
import SiteFooter from "@/components/SiteFooter";
import "@/styles/home.css";

import slide1 from "@/assets/hero-slides/erik-03-8-1.png.asset.json";
import slide2 from "@/assets/hero-slides/marcos-6-2.png.asset.json";
import slide3 from "@/assets/hero-slides/rodrigo-1-1.png.asset.json";
import slide4 from "@/assets/hero-slides/premium-11-2.png.asset.json";
import projFallback1 from "@/assets/hero-slides/rodrigo-8.png.asset.json";
import projFallback2 from "@/assets/hero-slides/marcos-10-4.png.asset.json";
import projFallback3 from "@/assets/hero-slides/premium-7-4.png.asset.json";
// TODO: par ilustrativo — trocar por 3D aprovado + foto de entrega do MESMO projeto
import cmp3dBefore from "@/assets/hero-slides/rodrigo-1-1.png.asset.json";
import cmp3dAfter from "@/assets/hero-slides/rodrigo-8.png.asset.json";
import finalBg from "@/assets/hero-slides/erik-03-11.png.asset.json";
import depoimentoVideo from "@/assets/testimonials/depoimento-cliente.mp4.asset.json";
import depoimentoPoster from "@/assets/hero-slides/rodrigo-15-1.png.asset.json";
import rafaelOcupacao from "@/assets/testimonials/rafael/rafael-ocupacao-novembro.jpeg.asset.json";
import rafaelAirbnb from "@/assets/testimonials/rafael/rafael-airbnb-butanta.jpeg.asset.json";

const HERO_SLIDES = [
  { src: slide1.url, alt: "Studio reformado pela Bewild em São Paulo" },
  { src: slide2.url, alt: "Interior de studio compacto com marcenaria sob medida" },
  { src: slide3.url, alt: "Studio pronto para short stay em São Paulo" },
  { src: slide4.url, alt: "Studio entregue pela Bewild em São Paulo" },
];

const FAZEMOS: Array<[string, string, string]> = [
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
const COMPARE_COLS = ["Sozinho", "Reformeiro", "Arquiteto + empreiteiro", "Bewild"] as const;

const FAQS: Array<{ q: string; a: string }> = [
  { q: "O que é uma reforma turnkey?", a: "Turnkey quer dizer chave na mão. Você assina um contrato, a gente executa tudo e devolve o imóvel pronto para usar. É o modelo da Bewild desde o primeiro projeto." },
  { q: "O que vocês chamam de contrato fechado?", a: "Preço e prazo definidos e assinados antes de a obra começar. Se o valor ultrapassar o combinado, a diferença é por nossa conta." },
  { q: "Vocês só reformam para Airbnb?", a: "Não. Reformamos para morar, para alugar em curta ou longa temporada e para vender. O projeto muda conforme o objetivo." },
  { q: "Preciso ir à obra?", a: "Só se você quiser. Todo o acompanhamento acontece pelo Bwild Workflow. E moradores de fora de São Paulo contam com vistoria por procuração, ligação de energia e instalação de internet feitas pela gente." },
  { q: "Quanto tempo leva uma reforma?", a: "A maioria fica pronta em torno de 60 dias úteis. A sua data exata sai definida no contrato, antes de a obra começar." },
];

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
    <section className="bwh-hero" aria-label="Bewild, reforma de studios em São Paulo">
      <div className="bwh-hero__slides" aria-hidden="true">
        {HERO_SLIDES.map((s, idx) => (
          <div key={s.src} className={"bwh-hero__slide" + (idx === i ? " is-on" : "")}>
            <img
              src={s.src}
              alt=""
              loading={idx === 0 ? "eager" : "lazy"}
              decoding={idx === 0 ? "sync" : "async"}
              {...(idx === 0 ? ({ fetchpriority: "high" } as { fetchpriority: string }) : {})}
            />
          </div>
        ))}
        <div className="bwh-hero__scrim" />
      </div>

      <div className="bwh-hero__inner">
        <div className="bwh-hero__col">
          <h1>
            Reformamos seu studio <em>por completo</em>. Você não vira <em>gerente de obra</em>.
          </h1>
          <p className="bwh-hero__sub">
            Projeto, obra, marcenaria e mobília. Entregamos pronto para morar, alugar ou vender.
          </p>
          <a
            className="bwh-btn bwh-btn--onphoto"
            href="/diagnostico"
            onClick={() => trackEvent("cta_click", { location: "hero", label: "solicitar_diagnostico" })}
          >
            Solicitar diagnóstico <span className="bwh-ar" aria-hidden="true">→</span>
          </a>

          {/* Timeline comprimida (Dia 0 → Dia 60) */}
          <div className="bwh-tl" aria-hidden="true">
            <div className="bwh-tl__p">
              <span className="bwh-tl__dot" />
              <span className="bwh-tl__d">Dia 0</span>
              <span className="bwh-tl__l">assinatura</span>
            </div>
            <div className="bwh-tl__mid">
              <b>a obra acontece do nosso lado</b>
              <span>você acompanha pelo Bwild Workflow</span>
            </div>
            <div className="bwh-tl__p bwh-tl__p--r">
              <span className="bwh-tl__dot" />
              <span className="bwh-tl__d">≈ Dia 60</span>
              <span className="bwh-tl__l">chaves na mão</span>
            </div>
          </div>
        </div>
      </div>


      <div className="bwh-hero__scrollhint" aria-hidden="true">
        <span>scroll</span>
        <span className="bwh-hero__scrollline" />
      </div>

      <div className="bwh-hero__controls">
        <button type="button" className="bwh-hero__arrow" aria-label="Slide anterior" onClick={prev}>←</button>
        <span className="bwh-hero__count">
          {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span className="bwh-hero__dots" role="tablist">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={"bwh-hero__dot" + (idx === i ? " is-on" : "")}
              aria-label={`Ir ao slide ${idx + 1}`}
              aria-selected={idx === i}
              onClick={() => setI(idx)}
            />
          ))}
        </span>
        <button type="button" className="bwh-hero__arrow" aria-label="Próximo slide" onClick={next}>→</button>
      </div>
    </section>
  );
}

/* ============ Cards de projeto ============ */
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
    { href: "/portfolio", img: projFallback1.url, title: "Studio Vila Olímpia", area: "24 m²", meta: "Reforma completa · 2026" },
    { href: "/portfolio", img: projFallback2.url, title: "Studio Pinheiros", area: "28 m²", meta: "Short stay · 2025" },
    { href: "/portfolio", img: projFallback3.url, title: "Studio Brooklin", area: "32 m²", meta: "Reforma completa · 2025" },
  ];
}
function projectTypeLabel(t: string | null | undefined) {
  if (t === "short_stay") return "Short stay";
  if (t === "turn_key") return "Reforma completa";
  if (t === "planta") return "Planta";
  return "Projeto";
}

/* ============ Reveals ============ */
function useReveals(root: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(".bwh-rv"));
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
    const safety = window.setTimeout(() => items.forEach((it) => it.classList.add("in")), 2000);
    return () => { io.disconnect(); window.clearTimeout(safety); };
  }, [root]);
}

/* ============ Portal (Bwild Workflow) — bloco fiel ============ */
function PortalMock() {
  return (
    <div className="bwh-pf bwh-rv" role="img" aria-label="Tela ilustrativa do Bwild Workflow">
      <div className="bwh-pf__chrome">
        <div className="bwh-pf__brand"><span className="bwh-pf__dot" /><span>Bwild Workflow</span></div>
        <div className="bwh-pf__per">Jun 2026</div>
      </div>
      <div className="bwh-pf__tabs">
        <span className="bwh-pf__tab act">Curva S</span>
        <span className="bwh-pf__tab">Relatórios</span>
        <span className="bwh-pf__tab">Atividade</span>
      </div>
      <div className="bwh-pf__body">
        <div>
          <div className="bwh-pf__hrow">
            <b className="bwh-pf__title">Studio Urban Flex · 22 m²</b>
            <span className="bwh-pf__pill bwh-pf__pill--info">Em obra</span>
          </div>
          <div className="bwh-pf__cap">Semana 6 de 10</div>
        </div>
        <div className="bwh-pf__kpis">
          <div className="bwh-pf__kpi"><span className="bwh-pf__klab">Concluído</span><span className="bwh-pf__kval">52%</span></div>
          <div className="bwh-pf__kpi"><span className="bwh-pf__klab">Status</span><span className="bwh-pf__kval"><span className="bwh-pf__sdot" />No prazo</span></div>
          <div className="bwh-pf__kpi"><span className="bwh-pf__klab">Cronograma</span><span className="bwh-pf__kval">Sem 6/10</span></div>
        </div>
        <div className="bwh-pf__chart">
          <div className="bwh-pf__legend">
            <span className="bwh-pf__leg"><span className="bwh-pf__ll bwh-pf__ll--real" />Real</span>
            <span className="bwh-pf__leg"><span className="bwh-pf__ll bwh-pf__ll--plan" />Planejado</span>
          </div>
          <svg viewBox="0 0 320 150" className="bwh-pf__svg" aria-hidden="true">
            <defs>
              <linearGradient id="bwhPfa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#005B99" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#005B99" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="34" y1="16" x2="312" y2="16" stroke="#E7EAEE" />
            <line x1="34" y1="42" x2="312" y2="42" stroke="#E7EAEE" />
            <line x1="34" y1="68" x2="312" y2="68" stroke="#E7EAEE" />
            <line x1="34" y1="94" x2="312" y2="94" stroke="#E7EAEE" />
            <line x1="34" y1="120" x2="312" y2="120" stroke="#E7EAEE" />
            <text x="26" y="20" textAnchor="end" className="bwh-pf__axis">100</text>
            <text x="26" y="72" textAnchor="end" className="bwh-pf__axis">50</text>
            <text x="26" y="124" textAnchor="end" className="bwh-pf__axis">0</text>
            <path d="M34 120 C 110 118, 150 70, 180 56 S 270 22, 312 16" fill="none" stroke="#8A8272" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
            <path d="M34 120 C 90 119, 130 96, 160 82 S 195 70, 200 66 L200 120 L34 120 Z" fill="url(#bwhPfa)" />
            <path d="M34 120 C 90 119, 130 96, 160 82 S 195 70, 200 66" fill="none" stroke="#005B99" strokeWidth="2" strokeLinecap="round" />
            <circle cx="200" cy="66" r="5" fill="#005B99" stroke="#fff" strokeWidth="2" />
            <text x="34" y="142" className="bwh-pf__axis">Início</text>
            <text x="200" y="142" textAnchor="middle" className="bwh-pf__axis">Sem 6</text>
            <text x="312" y="142" textAnchor="end" className="bwh-pf__axis">Entrega</text>
          </svg>
        </div>
        <ul className="bwh-pf__stages">
          <li className="bwh-pf__stage"><span className="bwh-pf__sic bwh-pf__sic--ok">✓</span><span className="bwh-pf__slab">Demolição e remoção</span><span className="bwh-pf__sst ok">Concluída</span></li>
          <li className="bwh-pf__stage"><span className="bwh-pf__sic bwh-pf__sic--ok">✓</span><span className="bwh-pf__slab">Elétrica e hidráulica</span><span className="bwh-pf__sst ok">Concluída</span></li>
          <li className="bwh-pf__stage"><span className="bwh-pf__sic bwh-pf__sic--warn">◐</span><span className="bwh-pf__slab">Marcenaria sob medida</span><span className="bwh-pf__smeta"><span className="bwh-pf__pill bwh-pf__pill--warn">em andamento</span><span className="bwh-pf__spct">60%</span></span></li>
          <li className="bwh-pf__stage"><span className="bwh-pf__sic bwh-pf__sic--todo">○</span><span className="bwh-pf__slab mut">Montagem e enxoval</span><span className="bwh-pf__sst mut">A iniciar</span></li>
        </ul>
      </div>
      <div className="bwh-pf__foot">Atualizado hoje. Relatório semanal #6: marcenaria instalada, elétrica revisada.</div>
    </div>
  );
}

/* ============ Loader de entrada (assinatura premium) ============ */
function EntryLoader() {
  const [mounted, setMounted] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    try { if (sessionStorage.getItem("bwh_loader_done") === "1") return false; } catch { /* ignore */ }
    return true;
  });
  const [out, setOut] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!mounted) return;
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setCount(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setOut(true);
        window.setTimeout(finish, 520);
      }
    };
    raf = requestAnimationFrame(tick);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      try { sessionStorage.setItem("bwh_loader_done", "1"); } catch { /* ignore */ }
      setMounted(false);
    };
    const failsafe = window.setTimeout(finish, 2500);

    return () => { cancelAnimationFrame(raf); window.clearTimeout(failsafe); };
  }, [mounted]);

  if (!mounted) return null;
  return (
    <div className={"bwh-loader" + (out ? " is-out" : "")} aria-hidden="true">
      <div className="bwh-loader__mark">Bewild</div>
      <div className="bwh-loader__count">{String(count).padStart(3, "0")}</div>
    </div>
  );
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
    <div className="bwh" ref={rootRef}>
      <EntryLoader />
      <BewildSiteNav />
      <main id="top">
        <Hero />

        {/* 01 O que fazemos */}
        <section className="bwh-sec" id="como-funciona" aria-labelledby="s01h">
          <div className="bwh-wrap">
            <div className="bwh-srlabel">
              <span className="bwh-mono">O que fazemos · 01</span>
              <span className="bwh-mono">Um contrato · preço e prazo fechados</span>
            </div>
            <h2 id="s01h" className="bwh-h2 bwh-rv">
              Você assina <em>um único contrato</em>, com preço e prazo definidos antes de a obra começar. Daí em diante, o trabalho é <em>nosso</em>.
            </h2>
            <ol className="bwh-list">
              {FAZEMOS.map(([n, t, d]) => (
                <li className="bwh-rv" key={n}>
                  <span className="n">{n}</span>
                  <span className="t">{t}</span>
                  <span className="d">{d}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 02 Projetos */}
        <section className="bwh-sec" id="projetos" aria-labelledby="s02h" style={{ paddingTop: 0 }}>
          <div className="bwh-wrap">
            <div className="bwh-srlabel">
              <span className="bwh-mono">Projetos entregues · 02</span>
              <span className="bwh-mono">Selecionados · 2024–2026</span>
            </div>
            <h2 id="s02h" className="bwh-sr-only">Studios que a Bewild já entregou em São Paulo.</h2>
            <div className="bwh-projects">
              {cards.map((c, i) => (
                <a className="bwh-proj bwh-rv" href={c.href} key={c.href + i}>
                  <span className="bwh-proj__media">
                    <img src={c.img} alt={c.title} loading="lazy" />
                    <span className="bwh-proj__count">{String(i + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}</span>
                    <span className="bwh-proj__go">ver projeto →</span>
                  </span>
                  <span className="bwh-proj__t">{c.title} {c.area && <em>{c.area}</em>}</span>
                  <span className="bwh-proj__meta">{c.meta}</span>
                </a>
              ))}
            </div>
            <div className="bwh-projects-cta bwh-rv">
              <a className="bwh-btn" href="/portfolio">
                Visitar portfólio completo <span className="bwh-ar" aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>

        {/* 03 Por que a Bewild */}
        <section className="bwh-sec bwh-sec--alt" id="por-que-a-bewild" aria-labelledby="s03h">
          <div className="bwh-wrap">
            <div className="bwh-srlabel" style={{ borderColor: "#E0D8C8" }}>
              <span className="bwh-mono">Sem dor de cabeça · 03</span>
            </div>
            <h2 id="s03h" className="bwh-h2 bwh-rv">
              Quem reforma por conta própria vira <em>comprador de material</em>, <em>fiscal de pedreiro</em> e <em>despachante de condomínio</em>. Na Bewild, isso tudo fica do nosso lado do contrato.
            </h2>
            <div className="bwh-split bwh-rv">
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
            <div className="bwh-incluso bwh-rv">
              <h3>Já incluso no contrato, sem custo extra</h3>
              <ul>{INCLUSO.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div className="bwh-pillars">
              <div className="bwh-pillar bwh-rv"><span className="n">01</span><div className="t">Preço fechado</div><div className="d">Se a obra custar mais do que o combinado, a diferença é por nossa conta.</div></div>
              <div className="bwh-pillar bwh-rv"><span className="n">02</span><div className="t">Prazo em contrato</div><div className="d">Você sabe a data de entrega no dia da assinatura.</div></div>
              <div className="bwh-pillar bwh-rv"><span className="n">03</span><div className="t">5 anos de garantia</div><div className="d">Obra e marcenaria com garantia Bewild, conforme termo contratual.</div></div>
            </div>
            <div className="bwh-norms bwh-rv">ART · CREA · NBR 16280 · NBR 5410 · NBR 16401 · NBR 14917 · NBR 13749 · NBR 14033</div>
          </div>
        </section>

        {/* 04 Workflow (dark) */}
        <section className="bwh-sec bwh-sec--dark" id="workflow" aria-labelledby="s04h">
          <div className="bwh-wrap">
            <div className="bwh-srlabel">
              <span className="bwh-mono">Obra sem caixa preta · 04</span>
            </div>
            <div className="bwh-wf">
              <div>
                <h2 id="s04h" className="bwh-wf__t bwh-rv">Sua obra inteira <em>na tela do celular</em>.</h2>
                <p className="bwh-wf__p bwh-rv">
                  O Bwild Workflow é o portal onde você acompanha tudo: cronograma por etapa, fotos da evolução, decisões registradas, compras e fornecedores organizados. Você abre e sabe em que pé a obra está, sem precisar cobrar ninguém no WhatsApp.
                </p>
                <a
                  className="bwh-btn bwh-btn--ghostdark bwh-rv"
                  href="https://bwildworkflow.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("cta_click", { location: "workflow", label: "ver_demonstracao" })}
                >
                  Ver demonstração <span className="bwh-ar" aria-hidden="true">→</span>
                </a>
              </div>
              <div className="bwh-wf__col bwh-rv">
                <PortalMock />
                <p className="bwh-wf__illus">Interface ilustrativa do portal de acompanhamento</p>
              </div>
            </div>
          </div>
        </section>

        {/* 05 Prova */}
        <section className="bwh-sec" id="prova" aria-labelledby="s05h" style={{ paddingBottom: 0 }}>
          <h2 id="s05h" className="bwh-sr-only">Quem já reformou com a Bewild.</h2>

          <div className="bwh-proof">
            <div className="bwh-proof__media">
              <video
                src={depoimentoVideo.url}
                poster={depoimentoPoster.url}
                controls
                playsInline
                preload="metadata"
                aria-label="Depoimento em vídeo da Vivian, cliente Bewild"
              />
            </div>
            <div className="bwh-proof__panel">
              <span className="bwh-proof__word" aria-hidden="true">confiança</span>
              <div className="bwh-proof__inner bwh-rv">
                <span className="bwh-proof__count">Depoimento · 01 / 02</span>
                <p className="bwh-proof__quote">“Uma empresa <em>humana</em>, do começo ao fim.”</p>
                <span className="bwh-tag">frase provisória · extrair do vídeo</span>
                <p className="bwh-proof__desc">
                  A Vivian reformou o studio dela com a Bewild e contou como foi acompanhar tudo sem entrar na obra. Depoimento gravado sem roteiro.
                </p>
              </div>
            </div>
          </div>

          <div className="bwh-proof bwh-proof--rev">
            <div className="bwh-proof__media bwh-dual">
              <figure>
                <img src={rafaelOcupacao.url} alt="Calendário do Airbnb do studio do Rafael no Butantã com novembro cheio" loading="lazy" />
                <figcaption>Novembro: 70% de ocupação</figcaption>
              </figure>
              <figure>
                <img src={rafaelAirbnb.url} alt="Anúncio no ar do studio do Rafael no Airbnb" loading="lazy" />
                <figcaption>Anúncio no ar no Airbnb</figcaption>
              </figure>
            </div>
            <div className="bwh-proof__panel">
              <span className="bwh-proof__word" aria-hidden="true">renda</span>
              <div className="bwh-proof__inner bwh-rv">
                <span className="bwh-proof__count">Resultado · 02 / 02</span>
                <div>
                  <div className="bwh-proof__stat">70%</div>
                  <div className="bwh-proof__statsub">de ocupação em novembro</div>
                </div>
                <p className="bwh-proof__desc">
                  O Rafael tinha um studio parado no Butantã. A Bewild reformou e entregou pronto para operar. Ele anunciou no Airbnb e fechou novembro com 70% de ocupação. “Esses studios serão um negócio para mim. Renda vitalícia.”
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 06 Objetivos */}
        <section className="bwh-sec" id="objetivos" aria-labelledby="s06h">
          <div className="bwh-wrap">
            <div className="bwh-srlabel">
              <span className="bwh-mono">Para cada objetivo · 05</span>
            </div>
            <h2 id="s06h" className="bwh-h2 bwh-rv">
              O contrato é o mesmo. O projeto muda <em>conforme o seu objetivo</em>.
            </h2>
            <div className="bwh-goals">
              <div className="bwh-goal bwh-rv"><span className="n">01</span><div className="t">Morar</div><div className="d">Seu apê do seu jeito, sem viver dentro de uma obra. Projeto pensado para a sua rotina, entrega com tudo instalado. É só mudar.</div></div>
              <div className="bwh-goal bwh-rv"><span className="n">02</span><div className="t">Alugar</div><div className="d">Studios desenhados para performar na locação, de curta ou longa temporada. O projeto já nasce pensando em conforto, foto de anúncio e ocupação.</div></div>
              <div className="bwh-goal bwh-rv"><span className="n">03</span><div className="t">Vender</div><div className="d">Reforma com foco em valorização e liquidez. Projeto e materiais para o comprador daquela região, imóvel fotografável e pronto para anunciar.</div></div>
            </div>
          </div>
        </section>

        {/* 07 Compare */}
        <section className="bwh-sec bwh-sec--alt" id="compare" aria-labelledby="s07h">
          <div className="bwh-wrap">
            <div className="bwh-srlabel" style={{ borderColor: "#E0D8C8" }}>
              <span className="bwh-mono">Compare · 06</span>
            </div>
            <h2 id="s07h" className="bwh-sr-only">Comparação entre alternativas de reforma.</h2>
            <div className="bwh-cmp bwh-rv">
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
              <div className="bwh-cmpcards">
                {COMPARE_COLS.map((label, colIdx) => {
                  const us = label === "Bewild";
                  return (
                    <div key={label} className={"bwh-cmpcard" + (us ? " us" : "")}>
                      <h4>{label}</h4>
                      <dl>
                        {COMPARE_ROWS.map((r) => (
                          <div key={r[0]}>
                            <dt>{r[0]}</dt>
                            <dd>{r[(colIdx + 1) as 1 | 2 | 3 | 4]}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="bwh-cmp-note bwh-rv">
              Se a sua prioridade é o orçamento mais barato da lista, ou se você prefere tocar a obra e contratar cada fornecedor por conta própria, a gente provavelmente não é a melhor escolha. Nosso trabalho é para quem quer assinar com uma empresa só e receber o imóvel pronto.
            </p>
          </div>
        </section>

        {/* 08 Manifesto */}
        <section className="bwh-sec" id="manifesto" aria-labelledby="s08h">
          <div className="bwh-wrap">
            <div className="bwh-srlabel" style={{ justifyContent: "center" }}>
              <span className="bwh-mono">Manifesto · 07</span>
            </div>
            <div className="bwh-manifesto">
              <p id="s08h" className="bwh-rv">
                A Bewild nasceu <em>inconformada</em> com o padrão do mercado. Com obra que atrasa, orçamento que estoura e cliente tratado como visita no próprio imóvel. Por isso medimos <em>cada centímetro</em> antes do primeiro corte, desenhamos como quem assina e entregamos <em>mais do que o combinado</em>.
              </p>
              <div className="bwh-mtag bwh-rv">Ambição selvagem · Processo disciplinado</div>
              <div className="bwh-mclose bwh-rv">Be wild. <em>Built by the wild ones.</em></div>
            </div>
          </div>
        </section>

        {/* 09 FAQ */}
        <section className="bwh-sec bwh-sec--alt" id="faq" aria-labelledby="s09h">
          <div className="bwh-wrap">
            <div className="bwh-srlabel" style={{ borderColor: "#E0D8C8" }}>
              <span className="bwh-mono">FAQ · 08</span>
            </div>
            <h2 id="s09h" className="bwh-sr-only">Perguntas frequentes.</h2>
            <div className="bwh-faq">
              {FAQS.map((f) => (
                <details className="bwh-rv" key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="bwh-final" id="contato" aria-labelledby="sfh">
          <div className="bwh-final__bg" aria-hidden="true">
            <img src={finalBg.url} alt="" loading="lazy" />
          </div>
          <div className="bwh-final__inner">
            <div className="bwh-flabel">Contato · 09</div>
            <h2 id="sfh">Vamos avaliar <em>o seu studio?</em></h2>
            <p>
              Conta para a gente o que você tem e o que quer fazer com ele. A gente analisa o potencial do imóvel e volta com um caminho claro, sem compromisso.
            </p>
            <a
              className="bwh-btn bwh-btn--invert"
              href="/diagnostico"
              onClick={() => trackEvent("cta_click", { location: "final", label: "solicitar_diagnostico" })}
            >
              Solicitar diagnóstico <span className="bwh-ar" aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </main>

      {/* Faixa decorativa BE WILD (referência visual) acima do footer global */}
      <div className="bwh-band" aria-hidden="true">BE WILD</div>

      <SiteFooter />
    </div>
  );
}
