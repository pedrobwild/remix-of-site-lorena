import { useEffect, useRef } from "react";
import { openCookiePreferences } from "@/lib/cookieConsent";
import { CONTACT, whatsappHref } from "@/components/landing/content";
import BwaWhatsForm from "@/components/BwaWhatsForm";

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
            <p>Seu desejo é uma obra.</p>
            <p>
              Reforma completa de studios e apartamentos compactos em São Paulo.
              Projeto, obra, marcenaria, mobiliário e entrega num processo único.
            </p>
          </div>

          <div className="bwa-footer-column">
            <h3>Navegação</h3>
            <nav>
              <a href="/#certeza">O contrato</a>
              <a href="/#marcenaria">Marcenaria</a>
              <a href="/#certeza">O que fazemos</a>
              <a href="/como-funciona">Como funciona</a>
              <a href="/portfolio">Portfólio de reformas em SP</a>
              <a href="/onde-atuamos">Onde atuamos</a>
              <a href="/reforma-de-apartamento-sao-paulo">Reforma de apartamento em SP</a>
              <a href="/reforma-de-studio-sao-paulo">Reforma de studio em SP</a>
              <a href="/conteudos">Conteúdos</a>
              <a href="/guia-do-investidor">Guia do investidor</a>
              <a href="/faq">FAQ</a>
              <a href="/contato">Contato</a>
            <a href="/escopo">Escopo com IA</a>
              <a href="/orcamento">Orçamento</a>
              <a href="/parceiros">Parceiros</a>
            </nav>
          </div>

          <div className="bwa-footer-column">
            <h3>Contato</h3>
            {/* Links reais, como no rodapé da home — antes eram <span> inertes. */}
            <div>
              <a href={whatsappHref("Olá, quero um orçamento para o meu studio")} target="_blank" rel="noreferrer">WhatsApp</a>
              <a href={CONTACT.instagram} target="_blank" rel="noreferrer">Instagram</a>
              <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
              <a href={`mailto:${CONTACT.email}`}>e-mail</a>
              <a href="/privacidade">Política de privacidade</a>
              <button type="button" className="bwa-footer-cookie-prefs" onClick={openCookiePreferences}>Preferências de cookies</button>
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

        <BwaWhatsForm />

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
