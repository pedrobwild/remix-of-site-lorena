import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { COMO_CITAR, INDICE_CANONICAL } from "@/content/indiceCusto";
import {
  LICENCA_CANONICAL,
  LICENCA_CC_DEED_PTBR,
  LICENCA_CC_LEGALCODE,
  LICENCA_CC_URL,
  LICENCA_SEO,
} from "@/content/pages/licenca";
import { useSeo } from "@/lib/useSeo";
import { LICENCAS, type LicencaSlug } from "@/content/pages/licencas";
import type { LicencaLoaderData } from "@/lib/contentLoaders";
/* Só post.css: a página usa exclusivamente as classes .bw-post/.pt-*
   (mesmo padrão de /privacidade e /politica-de-cookies). */
import "@/styles/post.css";

/**
 * /licenca-cc-by-4-0 — página de licença dos dados do Índice Bewild.
 * O resumo dos termos vem do deed oficial em português do Creative Commons
 * (creativecommons.org/licenses/by/4.0/deed.pt-br); a licença em si é o
 * Legal Code, linkado aqui. O COMO_CITAR é o mesmo texto do Índice.
 */
export default function LicencaPage({
  slug = "cc-by-4-0",
  content,
}: { slug?: LicencaSlug; content?: LicencaLoaderData } = {}) {
  const padrao = LICENCAS[slug];
  useSeo({
    ...(slug === "cc-by-4-0" ? LICENCA_SEO : padrao.seo),
    canonicalPath: slug === "cc-by-4-0" ? LICENCA_CANONICAL : padrao.path,
    ogType: "website",
  });

  // Texto editado no painel /admin/licencas (ou o padrão), já renderizado no servidor.
  if (content && content.bodyHtml !== null) {
    return (
      <div className="bw-home bw-post">
        <BwaNav />
        <main id="main" tabIndex={-1}>
          <section className="pt-hero">
            <div className="container">
              <div className="pt-cat">{padrao.eyebrow}</div>
              <h1 className="pt-title">{content.title}</h1>
              {content.intro.split(/\n\s*\n/).map((t, i) => (
                <p key={i} className="pt-excerpt">{t}</p>
              ))}
            </div>
          </section>
          <section className="pt-body-section">
            <div className="container">
              <div className="pt-body" dangerouslySetInnerHTML={{ __html: content.bodyHtml }} />
            </div>
          </section>
        </main>
        <BwaFooter />
      </div>
    );
  }

  return (
    <div className="bw-home bw-post">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">Licença de dados · Bewild</div>
            <h1 className="pt-title">Licença CC BY 4.0.</h1>
            <p className="pt-excerpt">
              Os dados do Índice Bewild de custo de reforma estão disponíveis
              sob a licença Creative Commons Atribuição 4.0 Internacional
              (CC BY 4.0): você pode usá-los em reportagens, estudos e
              materiais próprios, inclusive comercialmente, desde que cite a
              Bewild como fonte e indique o link da licença.
            </p>
            <div className="pt-meta">
              <span>Última atualização: 14 de outubro de 2026</span>
            </div>
          </div>
        </section>

        <section className="pt-body-section">
          <div className="container">
            <div className="pt-body">
              <h2>O que está sob esta licença</h2>
              <p>
                A licença vale para os <strong>dados</strong> do{" "}
                <a href={INDICE_CANONICAL}>Índice Bewild de custo de reforma</a>:
                os números publicados (mediana, quartis, tabela por faixa de
                metragem e distribuição de valores) e a tabela agregada em{" "}
                <a href="/dados/indice-custo-reforma-bewild-2026-10.csv" download>
                  CSV
                </a>
                . Você pode copiar, publicar, adaptar e criar a partir deles
                para qualquer fim, inclusive comercial, sem pedir autorização —
                basta citar a fonte e indicar a licença.
              </p>
              <p>
                O restante deste site não está sob a licença: textos,
                fotografias de obras, projetos e a marca Bewild continuam
                protegidos pelos direitos autorais da Bewild. Dúvidas sobre um
                uso específico podem ser enviadas pelo <a href="/contato">contato</a>.
              </p>

              <h2>Resumo oficial da licença (tradução do deed, em português)</h2>
              <p>
                <strong>Você tem o direito de:</strong>
              </p>
              <ul>
                <li>
                  <strong>Compartilhar</strong> — copiar e redistribuir o
                  material em qualquer suporte ou formato para qualquer fim,
                  mesmo que comercial.
                </li>
                <li>
                  <strong>Adaptar</strong> — remixar, transformar, e criar a
                  partir do material para qualquer fim, mesmo que comercial.
                </li>
              </ul>
              <p>
                O licenciante não pode revogar estes direitos desde que você
                respeite os termos da licença.
              </p>
              <p>
                <strong>De acordo com os termos seguintes:</strong>
              </p>
              <ul>
                <li>
                  <strong>Atribuição</strong> — Você deve dar o crédito
                  apropriado, prover um link para a licença e indicar se
                  mudanças foram feitas. Você deve fazê-lo em qualquer
                  circunstância razoável, mas de nenhuma maneira que sugira que
                  o licenciante apoia você ou o seu uso.
                </li>
                <li>
                  <strong>Sem restrições adicionais</strong> — Você não pode
                  aplicar termos jurídicos ou medidas de caráter tecnológico
                  que restrinjam legalmente outros de fazerem algo que a
                  licença permita.
                </li>
              </ul>
              <p>
                <strong>Avisos:</strong> Você não tem de cumprir com os termos
                da licença relativamente a elementos do material que estejam no
                domínio público ou cuja utilização seja permitida por uma
                exceção ou limitação que seja aplicável. Não são dadas quaisquer
                garantias. A licença pode não lhe dar todas as autorizações
                necessárias para o uso pretendido. Por exemplo, outros direitos,
                tais como direitos de imagem, de privacidade ou direitos
                morais, podem limitar o uso do material.
              </p>

              <h2>Texto oficial</h2>
              <p>
                Este resumo destaca apenas algumas das principais
                características e termos da licença real; ele não é a licença e
                não tem valor legal. Antes de usar o material, revise os termos
                completos na licença oficial:
              </p>
              <ul>
                <li>
                  <a href={LICENCA_CC_URL} target="_blank" rel="noopener noreferrer">
                    Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)
                  </a>{" "}
                  — página canônica da licença;
                </li>
                <li>
                  <a href={LICENCA_CC_LEGALCODE} target="_blank" rel="noopener noreferrer">
                    Legal Code
                  </a>{" "}
                  — o texto legal completo, em inglês, que prevalece em caso de
                  divergência;
                </li>
                <li>
                  <a href={LICENCA_CC_DEED_PTBR} target="_blank" rel="noopener noreferrer">
                    Resumo em português (deed pt-BR)
                  </a>{" "}
                  — tradução oficial do Creative Commons.
                </li>
              </ul>

              <h2>Como citar</h2>
              <p>{COMO_CITAR}</p>
              <p>
                Em uma reportagem, um crédito como “Fonte: Bewild — Índice
                Bewild de custo de reforma (out. 2026),
                https://bewild.com.br/indice-de-custo-de-reforma. Licença CC BY
                4.0.” já atende aos termos. A{" "}
                <a href="/atribuicao">página de atribuição</a> reúne nome,
                endereço e uma linha de crédito pronta para copiar. Em
                trabalhos acadêmicos, use o formato de citação da sua
                instituição, incluindo a licença.
              </p>
              <p>
                Se você adaptar os dados (por exemplo, recalcular, agrupar ou
                converter), indique no material que houve adaptação e mantenha
                a citação da Bewild — é o que o termo “Atribuição” pede.
              </p>

              <h2>Perguntas frequentes</h2>
              <ul>
                <li>
                  <strong>Preciso pedir autorização?</strong> Não. A licença já
                  autoriza o uso para qualquer fim, inclusive comercial, desde
                  que a Bewild seja citada e o link da licença seja indicado.
                </li>
                <li>
                  <strong>Preciso usar a citação completa?</strong> O termo é
                  dar o crédito apropriado: nome da fonte, link para a página e
                  link para a licença, de forma razoável ao meio (legenda,
                  rodapé ou nota).
                </li>
                <li>
                  <strong>Posso publicar os dados em outro formato?</strong>{" "}
                  Sim — planilha, gráfico ou base nova. Indique que a base
                  original é da Bewild e o que você mudou.
                </li>
              </ul>

              <p>
                Mais sobre os dados:{" "}
                <a href={INDICE_CANONICAL}>Índice Bewild de custo de reforma</a>.
              </p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
