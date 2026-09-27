import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { routes } from "../lib/useHashRoute";
import {
  hadLegacyAcceptance,
  readConsent,
  setConsent,
  OPEN_PREFERENCES_EVENT,
  type Consent,
} from "../lib/cookieConsent";
import { logConsentAudit } from "../lib/analytics";

/**
 * Banner de consentimento de cookies (LGPD).
 * - Aparece se o visitante ainda não decidiu nesta versão do texto — inclusive
 *   para quem tinha aceitado uma versão anterior (ver CONSENT_VERSION em
 *   src/lib/cookieConsent.ts). Quem recusou antes não é perguntado de novo.
 * - O texto diz para que servem os cookies: medição e anúncios da Bewild na
 *   Meta e no Google, inclusive remarketing e públicos semelhantes.
 * - "Recusar" e "Aceitar" têm o mesmo peso visual e nenhum dos dois recebe o
 *   foco: ao abrir, o foco vai para a própria região (leitores de tela
 *   anunciam o título) — sem empurrar o visitante para uma das opções.
 * - Persiste e propaga a decisão via `src/lib/cookieConsent.ts` (localStorage
 *   + evento `cookie:consent-change`). Analytics, GA4, Google Ads, Meta Pixel,
 *   Clarity e Hotjar só rodam com aceite. Recusar depois de aceitar recarrega
 *   a página limpa (ver cookieConsent.ts).
 * - A trilha de auditoria (`logConsentAudit`) sai daqui, do clique explícito
 *   — nunca de eventos de outras abas. Origem: "banner" (primeira escolha),
 *   "renovacao" (tinha aceitado uma versão anterior) ou "preferences"
 *   (reabriu pelo rodapé).
 * - Link para /privacidade para detalhes.
 */

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Checa consentimento após montagem — evita SSR/hidratação inconsistente.
    const current = readConsent();
    if (current === null) {
      // Pequeno atraso para não competir com render inicial da página.
      const t = window.setTimeout(() => setVisible(true), 400);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, []);

  // Reabertura manual via "Preferências de cookies" (rodapé/política).
  useEffect(() => {
    const onOpen = () => setVisible(true);
    window.addEventListener(OPEN_PREFERENCES_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, onOpen);
  }, []);

  // M8: a11y — quando o banner aparece, lembra o elemento focado para
  // restaurar depois e leva o foco à região do banner (neutro: nem "Aceitar"
  // nem "Recusar" ficam pré-selecionados). Tab segue para o link e os botões.
  useEffect(() => {
    if (!visible) return;
    previousFocusRef.current =
      (document.activeElement as HTMLElement | null) ?? null;
    regionRef.current?.focus({ preventScroll: true });
    return () => {
      previousFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, [visible]);

  function handle(choice: Consent) {
    // Auditoria antes de gravar: a retirada do aceite recarrega a página logo
    // depois, e o registro vai por beacon (sobrevive ao reload).
    const source =
      readConsent() !== null ? "preferences" : hadLegacyAcceptance() ? "renovacao" : "banner";
    logConsentAudit(choice, source);
    setConsent(choice);
    setVisible(false);
  }

  // ESC equivale a "Recusar" (opção mais segura para privacidade do que
  // dispensar sem decisão) — mas só com o foco DENTRO do banner. Antes o
  // listener era global: fechar um lightbox/modal com ESC registrava recusa.
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    handle("declined");
  }

  if (!visible) return null;

  return (
    // Usa `role="region"` (não "dialog") porque o banner não bloqueia
    // interação com o resto da página — declarar dialog sem aria-modal
    // nem focus-trap é o pior dos mundos. Region + aria-labelledby
    // mantém o banner navegável por leitores de tela como landmark;
    // o ESC (com foco no banner) cobre o fluxo de teclado. (M8)
    <div
      ref={regionRef}
      className="cookie-banner"
      role="region"
      aria-live="polite"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div className="cookie-banner__inner">
        <div className="cookie-banner__text">
          <p id="cookie-banner-title" className="cookie-banner__title">
            Cookies e privacidade
          </p>
          <p id="cookie-banner-desc" className="cookie-banner__desc">
            Com o seu aceite, usamos cookies e tecnologias da Meta e do Google
            para medir o uso do site e mostrar anúncios da Bewild no Facebook,
            no Instagram e no Google para quem já visitou o site e para pessoas
            com perfil parecido. Você pode mudar a escolha quando quiser em
            &ldquo;Preferências de cookies&rdquo;, no rodapé. Saiba mais na{" "}
            <a
              className="cookie-banner__link"
              href={routes.privacidade}
              data-cursor="hover"
            >
              Política de Privacidade
            </a>
            .
          </p>
        </div>
        <div className="cookie-banner__actions">
          <button
            type="button"
            className="cookie-banner__btn"
            data-consent="declined"
            onClick={() => handle("declined")}
            data-cursor="hover"
          >
            Recusar
          </button>
          <button
            type="button"
            className="cookie-banner__btn"
            data-consent="accepted"
            onClick={() => handle("accepted")}
            data-cursor="hover"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
