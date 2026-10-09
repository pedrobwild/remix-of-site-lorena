import { useEffect, useRef } from "react";
import { Accessibility } from "lucide-react";
import { openCookiePreferences } from "@/lib/cookieConsent";
import { CONTACT, whatsappHref } from "@/components/landing/content";
import BwaWhatsForm from "@/components/BwaWhatsForm";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { isExternalHref, safeHref } from "@/lib/safeUrl";
import { useIncorporadorasEnabled } from "@/lib/incorporadorasFlag";
import BewildLogo from "@/components/BewildLogo";
import { mountReclameAquiSealWhenVisible } from "@/lib/reclameAquiSeal";

/**
 * BwaFooter — Footer .bwa unificado, idêntico ao da home. Usado em toda
 * página pública fora da home. Depende do CSS injetado por BwaNav.
 */
export default function BwaFooter() {
  const incorporadorasOn = useIncorporadorasEnabled();
  const raRef = useRef<HTMLDivElement>(null);
  // LinkedIn: o do admin (site_settings.linkedin_url) quando configurado,
  // senão a página oficial. Validado — o valor do banco vira href.
  const { settings } = useSiteSettings();
  const linkedinHref = safeHref(settings?.linkedin_url) ?? CONTACT.linkedin;

  // Selo do Reclame Aqui só quando o rodapé chega perto da tela: o script
  // dele traz Open Sans e Inter Tight do Google Fonts (src/lib/reclameAquiSeal.ts).
  useEffect(() => mountReclameAquiSealWhenVisible(raRef.current), []);

  return (
    <footer className="bwa-footer">
      <div className="bwa-shell">
        <div className="bwa-footer-main">
          <div className="bwa-footer-brand">
            <BewildLogo variant="white" className="bwa-footer-wordmark" loading="lazy" />
            <p>Seu desejo é uma obra.</p>
            <p>
              Reforma completa de apartamentos em São Paulo. Projeto, obra,
              marcenaria, mobiliário e entrega num processo único.
            </p>
          </div>

          <div className="bwa-footer-column">
            <h3>Navegação</h3>
            <nav>
              <a href="/servicos">Serviços</a>
              <a href="/marcenaria">Marcenaria</a>
              <a href="/como-funciona">Como funciona</a>
              <a href="/portfolio">Projetos</a>
              <a href="/onde-atuamos">Onde atuamos</a>
              <a href="/reforma-de-apartamento-sao-paulo">Reforma de apartamento em SP</a>
              <a href="/reforma-de-studio-sao-paulo">Reforma de studio em SP</a>
              <a href="/reforma-de-cobertura-sao-paulo">Reforma de cobertura em SP</a>
              <a href="/conteudos">Conteúdos</a>
              <a href="/guia-do-investidor">Guia do investidor</a>
              <a href="/faq">FAQ</a>
              <a href="/contato">Contato</a>
              <a href="/orcamento">Orçamento</a>
              <a href="/parceiros">Parceiros: clientes e corretores</a>
              {incorporadorasOn && (
                <a href="/parceiros/incorporadoras">Parceiros: incorporadoras</a>
              )}
              <a href="/marcas-e-parcerias">Marcas e parcerias</a>
            </nav>
          </div>

          <div className="bwa-footer-column">
            <h3>Contato</h3>
            {/* Links reais, como no rodapé da home — antes eram <span> inertes. */}
            <div>
              <a href={whatsappHref("Olá! Quero um orçamento para o meu apartamento.")} target="_blank" rel="noreferrer">WhatsApp</a>
              <a href={CONTACT.instagram} target="_blank" rel="noreferrer">Instagram</a>
              {linkedinHref && isExternalHref(linkedinHref) && (
                <a href={linkedinHref} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              )}
              <a href={`mailto:${CONTACT.email}`}>e-mail</a>
              <a href="/privacidade">Política de privacidade</a>
              <a href="/mapa-do-site">Mapa do site</a>
              <a href="/acessibilidade" className="bwa-footer-a11y">
                <Accessibility size={16} aria-hidden="true" />
                Acessibilidade
              </a>
              <button type="button" className="bwa-footer-cookie-prefs" onClick={openCookiePreferences}>Preferências de cookies</button>
            </div>
            <div className="bwa-footer-seals">
              <div id="ra-verified-seal" ref={raRef} />
            </div>
          </div>
        </div>

        <BwaWhatsForm />

        <div className="bwa-footer-bottom">
          <p className="bwa-footer-tech">
            RUA PITÚ,72, SALA 115 - BROOKLIN, SÃO PAULO - SP, 04567-060 - BRASIL · CNPJ 47.350.338/0001-37 · RESP. TÉCNICO · THIAGO DANTAS DO AMOR · CAU A162437-7
          </p>
          <span className="bwa-footer-copy">© 2026 Bewild</span>
        </div>
      </div>
    </footer>
  );
}
