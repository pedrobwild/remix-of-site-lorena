import { useSeo } from "../lib/useSeo";
import { routes } from "../lib/useHashRoute";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
/* Mesmo design de /privacidade: exclusivamente as classes .bw-post/.pt-*. */
import "@/styles/post.css";
import { TABLE_REGION_CLASS } from "@/lib/articleTables";

/**
 * /politica-de-cookies — Política de Cookies (LGPD), design Bewild.
 *
 * Página para ser lida e indexada. A página de ajuste da escolha é
 * /preferencias-de-cookies (noindex); a política completa de dados é
 * /privacidade.
 *
 * Manter em sincronia com src/components/CookieBanner.tsx, CONSENT_VERSION
 * em src/lib/cookieConsent.ts e a tabela de cookies de /privacidade e
 * /preferencias-de-cookies (mesmos nomes e prazos).
 */
const COOKIE_POLICY_UPDATED = "12 de outubro de 2026";

export default function PoliticaCookiesPage() {
  useSeo({
    title: "Política de cookies | Bewild",
    description:
      "Quais cookies o site da Bewild usa, para quê, por quanto tempo e como aceitar, recusar ou mudar sua escolha a qualquer momento.",
    canonicalPath: "/politica-de-cookies",
    ogType: "website",
  });

  return (
    <div className="bw-home bw-post">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">Política · Bewild</div>
            <h1 className="pt-title">Política de cookies.</h1>
            <p className="pt-excerpt">
              Aqui explicamos quais cookies o site da Bewild usa, para que
              servem, quanto tempo duram e como você aceita, recusa ou muda a
              sua escolha.
            </p>
            <div className="pt-meta">
              <span>Última atualização: {COOKIE_POLICY_UPDATED}</span>
            </div>
          </div>
        </section>

        <section className="pt-body-section">
          <div className="container">
            <div className="pt-body">
              <h2>O que são cookies</h2>
              <p>
                Cookies são pequenos arquivos que o site grava no seu navegador.
                Eles guardam informações simples, como a sua escolha neste
                aviso, e permitem contar visitas e medir anúncios. Usamos
                também o armazenamento local do navegador para a mesma
                finalidade, e tratamos os dois da mesma forma nesta política.
              </p>

              <h2>Duas categorias</h2>
              <ul>
                <li>
                  <strong>Essenciais</strong> (sempre ativos): guardam a sua
                  própria escolha sobre cookies, até você mudar de ideia ou
                  limpar os dados do navegador. Sem eles o aviso voltaria a
                  cada visita.
                </li>
                <li>
                  <strong>Medição e publicidade</strong> (só com o seu aceite):
                  contam visitas e sessões, mostram de onde veio a visita e
                  permitem mostrar anúncios da Bewild no Facebook, no Instagram
                  e no Google para quem já visitou o site e para pessoas com
                  perfil parecido. Se você recusar, nenhum deles é carregado.
                </li>
              </ul>

              <h2>Cookies de medição e publicidade (só com aceite)</h2>
              <div className={TABLE_REGION_CLASS} tabIndex={0} role="region" aria-labelledby="tabela-cookies-politica">
                <table>
                  <caption id="tabela-cookies-politica">Cookies de medição e publicidade (só com aceite)</caption>
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

              <h2>Como aceitar, recusar ou mudar a escolha</h2>
              <p>
                Na primeira visita, o aviso na parte de baixo da tela traz os
                botões &ldquo;Aceitar&rdquo; e &ldquo;Recusar&rdquo;, com o
                mesmo peso. Você muda a escolha quando quiser em{" "}
                <a href={routes.preferenciasCookies}>Preferências de cookies</a>
                , também disponível no rodapé de todas as páginas. Retirar o
                aceite apaga os cookies de medição deste site, a página recarrega
                sem nenhum rastreador e nada mais é enviado à Meta nem ao
                Google. O que já foi enviado segue as ferramentas e os prazos
                dessas empresas.
              </p>
              <p>
                Você também pode bloquear ou apagar cookies pelas configurações
                do seu navegador. Isso não afeta o uso do site, mas o aviso
                pode voltar a aparecer.
              </p>

              <h2>Conteúdos de terceiros</h2>
              <p>
                O mapa do Google Maps, na página de contato, e outros conteúdos
                incorporados vêm direto do Google e da Meta, que podem gravar
                cookies próprios. Por isso eles só carregam depois do seu aceite
                ou quando você clica para exibi-los. A exceção são os vídeos do
                YouTube das páginas de vídeo e de alguns artigos, que carregam
                junto com a página, pelo endereço youtube-nocookie.com (e as
                miniaturas deles, pelo endereço i.ytimg.com).
              </p>

              <h2>Registro da sua escolha</h2>
              <p>
                Da sua decisão registramos apenas a escolha (aceite ou
                recusa), a versão do texto, a página e o horário, sem
                identificador pessoal, para comprovar o consentimento. Quando
                mudamos a finalidade dos cookies, o aviso volta a aparecer para
                você decidir de novo.
              </p>

              <h2>Mais detalhes e contato</h2>
              <p>
                Os dados pessoais que tratamos, os seus direitos e como falar
                com a Bewild estão na{" "}
                <a href={routes.privacidade}>Política de privacidade</a>.
              </p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
