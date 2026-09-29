import type { ReactNode } from "react";
import { routes } from "@/lib/useHashRoute";

/**
 * Aviso de privacidade no ponto de coleta (LGPD, art. 9º), igual em todos os
 * formulários: para que servem os dados e o que segue, criptografado, para as
 * plataformas de anúncio.
 *
 * `platforms` espelha src/lib/conversions.ts:
 *  - "meta-google": formulários de cliente. O Lead vai à Meta pela API de
 *    Conversões no envio do formulário (contato em hash), independentemente do
 *    banner de cookies (decisão de 25/09/2026; `META_CAPI_REQUIRE_CONSENT`
 *    religa a exigência); Pixel e Google Ads continuam só com o aceite.
 *  - "meta": cadastros de parceiro e de incorporadora e indicação
 *    (SubmitApplication, só no Pixel da Meta, só com aceite).
 */
export type FormAdsPlatforms = "meta" | "meta-google";

const SENTENCE: Record<FormAdsPlatforms, (contact: string) => string> = {
  "meta-google": (contact) =>
    `Ao enviar, ${contact} seguem criptografados para a Meta medir e direcionar nossos anúncios; se você aceitou os cookies, também para o Google.`,
  meta: (contact) =>
    `Se você aceitou os cookies, ${contact} também seguem criptografados para a Meta medir e direcionar nossos anúncios.`,
};

type Props = {
  /** Primeira frase: para que servem os dados (termina com ponto). */
  children: ReactNode;
  platforms: FormAdsPlatforms;
  /** Quais dados seguem para as plataformas. */
  contact?: string;
  className?: string;
};

export default function FormPrivacyNote({
  children,
  platforms,
  contact = "nome, e-mail e telefone",
  className,
}: Props) {
  return (
    <p className={className} data-privacy-note={platforms}>
      {children} {SENTENCE[platforms](contact)}{" "}
      <a href={routes.privacidade}>Política de privacidade</a>.
    </p>
  );
}
