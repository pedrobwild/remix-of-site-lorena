import { useEffect, useRef } from "react";

/**
 * BwaFooter — Footer .bwa unificado, idêntico ao da home. Usado em toda
 * página pública fora da home. Depende do CSS injetado por BwaNav.
 */
export default function BwaFooter() {
  const raRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = raRef.current;
    if (!container || container.querySelector("script")) return;
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.id = "ra-embed-verified-seal";
    s.src = "https://s3.amazonaws.com/raichu-beta/ra-verified/bundle.js";
    s.setAttribute("data-id", "SEpqak1Mcm9aM09nMm0wbDpid2lsZC1yZWZvcm1hcw==");
    s.setAttribute("data-target", "ra-verified-seal");
    s.setAttribute("data-model", "horizontal_1");
    container.appendChild(s);
  }, []);

  return (
    <footer className="bwa-footer">
      <div className="bwa-shell">
        <div className="bwa-footer-main">
          <div className="bwa-footer-brand">
            <div className="bwa-footer-wordmark">Bewild</div>
            <p>Built by the wild ones. Be wild.</p>
            <p>
              Reforma completa de studios em São Paulo. Projeto, obra, marcenaria,
              mobiliário e entrega num processo único.
            </p>
          </div>

          <div className="bwa-footer-column">
            <h3>Navegação</h3>
            <nav>
              <a href="/#certeza">O contrato</a>
              <a href="/#historia">A história</a>
              <a href="/#oque-fazemos">O que fazemos</a>
              <a href="/#como-funciona">Como funciona</a>
              <a href="/portfolio">Portfólio</a>
              <a href="/conteudos">Conteúdos</a>
              <a href="/faq">FAQ</a>
              <a href="/diagnostico">Diagnóstico</a>
            </nav>
          </div>

          <div className="bwa-footer-column">
            <h3>Contato</h3>
            <div>
              <span>WhatsApp</span>
              <span>Instagram</span>
              <span>LinkedIn</span>
              <span>e-mail</span>
              <a href="/privacidade">Política de privacidade</a>
              <span>Preferências de cookies</span>
            </div>
            <div className="bwa-footer-seals">
              <div id="ra-verified-seal" ref={raRef} />
              <img
                className="bwa-footer-ssl"
                src="/__l5e/assets-v1/5fc52424-22a9-4b06-8b2f-50ab9cc91361/ssl-shield.png"
                alt="Site seguro · certificado SSL"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        <div className="bwa-footer-bottom">
          <p className="bwa-footer-tech">
            BEWILD · SÃO PAULO, BRASIL · CNPJ 47.350.338/0001-37 · RESP. TÉCNICO · THIAGO DANTAS DO AMOR · CAU A162437-7
          </p>
          <span className="bwa-footer-copy">© 2026 Bewild</span>
        </div>
      </div>
    </footer>
  );
}
