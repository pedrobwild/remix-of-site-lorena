/**
 * SiteFooter — rodapé "prancheta" (Utsubo) unificado de todas as páginas
 * públicas da Bewild. Cena de fechamento: assinatura da marca + tagline,
 * navegação e contato, e a ficha técnica (carimbo de prancha) com os dados
 * legais. Autocontido. Marca sempre grafada "Bewild" (só B maiúsculo).
 */
import { CONTACT, whatsappHref } from "@/components/landing/content";
import { openCookiePreferences } from "@/lib/cookieConsent";
import "@/styles/site-footer.css";

function BrandLockup() {
  return (
    <img
      src="/brand/bewild-logo-cropped.png"
      alt="Bewild"
      className="bw-foot__logo"
      width={87}
      height={30}
      decoding="async"
      loading="lazy"
    />
  );
}

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bw-foot">
      <div className="bw-foot__top">
        <div className="bw-foot__brand">
          <a href="/" aria-label="Bewild — início">
            <BrandLockup />
          </a>
          <p className="bw-foot__tagline">
            Built by the wild ones. <em>Be wild.</em>
          </p>
          <p className="bw-foot__desc">
            Reforma turn-key de studios em São Paulo. Projeto, obra, marcenaria,
            mobiliário e entrega num processo único.
          </p>
        </div>

        <nav className="bw-foot__nav" aria-label="Rodapé — navegação">
          <h2 className="bw-foot__col">Navegação</h2>
          <ul>
            <li><a href="/#fazemos">O que fazemos</a></li>
            <li><a href="/#fazemos">Como funciona</a></li>
            <li><a href="/portfolio">Portfólio</a></li>
            <li><a href="/conteudos">Conteúdos</a></li>
            <li><a href="/diagnostico">Diagnóstico</a></li>
          </ul>
        </nav>

        <div className="bw-foot__contact">
          <h2 className="bw-foot__col">Contato</h2>
          <ul>
            <li><a href={whatsappHref()} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            <li><a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
            <li><a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
            <li><a href="/privacidade">Política de privacidade</a></li>
            <li>
              <button
                type="button"
                onClick={openCookiePreferences}
                className="bw-foot__linkbtn"
              >
                Preferências de cookies
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="bw-foot__spec" aria-label="Ficha técnica">
        <span>BEWILD · GRUPO BWILD</span>
        <span>{CONTACT.city}</span>
        <span>CNPJ 47.350.338/0001-37</span>
        <span>RESP. TÉCNICO · THIAGO DANTAS DO AMOR · CAU A162437-7</span>
      </div>

      <div className="bw-foot__bottom">
        <p>© {year} Bewild · Grupo Bwild</p>
        <p>Reforma turn-key de studios em São Paulo</p>
      </div>
    </footer>
  );
}
