import { formatAreaM2 } from "./formatArea";
import { brandTitle } from "./seoTitle";

/**
 * Faixa de metragem dos projetos de um bairro, em pt-BR: "24,5 a 35,12 m²"
 * (ou "28 m²" quando só há uma). Usada no texto da página e na descrição do
 * servidor, para as duas dizerem a mesma coisa.
 */
export function bairroAreaRange(list: ReadonlyArray<{ area_m2?: number | null }>): string | null {
  const areas = list.map((p) => p.area_m2).filter((n): n is number => typeof n === "number" && n > 0);
  if (!areas.length) return null;
  const min = Math.min(...areas);
  const max = Math.max(...areas);
  if (min === max) return formatAreaM2(min);
  const num = (n: number) => (formatAreaM2(n) ?? "").replace(/\s*m²$/, "");
  return `${num(min)} a ${num(max)} m²`;
}

/**
 * <title> da página de bairro, o mesmo no HTML do servidor e no navegador.
 *
 * "Apartamento e studio" desde 11/10/2026: a maior parte das obras desses
 * bairros é em studio, e quem busca "reforma de studio em <bairro>" não achava
 * a palavra no título. "Orçamento" fica porque é como a busca chega ("orçamento
 * de reforma de apartamento em Pinheiros", Search Console de out/2026). Sem
 * bairro (falha de rede no loader), o título fala de São Paulo.
 */
export function bairroTitle(label?: string | null): string {
  return brandTitle(`Reforma de apartamento e studio ${noBairro(label)}: orçamento`);
}

/** Meta description da página de bairro: a mesma no HTML do servidor e no navegador. */
export function bairroDescription(count: number, label: string, faixa: string | null): string {
  return `${count} apartamentos reformados pela Bewild ${noBairro(label)}, São Paulo${
    faixa ? ` (${faixa})` : ""
  }: fotos reais de cada obra e orçamento sem custo para o seu imóvel no bairro.`;
}

const foldBairro = (value: string) =>
  value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{M}/gu, "").trim();

/** Bairros de São Paulo que pedem artigo masculino: "no Brooklin", "no Butantã". */
const BAIRROS_NO = new Set([
  "brooklin", "butanta", "campo belo", "itaim bibi", "itaim", "jardim paulista", "paraiso", "ibirapuera",
  "tatuape", "morumbi", "cambuci", "centro", "sumare", "ipiranga", "pacaembu", "bom retiro", "jabaquara",
  "panamby", "bras", "belem", "belenzinho", "jardim europa", "jardim america", "alto de pinheiros",
  "alto da boa vista", "real parque", "planalto paulista", "brooklin novo", "campo limpo",
]);
/** Plural: "nos Jardins", "nos Campos Elíseos". */
const BAIRROS_NOS = new Set(["jardins", "campos eliseos", "campos elisios"]);
/** Femininos sem "Vila"/"Chácara" na frente: "na Bela Vista", "na Consolação". */
const BAIRROS_NA = new Set([
  "bela vista", "consolacao", "republica", "paulista", "liberdade", "lapa", "mooca", "aclimacao",
  "barra funda", "saude", "penha", "pompeia", "agua branca", "se", "luz", "casa verde", "granja julieta",
]);

/**
 * Preposição do bairro em português: "no Brooklin", "na Vila Madalena",
 * "em Pinheiros". "Em Brooklin" é o que ninguém escreve nem busca ("reforma
 * de apartamento no brooklin", Search Console de out/2026). Sem bairro: "em São Paulo".
 */
export function noBairro(label?: string | null): string {
  const nome = (label ?? "").trim();
  if (!nome) return "em São Paulo";
  return `${bairroPreposicao(nome)} ${nome}`;
}

/** Só a preposição ("no", "na", "nos", "em"), para quando o nome vai noutro elemento. */
export function bairroPreposicao(label: string): "no" | "na" | "nos" | "em" {
  const key = foldBairro(label);
  if (BAIRROS_NOS.has(key)) return "nos";
  if (BAIRROS_NO.has(key)) return "no";
  if (BAIRROS_NA.has(key) || /^(vila|chacara|cidade|granja|praca) /.test(key)) return "na";
  return "em";
}
