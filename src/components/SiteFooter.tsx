import { useEffect } from "react";
import "@/styles/bwa-footer-shared.css";
import { openCookiePreferences } from "@/lib/cookieConsent";

const WHATSAPP_URL =
  "https://wa.me/5511911906183?text=Ol%C3%A1%2C%20quero%20um%20diagn%C3%B3stico%20para%20meu%20studio";
const INSTAGRAM_URL = "https://instagram.com/bewild.oficial";
const LINKEDIN_URL = "https://www.linkedin.com/";
const EMAIL_URL = "mailto:contato@bewild.com.br";

export default function SiteFooter(_props: Record<string, unknown>) {
  useEffect(() => {
    const holder = document.getElementById("ra-verified-seal");
    if (!holder || holder.childElementCount > 0) return;
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.id = "ra-embed-verified-seal";
    s.src = "https://s3.amazonaws.com/raichu-beta/ra-verified/bundle.js";
    s.setAttribute("data-id", "SEpqak1Mcm9aM09nMm0wbDpid2lsZC1yZWZvcm1hcw==");
    s.setAttribute("data-target", "ra-verified-seal");
    s.setAttribute("data-model", "horizontal_1");
    holder.appendChild(s);
  }, []);

  return (
    <footer className="bwa-footer">
      <div className="bwa-shell">
        <div className="bwa-footer-main">
          <div className="bwa-footer-brand">
            <div className="bwa-footer-wordmark">Bewild</div>
            <p>Built by the wild ones. Be wild.</p>
            <p>
              Reforma completa de apartamentos em São Paulo e no Rio de Janeiro. Projeto, obra, marcenaria, mobiliário e entrega num processo único.
            </p>
          </div>
          <div className="bwa-footer-column">
            <h3>Navegação</h3>
            <nav>
              <a href="/#certeza">O contrato</a>
              <a href="/#historia">A história</a>
              <a href="/#projetos">Projetos</a>
              <a href="/#workflow">Bwild Workflow</a>
              <a href="/portfolio">Portfólio</a>
              <a href="/conteudos">Conteúdos</a>
              <a href="/faq">FAQ</a>
              <a href="/diagnostico">Diagnóstico</a>
            </nav>
          </div>
          <div className="bwa-footer-column">
            <h3>Contato</h3>
            <div>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp</a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram</a>
              <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">LinkedIn</a>
              <a href={EMAIL_URL}>e-mail</a>
              <a href="/privacidade">Política de privacidade</a>
              <button type="button" className="bwa-footer-cookie-prefs" onClick={openCookiePreferences}>Preferências de cookies</button>
              <div className="bwa-footer-seals">
                <div id="ra-verified-seal"></div>
                <img
                  className="bwa-footer-ssl"
                  src="/__l5e/assets-v1/5fc52424-22a9-4b06-8b2f-50ab9cc91361/ssl-shield.png"
                  alt="Site seguro · certificado SSL"
                  loading="lazy"
                />
              </div>
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
