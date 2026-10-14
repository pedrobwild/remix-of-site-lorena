import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import {
  ATRIBUICAO_CANONICAL,
  ATRIBUICAO_EMAIL,
  ATRIBUICAO_ENDERECO,
  ATRIBUICAO_LICENCA_NOME,
  ATRIBUICAO_LICENCA_URL,
  ATRIBUICAO_LINHA,
  ATRIBUICAO_NOME,
  ATRIBUICAO_SEO,
  ATRIBUICAO_SITE,
  ATRIBUICAO_TELEFONE,
} from "@/content/pages/atribuicao";
import { useSeo } from "@/lib/useSeo";
/* Mesmo padrão visual de /licenca-cc-by-4-0, /privacidade e /politica-de-cookies. */
import "@/styles/post.css";

/**
 * /atribuicao — página para reportagens e estudos citarem a Bewild como
 * fonte: nome, endereço, licença e linha de crédito pronta para copiar.
 * Conteúdo estático (não vem do banco nem do painel).
 */
export default function AtribuicaoPage() {
  useSeo({
    ...ATRIBUICAO_SEO,
    canonicalPath: ATRIBUICAO_CANONICAL,
    ogType: "website",
  });

  return (
    <div className="bw-home bw-post">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">Fonte de dados · Bewild</div>
            <h1 className="pt-title">Atribuição da Bewild.</h1>
            <p className="pt-excerpt">
              Esta página reúne o que uma reportagem, um estudo ou um material
              precisa para citar a Bewild como fonte: o nome oficial, o
              endereço e o link da licença dos dados do{" "}
              <a href="/indice-de-custo-de-reforma">Índice Bewild de custo de reforma</a>.
            </p>
            <div className="pt-meta">
              <span>Última atualização: 14 de outubro de 2026</span>
            </div>
          </div>
        </section>

        <section className="pt-body-section">
          <div className="container">
            <div className="pt-body">
              <h2>Quem é a fonte</h2>
              <p>
                <strong>{ATRIBUICAO_NOME}</strong> — reforma completa de
                apartamentos e studios em São Paulo: projeto, obra, marcenaria,
                mobília e setup em um único contrato, com preço fechado, prazo
                em contrato e 5 anos de garantia.
              </p>
              <ul>
                <li>
                  <strong>Endereço:</strong> {ATRIBUICAO_ENDERECO}
                </li>
                <li>
                  <strong>Site:</strong>{" "}
                  <a href={ATRIBUICAO_SITE}>{ATRIBUICAO_SITE.replace("https://", "")}</a>
                </li>
                <li>
                  <strong>E-mail:</strong>{" "}
                  <a href={`mailto:${ATRIBUICAO_EMAIL}`}>{ATRIBUICAO_EMAIL}</a>
                </li>
                <li>
                  <strong>Telefone:</strong> {ATRIBUICAO_TELEFONE}
                </li>
              </ul>

              <h2>O que está sob licença</h2>
              <p>
                Os <strong>dados</strong> do{" "}
                <a href="/indice-de-custo-de-reforma">Índice Bewild de custo de reforma</a>{" "}
                estão sob a licença{" "}
                <a
                  href="/licenca-cc-by-4-0"
                  title="Licença CC BY 4.0 — página da Bewild"
                >
                  {ATRIBUICAO_LICENCA_NOME}
                </a>
                , com o{" "}
                <a href={ATRIBUICAO_LICENCA_URL} target="_blank" rel="noopener noreferrer" aria-label="Texto oficial da licença CC BY 4.0 no Creative Commons (abre em nova aba)">
                  texto oficial do Creative Commons (abre em nova aba)
                </a>
                . Isso significa que você pode usar os números em reportagens,
                estudos e materiais próprios, inclusive comercialmente, desde
                que cite a Bewild e indique o link da licença. O restante do
                site — textos, fotografias de obras, projetos e a marca — não
                está sob a licença.
              </p>

              <h2>Linha de crédito pronta</h2>
              <p>
                Copie a linha abaixo para a legenda, o rodapé ou a nota de
                fonte do seu material:
              </p>
              <pre className="pt-atribuicao-bloco">{ATRIBUICAO_LINHA}</pre>
              <p>
                Em trabalhos acadêmicos, use o formato de citação da sua
                instituição, incluindo o nome da fonte, o link do Índice e a
                licença. Os requisitos completos de crédito estão descritos na{" "}
                <a href="/licenca-cc-by-4-0">página da licença</a>.
              </p>

              <h2>Dúvidas</h2>
              <p>
                Para um uso específico ou para falar com a assessoria, escreva
                para <a href={`mailto:${ATRIBUICAO_EMAIL}`}>{ATRIBUICAO_EMAIL}</a>{" "}
                ou use a <a href="/contato">página de contato</a>.
              </p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
