/**
 * SiteFooter — rodapé navy unificado de todas as páginas públicas da Bewild.
 *
 * Autocontido: importa seu próprio CSS (`src/styles/site-footer.css`) e não
 * depende de classes externas (ex.: `.bw-home`). Marca sempre grafada
 * "Bewild" (só B maiúsculo).
 */
import { CONTACT, whatsappHref } from "@/components/landing/content";
import "@/styles/site-footer.css";

function BrandLockup() {
  return (
    <img
      src="/brand/bewild-logo.png"
      alt="Bewild"
      className="bw-foot__logo"
      width={150}
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
      <div className="bw-foot__grid">
        <div>
          <a href="/" aria-label="Bewild — início">
            <BrandLockup />
          </a>
          <p style={{ marginTop: 14 }}>
            Reforma turn-key de studios em São Paulo. Projeto, obra, marcenaria,
            mobiliário e entrega em um processo único.
          </p>
          <p style={{ marginTop: 10 }}>{CONTACT.city}</p>
        </div>

        <nav aria-label="Rodapé — navegação">
          <h2 className="bw-foot__col">Navegação</h2>
          <ul>
            <li><a href="/#fazemos">O que fazemos</a></li>
            <li><a href="/#processo">Como funciona</a></li>
            <li><a href="/portfolio">Portfólio</a></li>
            <li><a href="/conteudos">Conteúdos</a></li>
            <li><a href="/diagnostico">Diagnóstico</a></li>
          </ul>
        </nav>

        <div>
          <h2 className="bw-foot__col">Contato</h2>
          <ul>
            <li><a href={whatsappHref()} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            <li><a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
            <li><a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
            <li><a href="/privacidade">Política de privacidade</a></li>
          </ul>
        </div>
      </div>

      <div className="bw-foot__bottom">
        <p>Bewild · Reforma turn-key de studios em São Paulo</p>
        <p>© {year} Bewild · Grupo Bwild</p>
      </div>
    </footer>
  );
}
