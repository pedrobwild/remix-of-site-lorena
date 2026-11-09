/**
 * Parser da query string do TanStack Router sem perda de precisão.
 *
 * O padrão do roteador (`parseSearchWith(JSON.parse)`) transforma em número
 * todo valor que pareça número. IDs do Meta Ads passam de 2^53 e o
 * `JSON.parse` arredonda: na primeira navegação SPA a URL era reescrita e
 * `utm_campaign=120252065401790152` virava `120252065401790140` (incidente de
 * 08/11/2026, atribuição dos leads com o id errado da campanha).
 *
 * `parseSearchValue` é o `JSON.parse` com uma condição a mais: se o número
 * lido não reescreve exatamente o texto original, ele lança — e o
 * `parseSearchWith` mantém o texto cru (string). Números pequenos, booleanos,
 * `null`, objetos e listas continuam como antes.
 */
import { parseSearchWith, stringifySearchWith } from "@tanstack/react-router";

// Mesmo atalho do roteador: valor que não começa como JSON nem tenta o parse.
const JSON_START = /^(?:\s|["[{\d-]|fa|nu|tr)/;

class ImpreciseSearchValue extends Error {}
const NOT_JSON = new ImpreciseSearchValue("not_json");
const IMPRECISE = new ImpreciseSearchValue("imprecise_number");

/**
 * Número aninhado (lista/objeto): sem o texto de cada item, só dá para
 * recusar o que certamente perdeu precisão. Determinístico no servidor e no
 * navegador (não depende do acesso ao texto-fonte do JSON.parse).
 */
function reviver(_key: string, value: unknown): unknown {
  if (typeof value === "number" && (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))) {
    throw IMPRECISE;
  }
  return value;
}

export function parseSearchValue(text: string): unknown {
  if (typeof text !== "string" || !JSON_START.test(text)) throw NOT_JSON;
  const parsed: unknown = JSON.parse(text, reviver);
  // Número no topo: precisa voltar idêntico ao texto ("5" ok; "1e3", "5.0",
  // "-0" e ids grandes ficam como texto).
  if (typeof parsed === "number" && String(parsed) !== text) throw IMPRECISE;
  return parsed;
}

export const parseSearch = parseSearchWith(parseSearchValue);
export const stringifySearch = stringifySearchWith(JSON.stringify, parseSearchValue);
