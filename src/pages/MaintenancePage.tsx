import { useEffect } from "react";
import { CONTACT, whatsappHref } from "../components/landing/content";
import { useSeo } from "../lib/useSeo";
import "./MaintenancePage.css";

const WHATSAPP_HREF = whatsappHref(CONTACT.whatsappText);
const INSTAGRAM_HREF = "https://instagram.com/bewild.oficial";
const INSTAGRAM_HANDLE = "@bewild.oficial";
const EMAIL = "contato@bewild.com.br";

export default function MaintenancePage() {
  useSeo({
    title: "Bewild — uma nova marca está chegando",
    description: "Estamos finalizando o novo site da Bewild. Voltamos em breve.",
    noindex: true,
  });

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            const soltas = e.target.querySelectorAll(".reveal-solta");
            soltas.forEach((s, i) => {
              setTimeout(() => s.classList.add("in"), 350 + i * 550);
            });
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    document.querySelectorAll(".bw-construcao .reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="bw-construcao">
      <div className="bg" aria-hidden="true" />
      <main>
        <section className="hero" aria-label="Bewild">
          <h1 className="name">
            <span className="pre">Você nunca leu</span>
            <span className="build">Build.</span>
            <span className="bewild">Você leu Be<em>wild.</em></span>
          </h1>
          <p className="lede">
            Talvez seu instinto estivesse certo. A gente está construindo uma marca nova pra um jeito de investir em imóvel que te devolve <em>o tempo.</em>
          </p>
          <div className="scroll-hint" aria-hidden="true">
            role devagar<span className="dot" />
          </div>
        </section>

        <section className="section sec-light">
          <div className="inner reveal">
            <p className="tag">o que é ser wild</p>
            <h2 className="h">Comprar imóvel pra render não deveria virar <em>um emprego.</em></h2>
            <p className="p">
              Comprar um imóvel pra ter renda costuma virar obra que atrasa, orçamento que estoura e fornecedor que some. Não era isso que você imaginou quando decidiu investir.
            </p>
            <p className="p">
              <strong>Ser Wild é ter o ativo sem ser dominado por ele.</strong> A Bewild entrega o studio pronto pra render, sem você entrar na obra.
            </p>
          </div>
        </section>

        <section className="section sec-dark">
          <div className="inner reveal">
            <p className="tag">o que a gente tira das suas costas</p>
            <h2 className="h">Uma a uma, as responsabilidades <em>deixam de ser suas.</em></h2>
            <div className="descida">
              <div className="solta reveal-solta">
                <span className="num">01</span>
                <div className="txt">
                  <div className="o">A arquitetura</div>
                  <div className="d">Projeto e layout pensados pra render no short stay.</div>
                </div>
                <span className="selo">não é sua</span>
              </div>
              <div className="solta reveal-solta">
                <span className="num">02</span>
                <div className="txt">
                  <div className="o">A obra</div>
                  <div className="d">Marcenaria, acabamento, fornecedores e prazo.</div>
                </div>
                <span className="selo">não é sua</span>
              </div>
              <div className="solta reveal-solta">
                <span className="num">03</span>
                <div className="txt">
                  <div className="o">A mobília</div>
                  <div className="d">Móveis, enxoval, eletro e decoração.</div>
                </div>
                <span className="selo">não é sua</span>
              </div>
            </div>
            <div className="resto">
              <p className="big">Fica o studio pronto.<br />Fica o seu tempo.</p>
            </div>
          </div>
        </section>

        <section className="section sec-dark">
          <div className="inner reveal">
            <div className="video-bloco">
              <div className="video-texto">
                <p className="vt-tag">antes de qualquer parede</p>
                <h2 className="vt-h">Quem projeta o seu studio mede ele <em>pessoalmente.</em></h2>
                <p className="vt-p">
                  A arquiteta vai até o imóvel e decide ali o que muda na diária: circulação, ponto de luz, onde a cama rende foto. Cada milímetro pensado pro studio operar bem, não só pra ficar bonito.
                </p>
              </div>
              <div className="video-moldura">
                <video src="/videos/arquiteta-medicao.mp4" poster="/videos/arquiteta-medicao-poster.jpg" muted loop autoPlay playsInline preload="metadata" aria-label="Arquiteta da Bewild fazendo a medição do imóvel" />
              </div>
            </div>
            <div className="video-bloco invertido">
              <div className="video-moldura">
                <video src="/videos/time-obra.mp4" poster="/videos/time-obra-poster.jpg" muted loop autoPlay playsInline preload="metadata" aria-label="Time de obra da Bewild a caminho da reforma" />
              </div>
              <div className="video-texto">
                <p className="vt-tag">e quem executa tem rosto</p>
                <h2 className="vt-h">A obra que você não toca tem <em>time próprio.</em></h2>
                <p className="vt-p">
                  Quem reforma o seu studio trabalha na Bewild, não é um terceiro que aparece e some. Você acompanha o andamento à distância e recebe o imóvel pronto pra operar.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section sec-light">
          <div className="inner reveal proposito">
            <p className="tag">por que isso importa</p>
            <h2 className="h">Você comprou liberdade.<br />A gente só <em>devolve ela pra você.</em></h2>
            <p className="p">
              Ninguém investe sonhando em virar gerente de obra. A Bewild faz a reforma inteira, do projeto à entrega, e te devolve o imóvel pronto pra render do jeito que você imaginou quando decidiu investir.
            </p>
          </div>
        </section>

        <section className="section sec-dark">
          <div className="inner reveal cta-wrap">
            <p className="tag" style={{ color: "var(--gold-400)" }}>a marca está mudando</p>
            <h2 className="h">O novo site está chegando.<br />Enquanto isso, <em>vem com a gente.</em></h2>
            <p className="p" style={{ margin: "0 auto" }}>
              A gente está no meio de uma mudança de marca. Até o novo site ficar pronto, fala com a gente por aqui:
            </p>
            <div className="cta-row">
              <a className="btn btn-wa" href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.15-1.7-.85-2-.95-.26-.1-.45-.15-.64.15-.2.3-.74.95-.9 1.14-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.34.44-.5.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.2 0-.5.07-.76.37-.26.3-1 .98-1 2.38s1.02 2.76 1.17 2.95c.15.2 2.02 3.08 4.9 4.32.68.3 1.22.47 1.63.6.69.22 1.31.19 1.8.12.55-.08 1.7-.7 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.2-.55-.34z M12 2a10 10 0 0 0-8.6 15.05L2 22l5.07-1.33A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.1.81.83-3.02-.2-.31A8.2 8.2 0 1 1 12 20.2z" /></svg>
                Falar no WhatsApp
              </a>
              <a className="btn btn-ig" href={INSTAGRAM_HREF} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
                Acompanhar no Instagram
              </a>
            </div>
            <div className="soon"><span className="pulse" /> novo site em breve</div>
          </div>
        </section>
      </main>

      <footer>
        <div className="foot-inner">
          <div className="foot-top">
            <p className="foot-claim">Renda sem virar <em>gerente de obra.</em></p>
            <div className="foot-cols">
              <div className="foot-col">
                <h4>falar</h4>
                <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.15-1.7-.85-2-.95-.26-.1-.45-.15-.64.15-.2.3-.74.95-.9 1.14-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.34.44-.5.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.2 0-.5.07-.76.37-.26.3-1 .98-1 2.38s1.02 2.76 1.17 2.95c.15.2 2.02 3.08 4.9 4.32.68.3 1.22.47 1.63.6.69.22 1.31.19 1.8.12.55-.08 1.7-.7 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.2-.55-.34z M12 2a10 10 0 0 0-8.6 15.05L2 22l5.07-1.33A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.1.81.83-3.02-.2-.31A8.2 8.2 0 1 1 12 20.2z" /></svg>
                  WhatsApp
                </a>
                <a href={`mailto:${EMAIL}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                  {EMAIL}
                </a>
              </div>
              <div className="foot-col">
                <h4>acompanhar</h4>
                <a href={INSTAGRAM_HREF} target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
                  {INSTAGRAM_HANDLE}
                </a>
              </div>
            </div>
          </div>
          <div className="foot-wordmark">Be<em>wild</em></div>
          <div className="foot-legal">
            <span>© 2026 Bewild · São Paulo, Brasil</span>
            <span>Reforma e preparação de studios para short stay</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
