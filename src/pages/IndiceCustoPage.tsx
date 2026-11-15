import { useState } from "react";
import { PROVA_CURTA } from "@/content/provas";
import { LICENCA_CANONICAL } from "@/content/pages/licenca";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { useSeo } from "@/lib/useSeo";
import { useCtaClickTracking } from "@/lib/trackCta";
import { PILAR_CUSTO } from "@/content/pages/orcamento";
import "./servico-reforma.css";
import "./indice-custo.css";
import {
  COMO_CITAR,
  COMPOSICAO,
  ESCOPO_INCLUIDO,
  ESTABILIDADE_M2,
  EXCLUSOES,
  FAIXAS_METRAGEM,
  FAIXAS_VALOR,
  graficoEmbedHtml,
  IMPRENSA_GRAFICOS,
  IMPRENSA_NUMEROS,
  INCC_12M,
  INDICE,
  INDICE_ATUALIZADO_EM,
  INDICE_CANONICAL,
  INDICE_CSV_PATH,
  INDICE_DESCRIPTION,
  INDICE_EDICAO,
  INDICE_FAQ,
  INDICE_FRASE_FONTE,
  INDICE_LICENCA_NOME,
  INDICE_TITLE,
  LIMITES,
  PROPOSTA_REAL_VALOR,
  REGIAO_P_VALOR,
  REGISTROS_INICIAIS,
  REGRA_DE_BOLSO,
  RESUMO,
} from "@/content/indiceCusto";

/* ============================================================
 * IndiceCustoPage — /indice-de-custo-de-reforma
 * Página de dados citável (imprensa, buscadores e IAs) com os números
 * do estudo de custo da Bewild. Todos os valores vêm de
 * src/content/indiceCusto.ts, que espelha o artigo pilar.
 * ============================================================ */

const CTA_HREF = "/orcamento";

const brl = (v: number) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
const pct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const dataBR = (iso: string) => iso.split("-").reverse().join("/");

/**
 * Copia um texto da página (frase de fonte, código de incorporação). Só
 * acrescenta: o texto já está no HTML do servidor, selecionável sem JS.
 */
function CopiarTexto({ texto, rotulo, cta }: { texto: string; rotulo: string; cta: string }) {
  const [estado, setEstado] = useState<"" | "copiado" | "falhou">("");
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setEstado("copiado");
    } catch {
      setEstado("falhou");
    }
  }
  return (
    <p className="bwa-indice-copy-row">
      <button type="button" className="bwa-indice-copy" data-cta={cta} onClick={() => void copiar()}>
        {rotulo}
      </button>
      <span role="status" aria-live="polite" className="bwa-indice-copy-status">
        {estado === "copiado" ? "Copiado." : estado === "falhou" ? "Não deu para copiar: selecione o texto e copie." : ""}
      </span>
    </p>
  );
}

export default function IndiceCustoPage() {
  useCtaClickTracking("indice-custo");

  useSeo({
    title: INDICE_TITLE,
    description: INDICE_DESCRIPTION,
    canonicalPath: INDICE_CANONICAL,
    ogType: "website",
  });

  return (
    <div className="bwa-servico bwa-indice">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-servico-intro">
          <div className="bwa-shell bwa-servico-head">
            <p className="bwa-label">Índice Bewild · {INDICE_EDICAO}</p>
            <div>
              <h1 className="bwa-title">
                Índice Bewild de custo de reforma <em>por m² em São Paulo.</em>
              </h1>
              <p className="bwa-servico-lead">{RESUMO}</p>
              <p className="bwa-indice-meta">
                Atualizado em <time dateTime={INDICE_ATUALIZADO_EM}>{dataBR(INDICE_ATUALIZADO_EM)}</time> ·{" "}
                <a href={INDICE_CSV_PATH} download>
                  Baixar os dados (CSV)
                </a>{" "}
                · <a href="#imprensa">Para imprensa</a>
              </p>
            </div>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="numeros">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="numeros">
              Os números da edição
            </h2>
            <dl className="bwa-indice-stats">
              <div>
                <dt>Custo mediano por m²</dt>
                <dd>{brl(INDICE.m2Mediano)}</dd>
              </div>
              <div>
                <dt>Metade dos contratos, por m²</dt>
                <dd>
                  <span className="bwa-indice-nowrap">{brl(INDICE.m2P25)}</span> a{" "}
                  <span className="bwa-indice-nowrap">{brl(INDICE.m2P75)}</span>
                </dd>
              </div>
              <div>
                <dt>Orçamento mediano</dt>
                <dd>{brl(INDICE.orcamentoMediano)}</dd>
              </div>
              <div>
                <dt>Área mediana</dt>
                <dd>{INDICE.areaMediana.toLocaleString("pt-BR")} m²</dd>
              </div>
            </dl>
            <p className="bwa-servico-text">
              A média ficou em {brl(INDICE.orcamentoMedio)}, puxada pelos imóveis maiores; por isso o índice usa a
              mediana. Nenhum contrato da base ficou abaixo de {brl(INDICE.orcamentoMinimo)}.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="metragem">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="metragem">
              Custo de reforma por faixa de metragem
            </h2>
            <div className="bwa-indice-table-wrap" role="region" aria-labelledby="metragem" tabIndex={0}>
              <table className="bwa-indice-table">
                <caption className="sr-only">
                  Orçamento de reforma completa por faixa de metragem, {INDICE_EDICAO}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Área</th>
                    <th scope="col">Contratos</th>
                    <th scope="col">Orçamento mediano</th>
                    <th scope="col">Metade do meio</th>
                    <th scope="col">Mediana por m²</th>
                  </tr>
                </thead>
                <tbody>
                  {FAIXAS_METRAGEM.map((f) => (
                    <tr key={f.faixa}>
                      <th scope="row">{f.faixa}</th>
                      <td>{f.contratos}</td>
                      <td>{brl(f.orcamentoMediano)}</td>
                      <td>
                        R$ {f.metadeDoMeioMil[0]} mil a R$ {f.metadeDoMeioMil[1]} mil
                      </td>
                      <td>{brl(f.m2Mediano)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              O custo por m² cai até perto de 32 m² e depois se estabiliza: cozinha, banheiro e marcenaria custam
              quase o mesmo num studio de 20 m² e num de 28 m², então pesam mais por metro nos menores. Acima de 40 m²
              a amostra é pequena ({FAIXAS_METRAGEM[FAIXAS_METRAGEM.length - 1].contratos} contratos); use como
              ordem de grandeza.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="distribuicao">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="distribuicao">
              Como os orçamentos se distribuem
            </h2>
            <ul className="bwa-indice-bars">
              {FAIXAS_VALOR.map((f) => (
                <li key={f.faixa}>
                  <span className="bwa-indice-bar-label">{f.faixa}</span>
                  <span className="bwa-indice-bar" aria-hidden="true">
                    <span style={{ width: `${f.pct}%` }} />
                  </span>
                  <span className="bwa-indice-bar-value">{pct(f.pct)} dos contratos</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="regra">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="regra">
              Regra de bolso para estimar
            </h2>
            <p className="bwa-indice-formula">
              Orçamento ≈ {brl(REGRA_DE_BOLSO.fixo)} + {brl(REGRA_DE_BOLSO.porM2)} × área em m²
            </p>
            <p className="bwa-servico-text">
              Ajustada em {REGRA_DE_BOLSO.contratos} contratos de {REGRA_DE_BOLSO.faixaAreas}. Em metade dos casos o
              valor real ficou a até {REGRA_DE_BOLSO.erroMediano}% da fórmula, e em cerca de três a cada quatro, a até{" "}
              {REGRA_DE_BOLSO.erroTresQuartos}%. A parte fixa é o que todo studio tem (cozinha, banheiro, projeto,
              gestão); a parte por m² é o que cresce com a área.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="composicao">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="composicao">
              Para onde vai o dinheiro
            </h2>
            <p className="bwa-servico-text">
              Composição de uma proposta real de {brl(Math.round(PROPOSTA_REAL_VALOR))} (setembro de 2026):
            </p>
            <ul className="bwa-indice-bars">
              {COMPOSICAO.map((c) => (
                <li key={c.item}>
                  <span className="bwa-indice-bar-label">{c.item}</span>
                  <span className="bwa-indice-bar" aria-hidden="true">
                    <span style={{ width: `${(c.pct / COMPOSICAO[0].pct) * 100}%` }} />
                  </span>
                  <span className="bwa-indice-bar-value">{pct(c.pct)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="metodologia">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="metodologia">
              Metodologia
            </h2>
            <ul className="bwa-indice-notes">
              <li>
                <strong>Base:</strong> {INDICE.contratos} contratos de reforma completa da Bewild em imóveis compactos de
                São Paulo, de {REGISTROS_INICIAIS} registros iniciais. Saíram da análise{" "}
                {EXCLUSOES.map((e, i) => (
                  <span key={e.motivo}>
                    {e.n} {e.motivo}
                    {i < EXCLUSOES.length - 2 ? ", " : i === EXCLUSOES.length - 2 ? " e " : "."}
                  </span>
                ))}
              </li>
              <li>
                <strong>Valor:</strong> o do contrato na assinatura, sem aditivos posteriores. Inclui {ESCOPO_INCLUIDO}.
              </li>
              <li>
                <strong>Estatística:</strong> mediana e quartis (resistem a valores extremos). A regra de bolso usa
                regressão robusta de Theil-Sen.
              </li>
              <li>
                <strong>Região:</strong> não houve diferença estatística de custo entre regiões da cidade (teste de
                Kruskal-Wallis, p = {REGIAO_P_VALOR.toLocaleString("pt-BR")}).
              </li>
              <li>
                <strong>Estabilidade no tempo:</strong> separando os contratos em três grupos pela data de assinatura, a
                mediana por m² ficou entre {brl(ESTABILIDADE_M2[0])} e {brl(ESTABILIDADE_M2[1])}. Para comparar com a
                inflação da construção, o INCC-M subiu {pct(INCC_12M)} em 12 meses até agosto de 2026.
              </li>
              <li>
                <strong>Limites:</strong> {LIMITES}
              </li>
            </ul>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              A análise completa, com gráficos, exemplos por empreendimento e o efeito no retorno do investimento, está
              em{" "}
              <a href={PILAR_CUSTO}>quanto custa reformar um apartamento ou studio de até 50 m²</a>. Para o seu imóvel,
              o <a href="/escopo">simulador de escopo</a> dá uma primeira estimativa.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block bwa-indice-imprensa" aria-labelledby="imprensa">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="imprensa">
              Para imprensa
            </h2>
            <p className="bwa-servico-text">
              Três números prontos para citar, a frase de fonte, a planilha e o código para incorporar os gráficos.
              Uso livre com crédito à Bewild ({INDICE_LICENCA_NOME}).
            </p>
            <ol className="bwa-indice-press">
              {IMPRENSA_NUMEROS.map((n) => (
                <li key={n.id} data-imprensa-numero={n.id}>
                  <p className="bwa-indice-press-valor" data-imprensa-valor>
                    {n.valor}
                  </p>
                  <p className="bwa-indice-press-rotulo">{n.rotulo}.</p>
                  <p className="bwa-indice-press-meta">
                    Edição de {INDICE_EDICAO}, atualizada em{" "}
                    <time dateTime={INDICE_ATUALIZADO_EM}>{dataBR(INDICE_ATUALIZADO_EM)}</time>.
                  </p>
                  <p className="bwa-indice-press-meta" data-imprensa-metodo>
                    Método: {n.metodo}
                  </p>
                </li>
              ))}
            </ol>

            <h3 className="bwa-servico-h3 bwa-indice-press-h3">Frase de fonte</h3>
            <p className="bwa-indice-cite" id="imprensa-fonte">
              {INDICE_FRASE_FONTE}
            </p>
            <CopiarTexto texto={INDICE_FRASE_FONTE} rotulo="Copiar a frase" cta="indice-imprensa-copiar-fonte" />
            <p className="bwa-servico-text">
              Nome oficial, endereço e regras de crédito da licença estão na página de{" "}
              <a href="/atribuicao">atribuição da Bewild</a>.
            </p>

            <h3 className="bwa-servico-h3 bwa-indice-press-h3">Planilha</h3>
            <p className="bwa-servico-text">
              <a href={INDICE_CSV_PATH} download data-cta="indice-imprensa-planilha">
                Baixar a planilha dos dados (CSV)
              </a>
              : números gerais e por faixa de metragem, com a fonte e a licença nas primeiras linhas. Abre no Excel,
              no Google Planilhas e no LibreOffice.
            </p>

            <h3 className="bwa-servico-h3 bwa-indice-press-h3">Incorporar os gráficos</h3>
            <p className="bwa-servico-text">
              Cole o código no seu site: ele mostra o gráfico e o link de atribuição para esta página.
            </p>
            {IMPRENSA_GRAFICOS.map((g) => {
              const codigo = graficoEmbedHtml(g);
              return (
                <div key={g.id} className="bwa-indice-embed">
                  <label className="bwa-indice-embed-label" htmlFor={`embed-${g.id}`}>
                    Código para incorporar: {g.titulo}
                  </label>
                  <textarea
                    id={`embed-${g.id}`}
                    className="bwa-indice-embed-code"
                    readOnly
                    rows={6}
                    spellCheck={false}
                    value={codigo}
                  />
                  <CopiarTexto texto={codigo} rotulo="Copiar o código" cta="indice-imprensa-copiar-embed" />
                  <p className="bwa-indice-press-meta">
                    <a href={g.src} target="_blank" rel="noopener noreferrer">
                      Ver o gráfico (SVG, abre em nova aba)
                    </a>
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="citar">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="citar">
              Como citar
            </h2>
            <p className="bwa-indice-cite">{COMO_CITAR}</p>
            <p className="bwa-servico-text">
              Dados sob licença{" "}
              {/* "CC BY 4.0" leva à página própria da licença (mesmo site, sem
                  nova aba); o deed e o texto legal oficiais ficam lá. */}
              <a href={LICENCA_CANONICAL} rel="license">
                {INDICE_LICENCA_NOME}
              </a>
              : use à vontade citando a Bewild
            </p>
            <p className="bwa-servico-text">
              Os números podem ser usados livremente com a citação da fonte. A tabela agregada está em{" "}
              <a href={INDICE_CSV_PATH} download>
                CSV
              </a>
              ; nenhum dado de cliente ou de contrato individual é publicado.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="faq">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="faq">
              Perguntas frequentes
            </h2>
            <div className="bwa-servico-faq">
              {INDICE_FAQ.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bwa-servico-cta" aria-label="Solicitar orçamento">
          <div className="bwa-shell bwa-servico-cta-grid">
            <h2>
              Quer o número do seu imóvel? <em>A gente calcula.</em>
            </h2>
            <div className="bwa-servico-cta-actions">
              <a className="bwa-button bwa-button-light" href={CTA_HREF} data-cta="indice-custo">
                Solicitar orçamento <span aria-hidden="true">→</span>
              </a>
              <a className="bwa-servico-whats" href={whatsappHref()} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp <span aria-hidden="true">→</span>
              </a>
              <p className="bwa-servico-cta-note">{PROVA_CURTA}</p>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
