import { useSeo, breadcrumbJsonLd } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
/* Só post.css: a página usa exclusivamente as classes .bw-post/.pt-*.
   home.css (folha legada da home antiga) e conteudos.css entravam no bundle
   global sem serem usadas aqui e sobrescreviam .bwh-wrap/.bwh-sec/.bwh-btn
   em telas <=720px, quebrando o alinhamento do FAQ e do portfólio. */
import "@/styles/post.css";

/**
 * /privacidade — Política de Privacidade (LGPD), design Bewild.
 * Reaproveita pt-hero / pt-body do design system de posts.
 */
export default function PrivacidadePage() {
  const { settings } = useSiteSettings();

  const contactEmail = settings?.contact_email || "contato@bewild.com.br";
  const lastUpdated = "21 de abril de 2026";

  useSeo({
    title: "Política de privacidade | Bewild",
    description: "Como a Bewild coleta, usa e protege seus dados.",
    canonicalPath: "/privacidade",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Política de Privacidade", path: "/privacidade" },
          ]),
        ]
      : undefined,
  });

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
                Coletamos apenas os dados estritamente necessários para
                oferecer uma experiência consistente e responder às suas
                solicitações:
              </p>
              <ul>
                <li>
                  <strong>Dados de contato voluntários:</strong> nome, e-mail,
                  telefone e mensagem, apenas quando você escolhe nos contatar
                  por WhatsApp, e-mail ou outros canais indicados no site.
                </li>
                <li>
                  <strong>Dados de navegação e analytics:</strong> páginas
                  visitadas, tempo de permanência, eventos de clique, tipo de
                  dispositivo, referrer e um identificador anônimo de sessão.
                  Esses dados não permitem sua identificação pessoal direta.
                </li>
                <li>
                  <strong>Cookies e armazenamento local:</strong> utilizados
                  para lembrar preferências (como o consentimento desta
                  política) e manter a coerência da navegação.
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
                  Garantir a segurança e a integridade técnica da plataforma;
                </li>
                <li>
                  Cumprir obrigações legais, regulatórias e fiscais aplicáveis
                  à atividade da empresa.
                </li>
              </ul>

              <h2>Base legal</h2>
              <p>O tratamento de dados pessoais fundamenta-se em:</p>
              <ul>
                <li>
                  <strong>Consentimento</strong> (art. 7º, I da LGPD), para
                  cookies não essenciais e comunicações comerciais;
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
                  manutenção e segurança do site, respeitando seus direitos
                  fundamentais;
                </li>
                <li>
                  <strong>Cumprimento de obrigação legal</strong> (art. 7º,
                  II), quando aplicável.
                </li>
              </ul>

              <h2>Compartilhamento com terceiros</h2>
              <p>
                Não comercializamos dados pessoais. Podemos compartilhar dados
                apenas com operadores contratados para hospedagem,
                infraestrutura e analytics, sempre sob obrigação contratual de
                confidencialidade e segurança. Também poderemos compartilhar
                dados mediante obrigação legal ou decisão judicial.
              </p>

              <h2>Cookies</h2>
              <p>
                Utilizamos cookies e tecnologias de armazenamento local com
                duas finalidades principais:
              </p>
              <ul>
                <li>
                  <strong>Essenciais:</strong> necessários para o funcionamento
                  do site, como lembrar seu consentimento a esta política.
                </li>
                <li>
                  <strong>Analytics:</strong> coletam dados agregados e
                  anônimos sobre uso do site, permitindo-nos entender o que é
                  mais relevante para os visitantes.
                </li>
              </ul>
              <p>
                Você pode aceitar ou recusar cookies não essenciais no banner
                exibido ao entrar no site, e limpar seu consentimento a
                qualquer momento pelas configurações do seu navegador.
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
                  nele;
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
                por lei. Adotamos medidas técnicas e organizacionais razoáveis
                para proteger dados pessoais contra acessos não autorizados,
                perda acidental, alteração ou divulgação indevida.
              </p>

              <h2>Alterações e contato</h2>
              <p>
                Esta política pode ser atualizada para refletir mudanças
                regulatórias ou nos serviços oferecidos. A data da última
                revisão é sempre indicada no topo desta página. Em caso de
                alterações materiais, destacaremos a mudança em lugar visível
                no site.
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
