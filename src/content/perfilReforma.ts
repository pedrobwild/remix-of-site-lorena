/**
 * Perfil Bewild de Quem Reforma Studio — textos e JSON-LD de
 * /perfil-de-quem-reforma-studio (módulo sem componentes nem CSS, para o
 * `head()` da rota não puxar a página inteira para o grafo de todas as rotas).
 *
 * ORIGEM ÚNICA (edição de novembro de 2026): pedidos de orçamento registrados
 * no Bwild Engine de 01/03/2026 a 23/11/2026, consulta somente de leitura em
 * 24/11/2026. Os números ficam em perfilReforma.dados.json e a regra da
 * amostra em docs/internal/perfil-bewild-quem-reforma-studio-2026-11.md.
 * Nenhum número novo nasce aqui: se a amostra for refeita, atualize o JSON, os
 * dois CSV de public/dados e PERFIL_ATUALIZADO_EM juntos.
 *
 * Decisão de publicação (24/11/2026): o estudo não publica volumes por canal
 * de captação (anúncios, indicação, site). O peso dos anúncios aparece só em
 * texto e em percentuais, nunca em contagem.
 */
import dados from "@/content/perfilReforma.dados.json";
import { INDICE, INDICE_CANONICAL, INDICE_LICENCA_NOME, INDICE_LICENCA_URL } from "@/content/indiceCusto";
import { faqJsonLd } from "@/lib/useSeo";

export const PERFIL = dados;

export const PERFIL_CANONICAL = "/perfil-de-quem-reforma-studio";
export const PERFIL_NOME = "Perfil Bewild de Quem Reforma Studio";
export const PERFIL_EDICAO = "novembro de 2026";
/** Data (ISO) da última atualização dos números. */
export const PERFIL_ATUALIZADO_EM = "2026-11-24";
export const PERFIL_PUBLICADO_EM = "2026-11-24";
/** Período dos pedidos (temporalCoverage, ISO 8601). */
export const PERFIL_PERIODO = `${dados.base.de}/${dados.base.ate}`;
export const PERFIL_PERIODO_TEXTO = "de março a novembro de 2026";
export const PERFIL_CSV_PATH = "/dados/perfil-quem-reforma-studio-bewild-2026-11.csv";
export const PERFIL_DICIONARIO_PATH = "/dados/perfil-quem-reforma-studio-bewild-2026-11-dicionario-de-temas.csv";
/** Mesma licença dos dados do Índice Bewild. */
export const PERFIL_LICENCA_URL = INDICE_LICENCA_URL;
export const PERFIL_LICENCA_NOME = INDICE_LICENCA_NOME;
export const PERFIL_URL_ABSOLUTA = `https://bewild.com.br${PERFIL_CANONICAL}`;
/** Artigo do blog com a leitura comentada do estudo. */
export const PERFIL_ARTIGO = "/conteudos/quem-reforma-studio-sao-paulo-perfil";

const comFuso = (d: string) => `${d}T00:00:00-03:00`;

/** Milhar com ponto e decimal com vírgula, sem depender do ICU do runtime (servidor e navegador iguais). */
export const num = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
/** Até uma casa decimal, com vírgula. */
export const dec1 = (v: number) => String(Math.round(v * 10) / 10).replace(".", ",");
/** Percentual inteiro de casos sobre a base. */
export const pctDe = (casos: number, base: number) => Math.round((100 * casos) / base);
export const dataBR = (iso: string) => iso.split("-").reverse().join("/");

// --- Números derivados (sempre dos dados, nunca digitados) -----------------

const fin = dados.finalidade;
const finPessoas = (id: string) => {
  const item = fin.itens.find((i) => i.id === id);
  if (!item) throw new Error(`Finalidade ${id} ausente em perfilReforma.dados.json`);
  return item.pessoas;
};

/** Pessoas que vão alugar (temporada + contrato tradicional). */
export const ALUGAR = fin.itens.filter((i) => i.alugar).reduce((s, i) => s + i.pessoas, 0);
export const ALUGAR_PCT = pctDe(ALUGAR, fin.base);
export const TEMPORADA_PCT = pctDe(finPessoas("temporada"), fin.base);
export const TRADICIONAL_PCT = pctDe(finPessoas("tradicional"), fin.base);
export const MORAR_PCT = pctDe(finPessoas("morar"), fin.base);
export const INDECISO_OU_MISTO_PCT = pctDe(finPessoas("indeciso") + finPessoas("misto"), fin.base);

/** Pessoas com telefone de fora da capital e da Grande São Paulo. */
export const FORA = dados.origem.itens.filter((i) => i.fora).reduce((s, i) => s + i.pessoas, 0);
export const FORA_PCT = pctDe(FORA, dados.origem.base);
const foraTemporada = dados.foraPorFinalidade[0];
export const FORA_TEMPORADA_PCT = pctDe(foraTemporada.fora, foraTemporada.base);

/** Pessoas que ainda não tinham a chave ao pedir o orçamento. */
export const SEM_CHAVE = dados.chaves.itens.filter((i) => !i.temChave).reduce((s, i) => s + i.pessoas, 0);
export const SEM_CHAVE_PCT = pctDe(SEM_CHAVE, dados.chaves.base);

const m2 = dados.metragem;
export const M2_MEDIANA = `${dec1(m2.mediana)} m²`;
export const M2_METADE = `${dec1(m2.p25)} e ${dec1(m2.p75)} m²`;

const TRES_REGIOES = dados.regioes.itens.slice(0, 3).reduce((s, r) => s + r.pedidos, 0);
export const TRES_REGIOES_PCT = pctDe(TRES_REGIOES, dados.regioes.base);
const TRES_BAIRROS = dados.bairros.itens.slice(0, 3);
export const TRES_BAIRROS_PEDIDOS = TRES_BAIRROS.reduce((s, b) => s + b.pedidos, 0);
export const TRES_BAIRROS_PCT = pctDe(TRES_BAIRROS_PEDIDOS, dados.bairros.base);
export const BAIRROS_PEDIDOS = dados.bairros.itens.reduce((s, b) => s + b.pedidos, 0);

export const MULTI_PCT = dec1((100 * dados.multi.pessoas) / dados.base.pessoas);
export const multiPct = (g: { casos: number; base: number }) => dec1((100 * g.casos) / g.base);

const conv = dados.conversas;
export const temaPct = (t: { alugar: number; morar: number }) => ({
  alugar: pctDe(t.alugar, conv.alugar),
  morar: pctDe(t.morar, conv.morar),
});
const RENDA = conv.temas[0];
export const RENDA_ALUGAR_PCT = temaPct(RENDA).alugar;
export const RENDA_MORAR_PCT = temaPct(RENDA).morar;

// --- Textos de cabeçalho ----------------------------------------------------

export const PERFIL_TITLE = `Quem reforma studio em São Paulo: ${ALUGAR_PCT}% para alugar (nov/2026)`;
export const PERFIL_DESCRIPTION =
  `Quem pede orçamento de reforma de studio em São Paulo: ${ALUGAR_PCT}% vão alugar, ${FORA_PCT}% têm telefone de fora ` +
  `e a mediana é de ${M2_MEDIANA}. Base de ${num(dados.base.pedidos)} pedidos e CSV.`;

/** Resumo citável (é o primeiro parágrafo da página e a descrição do Dataset). */
export const PERFIL_RESUMO =
  `Entre ${num(fin.base)} pessoas que pediram orçamento de reforma de studio ou apartamento compacto à Bewild, em São Paulo, ` +
  `${PERFIL_PERIODO_TEXTO}, e disseram a finalidade, ${ALUGAR_PCT}% vão alugar o imóvel: ${TEMPORADA_PCT}% por temporada e ` +
  `${TRADICIONAL_PCT}% com contrato tradicional. Outros ${MORAR_PCT}% vão morar. A base reúne ${num(dados.base.pedidos)} ` +
  `pedidos de ${num(dados.base.pessoas)} pessoas.`;

export const PERFIL_AVISO =
  "São pedidos recebidos por uma empresa, a Bewild. Os números não representam o mercado paulistano.";

export const PERFIL_COMO_CITAR =
  `Bewild. ${PERFIL_NOME}, ${PERFIL_EDICAO}: análise de ${num(dados.base.pedidos)} pedidos de orçamento de reforma em São Paulo. ` +
  `Disponível em: ${PERFIL_URL_ABSOLUTA}.`;

/** Frase de fonte pronta para copiar. */
export const PERFIL_FRASE_FONTE =
  `Fonte: ${PERFIL_NOME}, edição ${PERFIL_EDICAO}, base de ${num(dados.base.pedidos)} pedidos de orçamento, ` +
  `bewild.com.br${PERFIL_CANONICAL}`;

export type NumeroImprensa = { id: string; valor: string; rotulo: string; metodo: string };

/** Três números citáveis, cada um com o método em uma frase. */
export const PERFIL_IMPRENSA_NUMEROS: NumeroImprensa[] = [
  {
    id: "alugar",
    valor: `${ALUGAR_PCT}%`,
    rotulo: `vão alugar o imóvel: ${TEMPORADA_PCT}% por temporada e ${TRADICIONAL_PCT}% com contrato tradicional`,
    metodo:
      `parcela das ${num(fin.base)} pessoas que pediram orçamento de reforma à Bewild de ${dataBR(dados.base.de)} a ` +
      `${dataBR(dados.base.ate)} e declararam a finalidade no formulário ou no cadastro.`,
  },
  {
    id: "telefone-de-fora",
    valor: `${FORA_PCT}%`,
    rotulo:
      `têm telefone de fora da capital e da Grande São Paulo; entre quem vai alugar por temporada, ${FORA_TEMPORADA_PCT}%`,
    metodo:
      `DDD de ${num(dados.origem.base)} pessoas com telefone identificado; o DDD mostra onde o número foi habilitado, ` +
      `não o endereço atual.`,
  },
  {
    id: "metragem",
    valor: M2_MEDIANA,
    rotulo: `é a metragem mediana do imóvel; metade dos pedidos fica entre ${M2_METADE}`,
    metodo: `mediana da área informada em ${num(m2.base)} pedidos, no cadastro ou no formulário.`,
  },
];

export const PERFIL_FAQ: { q: string; a: string }[] = [
  {
    q: "Quem reforma studio em São Paulo: investidor ou morador?",
    a:
      `No ${PERFIL_NOME} de ${PERFIL_EDICAO}, ${ALUGAR_PCT}% das ${num(fin.base)} pessoas que disseram a finalidade vão alugar o imóvel ` +
      `(${TEMPORADA_PCT}% por temporada e ${TRADICIONAL_PCT}% com contrato tradicional), ${MORAR_PCT}% vão morar e ` +
      `${INDECISO_OU_MISTO_PCT}% ainda decidem ou farão uso misto. São pedidos de orçamento recebidos pela Bewild, não uma amostra do mercado.`,
  },
  {
    q: "De onde são as pessoas que pedem reforma de studio em São Paulo?",
    a:
      `${FORA_PCT}% têm telefone de fora da capital e da Grande São Paulo (${num(FORA)} de ${num(dados.origem.base)} pessoas com ` +
      `telefone identificado). Entre quem vai alugar por temporada, são ${FORA_TEMPORADA_PCT}%. O DDD mostra onde o número foi ` +
      `habilitado, não o endereço atual.`,
  },
  {
    q: "Qual é o tamanho dos imóveis reformados?",
    a:
      `A metragem mediana é de ${M2_MEDIANA} nos ${num(m2.base)} pedidos com área informada, e metade fica entre ${M2_METADE}. ` +
      `Quem vai alugar tem mediana de ${m2.porFinalidade[0].mediana} m²; quem vai morar, de ${m2.porFinalidade[2].mediana} m².`,
  },
  {
    q: "Posso usar os números do estudo em uma reportagem ou pesquisa?",
    a:
      `Sim, citando a fonte: ${PERFIL_COMO_CITAR} A planilha agregada pode ser baixada em CSV na própria página. ` +
      `Os dados estão sob a licença ${PERFIL_LICENCA_NOME}.`,
  },
];

// --- Metodologia e limites (texto da página) --------------------------------

export const PERFIL_FONTES: { fonte: string; mede: string; periodo: string; tamanho: string }[] = [
  {
    fonte: "Cadastro dos pedidos de orçamento",
    mede: "Imóvel, bairro, prédio, metragem e finalidade",
    periodo: `${dataBR(dados.base.de)} a ${dataBR(dados.base.ate)}`,
    tamanho: `${num(dados.base.pedidos)} pedidos de ${num(dados.base.pessoas)} pessoas`,
  },
  {
    fonte: "Formulários de entrada",
    mede: "Finalidade, chaves, bairro e metragem",
    periodo: `01/06/2026 a ${dataBR(dados.base.ate)}`,
    tamanho: "Respostas de quem preencheu o formulário",
  },
  {
    fonte: "Telefone do cadastro",
    mede: "Região do DDD",
    periodo: `${dataBR(dados.base.de)} a ${dataBR(dados.base.ate)}`,
    tamanho: `${num(dados.origem.base)} pessoas`,
  },
  {
    fonte: "Conversas por WhatsApp",
    mede: "Temas escritos pelo cliente antes de qualquer contrato",
    periodo: `${dataBR(dados.base.de)} a ${dataBR(dados.base.ate)}`,
    tamanho: `${num(conv.mensagens)} mensagens de ${num(conv.base)} pessoas`,
  },
  {
    fonte: "Reuniões de apresentação gravadas",
    mede: "Perguntas feitas pelo cliente",
    periodo: `${dataBR(dados.reunioes.de)} a ${dataBR(dados.reunioes.ate)}`,
    tamanho: `${dados.reunioes.reunioes} reuniões; ${dados.reunioes.perguntas} perguntas`,
  },
  {
    fonte: "Contratos assinados",
    mede: "Profissão, estado civil e endereço",
    periodo: "Até novembro de 2026",
    tamanho: `${dados.contratos.profissao.base} com profissão; ${dados.ddd.contratos} com endereço e telefone`,
  },
  {
    fonte: "Plataforma de anúncios em redes sociais",
    mede: "Faixa etária e sexo de quem se cadastrou por anúncio",
    periodo: `${dataBR(dados.base.de)} a ${dataBR(dados.base.ate)}`,
    tamanho: "Cadastros gerados por anúncio no período",
  },
];

export const PERFIL_METODO: { titulo: string; texto: string }[] = [
  {
    titulo: "Pedido e pessoa",
    texto:
      "Um pedido é um imóvel orçado, contado uma vez, pela data em que foi criado; aditivos de contrato não entram. Uma pessoa pode ter mais de um pedido e é identificada pelo telefone ou, na falta dele, pelo cadastro de cliente. Todo pedido conta, tenha ou não virado contrato.",
  },
  {
    titulo: "Finalidade",
    texto:
      `Vale o cadastro do pedido; na falta dele, a resposta do formulário. Uso misto vem sempre do formulário, porque o cadastro não tem essa opção. Quando os dois existem, coincidem em ${dec1(dados.formularioCadastro.concordanciaPct)}% dos casos (${num(dados.formularioCadastro.pedidos)} pedidos).`,
  },
  {
    titulo: "Origem do telefone",
    texto:
      `DDD 11 é capital e Grande São Paulo; DDDs 12 a 19, interior e litoral paulista; os demais, outros estados; números com código de outro país, exterior. Em ${dados.ddd.contratos} contratos com endereço de residência, o estado do DDD coincidiu com o do endereço em ${pctDe(dados.ddd.coincidem, dados.ddd.contratos)}%. Nas conversas, a distância do imóvel aparece em ${dados.ddd.conversaFora.pct}% das ${dados.ddd.conversaFora.base} pessoas com DDD de fora e em ${dados.ddd.conversaDdd11.pct}% das ${dados.ddd.conversaDdd11.base} com DDD 11.`,
  },
  {
    titulo: "Bairros e regiões",
    texto:
      `O bairro é escrito livremente no cadastro e no formulário e foi padronizado. As regiões seguem o agrupamento do Índice Bewild de custo de reforma, que põe os Jardins na Zona Sul. Em ${dados.bairrosHerdados} pedidos sem bairro, mas com o nome do prédio, usamos o bairro mais citado para aquele prédio.`,
  },
  {
    titulo: "Metragem",
    texto:
      "Área informada no cadastro ou no formulário, de 10 a 400 m². Respostas em faixas não entram na mediana. Cada faixa da tabela inclui o limite inferior.",
  },
  {
    titulo: "Perfis",
    texto:
      "Combinação de finalidade e origem do telefone. É uma regra, não um modelo estatístico: quem tem as duas informações chega ao mesmo perfil.",
  },
  {
    titulo: "Mais de uma unidade",
    texto:
      "Pessoas com pedidos de unidades diferentes (outro prédio, outro número ou diferença de 2 m² ou mais) ou que citaram duas ou mais unidades na conversa. É uma estimativa mínima.",
  },
  {
    titulo: "Conversas",
    texto:
      "Mensagens de texto do cliente no WhatsApp, anteriores ao contrato, sem as mensagens automáticas de formulário. Cada tema tem uma lista de expressões, publicada com os dados; a pessoa conta uma vez por tema. Percentuais sobre quem enviou 3 ou mais mensagens.",
  },
  {
    titulo: "Reuniões",
    texto:
      "Reuniões de apresentação gravadas, anteriores ao contrato. Contam só as perguntas feitas pelo cliente, extraídas por inteligência artificial e agrupadas pelo assunto.",
  },
  {
    titulo: "Testes",
    texto:
      "Fisher e qui-quadrado para proporções, Mann-Whitney para metragem, Cochran-Armitage para tendência mensal e correção de Benjamini-Hochberg nos temas de conversa. Quando um teste não mostra diferença, o texto diz que não houve diferença nesta base, o que não prova que ela não exista.",
  },
  {
    titulo: "Regra de publicação",
    texto:
      `Percentuais só aparecem com base de 25 ou mais; bairros, com ${dados.bairros.minimo} pedidos ou mais. O estudo não publica volumes por canal de captação.`,
  },
  {
    titulo: "Privacidade",
    texto:
      "Os dados são agregados e anônimos. Nenhuma pessoa ou empreendimento é identificado, e nenhuma mensagem é reproduzida.",
  },
];

const terco = dados.estabilidade.tercos;
export const PERFIL_LIMITES: { titulo: string; texto: string }[] = [
  {
    titulo: "Pedido não é contrato",
    texto:
      "A base reúne pedidos de orçamento. Parte virou contrato com a Bewild, parte foi para outras empresas e parte não reformou.",
  },
  {
    titulo: "A captação pesa no perfil",
    texto:
      `A maior parte dos pedidos chega por anúncios em redes sociais, e o retrato reflete também para quem esses anúncios foram exibidos. A ordem das finalidades se repete nas origens: vão alugar ${dados.estabilidade.porOrigem.anunciosRedesPct}% de quem chegou por anúncio em redes sociais e ${dados.estabilidade.porOrigem.outrasPct}% de quem chegou por indicação, site, redes e parceiros.`,
  },
  {
    titulo: "A composição mudou no período",
    texto:
      `Dividindo as pessoas em três grupos iguais pela data do pedido, a parcela que vai alugar foi de ${terco[0].alugarPct}% para ${terco[1].alugarPct}% e ${terco[2].alugarPct}%, e a que vai morar, de ${terco[0].morarPct}% para ${terco[1].morarPct}% e ${terco[2].morarPct}%. Dentro de um mesmo canal, o de anúncios em redes sociais, quem vai morar ficou entre ${dados.estabilidade.mesmoCanal.min}% e ${dados.estabilidade.mesmoCanal.max}% de junho a novembro, sem tendência (Cochran-Armitage, p = ${String(dados.estabilidade.mesmoCanal.p).replace(".", ",")}). A mudança acompanha a entrada de novos canais de captação, e o estudo não a trata como tendência de mercado. Os percentuais valem para o período inteiro, não para um mês.`,
  },
  {
    titulo: "Telefone não é endereço",
    texto:
      "O DDD indica onde o número foi habilitado. Quem se mudou e manteve o número conta como de fora.",
  },
  {
    titulo: "Nem todo pedido tem todo dado",
    texto:
      `A metragem existe em ${pctDe(m2.base, dados.base.pedidos)}% dos pedidos e o bairro em ${pctDe(dados.regioes.base, dados.base.pedidos)}%. Quem não informou pode ser diferente de quem informou.`,
  },
  {
    titulo: "Finalidade e chaves são declaradas",
    texto: "Vêm do formulário e do cadastro, no momento do pedido, e podem mudar depois.",
  },
  {
    titulo: "Tema de conversa é menção, não intenção",
    texto: "Um tema conta quando a pessoa escreve uma das expressões do dicionário. Áudios não entram.",
  },
  {
    titulo: "Profissão, estado civil, idade e sexo têm outras bases",
    texto:
      "Os dois primeiros valem para quem assinou contrato; os dois últimos são estimativas da plataforma de anúncios para quem se cadastrou por anúncio.",
  },
];

/** Tamanho da base do Índice, para o parágrafo que liga os dois estudos. */
export const INDICE_ORCAMENTOS = INDICE.orcamentos;
export { INDICE_CANONICAL };

export const PERFIL_JSONLD: Array<Record<string, unknown>> = [
  {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${PERFIL_URL_ABSOLUTA}#dataset`,
    name: `${PERFIL_NOME} — ${PERFIL_EDICAO}`,
    description:
      `${PERFIL_RESUMO} Inclui finalidade, origem do telefone, regiões e bairros, metragem, momento das chaves e temas das ` +
      `conversas. ${PERFIL_AVISO}`,
    url: PERFIL_URL_ABSOLUTA,
    keywords: [
      "quem reforma studio",
      "perfil do investidor de studio",
      "reforma de studio São Paulo",
      "aluguel por temporada",
      "imóveis compactos",
    ],
    inLanguage: "pt-BR",
    isAccessibleForFree: true,
    license: PERFIL_LICENCA_URL,
    temporalCoverage: PERFIL_PERIODO,
    creator: { "@id": "https://bewild.com.br/#org" },
    publisher: { "@id": "https://bewild.com.br/#org" },
    datePublished: comFuso(PERFIL_PUBLICADO_EM),
    dateModified: comFuso(PERFIL_ATUALIZADO_EM),
    spatialCoverage: { "@type": "Place", name: "São Paulo, SP, Brasil" },
    measurementTechnique:
      "Proporções sobre quem tem cada dado; mediana e quartis da metragem; testes de Fisher, qui-quadrado, Mann-Whitney e Cochran-Armitage",
    variableMeasured: [
      { "@type": "PropertyValue", name: "Pessoas que vão alugar o imóvel", value: ALUGAR_PCT, unitText: "PERCENT" },
      {
        "@type": "PropertyValue",
        name: "Pessoas com telefone de fora da capital e da Grande São Paulo",
        value: FORA_PCT,
        unitText: "PERCENT",
      },
      { "@type": "PropertyValue", name: "Metragem mediana do imóvel", value: m2.mediana, unitText: "m²" },
    ],
    distribution: [
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `https://bewild.com.br${PERFIL_CSV_PATH}` },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: `https://bewild.com.br${PERFIL_DICIONARIO_PATH}`,
      },
    ],
  },
  faqJsonLd(PERFIL_FAQ),
];
