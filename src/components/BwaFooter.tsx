/**
 * BwaFooter — Footer .bwa unificado, idêntico ao da home. Usado em toda
 * página pública fora da home. Depende do CSS injetado por BwaNav.
 */
export default function BwaFooter() {
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
