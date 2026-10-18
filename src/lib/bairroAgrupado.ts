import { BAIRROS } from "@/lib/bairrosSp";

/** Chave de comparação: sem acento, minúsculas, sem "- SP"/", São Paulo" e espaços extras. */
export function chaveBairro(texto: string): string {
  return texto
    .normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[\s,/-]+(sp|sao paulo)(\s*[-,/]\s*(sp|sao paulo))*\s*$/g, "")
    .replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

/** E-mail, telefone ou só números não são bairro: o lead fica como "Não informado". */
function naoEhBairro(texto: string): boolean {
  return /@/.test(texto) || /^[\d\s()+.-]+$/.test(texto);
}

/** Texto do cliente sem o sufixo de cidade, com acentos preservados. */
function limpar(texto: string): string {
  return texto.trim()
    .replace(/[\s,/-]+(sp|s[aã]o paulo)(\s*[-,/]\s*(sp|s[aã]o paulo))*\s*$/giu, "")
    .replace(/\s+/g, " ").trim();
}

const ACENTOS = (s: string) => (s.normalize("NFD").match(/\p{M}/gu) ?? []).length;
const titulo = (s: string) => s.toLocaleLowerCase("pt-BR").replace(/(^|[\s-])(\p{L})/gu, (_, a, l) => a + l.toLocaleUpperCase("pt-BR"));
const CATALOGO = new Map([...BAIRROS, "São Paulo"].map((b) => [chaveBairro(b), b]));

/**
 * Cria o agrupador a partir de todos os textos da lista: grafias que ficam iguais
 * sem acento/maiúsculas viram um nome só. Catálogo usa a grafia oficial; os demais,
 * a variante escrita com mais acentos ("Brás" vence "bras"). Nunca une bairros só parecidos.
 */
export function criarAgrupadorBairros(textos: Iterable<string | null | undefined>) {
  const melhor = new Map<string, string>();
  for (const t of textos) {
    if (!t || naoEhBairro(t)) continue;
    const chave = chaveBairro(t);
    if (!chave) continue;
    const limpo = limpar(t) || t.trim();
    const atual = melhor.get(chave);
    if (!atual || ACENTOS(limpo) > ACENTOS(atual)) melhor.set(chave, limpo);
  }
  return (texto: string | null | undefined): string | null => {
    if (!texto || naoEhBairro(texto)) return null;
    const chave = chaveBairro(texto);
    if (!chave) return null;
    return CATALOGO.get(chave) ?? titulo(melhor.get(chave) ?? limpar(texto));
  };
}

/** Atalho para um texto isolado. */
export function bairroAgrupado(texto: string | null | undefined): string | null {
  return criarAgrupadorBairros([texto])(texto);
}
