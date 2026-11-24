import { useState } from "react";
import { PROVA_CURTA } from "@/content/provas";
import { LICENCA_CANONICAL } from "@/content/pages/licenca";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { useSeo } from "@/lib/useSeo";
import { useCtaClickTracking } from "@/lib/trackCta";
import "./servico-reforma.css";
import "./indice-custo.css";
import {
  ALUGAR_PCT,
  BAIRROS_PEDIDOS,
  dataBR,
  FORA,
  FORA_PCT,
  INDICE_CANONICAL,
  INDICE_ORCAMENTOS,
  M2_MEDIANA,
  M2_METADE,
  MULTI_PCT,
  multiPct,
  num,
  pctDe,
  PERFIL,
  PERFIL_ARTIGO,
  PERFIL_ATUALIZADO_EM,
  PERFIL_AVISO,
  PERFIL_CANONICAL,
  PERFIL_COMO_CITAR,
  PERFIL_CSV_PATH,
  PERFIL_DESCRIPTION,
  PERFIL_DICIONARIO_PATH,
  PERFIL_EDICAO,
  PERFIL_FAQ,
  PERFIL_FONTES,
  PERFIL_FRASE_FONTE,
  PERFIL_IMPRENSA_NUMEROS,
  PERFIL_LICENCA_NOME,
  PERFIL_LIMITES,
  PERFIL_METODO,
  PERFIL_RESUMO,
  PERFIL_TITLE,
  RENDA_ALUGAR_PCT,
  RENDA_MORAR_PCT,
  SEM_CHAVE,
  SEM_CHAVE_PCT,
  temaPct,
  TRES_BAIRROS_PCT,
  TRES_BAIRROS_PEDIDOS,
  TRES_REGIOES_PCT,
} from "@/content/perfilReforma";

/* ============================================================
 * PerfilReformaPage — /perfil-de-quem-reforma-studio
 * Página de dados citável (imprensa, buscadores e IAs) com o perfil de
 * quem pede orçamento de reforma à Bewild. Todos os números vêm de
 * src/content/perfilReforma.ts (dados em perfilReforma.dados.json).
 * ============================================================ */

const CTA_HREF = "/orcamento";

/** Copia a frase de fonte. Só acrescenta: o texto já está no HTML do servidor. */
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

export default function PerfilReformaPage() {
  useCtaClickTracking("perfil-reforma");

  useSeo({
    title: PERFIL_TITLE,
    description: PERFIL_DESCRIPTION,
    canonicalPath: PERFIL_CANONICAL,
    ogType: "website",
  });

  const d = PERFIL;
  const exclusoes = d.exclusoes;

  return (
    <div className="bwa-servico bwa-indice">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-servico-intro">
          <div className="bwa-shell bwa-servico-head">
            <p className="bwa-label">Perfil Bewild · {PERFIL_EDICAO}</p>
            <div>
              <h1 className="bwa-title">
                Perfil Bewild de quem reforma studio <em>em São Paulo.</em>
              </h1>
              <p className="bwa-servico-lead">{PERFIL_RESUMO}</p>
              <p className="bwa-servico-text">{PERFIL_AVISO}</p>
              <p className="bwa-indice-meta">
                Atualizado em <time dateTime={PERFIL_ATUALIZADO_EM}>{dataBR(PERFIL_ATUALIZADO_EM)}</time> ·{" "}
                <a href={PERFIL_CSV_PATH} download>
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
                <dt>Vão alugar o imóvel</dt>
                <dd>{ALUGAR_PCT}%</dd>
              </div>
              <div>
                <dt>Telefone de fora da capital e da Grande São Paulo</dt>
                <dd>{FORA_PCT}%</dd>
              </div>
              <div>
                <dt>Metragem mediana</dt>
                <dd>{M2_MEDIANA}</dd>
              </div>
              <div>
                <dt>Ainda sem a chave ao pedir o orçamento</dt>
                <dd>{SEM_CHAVE_PCT}%</dd>
              </div>
            </dl>
            <p className="bwa-servico-text">
              Cada número usa como base quem tem aquele dado: {num(d.finalidade.base)} pessoas com finalidade
              declarada, {num(d.origem.base)} com telefone identificado ({num(FORA)} de fora), {num(d.metragem.base)}{" "}
              pedidos com metragem e {num(d.chaves.base)} pessoas que responderam sobre as chaves ({num(SEM_CHAVE)}{" "}
              ainda sem ela). Metade dos imóveis fica entre {M2_METADE}.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="perfis">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="perfis">
              Seis perfis de quem reforma
            </h2>
            <p className="bwa-servico-text">
              Duas respostas separam os perfis: para que é o imóvel e de onde é o telefone de quem pede. Com elas,{" "}
              {num(d.perfis.base)} pessoas se dividem em seis grupos, e nenhum passa de 22%.
            </p>
            <div className="bwa-indice-table-wrap" role="region" aria-labelledby="perfis" tabIndex={0}>
              <table className="bwa-indice-table">
                <caption className="sr-only">Perfis de quem pede orçamento de reforma, {PERFIL_EDICAO}</caption>
                <thead>
                  <tr>
                    <th scope="col">Perfil</th>
                    <th scope="col">Participação</th>
                    <th scope="col">Imóvel (mediana)</th>
                    <th scope="col">Já tem a chave</th>
                    <th scope="col">Onde fica o imóvel</th>
                    <th scope="col">Nas conversas</th>
                  </tr>
                </thead>
                <tbody>
                  {d.perfis.itens.map((p) => (
                    <tr key={p.nome}>
                      <th scope="row">{p.nome}</th>
                      <td>
                        {pctDe(p.pessoas, d.perfis.base)}% ({num(p.pessoas)})
                      </td>
                      <td>
                        {p.m2} m²; {p.ate30Pct}% até 30 m²
                      </td>
                      <td>{p.chavePct}%</td>
                      <td>{p.onde}</td>
                      <td>{p.conversa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              Cada célula usa quem tem aquele dado; a menor base é de {d.perfis.menorBase} pessoas, na metragem do
              perfil em dúvida. Ficaram fora {num(d.perfis.semFinalidade)} pessoas sem finalidade declarada e{" "}
              {d.perfis.semTelefone} sem telefone identificado.
            </p>
            <p className="bwa-servico-text">
              <strong>Mais de uma unidade.</strong> {d.multi.pessoas} das {num(d.base.pessoas)} pessoas ({MULTI_PCT}%)
              orçaram ou citaram duas ou mais unidades: {multiPct(d.multi.alugar)}% entre quem vai alugar (
              {d.multi.alugar.casos} de {num(d.multi.alugar.base)}) e {multiPct(d.multi.morar)}% entre quem vai morar (
              {d.multi.morar.casos} de {d.multi.morar.base}). A diferença tem significância estatística (teste exato de
              Fisher, p = 0,001). É uma estimativa mínima, porque só entram unidades registradas como diferentes ou
              citadas na conversa.
            </p>
            <p className="bwa-servico-text">
              <strong>Profissão e estado civil.</strong> Esses dados só existem para quem assinou contrato. Entre{" "}
              {d.contratos.profissao.base} clientes com profissão registrada,{" "}
              {d.contratos.profissao.itens.map((g, i, a) => (
                <span key={g.grupo}>
                  {g.grupo} ({pctDe(g.n, d.contratos.profissao.base)}%)
                  {i < a.length - 2 ? ", " : i === a.length - 2 ? " e " : ""}
                </span>
              ))}{" "}
              somam {pctDe(d.contratos.profissao.itens.reduce((s, g) => s + g.n, 0), d.contratos.profissao.base)}%.
              Entre {d.contratos.estadoCivil.base} com estado civil registrado,{" "}
              {d.contratos.estadoCivil.itens.map((g, i, a) => (
                <span key={g.grupo}>
                  {pctDe(g.n, d.contratos.estadoCivil.base)}% são {g.grupo}
                  {i < a.length - 2 ? ", " : i === a.length - 2 ? " e " : "."}
                </span>
              ))}
            </p>
            <p className="bwa-servico-text">
              <strong>Idade e sexo.</strong> Esses dados vêm da plataforma de anúncios e valem só para quem se
              cadastrou por anúncio em redes sociais no período: {d.idadeSexo.mais45Pct}% têm 45 anos ou mais. Por faixa:{" "}
              {d.idadeSexo.faixas.map((f, i, a) => (
                <span key={f.faixa}>
                  {f.faixa}, {f.pct}%{i < a.length - 1 ? "; " : "."}
                </span>
              ))}{" "}
              Homens são {d.idadeSexo.homensPct}% dos cadastros com sexo identificado.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="finalidade">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="finalidade">
              Para que reformam
            </h2>
            <p className="bwa-servico-text">
              A maioria reforma para alugar, e o aluguel por temporada é a finalidade mais citada entre as{" "}
              {num(d.finalidade.base)} pessoas que a declararam.
            </p>
            <ul className="bwa-indice-bars">
              {d.finalidade.itens.map((f) => (
                <li key={f.id}>
                  <span className="bwa-indice-bar-label">{f.rotulo}</span>
                  <span className="bwa-indice-bar" aria-hidden="true">
                    <span style={{ width: `${pctDe(f.pessoas, d.finalidade.base)}%` }} />
                  </span>
                  <span className="bwa-indice-bar-value">
                    {pctDe(f.pessoas, d.finalidade.base)}% ({num(f.pessoas)} pessoas)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="origem">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="origem">
              De onde são
            </h2>
            <p className="bwa-servico-text">
              Quatro em cada dez pessoas têm telefone de fora da capital e da Grande São Paulo: {num(FORA)} de{" "}
              {num(d.origem.base)} com telefone identificado.
            </p>
            <div className="bwa-indice-table-wrap" role="region" aria-labelledby="origem" tabIndex={0}>
              <table className="bwa-indice-table">
                <caption className="sr-only">Origem do telefone de quem pede orçamento, {PERFIL_EDICAO}</caption>
                <thead>
                  <tr>
                    <th scope="col">Origem do telefone (DDD)</th>
                    <th scope="col">Pessoas</th>
                    <th scope="col">Participação</th>
                  </tr>
                </thead>
                <tbody>
                  {d.origem.itens.map((o) => (
                    <tr key={o.rotulo}>
                      <th scope="row">{o.rotulo}</th>
                      <td>{num(o.pessoas)}</td>
                      <td>{pctDe(o.pessoas, d.origem.base)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              <strong>Por estado.</strong> Depois de São Paulo, os estados mais frequentes são{" "}
              {d.estados.itens.map((e, i, a) => (
                <span key={e.uf}>
                  {e.nome} ({num(e.pessoas)})
                  {i < a.length - 2 ? ", " : i === a.length - 2 ? " e " : "."}
                </span>
              ))}{" "}
              A base é de {num(d.estados.base)} pessoas com DDD brasileiro, de {d.estados.ufs} unidades da federação.
            </p>
            <p className="bwa-servico-text">
              <strong>Por finalidade.</strong> Têm telefone de fora{" "}
              {d.foraPorFinalidade.map((f, i, a) => (
                <span key={f.rotulo}>
                  {pctDe(f.fora, f.base)}% de quem vai {f.rotulo} ({f.fora} de {f.base})
                  {i < a.length - 2 ? ", " : i === a.length - 2 ? " e " : "."}
                </span>
              ))}{" "}
              A diferença tem significância estatística (qui-quadrado, p &lt; 0,001).
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="regioes">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="regioes">
              Onde ficam os imóveis
            </h2>
            <p className="bwa-servico-text">
              Zona Sul, Zona Oeste e Centro somam {TRES_REGIOES_PCT}% dos {num(d.regioes.base)} pedidos com bairro
              informado, e o perfil muda de uma região para outra.
            </p>
            <div className="bwa-indice-table-wrap" role="region" aria-labelledby="regioes" tabIndex={0}>
              <table className="bwa-indice-table">
                <caption className="sr-only">Pedidos de orçamento por região de São Paulo, {PERFIL_EDICAO}</caption>
                <thead>
                  <tr>
                    <th scope="col">Região</th>
                    <th scope="col">Pedidos</th>
                    <th scope="col">Alugar por temporada</th>
                    <th scope="col">Para morar</th>
                    <th scope="col">Telefone de fora</th>
                    <th scope="col">Metragem mediana</th>
                  </tr>
                </thead>
                <tbody>
                  {d.regioes.itens.map((r) => (
                    <tr key={r.regiao}>
                      <th scope="row">{r.regiao}</th>
                      <td>{num(r.pedidos)}</td>
                      <td>{r.temporadaPct}%</td>
                      <td>{r.morarPct}%</td>
                      <td>{r.foraPct}%</td>
                      <td>{r.m2} m²</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              Temporada e moradia são percentuais de quem declarou a finalidade em cada região; telefone de fora usa
              quem tem telefone identificado. No Centro, na Zona Sul e na Zona Oeste, cerca de metade vai alugar por
              temporada. Na Zona Leste, na Zona Norte e na Grande São Paulo, a maioria vai morar e quase todos têm
              telefone da região.
            </p>

            <h3 className="bwa-servico-h3" id="bairros" style={{ marginTop: 32 }}>
              Bairros com {d.bairros.minimo} pedidos ou mais
            </h3>
            <p className="bwa-servico-text">
              {d.bairros.itens
                .slice(0, 3)
                .map((b) => b.bairro)
                .join(", ")
                .replace(/, ([^,]*)$/, " e $1")}{" "}
              somam {TRES_BAIRROS_PEDIDOS} dos {num(d.bairros.base)} pedidos com bairro ({TRES_BAIRROS_PCT}%). Os{" "}
              {d.bairros.itens.length} bairros da tabela somam {num(BAIRROS_PEDIDOS)} (
              {pctDe(BAIRROS_PEDIDOS, d.bairros.base)}%).
            </p>
            <div className="bwa-indice-table-wrap" role="region" aria-labelledby="bairros" tabIndex={0}>
              <table className="bwa-indice-table">
                <caption className="sr-only">Pedidos de orçamento por bairro de São Paulo, {PERFIL_EDICAO}</caption>
                <thead>
                  <tr>
                    <th scope="col">Bairro</th>
                    <th scope="col">Pedidos</th>
                    <th scope="col">Vão alugar por temporada</th>
                  </tr>
                </thead>
                <tbody>
                  {d.bairros.itens.map((b) => (
                    <tr key={b.bairro}>
                      <th scope="row">{b.bairro}</th>
                      <td>{b.pedidos}</td>
                      <td>{b.temporadaPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              Jardins inclui Jardim Paulista e Cerqueira César; Moema, Indianópolis; Brooklin, Berrini e Monções. A
              parcela de temporada é de quem declarou a finalidade em cada bairro.
            </p>
            <p className="bwa-servico-text">
              <strong>Pedidos chegam em ondas por prédio.</strong> Dos {d.predios.pedidos} pedidos com o empreendimento
              identificado, {d.predios.pedidosCom5} ({pctDe(d.predios.pedidosCom5, d.predios.pedidos)}%) vieram de{" "}
              {d.predios.com5} prédios com 5 ou mais pedidos cada. O maior reuniu {d.predios.maior} pedidos de{" "}
              {d.predios.maiorPessoas} pessoas, {d.predios.maiorMes} deles em um único mês. A entrega das chaves de um
              prédio de unidades compactas leva vários donos a orçar a reforma ao mesmo tempo.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="metragem">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="metragem">
              Tamanho dos imóveis
            </h2>
            <p className="bwa-servico-text">
              A metragem mediana é de {M2_MEDIANA}, e metade dos {num(d.metragem.base)} pedidos com área informada fica
              entre {M2_METADE}.
            </p>
            <ul className="bwa-indice-bars">
              {d.metragem.faixas.map((f) => (
                <li key={f.faixa}>
                  <span className="bwa-indice-bar-label">{f.faixa}</span>
                  <span className="bwa-indice-bar" aria-hidden="true">
                    <span style={{ width: `${pctDe(f.pedidos, d.metragem.base)}%` }} />
                  </span>
                  <span className="bwa-indice-bar-value">
                    {pctDe(f.pedidos, d.metragem.base)}% ({f.pedidos} pedidos)
                  </span>
                </li>
              ))}
            </ul>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              Dois em cada três imóveis têm até 30 m² ({d.metragem.ate30} de {num(d.metragem.base)}), e 1 em cada 10
              tem 45 m² ou mais ({d.metragem.de45}). Até 45 m², as faixas são as mesmas do{" "}
              <a href={INDICE_CANONICAL}>Índice Bewild de custo de reforma</a>, que traz o orçamento mediano de cada
              uma, calculado sobre {num(INDICE_ORCAMENTOS)} orçamentos.
            </p>
            <p className="bwa-servico-text">
              <strong>Por finalidade.</strong> A mediana é de {d.metragem.porFinalidade[0].mediana} m² para quem vai
              alugar, por temporada ({d.metragem.porFinalidade[0].pedidos} pedidos) ou com contrato tradicional (
              {d.metragem.porFinalidade[1].pedidos}), e de {d.metragem.porFinalidade[2].mediana} m² para quem vai morar
              ({d.metragem.porFinalidade[2].pedidos}). Um em cada três imóveis de quem vai morar passa de 40 m². A
              diferença entre morar e alugar tem significância estatística (teste de Mann-Whitney, p &lt; 0,001).
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="chaves">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="chaves">
              Em que momento pedem o orçamento
            </h2>
            <p className="bwa-servico-text">
              {SEM_CHAVE_PCT}% ainda não tinham a chave ao pedir o orçamento: {num(SEM_CHAVE)} das {num(d.chaves.base)}{" "}
              pessoas que responderam.
            </p>
            <ul className="bwa-indice-bars">
              {d.chaves.itens.map((c) => (
                <li key={c.rotulo}>
                  <span className="bwa-indice-bar-label">{c.rotulo}</span>
                  <span className="bwa-indice-bar" aria-hidden="true">
                    <span style={{ width: `${pctDe(c.pessoas, d.chaves.base)}%` }} />
                  </span>
                  <span className="bwa-indice-bar-value">
                    {pctDe(c.pessoas, d.chaves.base)}% ({c.pessoas} pessoas)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="conversas">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="conversas">
              O que perguntam e o que temem
            </h2>
            <p className="bwa-servico-text">
              A conversa antes do contrato gira em torno do que se está comprando. Entre {num(d.conversas.base)}{" "}
              pessoas com 3 ou mais mensagens ({num(d.conversas.mensagens)} mensagens),{" "}
              {d.conversas.gerais.map((g, i, a) => (
                <span key={g.tema}>
                  {pctDe(g.pessoas, d.conversas.base)}% citam {g.tema}
                  {i < a.length - 2 ? ", " : i === a.length - 2 ? " e " : "."}
                </span>
              ))}{" "}
              Renda aparece em {RENDA_ALUGAR_PCT}% das conversas de quem vai alugar e em {RENDA_MORAR_PCT}% das de quem
              vai morar.
            </p>
            <div className="bwa-indice-table-wrap" role="region" aria-labelledby="conversas" tabIndex={0}>
              <table className="bwa-indice-table">
                <caption className="sr-only">
                  Temas citados nas conversas antes do contrato, por finalidade, {PERFIL_EDICAO}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Tema citado na conversa</th>
                    <th scope="col">Vai alugar ({d.conversas.alugar} pessoas)</th>
                    <th scope="col">Vai morar ({d.conversas.morar} pessoas)</th>
                    <th scope="col">Diferença estatística</th>
                  </tr>
                </thead>
                <tbody>
                  {d.conversas.temas.map((t) => (
                    <tr key={t.tema}>
                      <th scope="row">{t.tema}</th>
                      <td>{temaPct(t).alugar}%</td>
                      <td>{temaPct(t).morar}%</td>
                      <td>{t.difere ? "Sim" : "Não nesta base"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              A diferença estatística usa o teste exato de Fisher com correção para comparações múltiplas
              (Benjamini-Hochberg). <strong>O que quase não é escrito:</strong>{" "}
              {d.conversas.raros.map((r, i, a) => (
                <span key={r.tema}>
                  {r.tema} ({r.pessoas}
                  {i === 0 ? ` das ${num(d.conversas.base)} pessoas` : ""})
                  {i < a.length - 2 ? ", " : i === a.length - 2 ? " e " : "."}
                </span>
              ))}
            </p>
            <p className="bwa-servico-text">
              <strong>Nas reuniões de apresentação do orçamento</strong>, as perguntas seguem a mesma ordem. Em{" "}
              {d.reunioes.negocios} negócios com perguntas registradas ({d.reunioes.perguntas} perguntas, de{" "}
              {dataBR(d.reunioes.de)} a {dataBR(d.reunioes.ate)}), os assuntos foram{" "}
              {d.reunioes.itens.map((r, i, a) => (
                <span key={r.tema}>
                  {r.tema} ({pctDe(r.negocios, d.reunioes.negocios)}%)
                  {i < a.length - 2 ? ", " : i === a.length - 2 ? " e " : "."}
                </span>
              ))}
            </p>
            <p className="bwa-servico-text">
              A leitura comentada, com o que cada perfil precisa ouvir antes de contratar, está em{" "}
              <a href={PERFIL_ARTIGO}>quem reforma studio em São Paulo</a>.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="fontes">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="fontes">
              Fontes e regra da amostra
            </h2>
            <p className="bwa-servico-text">
              O estudo cruza {PERFIL_FONTES.length} fontes, todas de registros da Bewild, e cada número usa como base
              quem tem aquele dado.
            </p>
            <div className="bwa-indice-table-wrap" role="region" aria-labelledby="fontes" tabIndex={0}>
              <table className="bwa-indice-table">
                <caption className="sr-only">Fontes do estudo, {PERFIL_EDICAO}</caption>
                <thead>
                  <tr>
                    <th scope="col">Fonte</th>
                    <th scope="col">O que mede</th>
                    <th scope="col">Período</th>
                    <th scope="col">Tamanho</th>
                  </tr>
                </thead>
                <tbody>
                  {PERFIL_FONTES.map((f) => (
                    <tr key={f.fonte}>
                      <th scope="row">{f.fonte}</th>
                      <td>{f.mede}</td>
                      <td>{f.periodo}</td>
                      <td>{f.tamanho}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              <strong>Como a amostra foi formada.</strong> Partimos de {num(d.base.negociosIniciais)} negócios
              registrados no sistema comercial da Bewild em {dataBR(d.base.consulta)}, contados uma vez por imóvel
              orçado e sem aditivos de contrato. Saíram, nesta ordem,{" "}
              {exclusoes.map((e, i) => (
                <span key={e.motivo}>
                  {e.n} {e.motivo}
                  {i < exclusoes.length - 2 ? "; " : i === exclusoes.length - 2 ? "; e " : "."}
                </span>
              ))}{" "}
              Ficaram {num(d.base.pedidos)} pedidos de {num(d.base.pessoas)} pessoas, de {dataBR(d.base.de)} a{" "}
              {dataBR(d.base.ate)}.
            </p>
            <div className="bwa-indice-table-wrap" role="region" aria-label="Quanto da amostra tem cada dado" tabIndex={0}>
              <table className="bwa-indice-table">
                <caption className="sr-only">Quanto da amostra tem cada dado, {PERFIL_EDICAO}</caption>
                <thead>
                  <tr>
                    <th scope="col">Informação</th>
                    <th scope="col">Com o dado</th>
                    <th scope="col">Parcela da amostra</th>
                  </tr>
                </thead>
                <tbody>
                  {d.cobertura.map((c) => (
                    <tr key={c.dado}>
                      <th scope="row">{c.dado}</th>
                      <td>
                        {num(c.com)} de {num(c.total)} {c.unidade}
                      </td>
                      <td>{pctDe(c.com, c.total)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="metodologia">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="metodologia">
              Metodologia
            </h2>
            <ul className="bwa-indice-notes">
              {PERFIL_METODO.map((m) => (
                <li key={m.titulo}>
                  <strong>{m.titulo}:</strong> {m.texto}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="limites">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="limites">
              O que os números medem e o que não medem
            </h2>
            <p className="bwa-servico-text">
              O estudo descreve quem pediu orçamento de reforma a uma empresa, a Bewild, que atende studios e
              apartamentos compactos em São Paulo. Não é uma amostra do mercado.
            </p>
            <ul className="bwa-indice-notes">
              {PERFIL_LIMITES.map((l) => (
                <li key={l.titulo}>
                  <strong>{l.titulo}:</strong> {l.texto}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bwa-servico-block bwa-indice-imprensa" aria-labelledby="imprensa">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="imprensa">
              Para imprensa
            </h2>
            <p className="bwa-servico-text">
              Três números prontos para citar, a frase de fonte e as planilhas. Uso livre com crédito à Bewild (
              {PERFIL_LICENCA_NOME}).
            </p>
            <ol className="bwa-indice-press">
              {PERFIL_IMPRENSA_NUMEROS.map((n) => (
                <li key={n.id} data-imprensa-numero={n.id}>
                  <p className="bwa-indice-press-valor" data-imprensa-valor>
                    {n.valor}
                  </p>
                  <p className="bwa-indice-press-rotulo">{n.rotulo}.</p>
                  <p className="bwa-indice-press-meta">
                    Edição de {PERFIL_EDICAO}, atualizada em{" "}
                    <time dateTime={PERFIL_ATUALIZADO_EM}>{dataBR(PERFIL_ATUALIZADO_EM)}</time>.
                  </p>
                  <p className="bwa-indice-press-meta" data-imprensa-metodo>
                    Método: {n.metodo}
                  </p>
                </li>
              ))}
            </ol>

            <h3 className="bwa-servico-h3 bwa-indice-press-h3">Frase de fonte</h3>
            <p className="bwa-indice-cite" id="imprensa-fonte">
              {PERFIL_FRASE_FONTE}
            </p>
            <CopiarTexto texto={PERFIL_FRASE_FONTE} rotulo="Copiar a frase" cta="perfil-imprensa-copiar-fonte" />
            <p className="bwa-servico-text">
              Nome oficial, endereço e regras de crédito da licença estão na página de{" "}
              <a href="/atribuicao">atribuição da Bewild</a>.
            </p>

            <h3 className="bwa-servico-h3 bwa-indice-press-h3">Planilhas</h3>
            <p className="bwa-servico-text">
              <a href={PERFIL_CSV_PATH} download data-cta="perfil-imprensa-planilha">
                Baixar a planilha dos dados (CSV)
              </a>
              : cada indicador com casos, base e percentual, e a fonte e a licença nas primeiras linhas.{" "}
              <a href={PERFIL_DICIONARIO_PATH} download data-cta="perfil-imprensa-dicionario">
                Baixar o dicionário de temas das conversas (CSV)
              </a>
              : as expressões que definem cada tema.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="citar">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="citar">
              Como citar
            </h2>
            <p className="bwa-indice-cite">{PERFIL_COMO_CITAR}</p>
            <p className="bwa-servico-text">
              Dados agregados sob licença{" "}
              <a href={LICENCA_CANONICAL} rel="license">
                {PERFIL_LICENCA_NOME}
              </a>
              , a mesma do Índice Bewild: use à vontade citando a Bewild. Nenhum dado de cliente, de conversa ou de
              contrato individual é publicado.
            </p>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="faq">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="faq">
              Perguntas frequentes
            </h2>
            <div className="bwa-servico-faq">
              {PERFIL_FAQ.map((item) => (
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
              Vai reformar um studio? <em>A gente orça o seu.</em>
            </h2>
            <div className="bwa-servico-cta-actions">
              <a className="bwa-button bwa-button-light" href={CTA_HREF} data-cta="perfil-reforma">
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
