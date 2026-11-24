/**
 * Gráficos e infográficos do Perfil Bewild de Quem Reforma Studio.
 *
 * Os arquivos ficam em public/images/blog/quem-reforma-studio-sao-paulo-perfil/
 * (versão larga e versão "-m" para celular) e saem de
 * scripts/graficos/perfil_quem_reforma_2026_11.py, que lê os mesmos números de
 * perfilReforma.dados.json. Refez o estudo? Rode o script e atualize as alturas
 * abaixo (perfilGraficos.test.ts compara com os arquivos e com os percentuais).
 * Os textos alternativos são montados dos dados, nunca digitados.
 */
import {
  ALUGAR_PCT,
  FORA_PCT,
  M2_MEDIANA,
  num,
  pctDe,
  PERFIL,
  PERFIL_EDICAO,
  PERFIL_LICENCA_NOME,
  PERFIL_LICENCA_URL,
  PERFIL_NOME,
  PERFIL_URL_ABSOLUTA,
  RENDA_ALUGAR_PCT,
  RENDA_MORAR_PCT,
  SEM_CHAVE_PCT,
  temaPct,
} from "@/content/perfilReforma";

/** O conjunto usa o slug do artigo: os mesmos arquivos servem o artigo, a página do estudo e /graficos/<slug>. */
export const PERFIL_GRAFICOS_SLUG = "quem-reforma-studio-sao-paulo-perfil";
export const PERFIL_GRAFICOS_DIR = `/images/blog/${PERFIL_GRAFICOS_SLUG}`;
export const PERFIL_GRAFICOS_PAGINA = `/graficos/${PERFIL_GRAFICOS_SLUG}`;

export type PerfilGrafico = {
  id: string;
  /** Nome do arquivo sem extensão; a versão de celular termina em "-m". */
  file: string;
  /** Título de acessibilidade, igual ao <title> do SVG. */
  titulo: string;
  /** Leitura do gráfico, para a legenda. */
  legenda: string;
  /** Base do gráfico, para a linha de fonte. */
  base: string;
  largura: number;
  altura: number;
  alturaM: number;
  alt: string;
};

const d = PERFIL;
const lista = (itens: string[]) => itens.join("; ");
const fin = d.finalidade;
const ori = d.origem;
const ch = d.chaves;
const DOIS_PERFIS_PCT = pctDe(d.perfis.itens[0].pessoas + d.perfis.itens[1].pessoas, d.perfis.base);
const TRES_BAIRROS = d.bairros.itens.slice(0, 3);
const CENTRO = d.regioes.itens.find((r) => r.regiao === "Centro");

export const PERFIL_GRAFICOS: PerfilGrafico[] = [
  {
    id: "resumo",
    file: "01-perfil-em-seis-numeros",
    titulo: "Quem reforma studio em São Paulo, em seis números",
    legenda: "Os seis números do estudo que resumem quem recebe orçamento de reforma de studio em São Paulo.",
    base: `base de ${num(d.base.pedidos)} orçamentos de ${num(d.base.pessoas)} pessoas`,
    largura: 720,
    altura: 706,
    alturaM: 993,
    alt:
      `Seis números do ${PERFIL_NOME}: ${ALUGAR_PCT}% vão alugar o imóvel; ${FORA_PCT}% têm telefone de fora da Grande São Paulo; ` +
      `metragem mediana de ${M2_MEDIANA}; ${SEM_CHAVE_PCT}% pedem o orçamento antes de ter a chave; renda aparece nas conversas de ` +
      `${RENDA_ALUGAR_PCT}% de quem vai alugar e de ${RENDA_MORAR_PCT}% de quem vai morar; base de ${num(d.base.pedidos)} orçamentos ` +
      `de ${num(d.base.pessoas)} pessoas.`,
  },
  {
    id: "finalidade",
    file: "02-finalidade-do-imovel",
    titulo: "Finalidade do imóvel de quem recebe orçamento de reforma de studio",
    legenda: `${ALUGAR_PCT}% reformam para alugar, a maior parte por temporada.`,
    base: `base de ${num(fin.base)} pessoas que declararam a finalidade`,
    largura: 720,
    altura: 617,
    alturaM: 532,
    alt:
      `Finalidade declarada por ${num(fin.base)} pessoas: ` +
      lista(fin.itens.map((i) => `${i.rotulo.toLowerCase()}, ${pctDe(i.pessoas, fin.base)}% (${i.pessoas})`)) + ".",
  },
  {
    id: "origem",
    file: "03-origem-do-telefone",
    titulo: "Origem do telefone de quem recebe orçamento de reforma de studio em São Paulo",
    legenda: `${FORA_PCT}% têm telefone de fora da capital e da Grande São Paulo. O DDD mostra onde o número foi habilitado, não o endereço atual.`,
    base: `base de ${num(ori.base)} pessoas com telefone identificado`,
    largura: 720,
    altura: 614,
    alturaM: 656,
    alt:
      `Origem do telefone de ${num(ori.base)} pessoas: ` +
      lista(ori.itens.map((i) => `${i.rotulo}, ${pctDe(i.pessoas, ori.base)}% (${i.pessoas})`)) +
      `. Depois de São Paulo, os estados mais frequentes: ` +
      lista(d.estados.itens.map((e) => `${e.nome} ${e.pessoas}`)) + ".",
  },
  {
    id: "chaves",
    file: "04-momento-das-chaves",
    titulo: "Momento das chaves de quem pede orçamento de reforma de studio",
    legenda: `${SEM_CHAVE_PCT}% pedem o orçamento antes de receber a chave.`,
    base: `base de ${num(ch.base)} pessoas que informaram a situação das chaves`,
    largura: 720,
    altura: 617,
    alturaM: 617,
    alt:
      `Momento das chaves informado por ${num(ch.base)} pessoas: ` +
      lista(ch.itens.map((i) => `${i.rotulo.toLowerCase()}, ${pctDe(i.pessoas, ch.base)}% (${i.pessoas})`)) + ".",
  },
  {
    id: "temas",
    file: "05-temas-das-conversas",
    titulo: "Temas das conversas antes do contrato, por finalidade do imóvel",
    legenda:
      `Renda aparece nas conversas de ${RENDA_ALUGAR_PCT}% de quem vai alugar e de ${RENDA_MORAR_PCT}% de quem vai morar: ` +
      `é o único tema com diferença estatística entre os dois grupos.`,
    base: `base de ${num(d.conversas.alugar)} pessoas que vão alugar e ${num(d.conversas.morar)} que vão morar`,
    largura: 720,
    altura: 871,
    alturaM: 1020,
    alt:
      `Parcela das conversas em que cada tema aparece, entre ${num(d.conversas.alugar)} pessoas que vão alugar e ` +
      `${num(d.conversas.morar)} que vão morar: ` +
      lista(d.conversas.temas.map((t) => `${t.tema.toLowerCase()}, ${temaPct(t).alugar}% e ${temaPct(t).morar}%`)) + ".",
  },
  {
    id: "regioes",
    file: "06-regioes-de-sao-paulo",
    titulo: "Orçamentos de reforma por região de São Paulo e parcela para aluguel por temporada",
    legenda: `No Centro, ${CENTRO?.temporadaPct}% de quem declarou a finalidade vai alugar por temporada.`,
    base: `base de ${num(d.regioes.base)} orçamentos com bairro informado`,
    largura: 720,
    altura: 593,
    alturaM: 757,
    alt:
      `Orçamentos por região, entre ${num(d.regioes.base)} com bairro informado: ` +
      lista(
        d.regioes.itens.map(
          (r) =>
            `${r.regiao}, ${r.pedidos} orçamentos` +
            (r.temporadaPct === null ? ", percentual de temporada não calculado" : `, ${r.temporadaPct}% para temporada`),
        ),
      ) + ".",
  },
  {
    id: "bairros",
    file: "07-bairros-com-mais-orcamentos",
    titulo: `Bairros de São Paulo com ${d.bairros.minimo} orçamentos de reforma ou mais`,
    legenda:
      `${TRES_BAIRROS.map((b) => b.bairro).join(", ").replace(/, ([^,]*)$/, " e $1")} somam ` +
      `${TRES_BAIRROS.reduce((s, b) => s + b.pedidos, 0)} dos ${num(d.bairros.base)} orçamentos com bairro informado.`,
    base: `base de ${num(d.bairros.base)} orçamentos com bairro informado`,
    largura: 720,
    altura: 773,
    alturaM: 692,
    alt:
      `Bairros com ${d.bairros.minimo} orçamentos ou mais: ` +
      lista(d.bairros.itens.map((b) => `${b.bairro} ${b.pedidos}`)) + ".",
  },
  {
    id: "perfis",
    file: "08-seis-perfis",
    titulo: "Seis perfis de quem recebe orçamento de reforma de studio em São Paulo",
    legenda: `Os dois perfis de investidor de temporada somam ${DOIS_PERFIS_PCT}% das ${num(d.perfis.base)} pessoas classificadas.`,
    base: `base de ${num(d.perfis.base)} pessoas com finalidade e telefone identificados`,
    largura: 720,
    altura: 706,
    alturaM: 776,
    alt:
      `Seis perfis entre ${num(d.perfis.base)} pessoas: ` +
      lista(
        d.perfis.itens.map(
          (p) =>
            `${p.nome}, ${pctDe(p.pessoas, d.perfis.base)}% (${p.pessoas})` +
            (p.m2 === null ? "" : `, mediana de ${p.m2} m² e ${p.ate30Pct}% com até 30 m²`),
        ),
      ) + ".",
  },
  {
    id: "metodo",
    file: "09-como-o-estudo-foi-montado",
    titulo: `Como o Perfil Bewild foi montado: de ${d.base.negociosIniciais} negócios a ${d.base.pedidos} orçamentos`,
    legenda:
      `A amostra parte de ${num(d.base.negociosIniciais)} negócios com orçamento enviado e chega a ${num(d.base.pedidos)} orçamentos ` +
      `de ${num(d.base.pessoas)} pessoas. Cada percentual usa como base quem tem aquele dado.`,
    base: `base de ${num(d.base.pedidos)} orçamentos`,
    largura: 720,
    altura: 1163,
    alturaM: 1191,
    alt:
      `De ${num(d.base.negociosIniciais)} negócios com orçamento enviado ao cliente saíram ` +
      lista(d.exclusoes.map((e) => `${e.n} ${e.motivo}`)) +
      `; ficaram ${num(d.base.pedidos)} orçamentos de ${num(d.base.pessoas)} pessoas. Cobertura dos dados: ` +
      lista(d.cobertura.map((c) => `${c.dado.toLowerCase()}, ${c.com} de ${c.total} ${c.unidade}`)) + ".",
  },
];

export function perfilGrafico(id: string): PerfilGrafico {
  const g = PERFIL_GRAFICOS.find((x) => x.id === id);
  if (!g) throw new Error(`Gráfico ${id} ausente em PERFIL_GRAFICOS`);
  return g;
}

export function perfilGraficoSrc(g: PerfilGrafico, variante: "desktop" | "mobile"): string {
  return `${PERFIL_GRAFICOS_DIR}/${g.file}${variante === "mobile" ? "-m" : ""}.svg`;
}

/** Gráficos com código de incorporação no bloco "Para imprensa". */
export const PERFIL_GRAFICOS_IMPRENSA = ["resumo", "finalidade", "origem"].map(perfilGrafico);

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** HTML para colar num site: a imagem do gráfico e a legenda com o link de atribuição. */
export function perfilGraficoEmbedHtml(g: PerfilGrafico): string {
  return [
    `<figure style="margin:0;max-width:${g.largura}px">`,
    `  <img src="https://bewild.com.br${perfilGraficoSrc(g, "desktop")}" alt="${escapeHtml(g.alt)}" width="${g.largura}" height="${g.altura}" style="width:100%;height:auto" loading="lazy">`,
    `  <figcaption>Fonte: <a href="${PERFIL_URL_ABSOLUTA}">${PERFIL_NOME}</a>, edição ${PERFIL_EDICAO}, ${escapeHtml(g.base)}. ` +
      `Licença <a href="${PERFIL_LICENCA_URL}" rel="license">${PERFIL_LICENCA_NOME}</a>.</figcaption>`,
    `</figure>`,
  ].join("\n");
}
