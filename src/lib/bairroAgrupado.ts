import { BAIRROS } from "@/lib/bairrosSp";

/** Chave de comparação: sem acento, minúsculas, sem "- SP"/", São Paulo" e espaços extras. */
export function chaveBairro(texto: string): string {
  return texto
    .normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[\s,/-]+(sp|sao paulo)(\s*[-,/]\s*(sp|sao paulo))*\s*$/g, "")
    .replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

const CATALOGO = new Map(BAIRROS.map((b) => [chaveBairro(b), b]));

/**
 * Nome único para grafias diferentes do mesmo bairro ("lapa", "Lapa ", "LAPA - SP").
 * Só une textos que ficam iguais após a normalização; nunca adivinha bairro parecido.
 * Bairro do catálogo usa a grafia oficial; os demais, a primeira letra de cada palavra.
 */
export function bairroAgrupado(texto: string | null | undefined): string | null {
  const chave = chaveBairro(texto ?? "");
  if (!chave) return null;
  return CATALOGO.get(chave) ?? chave.replace(/(^|\s)(\p{L})/gu, (_, s, l) => s + l.toUpperCase());
}
