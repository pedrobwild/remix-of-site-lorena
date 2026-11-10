import { useId, useMemo, useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import { BASE_CUSTO } from "@/content/baseCusto";
import BwaNav from "@/components/BwaNav";
import { ESTADOS_IMOVEL, OBJETIVOS } from "@/content/pages/orcamento";
import {
  IDS_ITENS,
  ITENS_ESCOPO,
  areaValida,
  escopoParaQuery,
  montarEscopo,
  type ItemEscopoId,
} from "@/lib/escopoCalc";
import { LIMITES, parseNumeroBR } from "@/lib/reformaCalc";
import { useSeo } from "@/lib/useSeo";
import { ESCOPO_DESCRIPTION, ESCOPO_PATH, ESCOPO_TITLE } from "@/content/pages/escopo.seo";
import {
  ESCOPO_CONTRATO,
  ESCOPO_ENTRA,
  ESCOPO_FAIXAS,
  ESCOPO_FAIXAS_FONTE,
  ESCOPO_FAQ,
  ESCOPO_NAO_ENTRA,
  type EscopoItem,
} from "@/content/pages/escopo";
import "@/styles/post.css";
import "@/styles/calculadora.css";
import "@/styles/escopo.css";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/**
 * /escopo — monte o escopo da reforma e veja a faixa de investimento.
 *
 * Preço: só a faixa por m² da reforma completa (mesma base da calculadora do
 * artigo, ver src/lib/escopoCalc.ts). Escopo parcial não tem faixa publicada.
 * O fim do fluxo leva a /orcamento com as respostas na URL (nada é enviado
 * daqui: o lead só nasce no pedido de orçamento).
 *
 * Conteúdo próprio no HTML do servidor (D4 do Pedro, auditoria de SEO rodada
 * 4, 09/11/2026; antes eram 403 palavras sem FAQPage): o que entra e o que não
 * entra, o que fica no contrato, faixas por metragem do Índice e FAQ, tudo de
 * src/content/pages/escopo.ts. Papel da página: entender e montar o escopo;
 * custo da base inteira é do Índice e o valor do imóvel, do orçamento.
 */

function ListaEscopo({ itens }: { itens: EscopoItem[] }) {
  return (
    <ul>
      {itens.map(({ item, detalhe }) => (
        <li key={item}>
          <strong>{item}.</strong> {detalhe}
        </li>
      ))}
    </ul>
  );
}
export default function EscopoPage() {
  const uid = useId();
  const [area, setArea] = useState("28");
  const [estado, setEstado] = useState<string>(ESTADOS_IMOVEL[0]);
  const [objetivo, setObjetivo] = useState<string>("");
  const [itens, setItens] = useState<ItemEscopoId[]>([...IDS_ITENS]);

  useSeo({
    title: ESCOPO_TITLE,
    description: ESCOPO_DESCRIPTION,
    canonicalPath: ESCOPO_PATH,
    ogType: "website",
  });

  const areaNum = parseNumeroBR(area);
  const areaOk = areaNum !== null && areaValida(areaNum);
  const resultado = useMemo(
    () => (areaOk ? montarEscopo({ areaM2: areaNum, itens }) : null),
    [areaOk, areaNum, itens],
  );

  function alternar(id: ItemEscopoId) {
    setItens((atual) => (atual.includes(id) ? atual.filter((i) => i !== id) : [...atual, id]));
  }

  const hrefOrcamento =
    areaOk && itens.length > 0
      ? `/orcamento?${escopoParaQuery({ areaM2: areaNum, estado, objetivo, itens })}#formulario`
      : null;
  const erroArea = area.trim() && !areaOk ? `Informe de ${LIMITES.areaMin} a ${LIMITES.areaMax} m².` : null;

  return (
    <div className="bw-home bw-post">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">Escopo · Bewild</div>
            <h1 className="pt-title">Escopo da reforma: o que entra e como montar o seu.</h1>
            <p className="pt-excerpt es-intro">
              Orçamento só se compara com o mesmo escopo: um preço sem marcenaria, mobília ou documentação do
              condomínio é outro serviço. Aqui você vê o que entra e o que não entra na reforma completa da Bewild e
              monta o seu escopo em quatro perguntas. O custo por m² da base inteira está no{" "}
              <a href="/indice-de-custo-de-reforma">Índice Bewild de custo de reforma</a>; o valor do seu imóvel sai
              no <a href="/orcamento">pedido de orçamento</a>.
            </p>
          </div>
        </section>

        <section className="rc" aria-labelledby={`${uid}-titulo`}>
          <div className="rc-wrap">
            <h2 id={`${uid}-titulo`} className="rc-title">Perguntas</h2>

            <form className="rc-form" onSubmit={(e) => e.preventDefault()} noValidate>
              <div className="rc-field">
                <label htmlFor={`${uid}-area`}>1. Metragem do imóvel (m²)</label>
                <input
                  id={`${uid}-area`}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="Ex.: 28"
                  value={area}
                  aria-invalid={erroArea ? true : undefined}
                  aria-describedby={erroArea ? `${uid}-area-err` : undefined}
                  onChange={(e) => setArea(e.target.value)}
                />
                {erroArea ? <p className="rc-err" id={`${uid}-area-err`}>{erroArea}</p> : null}
              </div>

              <div className="rc-field">
                <label htmlFor={`${uid}-estado`}>2. Em que estado está o imóvel?</label>
                <select id={`${uid}-estado`} value={estado} onChange={(e) => setEstado(e.target.value)}>
                  {ESTADOS_IMOVEL.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              <div className="rc-field rc-field--wide">
                <label htmlFor={`${uid}-objetivo`}>3. Para que é a reforma?</label>
                <select id={`${uid}-objetivo`} value={objetivo} onChange={(e) => setObjetivo(e.target.value)}>
                  <option value="" disabled />
                  {OBJETIVOS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}{o.dica ? ` — ${o.dica}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset className="rc-field rc-field--wide es-itens">
                <legend>4. O que a Bewild cuida?</legend>
                {ITENS_ESCOPO.map((item) => (
                  <label key={item.id} className="es-item" htmlFor={`${uid}-${item.id}`}>
                    <input
                      id={`${uid}-${item.id}`}
                      type="checkbox"
                      checked={itens.includes(item.id)}
                      onChange={() => alternar(item.id)}
                    />
                    <span>
                      <strong>{item.nome}</strong>
                      <small>{item.detalhe}</small>
                    </span>
                  </label>
                ))}
              </fieldset>
            </form>

            <div className="rc-out" role="status" aria-live="polite">
              {!resultado ? (
                <p className="rc-empty">Informe a metragem para ver o resumo.</p>
              ) : (
                <>
                  <div className="rc-card">
                    <h3>Investimento estimado</h3>
                    {resultado.faixa ? (
                      <>
                        <p className="rc-big">
                          {brl.format(resultado.faixa.baixo)} a {brl.format(resultado.faixa.alto)}
                        </p>
                        <p>
                          Mediana de {brl.format(resultado.faixa.mediano)} para {area.trim()} m². São{" "}
                          {brl.format(resultado.porM2.baixo)} a {brl.format(resultado.porM2.alto)} por m² (mediana de{" "}
                          {brl.format(resultado.porM2.mediano)}), a metade central dos contratos de reforma completa da Bewild.
                        </p>
                      </>
                    ) : (
                      <p>
                        Com escopo parcial não publicamos faixa: a base da Bewild tem o preço da reforma completa, não o de
                        cada item. Marque todos os itens para ver a faixa, ou peça o orçamento e calculamos o seu escopo.
                      </p>
                    )}
                  </div>

                  <div className="rc-card">
                    <h3>O que entra no seu escopo</h3>
                    {resultado.itens.length ? (
                      <ul className="es-lista">
                        {ITENS_ESCOPO.filter((i) => resultado.itens.includes(i.id)).map((i) => (
                          <li key={i.id}>{i.nome}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>Marque ao menos um item.</p>
                    )}
                    {objetivo === "Short stay" ? (
                      <p>Para short stay, o imóvel sai pronto para anunciar: enxoval e utensílios entram na reforma completa.</p>
                    ) : null}
                    <p>
                      Imóvel: {estado.toLowerCase()}. O estado muda o que precisa ser refeito; o time confirma na visita
                      técnica.
                    </p>
                  </div>

                  <div className="rc-card">
                    <h3>Próximo passo</h3>
                    <p>
                      O orçamento é gratuito. Levamos metragem, estado, objetivo e itens para o formulário, e você só
                      completa bairro e contato.
                    </p>
                    {hrefOrcamento ? (
                      <a className="es-cta" href={hrefOrcamento}>Levar este escopo ao orçamento</a>
                    ) : null}
                  </div>
                </>
              )}
            </div>

            <p className="rc-note">
              Estimativa, não é orçamento: usa a mediana por m² dos {BASE_CUSTO.contratos} contratos de reforma completa da Bewild (out/2026), a mesma
              do <a href="/indice-de-custo-de-reforma">Índice Bewild de custo de reforma</a> e da{" "}
              <a href="/conteudos/reformar-apartamento-para-vender-ou-alugar-sp">calculadora do artigo</a>. O valor final
              fecha no contrato, com preço e prazo por escrito.
            </p>
          </div>
        </section>

        <section className="pt-body-section">
          <div className="container">
            <div className="pt-body">
              <h2>O que entra na reforma completa</h2>
              <p>
                Um contrato só, do contrapiso ao imóvel pronto. É o escopo que as faixas de preço desta página e do
                Índice cobrem:
              </p>
              <ListaEscopo itens={ESCOPO_ENTRA} />

              <h2>O que fica por escrito no contrato</h2>
              <ListaEscopo itens={ESCOPO_CONTRATO} />

              <h2>O que não entra</h2>
              <ListaEscopo itens={ESCOPO_NAO_ENTRA} />

              <h2>Quanto custa por faixa de metragem</h2>
              <p>{ESCOPO_FAIXAS_FONTE}</p>
              <div className="pt-table">
                <div className="pt-table-wrap" tabIndex={0} role="region" aria-label="Orçamento por faixa de metragem">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Metragem</th>
                        <th scope="col">Contratos</th>
                        <th scope="col">Orçamento mediano</th>
                        <th scope="col">Metade do meio</th>
                        <th scope="col">Mediana por m²</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ESCOPO_FAIXAS.map((f) => (
                        <tr key={f.faixa}>
                          <th scope="row">{f.faixa}</th>
                          <td>{f.contratos}</td>
                          <td>{f.orcamentoMediano}</td>
                          <td>{f.metadeDoMeio}</td>
                          <td>{f.m2Mediano}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p>
                Metade do meio: metade dos contratos de cada faixa ficou entre esses dois valores. Método, regra de
                bolso e a tabela em CSV estão no{" "}
                <a href="/indice-de-custo-de-reforma">Índice Bewild de custo de reforma</a>.
              </p>

              <h2>Escopo, Índice ou orçamento: qual página usar</h2>
              <ul>
                <li>
                  <strong>Esta página.</strong> Entender o que entra na reforma completa e montar o seu escopo em
                  quatro perguntas.
                </li>
                <li>
                  <strong>
                    <a href="/indice-de-custo-de-reforma">Índice Bewild de custo de reforma</a>.
                  </strong>{" "}
                  O custo por m² da base inteira, com tabela por metragem, método e CSV.
                </li>
                <li>
                  <strong>
                    <a href="/orcamento">Pedido de orçamento</a>.
                  </strong>{" "}
                  O valor do seu imóvel, fechado na proposta com memorial item a item antes de a obra começar. O
                  orçamento é gratuito.
                </li>
              </ul>

              <h2>Perguntas frequentes</h2>
              {ESCOPO_FAQ.map(({ q, a }) => (
                <div key={q}>
                  <h3>{q}</h3>
                  <p>{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
