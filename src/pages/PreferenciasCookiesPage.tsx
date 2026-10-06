import { useEffect, useState } from "react";
import { useSeo } from "../lib/useSeo";
import { routes } from "../lib/useHashRoute";
import {
  readConsent,
  setConsent,
  onConsentChange,
  type Consent,
} from "../lib/cookieConsent";
import { logConsentAudit } from "../lib/analytics";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
/* Mesmo design de /privacidade: exclusivamente as classes .bw-post/.pt-*. */
import "@/styles/post.css";
import { TABLE_REGION_CLASS } from "@/lib/articleTables";

/**
 * /preferencias-de-cookies — página de Preferências de Cookies (LGPD).
 *
 * É para cá que o banner aponta: o visitante vê a escolha atual, entende o
 * que cada opção autoriza e pode trocar a qualquer momento (direito de
 * retirar o consentimento, LGPD art. 8º, §5º). Os botões usam o mesmo fluxo
 * do banner (`setConsent` + `logConsentAudit` com origem "preferences"), e a
 * retirada do aceite recarrega a página limpa (ver cookieConsent.ts).
 *
 * Manter em sincronia com src/components/CookieBanner.tsx, CONSENT_VERSION
 * em src/lib/cookieConsent.ts e a tabela de cookies de /privacidade.
 */
export default function PreferenciasCookiesPage() {
  const [choice, setChoice] = useState<Consent | null>(null);

  useEffect(() => {
    setChoice(readConsent());
    return onConsentChange((value) => setChoice(value));
  }, []);

  useSeo({
    title: "Preferências de cookies | Bewild",
    description:
      "Veja e mude sua escolha sobre cookies de medição e publicidade do site da Bewild a qualquer momento.",
    canonicalPath: "/preferencias-de-cookies",
    noindex: true,
    ogType: "website",
  });

  function handle(value: Consent) {
    // Mesma trilha de auditoria do banner, com origem "preferences".
    logConsentAudit(value, "preferences");
    setConsent(value);
  }

  const statusText =
    choice === "accepted"
      ? "Você aceitou os cookies de medição e publicidade."
      : choice === "declined"
        ? "Você recusou os cookies de medição e publicidade."
        : "Você ainda não fez uma escolha nesta versão do aviso.";

  return (
    <div className="bw-home bw-post">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">Privacidade · Bewild</div>
            <h1 className="pt-title">Preferências de cookies.</h1>
            <p className="pt-excerpt">
              Aqui você vê e muda, a qualquer momento, a sua escolha sobre os
              cookies de medição e publicidade deste site.
            </p>
            <div className="pt-meta">
              <span>Última atualização: 27 de setembro de 2026</span>
            </div>
          </div>
        </section>

        <section className="pt-body-section">
          <div className="container">
            <div className="pt-body">
              <h2>Sua escolha atual</h2>
              <p>
                <strong>{statusText}</strong>
              </p>
              <p>
                <button
                  type="button"
                  className="pt-link-button"
                  onClick={() => handle("accepted")}
                  disabled={choice === "accepted"}
                >
                  Aceitar cookies de medição e publicidade
                </button>
                {" · "}
                <button
                  type="button"
                  className="pt-link-button"
                  onClick={() => handle("declined")}
                  disabled={choice === "declined"}
                >
                  Recusar cookies de medição e publicidade
                </button>
              </p>
              <p>
                As duas opções têm o mesmo peso. Se você retirar o aceite, os
                cookies de medição deste site são apagados, a página recarrega
                sem nenhum rastreador e nada mais é enviado à Meta nem ao
                Google; o que já foi enviado segue as ferramentas e os prazos
                dessas empresas.
              </p>

              <h2>O que cada opção autoriza</h2>
              <ul>
                <li>
                  <strong>Cookies essenciais</strong> (sempre ativos): guardam
                  a sua própria escolha sobre cookies, até você mudar de ideia
                  ou limpar os dados do navegador. Sem eles o aviso voltaria a
                  cada visita.
                </li>
                <li>
                  <strong>Medição e publicidade</strong> (só com o seu aceite):
                  permitem contar visitas e sessões, saber de onde veio a
                  visita e mostrar anúncios da Bewild no Facebook, no Instagram
                  e no Google para quem já visitou o site e para pessoas com
                  perfil parecido. Se você recusar, nenhum deles é carregado.
                </li>
              </ul>

              <h2>Cookies de medição e publicidade (só com aceite)</h2>
              {/* Região rolável: no celular a tabela tem 4 colunas e a última ("Duração")
                  ficava cortada, sem como alcançá-la (MOB-07, ver src/lib/articleTables.ts).
                  O nome da região é a própria legenda da tabela. */}
              <div className={TABLE_REGION_CLASS} tabIndex={0} role="region" aria-labelledby="tabela-cookies-aceite">
                <table>
                  <caption id="tabela-cookies-aceite">Cookies de medição e publicidade (só com aceite)</caption>
                  <thead>
                    <tr>
                      <th scope="col">Quem grava</th>
                      <th scope="col">Nome</th>
                      <th scope="col">Para quê</th>
                      <th scope="col">Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Bewild (medição própria)</td>
                      <td>bewild_vid, bewild_sid e origem da visita</td>
                      <td>Contar visitas e sessões e saber de onde veio a visita</td>
                      <td>
                        Visitante e primeira origem: 12 meses sem visitas; sessão:
                        30 minutos sem uso; clique de anúncio: 90 dias
                      </td>
                    </tr>
                    <tr>
                      <td>Google Analytics</td>
                      <td>_ga, _ga_*</td>
                      <td>Medir o uso do site</td>
                      <td>Até 2 anos</td>
                    </tr>
                    <tr>
                      <td>Google Ads</td>
                      <td>_gcl_*</td>
                      <td>Medir conversões dos anúncios e remarketing</td>
                      <td>90 dias</td>
                    </tr>
                    <tr>
                      <td>Meta</td>
                      <td>_fbp, _fbc</td>
                      <td>Medir anúncios, remarketing e públicos</td>
                      <td>90 dias</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2>Mais detalhes</h2>
              <p>
                A lista completa do que é coletado, para quê, por quanto tempo
                e como exercer seus direitos está na&nbsp;
                <a href={routes.privacidade}>Política de Privacidade</a>.
              </p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
