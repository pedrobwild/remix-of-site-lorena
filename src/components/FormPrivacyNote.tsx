import type { ReactNode } from "react";
import { routes } from "@/lib/useHashRoute";

/**
 * Aviso de privacidade no ponto de coleta (LGPD, art. 9º), igual em todos os
 * formulários: para que servem os dados e o que segue, criptografado, para as
 * plataformas de anúncio — só com o aceite de cookies.
 *
 * `platforms` espelha src/lib/conversions.ts:
 *  - "meta-google": formulários de cliente (Lead no Pixel e na API de
 *    Conversões da Meta + conversão otimizada do Google Ads);
 *  - "meta": cadastros de parceiro e de incorporadora e indicação
 *    (SubmitApplication, só na Meta).
 */
export type FormAdsPlatforms = "meta" | "meta-google";

const RECEIVERS: Record<FormAdsPlatforms, string> = {
  "meta-google": "a Meta e o Google medirem e direcionarem",
  meta: "a Meta medir e direcionar",
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
      {children} Se você aceitou os cookies, {contact} também seguem
      criptografados para {RECEIVERS[platforms]} nossos anúncios.{" "}
      <a href={routes.privacidade}>Política de privacidade</a>.
    </p>
  );
}
