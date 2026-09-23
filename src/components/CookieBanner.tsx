import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { routes } from "../lib/useHashRoute";
import { readConsent, setConsent, OPEN_PREFERENCES_EVENT, type Consent } from "../lib/cookieConsent";
import { logConsentAudit } from "../lib/analytics";

/**
 * Banner de consentimento de cookies (LGPD).
 * - Aparece apenas se o usuário ainda não registrou uma escolha.
 * - Persiste e propaga a decisão via `src/lib/cookieConsent.ts` (chave
 *   `lal_cookie_consent` no localStorage + evento `cookie:consent-change`).
 * - Analytics, GA4, GTM, Meta Pixel, Clarity e Hotjar só rodam quando o
 *   valor é `"accepted"` — sem aceite, nenhum tracker é injetado. Recusar
 *   depois de aceitar recarrega a página limpa (ver cookieConsent.ts).
 * - A trilha de auditoria (`logConsentAudit`) sai daqui, do clique explícito
 *   — nunca de eventos de outras abas.
 * - Link para /privacidade para detalhes.
 */

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const acceptBtnRef = useRef<HTMLButtonElement>(null);
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
  // restaurar depois, e move o foco para "Aceitar" (default não
  // destrutivo).
  useEffect(() => {
    if (!visible) return;
    previousFocusRef.current =
      (document.activeElement as HTMLElement | null) ?? null;
    acceptBtnRef.current?.focus({ preventScroll: true });
    return () => {
      previousFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, [visible]);

  function handle(choice: Consent) {
    // Auditoria antes de gravar: a retirada do aceite recarrega a página logo
    // depois, e o registro vai por beacon (sobrevive ao reload).
    logConsentAudit(choice, readConsent() === null ? "banner" : "preferences");
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
      className="cookie-banner"
      role="region"
      aria-live="polite"
      aria-labelledby="cookie-banner-title"
      onKeyDown={onKeyDown}
    >
      <div className="cookie-banner__inner">
        <div className="cookie-banner__text">
          <p id="cookie-banner-title" className="cookie-banner__title">
            Cookies e privacidade
          </p>
          <p className="cookie-banner__desc">
            Este site utiliza cookies para melhorar sua experiência e entender
            como nossos conteúdos são acessados. Você pode aceitar ou recusar
            cookies não essenciais. Saiba mais em nossa{" "}
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
            className="cookie-banner__btn cookie-banner__btn--ghost"
            onClick={() => handle("declined")}
            data-cursor="hover"
          >
            Recusar
          </button>
          <button
            ref={acceptBtnRef}
            type="button"
            className="cookie-banner__btn cookie-banner__btn--solid"
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
