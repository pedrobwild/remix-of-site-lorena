/**
 * Converte o nome de uma pasta do Google Drive no título padrão de projeto:
 * "iniciais do cliente · nome do prédio".
 *
 * Exemplos:
 *   "34 - FD - Next One vila nova"            -> "FD · Next One Vila Nova"
 *   "TB - Latitude Campo Belo"                -> "TB · Latitude Campo Belo"
 *   "AG-YBY"                                  -> "AG · YBY"
 *   "40‑Paulo Ricardo Gregório ‑ MetroCasa"   -> "PRG · MetroCasa"
 *   "12 Paulo Ricardo Gregorio MetroCasa"     -> "PRG · MetroCasa"
 */

const SMALL_WORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas", "of", "the",
]);

/** Todos os tipos de traço/separador que aparecem em nomes de pasta. */
const DASHES = "-\u2010\u2011\u2012\u2013\u2014\u2015_|/·•";
const LEADING_NUMBER = new RegExp(`^\\s*\\d{1,4}\\s*(?:[${DASHES}.)]\\s*|\\s+)`);
const SPLIT_PARTS = new RegExp(`\\s*[${DASHES}]+\\s*`);

/** Primeiros nomes comuns no Brasil — usados quando a pasta não traz traço separando cliente e prédio. */
const GIVEN_NAMES = new Set([
  "adriana", "adriano", "alessandra", "alex", "alexandre", "aline", "amanda", "ana", "anderson",
  "andre", "andrea", "andressa", "antonio", "artur", "arthur", "beatriz", "bianca", "bruna",
  "bruno", "caio", "camila", "carla", "carlos", "carolina", "caroline", "cassio", "cesar",
  "cintia", "claudia", "claudio", "cristiane", "cristina", "daniel", "daniela", "danilo",
  "david", "debora", "diego", "diogo", "edson", "eduardo", "elaine", "eliane", "elisa",
  "emanuel", "erica", "erik", "everton", "fabiana", "fabio", "felipe", "fernanda", "fernando",
  "flavia", "flavio", "francisco", "gabriel", "gabriela", "geraldo", "giovanna", "gisele",
  "guilherme", "gustavo", "helena", "heloisa", "henrique", "hugo", "igor", "isabela", "isabella",
  "italo", "ivan", "jaqueline", "joao", "joana", "joaquim", "jorge", "jose", "juliana", "julio",
  "karina", "larissa", "laura", "leandro", "leonardo", "leticia", "lucas", "luciana", "luciano",
  "lucia", "luis", "luiz", "luiza", "maira", "marcela", "marcelo", "marcio", "marco", "marcos",
  "maria", "mariana", "mario", "marina", "matheus", "mauricio", "michel", "michele", "miguel",
  "milena", "murilo", "nathalia", "natalia", "nelson", "otavio", "patricia", "paula", "paulo",
  "pedro", "priscila", "rafael", "rafaela", "raphael", "raquel", "regina", "renan", "renata",
  "renato", "ricardo", "roberta", "roberto", "rodrigo", "rogerio", "ronaldo", "rosana", "rubens",
  "samuel", "sandra", "sergio", "silvia", "simone", "sofia", "tadeu", "tais", "talita", "tatiana",
  "thiago", "tiago", "valeria", "vanessa", "victor", "vinicius", "vitor", "vitoria", "viviane",
  "wagner", "wallace", "walter", "wesley", "william", "yuri",
]);

/** Sobrenomes/partículas que fazem parte do nome da pessoa. */
const NAME_PARTICLES = new Set(["de", "da", "do", "das", "dos", "e"]);

function strip(word: string): string {
  return word
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function titleCaseWord(word: string, index: number): string {
  if (!word) return word;
  // Mantém siglas já em caixa alta (YBY, SP, JK…)
  if (word.length <= 4 && word === word.toUpperCase() && /[A-ZÀ-Ú]/.test(word)) return word;
  // Mantém grafias com maiúscula interna (MetroCasa, YbY, JHSF)
  if (/[A-ZÀ-Ú]/.test(word.slice(1))) return word;
  const lower = word.toLocaleLowerCase("pt-BR");
  if (index > 0 && SMALL_WORDS.has(lower)) return lower;
  return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
}

export function titleCasePt(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .map(titleCaseWord)
    .join(" ");
}

export type ParsedFolderName = {
  /** Iniciais do cliente (caixa alta) ou "" quando a pasta não traz. */
  initials: string;
  /** Nome do prédio/unidade já normalizado. */
  building: string;
  /** Título final pronto para o campo "Projeto". */
  title: string;
};

/** "Fernanda Dias" -> "FD"; "FD" -> "FD"; "Paulo Ricardo Gregório" -> "PRG". */
function toInitials(raw: string): string {
  const words = raw
    .trim()
    .split(/[\s.]+/)
    .filter((w) => w && !SMALL_WORDS.has(strip(w)));
  if (words.length === 0) return "";
  // Já é uma sigla curta ("FD", "AG", "TB")
  if (words.length === 1 && words[0].length <= 4) {
    return words[0].toLocaleUpperCase("pt-BR");
  }
  return words
    .map((w) => w.charAt(0).toLocaleUpperCase("pt-BR"))
    .join("")
    .slice(0, 4);
}

/** Nome de pessoa por extenso (sem traço): "Paulo Ricardo Gregorio MetroCasa Berrini". */
function splitPersonPrefix(words: string[]): { person: string[]; rest: string[] } | null {
  if (words.length < 2) return null;
  if (!GIVEN_NAMES.has(strip(words[0]))) return null;
  const person: string[] = [words[0]];
  let unknown = 0; // sobrenomes fora da lista: aceita no máximo 1
  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    const s = strip(w);
    if (words.length - i <= 1 || person.length >= 4) break; // sobra pouca coisa para o prédio
    if (!/^[A-Za-zÀ-ÿ']+$/.test(w)) break;
    if (/[A-ZÀ-Ú]/.test(w.slice(1))) break; // "MetroCasa" já é o empreendimento
    const known = NAME_PARTICLES.has(s) || GIVEN_NAMES.has(s);
    if (!known) {
      if (unknown >= 1 || !/^[A-ZÀ-Ý]/.test(w)) break;
      unknown += 1;
    }
    person.push(w);
  }

  const rest = words.slice(person.length);
  if (rest.length === 0) return null;
  return { person, rest };
}

export function parseDriveFolderName(raw: string): ParsedFolderName {
  // Remove numeração de ordem no começo: "34 - ", "34. ", "34) ", "40‑", "12 "
  const cleaned = (raw || "").replace(LEADING_NUMBER, "").trim();

  // 1) "Cliente - Empreendimento" (o cliente pode vir por extenso)
  const parts = cleaned.split(SPLIT_PARTS).filter((p) => p.trim().length > 0);
  if (parts.length >= 2) {
    const initials = toInitials(parts[0]);
    const building = titleCasePt(parts.slice(1).join(" "));
    if (initials && building) {
      return { initials, building, title: `${initials} · ${building}` };
    }
  }

  // 2) Sem traço: tenta reconhecer um nome de pessoa no começo.
  const words = cleaned.split(/\s+/).filter(Boolean);
  const guess = splitPersonPrefix(words);
  if (guess) {
    const initials = toInitials(guess.person.join(" "));
    const building = titleCasePt(guess.rest.join(" "));
    if (initials && building) {
      return { initials, building, title: `${initials} · ${building}` };
    }
  }

  const building = titleCasePt(cleaned) || "Projeto";
  return { initials: "", building, title: building };
}
