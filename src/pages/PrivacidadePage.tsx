import { useSeo } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import { routes } from "../lib/useHashRoute";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
/* Só post.css: a página usa exclusivamente as classes .bw-post/.pt-*.
   home.css (folha legada da home antiga) e conteudos.css entravam no bundle
   global sem serem usadas aqui e sobrescreviam .bwh-wrap/.bwh-sec/.bwh-btn
   em telas <=720px, quebrando o alinhamento do FAQ e do portfólio. */
import "@/styles/post.css";
import { TABLE_REGION_CLASS } from "@/lib/articleTables";

/**
 * /privacidade — Política de Privacidade (LGPD), design Bewild.
 * Reaproveita pt-hero / pt-body do design system de posts.
 *
 * Manter em sincronia com o que o site faz de verdade:
 *  - banner e versão do aceite: src/components/CookieBanner.tsx e
 *    CONSENT_VERSION em src/lib/cookieConsent.ts (mudou a finalidade do
 *    aceite → sobe a versão e atualiza esta página);
 *  - eventos e dados que vão à Meta e ao Google: src/lib/conversions.ts,
 *    src/lib/metaPixel.ts, src/lib/googleAds.ts e
 *    supabase/functions/_shared/meta-capi.ts;
 *  - prazos da medição própria: src/lib/analytics.ts.
 */
export default function PrivacidadePage() {
  const { settings } = useSiteSettings();

  const contactEmail = settings?.contact_email || "contato@bewild.com.br";
  const lastUpdated = "9 de outubro de 2026";

  useSeo({
    title: "Política de privacidade | Bewild",
    description: "Como a Bewild coleta, usa e protege os dados de clientes e interessados em projetos e reformas de apartamentos.",
    canonicalPath: "/privacidade",
    ogType: "website",
  });

  const prefsButton = <a href={routes.preferenciasCookies}>Preferências de cookies</a>;

  return (
    <div className="bw-home bw-post">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">Política · Bewild</div>
            <h1 className="pt-title">Política de privacidade.</h1>
            <p className="pt-excerpt">
              A Bewild respeita sua privacidade e está comprometida com a
              transparência no tratamento de dados pessoais, em conformidade
              com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
            </p>
            <div className="pt-meta">
              <span>Última atualização: {lastUpdated}</span>
            </div>
          </div>
        </section>

        <section className="pt-body-section">
          <div className="container">
            <div className="pt-body">
              <p>
                <strong>O que mudou nesta versão:</strong> explicamos como
                usamos o Pixel da Meta e a tag do Google para medir e direcionar
                anúncios (inclusive para quem já visitou o site e para pessoas
                com perfil parecido), o envio criptografado do seu contato a
                essas plataformas quando você envia um formulário, os prazos dos
                cookies e como recusar. Quem já tinha aceitado os cookies verá o
                banner de novo, para decidir com essas informações.
              </p>

              <h2>Quem é o controlador dos dados</h2>
              <p>
                <strong>Bewild</strong>, estabelecida em São
                Paulo/SP{settings?.cnpj && <>, inscrita no CNPJ {settings.cnpj}</>},
                é a controladora dos dados pessoais tratados por meio deste
                site, sendo responsável pelas decisões sobre o tratamento
                desses dados.
              </p>

              <h2>Quais dados coletamos</h2>
              <p>
                Coletamos apenas os dados necessários para responder às suas
                solicitações, oferecer uma experiência consistente e, com o seu
                aceite, medir e direcionar nossos anúncios:
              </p>
              <ul>
                <li>
                  <strong>Dados que você envia nos formulários do site:</strong>{" "}
                  conforme o formulário, nome, WhatsApp, e-mail, localização do
                  imóvel, metragem, objetivo da reforma e mensagem, nos
                  formulários de orçamento, contato, das páginas de campanha, do
                  programa de parceiros e do cadastro de incorporadoras. O
                  pedido de orçamento também pergunta se você já tem as chaves e
                  a planta do imóvel, se mora em São Paulo e como conheceu a
                  Bewild. Na indicação de amigos, pedimos também o nome e o
                  WhatsApp de quem você indica. Junto com o envio, registramos a
                  origem da visita (parâmetros de campanha, site de referência,
                  página de entrada e, se você chegou por um anúncio, o código
                  do clique) e o tipo de navegador.
                </li>
                <li>
                  <strong>Formulários dos anúncios da Meta:</strong> quando você
                  preenche um formulário de cadastro dentro de um anúncio da
                  Bewild no Facebook ou no Instagram, a Meta nos repassa as
                  respostas (como nome, telefone, e-mail e cidade) e a campanha
                  em que o formulário estava.
                </li>
                <li>
                  <strong>Dados de contato voluntários:</strong> nome, e-mail,
                  telefone e mensagem, quando você escolhe nos contatar por
                  WhatsApp, e-mail ou outros canais indicados no site.
                </li>
                <li>
                  <strong>Dados de navegação da nossa própria medição:</strong>{" "}
                  páginas visitadas, tempo de permanência, eventos de clique,
                  tipo de dispositivo, site de origem e identificadores
                  aleatórios de visitante e de sessão guardados no seu navegador
                  — coletados somente depois que você aceita os cookies. Esses
                  dados não permitem sua identificação pessoal direta.
                </li>
                <li>
                  <strong>Dados coletados pelo Pixel da Meta e pela tag do
                  Google (somente com o seu aceite):</strong> as páginas e os
                  conteúdos que você vê (projetos, serviços, artigos), o início
                  e o envio de formulários, cliques para falar por WhatsApp,
                  telefone ou e-mail, sinais de interesse (tempo na página e
                  rolagem), dados técnicos do aparelho e do navegador, endereço
                  IP e os identificadores dos cookies dessas empresas. Quando
                  você envia um formulário, seguem também nome, e-mail e
                  telefone criptografados por hash (as plataformas só conseguem
                  compará-los com os dados que já têm, sem ler o original) e
                  características gerais do pedido: objetivo da reforma, faixa
                  de metragem, etapa do imóvel e se você mora em São Paulo.
                  Detalhes em &ldquo;Anúncios e públicos&rdquo;.
                </li>
                <li>
                  <strong>Contagem de campanhas:</strong> aberturas e cliques em
                  imagens e links rastreados das nossas campanhas (como e-mails
                  e QR codes de materiais impressos) são contados por campanha,
                  sem identificar quem abriu ou clicou.
                </li>
                <li>
                  <strong>Cookies e armazenamento local:</strong> para lembrar
                  sua escolha sobre cookies e, com o seu aceite, para medição e
                  publicidade — veja &ldquo;Cookies&rdquo;.
                </li>
              </ul>

              <h2>Finalidade do tratamento</h2>
              <p>Utilizamos os dados coletados para:</p>
              <ul>
                <li>Responder a pedidos de orçamento, dúvidas e contatos;</li>
                <li>
                  Compreender o desempenho do site e aprimorar a experiência
                  de navegação (analytics agregados);
                </li>
                <li>
                  Com o seu aceite, medir o resultado das nossas campanhas e
                  exibir anúncios da Bewild no Facebook, no Instagram e no
                  Google para quem já visitou o site e para pessoas com perfil
                  parecido (veja &ldquo;Anúncios e públicos&rdquo;);
                </li>
                <li>
                  Garantir a segurança e a integridade técnica da plataforma;
                </li>
                <li>
                  Cumprir obrigações legais, regulatórias e fiscais aplicáveis
                  à atividade da empresa.
                </li>
              </ul>

              <h2>Para onde vão os dados dos formulários</h2>
              <p>
                Quando você envia um formulário do site, os dados são gravados
                no nosso banco de dados, mantido no Supabase (serviço de banco
                de dados e infraestrutura em nuvem), e encaminhados aos nossos
                canais internos: um aviso à equipe comercial no Slack e por
                e-mail, e o nosso CRM, onde o atendimento e o orçamento são
                acompanhados. Os cadastros feitos nos formulários dos anúncios
                da Meta seguem o mesmo caminho. Esses dados são usados para
                responder ao seu pedido e dar andamento a ele.
              </p>
              <p>
                Quando você envia um formulário de orçamento, contato ou
                diagnóstico, nome, e-mail e telefone (e cidade e estado, quando
                informados) seguem criptografados por hash para a Meta, para
                medir o resultado e direcionar nossos anúncios — isso acontece
                pelo nosso servidor, no envio do formulário, com base no nosso
                interesse legítimo em medir as campanhas, e independe dos
                cookies (que controlam apenas o Pixel no seu navegador). Se você
                aceitou os cookies, o mesmo contato criptografado segue também
                para o Google. Quando o atendimento avança (contato qualificado
                ou não), a Meta também é avisada, com o mesmo contato
                criptografado, o objetivo da reforma e a campanha de origem —
                nunca a mensagem. Para os cadastros feitos nos formulários dos
                anúncios da Meta, informamos à Meta o andamento do atendimento
                (recebido, contatado, qualificado ou descartado) usando o
                identificador que a própria Meta deu ao seu cadastro. Nos
                cadastros de parceiros e de incorporadoras e na indicação de
                amigos, só a Meta recebe o seu contato criptografado, e somente
                com o seu aceite de cookies — os dados de quem você indica nunca
                são enviados às plataformas de anúncio. Para se opor a esse
                envio, escreva para o contato indicado em &ldquo;Seus
                direitos&rdquo;.
              </p>
              <p>
                Para relatórios internos, levamos às nossas planilhas e
                ferramentas de análise dados sem nome, telefone, e-mail ou
                mensagem.
              </p>

              <h2>Anúncios e públicos</h2>
              <p>
                Com o seu aceite, o site carrega o Pixel da Meta e a tag do
                Google (Google Analytics e Google Ads). A Meta e o Google, como
                terceiros, usam cookies, pixels e tecnologias parecidas para
                coletar ou receber informações do nosso site e de outros sites
                e aplicativos, e usam essas informações para medir resultados e
                direcionar anúncios, conforme as políticas de privacidade da{" "}
                <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer">
                  Meta
                </a>{" "}
                e do{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  Google
                </a>{" "}
                (veja também{" "}
                <a
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  como o Google usa dados de sites parceiros
                </a>
                ).
              </p>
              <p>Com essas informações, a Bewild pode:</p>
              <ul>
                <li>
                  medir quantas visitas, contatos e pedidos de orçamento vieram
                  de cada anúncio;
                </li>
                <li>
                  mostrar anúncios da Bewild a quem visitou o site, viu um
                  projeto ou serviço, começou um formulário ou passou mais
                  tempo no conteúdo (remarketing);
                </li>
                <li>
                  deixar de mostrar anúncios de captação a quem já pediu
                  orçamento;
                </li>
                <li>
                  pedir às plataformas que encontrem pessoas com perfil parecido
                  com o de quem visitou o site ou virou cliente (públicos
                  semelhantes). Quem monta esses públicos são a Meta e o Google,
                  com os dados que já têm; a Bewild não recebe nenhuma
                  informação que identifique essas pessoas.
                </li>
              </ul>
              <p>
                A Bewild não coleta no site idade, gênero, renda ou interesses.
                Os relatórios demográficos das plataformas de anúncio são
                agregados e produzidos por elas, sem identificar ninguém. Não
                enviamos às plataformas dados sensíveis (como saúde, situação
                financeira ou documentos), o texto das mensagens, o endereço do
                imóvel nem os dados de pessoas indicadas.
              </p>

              <h3>Como recusar ou limitar</h3>
              <ul>
                <li>
                  <strong>No site:</strong> em {prefsButton} (também no rodapé),
                  escolha &ldquo;Recusar&rdquo;. Os cookies de medição deste
                  site são apagados e nada mais é enviado às plataformas daí em
                  diante.
                </li>
                <li>
                  <strong>Na Meta:</strong> em{" "}
                  <a href="https://www.facebook.com/adpreferences" target="_blank" rel="noopener noreferrer">
                    Preferências de anúncios
                  </a>{" "}
                  você controla os anúncios que vê no Facebook e no Instagram;
                  na Central de Contas, em &ldquo;Sua atividade fora das
                  tecnologias da Meta&rdquo;, pode ver e desconectar as
                  informações que sites como o nosso enviam.
                </li>
                <li>
                  <strong>No Google:</strong> em{" "}
                  <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">
                    Minha Central de Anúncios
                  </a>{" "}
                  você desativa os anúncios personalizados.
                </li>
                <li>
                  <strong>Outras ferramentas:</strong> as páginas de exclusão da{" "}
                  <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer">
                    Network Advertising Initiative
                  </a>{" "}
                  e da{" "}
                  <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer">
                    Digital Advertising Alliance
                  </a>{" "}
                  e as configurações de anúncios do seu celular.
                </li>
              </ul>

              <h2>Base legal</h2>
              <p>O tratamento de dados pessoais fundamenta-se em:</p>
              <ul>
                <li>
                  <strong>Consentimento</strong> (art. 7º, I da LGPD), dado no
                  banner de cookies, para os cookies não essenciais, a medição,
                  os anúncios e públicos descritos acima e o envio criptografado
                  do seu contato ao Google e ao Pixel da Meta; e para
                  comunicações comerciais;
                </li>
                <li>
                  <strong>
                    Execução de contrato ou procedimentos preliminares
                  </strong>{" "}
                  (art. 7º, V), quando você nos contata para contratar
                  serviços;
                </li>
                <li>
                  <strong>Legítimo interesse</strong> (art. 7º, IX), para
                  manutenção e segurança do site e para medir o resultado das
                  nossas campanhas na Meta a partir dos formulários de cliente
                  (envio do contato criptografado por hash pelo servidor e do
                  andamento do atendimento, como descrito em &ldquo;Para onde
                  vão os dados dos formulários&rdquo;), respeitando seus
                  direitos fundamentais e com a possibilidade de oposição;
                </li>
                <li>
                  <strong>Cumprimento de obrigação legal</strong> (art. 7º,
                  II), quando aplicável.
                </li>
              </ul>

              <h2>Compartilhamento com terceiros</h2>
              <p>
                Não comercializamos dados pessoais. Compartilhamos dados apenas
                com operadores contratados para hospedagem, infraestrutura e
                banco de dados (Supabase), comunicação interna da equipe
                (Slack e serviço de envio de e-mails), gestão do atendimento
                (CRM) e relatórios internos,
                sempre sob obrigação contratual de confidencialidade e
                segurança; com a Meta (Facebook e Instagram), para medição e
                publicidade, como descrito em &ldquo;Anúncios e públicos&rdquo;
                e em &ldquo;Formulários&rdquo;; e, somente com o seu aceite,
                com o Google, para as mesmas finalidades. A Meta e o Google também
                tratam esses dados para finalidades próprias, conforme as
                políticas de privacidade deles. Alguns desses serviços
                armazenam e processam dados em servidores fora do Brasil.
                Também poderemos compartilhar dados mediante obrigação legal ou
                decisão judicial.
              </p>

              <h2>Cookies</h2>
              <p>
                Utilizamos cookies e o armazenamento local do navegador em duas
                categorias:
              </p>
              <ul>
                <li>
                  <strong>Essenciais:</strong> guardam a sua escolha sobre
                  cookies, até você mudar de ideia ou limpar os dados do
                  navegador.
                </li>
                <li>
                  <strong>Medição e publicidade:</strong> só são carregados
                  depois que você clica em &ldquo;Aceitar&rdquo; no banner de
                  cookies; se você recusar, nenhum deles é carregado. O mesmo
                  vale para qualquer outra ferramenta de medição configurada no
                  site.
                </li>
              </ul>
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
              <p>
                Da sua decisão no banner, registramos apenas a escolha (aceite
                ou recusa), a versão do texto, a página e o horário, sem
                identificador pessoal, para comprovar o consentimento. Você pode
                mudar sua escolha a qualquer momento em {prefsButton}, também
                no rodapé do site. Retirar o aceite apaga os cookies de medição
                deste site e interrompe novos envios; o que já foi enviado à
                Meta e ao Google segue as ferramentas e os prazos dessas
                empresas (veja &ldquo;Como recusar ou limitar&rdquo;).
              </p>

              <h2>Conteúdos de terceiros</h2>
              <p>
                O mapa do Google Maps, na página de contato, e as postagens do
                Instagram exibidas na página inicial vêm diretamente do Google
                e da Meta, que podem registrar dados técnicos do acesso (como
                endereço IP e navegador) e gravar cookies próprios. Por isso,
                esses conteúdos só são carregados depois que você aceita os
                cookies ou quando você clica para exibi-los. As fontes
                tipográficas (Google Fonts) e o selo do Reclame Aqui, no
                rodapé, também são carregados a partir dos servidores desses
                serviços.
              </p>

              <h2>Seus direitos</h2>
              <p>Como titular, a LGPD lhe assegura o direito de:</p>
              <ul>
                <li>Confirmar a existência de tratamento de seus dados;</li>
                <li>Acessar os dados tratados;</li>
                <li>
                  Corrigir dados incompletos, inexatos ou desatualizados;
                </li>
                <li>
                  Solicitar anonimização, bloqueio ou eliminação de dados
                  desnecessários ou tratados em desconformidade;
                </li>
                <li>
                  Solicitar a portabilidade de seus dados, nos termos da
                  regulamentação;
                </li>
                <li>
                  Revogar o consentimento, sempre que o tratamento for baseado
                  nele — para cookies e anúncios, a qualquer momento em
                  &ldquo;Preferências de cookies&rdquo;;
                </li>
                <li>
                  Obter informação sobre compartilhamento de seus dados com
                  terceiros;
                </li>
                <li>
                  Opor-se a tratamento realizado em desacordo com a LGPD.
                </li>
              </ul>
              <p>
                Para exercer qualquer desses direitos, entre em contato pelo
                e-mail{" "}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
              </p>

              <h2>Retenção e segurança</h2>
              <p>
                Armazenamos seus dados pelo tempo estritamente necessário às
                finalidades descritas nesta política, ou pelo prazo exigido
                por lei. Os cookies seguem os prazos da tabela acima. Nos
                públicos de anúncio, cada pessoa fica por prazo limitado — na
                Meta, no máximo 180 dias desde a última interação com o site —
                e sai automaticamente depois disso. Adotamos medidas técnicas e
                organizacionais razoáveis para proteger dados pessoais contra
                acessos não autorizados, perda acidental, alteração ou
                divulgação indevida.
              </p>

              <h2>Alterações e contato</h2>
              <p>
                Esta política pode ser atualizada para refletir mudanças
                regulatórias ou nos serviços oferecidos. A data da última
                revisão é sempre indicada no topo desta página. Em caso de
                alterações materiais, destacaremos a mudança em lugar visível
                no site; quando a mudança alterar o que depende do seu aceite,
                o banner de cookies volta a aparecer para você decidir de novo.
              </p>
              <p>
                Para dúvidas, solicitações ou reclamações relacionadas a
                dados pessoais, o canal oficial é o e-mail{" "}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
              </p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
