import { useEffect } from 'react';
import './EmConstrucao.css';

const WA_HREF =
  'https://wa.me/5511911906183?text=' +
  encodeURIComponent('Oi, vim do site em construção da Be Wild. Quero saber mais.');
const IG_HREF = 'https://instagram.com/bewild.oficial';
const MAIL_HREF = 'mailto:contato@bewild.com.br';

export default function EmConstrucao() {
  useEffect(() => {
    document.title = 'Be Wild — uma nova marca está nascendo';

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            const soltas = e.target.querySelectorAll('.reveal-solta');
            soltas.forEach((s, i) => {
              setTimeout(() => s.classList.add('in'), 350 + i * 550);
            });
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 },
    );
    document.querySelectorAll('.bw-construcao .reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="bw-construcao">
      <div className="bg" aria-hidden="true" />

      {/* HERO */}
      <section className="hero">
        <h1 className="name">
          <span className="pre">Você nunca leu</span>
          <span className="build">Build.</span>
          <span className="bewild">
            Você leu <em>Be Wild</em>.
          </span>
        </h1>
        <p className="lede">
          Talvez seu instinto estivesse certo. Estamos construindo uma marca nova para um{' '}
          <em>jeito de investir em imóvel que devolve o seu tempo</em>.
        </p>
        <div className="scroll-hint">
          <span>role devagar</span>
          <span className="dot" />
        </div>
      </section>

      {/* O QUE É SER WILD — light */}
      <section className="section sec-light">
        <div className="inner reveal">
          <div className="tag">o que é ser wild</div>
          <h2 className="h">
            Investir não deveria virar uma <em>coleira</em>.
          </h2>
          <p className="p">
            Comprar imóvel para ter renda virou sinônimo de obra, planilha, fornecedor sumido e
            hóspede mandando mensagem às duas da manhã. O contrário de liberdade.
          </p>
          <p className="p">
            Ser <strong>Wild</strong> é ter o ativo sem ser domesticado por ele. É renda que corre
            sozinha — enquanto você faz outra coisa da sua vida.
          </p>
        </div>
      </section>

      {/* DESCIDA — dark */}
      <section className="section sec-dark">
        <div className="inner reveal">
          <div className="tag">o que a gente tira das suas costas</div>
          <h2 className="h">
            Uma por uma, as responsabilidades <em>deixam de ser suas</em>.
          </h2>

          <div className="descida">
            <div className="solta reveal-solta">
              <span className="num">01</span>
              <div className="txt">
                <div className="o">A reforma</div>
                <div className="d">Projeto, obra, marcenaria, mobiliário, setup.</div>
              </div>
              <span className="selo">não é sua</span>
            </div>
            <div className="solta reveal-solta">
              <span className="num">02</span>
              <div className="txt">
                <div className="o">A operação</div>
                <div className="d">Anúncio, hóspede, limpeza, manutenção, repasse.</div>
              </div>
              <span className="selo">não é sua</span>
            </div>
            <div className="solta reveal-solta">
              <span className="num">03</span>
              <div className="txt">
                <div className="o">A rotina</div>
                <div className="d">A planilha, o telefone, a dor de cabeça.</div>
              </div>
              <span className="selo">não é sua</span>
            </div>
          </div>

          <div className="resto">
            <p className="big">
              Sobra a renda.
              <br />E o seu tempo.
            </p>
          </div>
        </div>
      </section>

      {/* PROPÓSITO — light */}
      <section className="section sec-light proposito">
        <div className="inner reveal">
          <div className="tag">por que isso importa</div>
          <h2 className="h">
            Você comprou liberdade.
            <br />
            A gente só <em>devolve ela</em> pra você.
          </h2>
          <p className="p">
            Ninguém investe sonhando em virar gerente de obra. A Be Wild existe para que o seu
            dinheiro trabalhe do jeito que você imaginou quando decidiu investir:{' '}
            <strong>rendendo, sem te prender</strong>.
          </p>
        </div>
      </section>

      {/* CTA — dark */}
      <section className="section sec-dark cta-wrap">
        <div className="inner reveal">
          <div className="tag">a marca está mudando</div>
          <h2 className="h">
            Um novo site está por vir.
            <br />
            Enquanto isso, <em>vem com a gente</em>.
          </h2>
          <p className="p" style={{ margin: '0 auto' }}>
            Estamos no meio de uma transformação — nome, marca, experiência. Até o novo site nascer,
            o melhor lugar para falar com a gente é aqui:
          </p>

          <div className="cta-row">
            <a className="btn btn-wa" href={WA_HREF} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84a11.78 11.78 0 0 0 1.6 5.94L0 24l6.36-1.66a11.84 11.84 0 0 0 5.68 1.45h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.47ZM12.05 21.5a9.62 9.62 0 0 1-4.9-1.34l-.35-.21-3.77.99 1-3.67-.23-.38a9.65 9.65 0 1 1 17.92-5.06c0 5.33-4.34 9.67-9.67 9.67Zm5.59-7.24c-.31-.16-1.81-.89-2.09-.99-.28-.1-.49-.16-.7.16-.2.31-.8.99-.98 1.2-.18.2-.36.23-.67.08-.31-.16-1.31-.48-2.49-1.54-.92-.82-1.54-1.83-1.72-2.14-.18-.31-.02-.48.14-.63.14-.14.31-.36.47-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.7-1.69-.96-2.32-.25-.6-.51-.52-.7-.53l-.6-.01c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.62 0 1.55 1.13 3.04 1.29 3.25.16.21 2.22 3.39 5.39 4.76.75.32 1.34.52 1.8.66.76.24 1.45.21 2 .13.61-.09 1.81-.74 2.07-1.46.26-.71.26-1.32.18-1.45-.08-.13-.28-.21-.59-.36Z" />
              </svg>
              Falar no WhatsApp
            </a>
            <a className="btn btn-ig" href={IG_HREF} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              Acompanhar no Instagram
            </a>
          </div>

          <div className="soon">
            <span className="pulse" />
            novo site em breve
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="foot-inner reveal">
          <div className="foot-top">
            <div className="foot-claim">
              Renda sem virar <em>gerente de nada</em>.
            </div>
            <div className="foot-cols">
              <div className="foot-col">
                <h4>falar</h4>
                <a href={WA_HREF} target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84a11.78 11.78 0 0 0 1.6 5.94L0 24l6.36-1.66a11.84 11.84 0 0 0 5.68 1.45h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.47Z" />
                  </svg>
                  WhatsApp
                </a>
                <a href={MAIL_HREF}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                  contato@bewild.com.br
                </a>
              </div>
              <div className="foot-col">
                <h4>acompanhar</h4>
                <a href={IG_HREF} target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                  @bewild.oficial
                </a>
              </div>
            </div>
          </div>

          <div className="foot-wordmark" aria-hidden="true">
            Be <em>Wild</em>
          </div>

          <div className="foot-legal">
            <span>© 2026 Be Wild · São Paulo, Brasil</span>
            <span>Preparação e gestão de imóveis para short stay</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
