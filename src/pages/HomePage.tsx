/**
 * HomePage — Bewild Home v5 (direção "prancheta de arquitetura").
 *
 * Estrutura inteiramente reescrita conforme o protótipo de direção de arte.
 * Mantém o footer global (SiteFooter), a navegação unificada (BewildSiteNav),
 * o sticky CTA mobile, os assets de imagem/vídeo já em uso, e toda a camada
 * de SEO/analytics (useSeo + faqJsonLd + trackEvent + whatsappHref).
 */
import { useEffect, useRef } from "react";
import { useHomeFx } from "@/lib/useHomeFx";
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

const FAQS_HOME = [
  { q: "Quanto custa uma reforma dessas?", a: "Varia conforme o tamanho e o estado do studio. No diagnóstico a gente fecha o escopo e o valor, e ele não muda no meio da obra." },
  { q: "Quanto tempo demora?", a: "A maioria fica pronta em torno de 60 dias úteis. No diagnóstico você já recebe a data da sua." },
  { q: "Vocês só fazem a obra ou entregam pronto pra alugar?", a: "Entregamos pronto pra operar: obra, marcenaria, mobília, enxoval e as fotos pro anúncio." },
  { q: "Airbnb ainda vale a pena?", a: "Depende do bairro e do studio. Por isso o diagnóstico começa avaliando o potencial real de diária e ocupação da sua unidade." },
  { q: "Como sei que vai ficar bom?", a: "Você aprova o projeto antes, acompanha a obra pelo portal e tem 5 anos de garantia. Fora os mais de 150 studios já entregues." },
  { q: "Preciso já ter o imóvel?", a: "O ideal é já ter. Se ainda está escolhendo, a gente ajuda a avaliar se o studio tem potencial antes da compra." },
];

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

  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  // Reveal robusto (scroll-based) para .rv, .fade, .hair, .vbloco.
  // Determinístico: revela o que já está visível no load e o resto ao rolar.
  // Não depende de IntersectionObserver (que deixava blocos presos invisíveis
  // no mobile). Respeita prefers-reduced-motion.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(
      root.querySelectorAll<HTMLElement>(".rv, .fade, .hair, .vbloco"),
    );
    if (els.length === 0) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }

    let pending = els;
    let ticking = false;

    const reveal = () => {
      ticking = false;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const still: HTMLElement[] = [];
      for (const el of pending) {
        if (el.getBoundingClientRect().top < vh * 0.9) {
          el.classList.add("in");
        } else {
          still.push(el);
        }
      }
      pending = still;
      if (pending.length === 0) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(reveal);
    };

    requestAnimationFrame(reveal);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // O React nem sempre reflete o atributo `muted` no DOM, o que faz o
  // navegador bloquear o autoplay no mobile. Força muted real e dá play.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const vids = Array.from(
      root.querySelectorAll<HTMLVideoElement>("video[autoplay]"),
    );
    vids.forEach((v) => {
      v.muted = true;
      v.defaultMuted = true;
      const p = v.play();
      if (p && typeof (p as Promise<void>).catch === "function") {
        (p as Promise<void>).catch(() => {});
      }
    });
  }, []);

  useHomeFx(rootRef);

  const onCtaWhatsApp = () => {
    trackEvent("click_whatsapp", { category: "home_cta", label: "cta_final" });
  };

  const scrollToResultado = (e: React.MouseEvent) => {
    e.preventDefault();
    const t = document.getElementById("resultado");
    if (t) t.scrollIntoView({ behavior: "smooth" });
    trackEvent("click_prova_hero", { category: "rafael_butanta", label: "rafael_butanta" });
  };

  return (
    <div className="bw-home" ref={rootRef}>
      <div className="bw-grain" aria-hidden="true" />
      <div className="bw-frame" aria-hidden="true">
        <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
      </div>
      <div className="bw-titleblock" aria-hidden="true">
        BEWILD · GRUPO BWILD<br /><b>BW—001 / HOME</b><br />SÃO PAULO · BR
      </div>
      <div className="bw-sheetno" aria-hidden="true">SHEET 01 / 14</div>

      <BewildSiteNav />

      {/* ============ HERO ============ */}
      <section className="hero" id="top" aria-label="Bewild — reforma turn-key de studios">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-top">
          <div className="hero-eyebrow">
            <span className="mono tag">Reforma turn-key de studios · São Paulo</span>
          </div>
          <h1>
            <span className="rv" data-d="1"><span>Seu studio pronto para render.</span></span>
            <span className="rv lo" data-d="2"><span>Sem você virar gerente de obra.</span></span>
          </h1>
        </div>

        <div className="hero-row">
          <div className="hero-left">
            <p className="sub fade">
              Projeto, obra, marcenaria, mobília e setup num contrato só. Você acompanha tudo pelo portal. O trabalho fica com a gente.
            </p>
            <div className="cta fade">
              <a className="btn btn-cyan bw-magnetic" href="/diagnostico" data-cursor="hover">
                <span>Solicitar diagnóstico</span><span className="ar">→</span>
              </a>
              <a className="btn btn-ghost" href="/portfolio" data-cursor="hover">
                <span>Ver reformas entregues</span>
              </a>
            </div>
          </div>

          <div className="plate fade" aria-hidden="true">
            <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
            <img className="pl-img" src={studioPronto.url} alt="" loading="eager" />
            <div className="pl-label">
              <span>PL.01 — STUDIO / VILA OLÍMPIA</span>
              <span><b>22 M²</b></span>
            </div>
          </div>
        </div>

        <div className="hero-data">
          <div className="cell fade"><b>150+</b><span>studios entregues</span></div>
          <div className="cell fade"><b>60</b><span>dias úteis · a partir de</span></div>
          <div className="cell fade"><b>05</b><span>anos de garantia</span></div>
          <a
            href="#resultado"
            className="hero-proof fade"
            onClick={scrollToResultado}
            aria-label="Caso real: 70% de ocupação em novembro num studio no Butantã"
          >
            <span className="pin">Caso real — Butantã</span>
            <span className="hl">70% de ocupação</span> em novembro, num studio entregue pela Bewild. <span style={{ color: "var(--sky)" }}>ver →</span>
          </a>
        </div>

        <div className="hero-status" aria-hidden="true">
          <span className="sc">ROLE — 01 / 14</span>
          <span>LAT -23.5965 · LON -46.6856</span>
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <div className="marquee" aria-hidden="true">
        <div className="trk">
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
        </div>
      </div>

      {/* ============ MANIFESTO ============ */}
      <section className="manifesto" id="manifesto" aria-label="Manifesto Bewild">
        <div className="sec-mark"><span className="n">01</span><span className="t">Manifesto</span><span className="ln" /></div>
        <div className="reveal-block">
          <div className="pre fade">Você nunca leu</div>
          <div className="build-row">
            <span className="build">Build.
              <svg className="strike" viewBox="0 0 320 24" preserveAspectRatio="none" fill="none">
                <path d="M4 15 C 80 8, 160 18, 250 9 S 312 12, 316 11" stroke="#2F86B8" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
          </div>
          <div className="rv" data-d="2"><div className="bewild">Você leu Be<i>wild</i>.</div></div>
        </div>
        <div className="manifesto-lede">
          <p className="big fade">Comprar um imóvel pra render não deveria virar um emprego.</p>
          <p className="fade">
            Ser <span className="wild">wild</span> é ter o ativo sem ser dominado por ele. A Bewild entrega o studio pronto pra render, sem você entrar na obra.
          </p>
        </div>

        <div className="descida">
          <div className="it fade"><div className="num">01</div><div className="nm">Arquitetura</div><div className="ds">Projeto, medição e humanização da planta.</div><div className="seal">não é sua</div></div>
          <div className="it fade"><div className="num">02</div><div className="nm">Obra</div><div className="ds">Demolição, hidráulica, elétrica e acabamento.</div><div className="seal">não é sua</div></div>
          <div className="it fade"><div className="num">03</div><div className="nm">Mobília</div><div className="ds">Marcenaria sob medida, mobiliário e enxoval.</div><div className="seal">não é sua</div></div>
        </div>

        <div className="closer fade">Fica o studio pronto. <b>Fica o seu tempo.</b></div>
      </section>

      {/* ============ PROBLEMA ============ */}
      <section className="sec sec-dark problema" id="problema" aria-label="O problema">
        <div className="sec-mark"><span className="n">02</span><span className="t">O problema</span><span className="ln" /></div>
        <div className="sec-head">
          <h2 className="fade">Comprar o studio é o passo fácil.</h2>
          <p className="lead fade">O difícil vem depois. Sem alguém pra assumir, tudo isso cai no seu colo. O que era pra ser investimento vira um segundo emprego.</p>
        </div>
        <div className="issues">
          {[
            ["OC—01", "Contratar e fiscalizar", "Achar pedreiro, marceneiro e eletricista. Depois correr atrás todo dia pra não atrasar."],
            ["OC—02", "Orçamento que escapa", "Começa num valor e termina em outro. Cada imprevisto sai do seu bolso."],
            ["OC—03", "Comprar tudo", "Móveis, eletro, enxoval, louça. São dezenas de decisões e entregas pra acompanhar."],
            ["OC—04", "Acertar o padrão", "Studio pra morar segue uma lógica. Studio pra render, outra. Errar isso derruba a diária."],
            ["OC—05", "Preparar pra operar", "Foto, anúncio, preço, check-in. O imóvel fica pronto e ainda não rende sozinho."],
            ["OC—06", "Resolver o que der errado", "Fornecedor que some, prazo que estoura, retrabalho. Sempre sobra pra você."],
          ].map(([code, ti, de]) => (
            <div className="issue fade" key={code}>
              <div className="code">{code}</div>
              <div className="ti">{ti}</div>
              <div className="de">{de}</div>
            </div>
          ))}
        </div>
        <div className="kicker fade">Você não comprou um imóvel pra ganhar um emprego. <b>Comprou pra ele render por você.</b></div>
      </section>

      {/* ============ PROCESSO ============ */}
      <section className="paper" id="fazemos" aria-label="Processo Bewild">
        <div className="sec-mark"><span className="n">03</span><span className="t">Processo</span><span className="ln" /></div>
        <div className="paper-head">
          <h2 className="fade">Da chave ao render, num processo só.</h2>
          <div className="meta fade">06 ETAPAS<br />~60 DIAS ÚTEIS<br />ACOMPANHADO NO PORTAL</div>
        </div>
        <div className="steps">
          {[
            ["01", "Diagnóstico", "Visita, medição e leitura do potencial de renda do imóvel.", "2–3 dias"],
            ["02", "Projeto & orçamento", "Planta humanizada, escopo fechado e um valor que não muda no meio da obra.", "7–10 dias"],
            ["03", "Obra", "Demolição a acabamento com time próprio. Você não toca em nada.", "~40 dias"],
            ["04", "Marcenaria & mobília", "Marcenaria sob medida, mobiliário e enxoval instalados.", "paralelo"],
            ["05", "Styling & foto", "Ambientação e fotos prontas pra anúncio no short-stay.", "3–5 dias"],
            ["06", "Entrega pra render", "Chaves de volta com o studio operando, pronto pra receber hóspede.", "dia 60"],
          ].map(([sn, st, sd, sx]) => (
            <div className="step fade" key={sn}>
              <div className="sn">{sn}</div>
              <div className="st">{st}</div>
              <div className="sd">{sd}</div>
              <div className="sx">{sx}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ POR DENTRO (vídeos) ============ */}
      <section className="sec sec-dark dentro" id="bastidores" aria-label="Por dentro da obra">
        <div className="sec-mark"><span className="n">04</span><span className="t">Por dentro</span><span className="ln" /></div>
        <div className="sec-head">
          <h2 className="fade">A obra é nossa, do primeiro milímetro.</h2>
          <p className="lead fade">Antes de levantar parede, a gente mede cada centímetro do seu studio. O que você vê aqui é o nosso time, na obra de verdade.</p>
        </div>
        <div className="vblocos">
          <div className="vbloco">
            <div className="vtext">
              <span className="vtag mono">Reg. 01 — Medição</span>
              <h3>Quem projeta o seu studio mede ele <em>pessoalmente.</em></h3>
              <p>A arquiteta vai até o imóvel e decide ali o que muda na diária: circulação, ponto de luz, onde a cama rende foto. Cada milímetro pensado pro studio operar, não só pra ficar bonito.</p>
            </div>
            <figure className="vphone">
              <div className="vphone-frame">
                <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
                <video src="/videos/arquiteta-medicao.mp4" poster={studioAntes.url} autoPlay muted loop playsInline preload="metadata" />
                <span className="vphone-tag">ARQUITETA · MEDIÇÃO</span>
              </div>
            </figure>
          </div>
          <div className="vbloco invertido">
            <figure className="vphone">
              <div className="vphone-frame">
                <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
                <video src="/videos/time-obra.mp4" poster={studioDepois.url} autoPlay muted loop playsInline preload="metadata" />
                <span className="vphone-tag">OBRA · TIME PRÓPRIO</span>
              </div>
            </figure>
            <div className="vtext">
              <span className="vtag mono">Reg. 02 — Obra</span>
              <h3>A obra que você não toca tem <em>time próprio.</em></h3>
              <p>Quem reforma o seu studio trabalha na Bewild, não é terceiro que aparece e some. Você acompanha o andamento à distância e recebe o imóvel pronto pra operar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ARQUITETURA ============ */}
      <section className="paper" id="arquitetura" aria-label="Arquitetura Bewild">
        <div className="sec-mark"><span className="n">05</span><span className="t">Arquitetura</span><span className="ln" /></div>
        <div className="arch-split">
          <div className="arch-figc">
            <figure className="planta fade">
              <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
              <img src={plantaHumanizada.url} alt="Planta humanizada de studio compacto 22 m²" loading="lazy" />
            </figure>
            <p className="arch-cap fade">PLANTA HUMANIZADA · STUDIO 22 M²</p>
          </div>
          <div className="arch-txt">
            <h2 className="fade">Arquitetura pra cada metro <i>trabalhar melhor.</i></h2>
            <p className="lead fade">Em studio compacto, o projeto é estratégia de uso, operação e renda. Cada centímetro precisa justificar a existência, e nada aqui é genérico.</p>
            <div className="arch-list">
              {[
                ["01", "Layout inteligente", "Cama, bancada, cozinha, circulação e apoio de malas pro espaço parecer maior e render foto."],
                ["02", "Marcenaria sob medida", "Armazenamento, painéis e nichos que aumentam a percepção de qualidade e cortam o improviso."],
                ["03", "Iluminação e percepção de valor", "A luz certa melhora a foto, a experiência do hóspede e a sensação de cuidado no imóvel."],
                ["04", "Materiais pra uso real", "A escolha não é só estética. Entra limpeza, manutenção, resistência, reposição e custo total."],
                ["05", "Personalização sem perder eficiência", "O projeto respeita o imóvel e o perfil do investidor, sem escolha que encareça ou atrase a operação."],
              ].map(([ax, at, ad]) => (
                <div className="ai fade" key={ax}>
                  <span className="ax">{ax}</span>
                  <div>
                    <div className="at">{at}</div>
                    <div className="ad">{ad}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ COMPARATIVO ============ */}
      <section className="paper" id="diferenciais" aria-label="Comparativo Bewild">
        <div className="sec-mark"><span className="n">06</span><span className="t">Comparativo</span><span className="ln" /></div>
        <div className="paper-head">
          <h2 className="fade">Dá pra fazer de outros jeitos. Nenhum entrega isso.</h2>
          <div className="meta fade">BEWILD VS.<br />ALTERNATIVAS<br />DO MERCADO</div>
        </div>
        <div className="cmp-scroll fade">
          <div className="cmp-wrap">
            <table className="cmp">
              <thead>
                <tr>
                  <th></th><th>Fazer sozinho</th><th>Reformeiro</th><th>Arquiteto</th><th className="bw">Bewild</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Projeto pensado pra render no short-stay", "—", "—", "±"],
                  ["Obra, marcenaria e mobília num contrato só", "—", "±", "—"],
                  ["Prazo e orçamento fechados desde o início", "—", "±", "±"],
                  ["Acompanhamento pelo portal, sem você fiscalizar", "—", "—", "—"],
                  ["Entregue pronto pra operar (foto e anúncio)", "—", "—", "—"],
                  ["Garantia de 5 anos", "—", "—", "±"],
                ].map(([label, a, b, c]) => (
                  <tr key={label}>
                    <th>{label}</th><td>{a}</td><td>{b}</td><td>{c}</td><td className="bw yes">sim</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="cmp-note fade">— não contempla &nbsp;·&nbsp; ± depende / parcial &nbsp;·&nbsp; sim incluso no escopo Bewild</div>
      </section>

      {/* ============ PORTFÓLIO ============ */}
      <section className="sec sec-dark" id="portfolio" aria-label="Portfólio Bewild">
        <div className="sec-mark"><span className="n">07</span><span className="t">Portfólio</span><span className="ln" /></div>
        <div className="sec-head">
          <h2 className="fade">Reformas reais, pra imóvel que precisa performar.</h2>
          <p className="lead fade">Não é render bonito de portfólio. É studio entregue, mobiliado e pronto pra receber hóspede.</p>
        </div>
        <div className="ports">
          <article className="port fade">
            <div className="port-ba">
              <figure style={{ margin: 0 }}>
                <div className="port-ph">
                  <span>ANTES</span>
                  <img src={studioAntes.url} alt="Studio Zip Brooklin antes da reforma" loading="lazy" />
                </div>
              </figure>
              <figure style={{ margin: 0 }}>
                <div className="port-ph">
                  <span>DEPOIS</span>
                  <img src={studioDepois.url} alt="Studio Zip Brooklin depois da reforma Bewild" loading="lazy" />
                </div>
              </figure>
            </div>
            <div className="port-body">
              <span className="port-pill">Turn-key</span>
              <h3>Studio na planta, entregue pronto</h3>
              <dl>
                <dt>Desafio</dt><dd>Sair do apartamento cru sem o cliente coordenar dez fornecedores.</dd>
                <dt>Solução</dt><dd>Projeto sob medida, obra turn-key, compras planejadas e montagem final.</dd>
                <dt>Resultado</dt><dd>Imóvel com visual consistente, layout otimizado e pronto pra uso.</dd>
              </dl>
            </div>
          </article>
          <article className="port fade">
            <div className="port-ba" style={{ gridTemplateColumns: "1fr" }}>
              <figure style={{ margin: 0 }}>
                <div className="port-ph solo">
                  <span>STUDIO PRONTO · SHORT-STAY</span>
                  <img src={studioPronto.url} alt="Studio compacto pronto para short stay" loading="lazy" />
                </div>
              </figure>
            </div>
            <div className="port-body">
              <span className="port-pill">Short stay</span>
              <h3>Studio compacto pra short stay</h3>
              <dl>
                <dt>Desafio</dt><dd>Transformar uma planta pequena em imóvel funcional, bonito e fácil de operar.</dd>
                <dt>Solução</dt><dd>Marcenaria inteligente, bancada compacta, luz estratégica e acabamento resistente.</dd>
                <dt>Resultado</dt><dd>Unidade pronta pra foto, anúncio e operação.</dd>
              </dl>
            </div>
          </article>
        </div>
        <p className="illus fade">Cases reais Bewild · São Paulo</p>
      </section>

      {/* ============ DEPOIMENTO ============ */}
      <section className="paper" id="depoimento" aria-label="Depoimento Vivian">
        <div className="sec-mark"><span className="n">08</span><span className="t">Depoimento</span><span className="ln" /></div>
        <div className="depo">
          <figure className="vphone fade">
            <div className="vphone-frame">
              <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
              <video
                src={depoimentoVideo.url}
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Depoimento da Vivian, cliente Bewild"
                controls
              />
              <span className="vphone-tag">VIVIAN · CLIENTE</span>
            </div>
          </figure>
          <div className="depo-txt">
            <h2 className="fade">Quem já passou pela obra <i>conta melhor que a gente.</i></h2>
            <p className="lead fade">A Vivian reformou o studio dela com a Bewild e contou como foi acompanhar tudo sem entrar na obra. Depoimento gravado pessoalmente, sem roteiro.</p>
            <p className="depo-src fade">VIVIAN · CLIENTE BEWILD · DEPOIMENTO PRESENCIAL</p>
          </div>
        </div>
      </section>

      {/* ============ RESULTADO REAL ============ */}
      <section className="paper" id="resultado" aria-label="Resultado real Rafael">
        <div className="sec-mark"><span className="n">09</span><span className="t">Resultado real</span><span className="ln" /></div>
        <div className="paper-head">
          <h2 className="fade">Um studio no Butantã com <i>70% de ocupação</i> em novembro.</h2>
          <div className="meta fade">CLIENTE REAL<br />RAFAEL · BUTANTÃ<br />SHORT-STAY</div>
        </div>
        <p className="raf-lead fade">O Rafael tinha um studio no Butantã e queria virar renda. A Bewild reformou e entregou pronto pra operar. Ele anunciou no Airbnb, e em novembro o calendário fechou com 70% de ocupação.</p>
        <figure className="raf-quote fade">
          <blockquote>“Esses studios serão um negócio pra mim. Renda vitalícia.”</blockquote>
          <figcaption>Rafael · cliente Bewild · studio no Butantã</figcaption>
        </figure>
        <div className="raf-proof">
          <figure className="fade">
            <div className="raf-ph">
              <img src={rafaelOcupacao.url} alt="Calendário de novembro com 70% de ocupação no Airbnb" loading="lazy" />
            </div>
            <figcaption>Novembro: 70% de ocupação</figcaption>
          </figure>
          <figure className="fade">
            <div className="raf-ph">
              <img src={rafaelAirbnb.url} alt="Anúncio no Airbnb do studio no Butantã" loading="lazy" />
            </div>
            <figcaption>Anúncio no ar no Airbnb</figcaption>
          </figure>
        </div>
        <p className="raf-note fade">Resultado de um cliente real. Ocupação e diária variam conforme imóvel, região e operação.</p>
      </section>

      {/* ============ PORTAL ============ */}
      <section className="paper" id="portal" aria-label="Portal de acompanhamento">
        <div className="sec-mark"><span className="n">10</span><span className="t">Portal</span><span className="ln" /></div>
        <div className="portal-split">
          <div className="portal-txt">
            <h2 className="fade">Obra com visibilidade. <i>Sem caixa-preta.</i></h2>
            <p className="lead fade">Cronograma, decisões e compras organizados num portal. Você vê a obra andar pelo celular, sem precisar ir até lá nem cobrar no WhatsApp.</p>
            <div className="portal-checks fade">
              {[
                "Cronograma por etapa","Fotos de evolução","Relatórios de acompanhamento",
                "Registro de decisões","Controle de escopo","Compras e fornecedores",
              ].map((t) => (
                <div className="pchk" key={t}><i>✓</i>{t}</div>
              ))}
            </div>
            <a className="btn btn-cyan bw-magnetic fade" href="https://bwildworkflow.com" target="_blank" rel="noopener noreferrer">
              <span>Acessar área do cliente</span><span className="ar">→</span>
            </a>
          </div>
          <div className="pf-app fade" role="img" aria-label="Tela ilustrativa do Bwild Workflow">
            <div className="pf-chrome">
              <div className="pf-brand"><span className="pf-bdot" /><span className="pf-bname">Bwild Workflow</span></div>
              <div className="pf-period">Jun 2026</div>
            </div>
            <div className="pf-tabs">
              <span className="pf-tab act">Curva S</span>
              <span className="pf-tab">Relatórios</span>
              <span className="pf-tab">Atividade</span>
            </div>
            <div className="pf-body">
              <div>
                <div className="pf-hrow">
                  <b className="pf-title">Studio Urban Flex · 22 m²</b>
                  <span className="pf-pill pf-pill-info">Em obra</span>
                </div>
                <div className="pf-cap">Semana 6 de 10</div>
              </div>
              <div className="pf-kpis">
                <div className="pf-kpi"><span className="pf-klab">Concluído</span><span className="pf-kval">52%</span></div>
                <div className="pf-kpi"><span className="pf-klab">Status</span><span className="pf-kval"><span className="pf-sdot" />No prazo</span></div>
                <div className="pf-kpi"><span className="pf-klab">Cronograma</span><span className="pf-kval">Sem 6/10</span></div>
              </div>
              <div className="pf-chart">
                <div className="pf-legend">
                  <span className="pf-leg"><span className="pf-lline pf-lreal" />Real</span>
                  <span className="pf-leg"><span className="pf-lline pf-lplan" />Planejado</span>
                </div>
                <svg viewBox="0 0 320 150" className="pf-svg" aria-hidden="true">
                  <defs>
                    <linearGradient id="pfa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(204 100% 25%)" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="hsl(204 100% 25%)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="34" y1="16" x2="312" y2="16" stroke="hsl(220 16% 92%)" />
                  <line x1="34" y1="42" x2="312" y2="42" stroke="hsl(220 16% 92%)" />
                  <line x1="34" y1="68" x2="312" y2="68" stroke="hsl(220 16% 92%)" />
                  <line x1="34" y1="94" x2="312" y2="94" stroke="hsl(220 16% 92%)" />
                  <line x1="34" y1="120" x2="312" y2="120" stroke="hsl(220 16% 92%)" />
                  <text x="26" y="20" textAnchor="end" className="pf-axis">100</text>
                  <text x="26" y="72" textAnchor="end" className="pf-axis">50</text>
                  <text x="26" y="124" textAnchor="end" className="pf-axis">0</text>
                  <path d="M34 120 C 110 118, 150 70, 180 56 S 270 22, 312 16" fill="none" stroke="hsl(220 12% 55%)" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
                  <path d="M34 120 C 90 119, 130 96, 160 82 S 195 70, 200 66 L200 120 L34 120 Z" fill="url(#pfa)" />
                  <path d="M34 120 C 90 119, 130 96, 160 82 S 195 70, 200 66" fill="none" stroke="hsl(204 100% 25%)" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="200" cy="66" r="5" fill="hsl(204 100% 25%)" stroke="#fff" strokeWidth="2" />
                  <text x="34" y="142" className="pf-axis">Início</text>
                  <text x="200" y="142" textAnchor="middle" className="pf-axis">Sem 6</text>
                  <text x="312" y="142" textAnchor="end" className="pf-axis">Entrega</text>
                </svg>
              </div>
              <ul className="pf-stages">
                <li className="pf-stage"><span className="pf-sic pf-sic-ok">✓</span><span className="pf-slab">Demolição e remoção</span><span className="pf-sst ok">Concluída</span></li>
                <li className="pf-stage"><span className="pf-sic pf-sic-ok">✓</span><span className="pf-slab">Elétrica e hidráulica</span><span className="pf-sst ok">Concluída</span></li>
                <li className="pf-stage"><span className="pf-sic pf-sic-warn">◐</span><span className="pf-slab">Marcenaria sob medida</span><span className="pf-smeta"><span className="pf-pill pf-pill-warn">em andamento</span><span className="pf-spct">60%</span></span></li>
                <li className="pf-stage"><span className="pf-sic pf-sic-todo">○</span><span className="pf-slab mut">Montagem e enxoval</span><span className="pf-sst mut">A iniciar</span></li>
              </ul>
            </div>
            <div className="pf-foot">Atualizado hoje. Relatório semanal #6: marcenaria instalada, elétrica revisada.</div>
          </div>
        </div>
        <p className="illus fade">Interface ilustrativa do portal de acompanhamento</p>
      </section>

      {/* ============ SEGURANÇA ============ */}
      <section className="sec sec-dark garantias" aria-label="Segurança e garantias">
        <div className="sec-mark"><span className="n">11</span><span className="t">Segurança</span><span className="ln" /></div>
        <div className="sec-head">
          <h2 className="fade">O risco fica do nosso lado.</h2>
          <p className="lead fade">Tudo que costuma assustar numa obra fica com a gente, por contrato. Sobra pra você a parte boa: a renda.</p>
        </div>
        <div className="grnt">
          {[
            ["Escopo e prazo fechados em contrato", "Você sabe o valor e a data antes da obra começar."],
            ["Time próprio na obra", "Quem começa termina. A gente não terceiriza pra sumir depois."],
            ["Garantia de 5 anos", "A relação não acaba quando a chave volta pra sua mão."],
            ["Tudo no portal", "Você vê cada etapa pelo celular, sem precisar ir na obra."],
            ["+150 studios entregues", "Em São Paulo, pra quem investe em short-stay. O seu não é o primeiro."],
          ].map(([gt, gd]) => (
            <div className="g fade" key={gt}>
              <span className="gp" />
              <div className="gt">{gt}</div>
              <div className="gd">{gd}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ PARA QUEM ============ */}
      <section className="sec sec-dark" id="para-quem" aria-label="Para quem é a Bewild">
        <div className="sec-mark"><span className="n">12</span><span className="t">Para quem</span><span className="ln" /></div>
        <div className="sec-head">
          <h2 className="fade">A Bewild não é pra todo mundo.</h2>
          <p className="lead fade">Melhor deixar claro antes da reunião. Veja se é o seu caso.</p>
        </div>
        <div className="fork">
          <div className="col is">
            <div className="h"><span className="mk">É pra você se</span></div>
            <ul>
              <li><span className="b" />Comprou ou vai comprar um studio em SP pra rentabilizar no short-stay.</li>
              <li><span className="b" />Quer renda do imóvel sem virar gerente de obra, comprador e operador.</li>
              <li><span className="b" />Valoriza prazo, escopo fechado e transparência mais do que o menor preço.</li>
              <li><span className="b" />Quer resolver o studio uma vez e partir pra renda.</li>
            </ul>
          </div>
          <div className="col isnt">
            <div className="h"><span className="mk">Não é pra você se</span></div>
            <ul>
              <li><span className="b" />Busca o orçamento mais barato, custe o que custar na entrega.</li>
              <li><span className="b" />Quer tocar a obra você mesmo e contratar cada fornecedor.</li>
              <li><span className="b" />Procura reforma pra morar, sem foco em renda.</li>
              <li><span className="b" />Ainda não tem o imóvel nem pretende investir nisso agora.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="paper faq" id="faq" aria-label="Perguntas frequentes">
        <div className="sec-mark"><span className="n">13</span><span className="t">Perguntas</span><span className="ln" /></div>
        <div className="paper-head">
          <h2 className="fade">O que todo investidor pergunta.</h2>
          <div className="meta fade">DÚVIDAS<br />FREQUENTES<br />RESPOSTA DIRETA</div>
        </div>
        <div className="qa">
          {FAQS_HOME.map(({ q, a }) => (
            <div className="qi fade" key={q}>
              <div className="q">{q}</div>
              <div className="a">{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="cta-final" id="cta" aria-label="Diagnóstico gratuito">
        <div className="grid-bg" aria-hidden="true" />
        <div className="inner">
          <div className="eye fade"><span className="mono tag">Diagnóstico gratuito · sem compromisso</span></div>
          <h2 className="fade">Pronto pra ver seu<br />studio <i>rendendo?</i></h2>
          <p className="fade">Manda os dados da sua unidade no WhatsApp. A gente avalia o potencial de renda e mostra como ficaria o projeto.</p>
          <div className="act fade">
            <a
              className="btn btn-cyan bw-magnetic"
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onCtaWhatsApp}
            >
              <span>Falar no WhatsApp</span><span className="ar">→</span>
            </a>
            <a className="btn btn-ghost" href="/portfolio">
              <span>Ver reformas entregues</span>
            </a>
          </div>
          <div className="rea fade">Atendimento de gente real · <b>retorno rápido</b> · 150+ studios entregues</div>
        </div>
        <div className="stamp">BEWILD · GRUPO BWILD<br />SÃO PAULO · BR<br />BW—001 / HOME</div>
      </section>

      <StickyMobileCTA />
      <SiteFooter />
    </div>
  );
}
