import { brandTitle } from "@/lib/seoTitle";
import { formatAreaM2 } from "./formatArea";
/**
 * Meta description derivada dos DADOS REAIS do projeto.
 *
 * Contexto: 161 projetos publicados não têm `seo_description` nem `summary`,
 * então todas as páginas /portfolio/:slug caíam no mesmo texto genérico —
 * ~100 URLs do sitemap com descrição idêntica. Aqui montamos uma frase a
 * partir do que está preenchido no admin (tipo, metragem, bairro). Nada é
 * inventado: campo vazio simplesmente não entra na frase.
 */
export type ProjectSeoInput = {
  title?: string | null;
  neighborhood?: string | null;
  location?: string | null;
  area_m2?: number | null;
  project_type?: string | null;
  seo_description?: string | null;
  summary?: string | null;
  seo_title?: string | null;
  /** Fase: "em_projeto", "em_obra" ou vazio/"entregue". */
  status?: string | null;
};

const TYPE_NOUN: Record<string, string> = {
  short_stay: "Apartamento pronto para short stay",
  turn_key: "Apartamento pronto após reforma turn-key",
  planta: "Projeto de reforma para apartamento na planta",
};

const LOCAL_DESCRIPTION =
  "Reforma de apartamento em São Paulo pela Bewild, com entrega do apartamento pronto para morar ou rentabilizar.";

/** Código interno do negócio no começo do nome: "AB - ", "B&F — ", "SX -". */
const CODE_PREFIX = /^(?:[A-ZÀ-Ú][A-ZÀ-Ú&0-9]{0,4}\s*[-–—]|[A-ZÀ-Ú][A-Za-zÀ-ú&0-9()]{0,4}\s*·)\s*/;

/** Remove o código interno: ele não diz nada para quem vê o resultado no Google. */
export function stripProjectCode(value: string): string {
  const match = value.match(CODE_PREFIX);
  if (!match) return value.trim();
  let rest = value.slice(match[0].length).trim();
  // "LM - LM URBAN FLEX": o código repetido no começo do nome também sai.
  const code = match[0].replace(/[-–—·\s]+$/, "");
  if (code && rest.startsWith(`${code} `)) rest = rest.slice(code.length).trim();
  return rest;
}

const LOWER_WORDS = new Set(["de", "da", "do", "das", "dos", "e", "em", "no", "na"]);

/** Sigla sem vogal ("SP", "JK", "PJM") continua em caixa alta. */
const ACRONYM = /^[b-df-hj-np-tv-xz]{2,4}$/;

/** Nomes vêm em CAIXA ALTA no admin; no título do Google fica melhor capitalizado. */
function humanizeName(value: string): string {
  const clean = stripProjectCode(value);
  if (!clean) return "";
  if (clean !== clean.toUpperCase()) return clean;
  return clean
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) =>
      ACRONYM.test(w)
        ? w.toUpperCase()
        : i > 0 && LOWER_WORDS.has(w)
          ? w
          : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

/** Nome do projeto sem o código interno, pronto para leitura. */
export function projectFriendlyName(p: ProjectSeoInput | null | undefined): string {
  return humanizeName((p?.title || "").trim());
}

const hasSearchContext = (value: string) =>
  /s[aã]o paulo|\bsp\b/i.test(value) &&
  /reforma|apartamento pronto|apartamentos prontos/i.test(value);

const truncateTitleBase = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value;
  const shortened = value.slice(0, maxLength + 1).replace(/\s+\S*$/, "").trim();
  return shortened && shortened.length <= maxLength ? shortened : value.slice(0, maxLength).trim();
};

const areaLabel = (p: ProjectSeoInput) =>
  formatAreaM2(p.area_m2) ?? "";

/**
 * O que foi feito, logo depois do nome: "reforma de 28,21 m²". Só o que o
 * cadastro diz: projeto ainda não executado não é "reforma".
 */
const titleWhat = (p: ProjectSeoInput, area: string) => {
  if (p.status === "em_projeto") return area ? `projeto de interiores de ${area}` : "projeto de interiores";
  const base = area ? `reforma de ${area}` : "reforma de apartamento";
  return p.status === "em_obra" ? `${base} em obra` : base;
};

/** Conectivo ou traço que sobra no fim do nome depois de tirar o bairro ou cortar. */
const TRAILING_FILLER = /(?:\s+(?:de|da|do|das|dos|e|em|no|na|nos|nas)|\s*[-–—·,:;&/|])+$/;
const tidyName = (value: string) => value.replace(TRAILING_FILLER, "").trim();

/**
 * Palavra que costuma abrir nome de lugar: "Jardim Paulista", "Alto do
 * Ipiranga", "Dom Brás". Se o nome termina nela antes do bairro, o bairro é
 * parte do nome próprio e fica.
 */
const PLACE_GLUE = /(?:^|\s)(?:de|da|do|das|dos|jardim|vila|alto|parque|ch[aá]cara|cidade|dom|santa|santo|s[aã]o)$/i;

const escapeRx = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Comparação sem acento nem caixa: "Vila Olimpia" = "Vila Olímpia". */
const fold = (value: string) =>
  value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{M}/gu, "");

/** O nome já cita o bairro ("Brooklin Studio")? Então "em Brooklin" não se repete. */
const nameHasPlace = (name: string, place: string) =>
  new RegExp(`(^|[^a-z0-9])${escapeRx(fold(place))}([^a-z0-9]|$)`).test(fold(name));

/** Teto do título gerado (o Google exibe uns 60 caracteres e corta o resto). */
const TITLE_MAX = 78;

/** Google corta em ~160 caracteres: fecha em frase ou palavra inteira. */
const DESCRIPTION_MAX = 160;
export function clampDescription(value: string, max = DESCRIPTION_MAX): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const sentence = head.match(/^(.{60,}[.!?])\s/);
  if (sentence) return sentence[1];
  const cut = head.slice(0, head.lastIndexOf(" ")).replace(/[\s,;:.\-–—]+$/, "");
  return `${cut}…`;
}

/** Bairro → cidade. Valor sem nenhuma letra (ex.: "31", erro de cadastro) não conta. */
const placeLabel = (p: ProjectSeoInput) =>
  [p.neighborhood, p.location].map((v) => (v || "").trim()).find((v) => /\p{L}/u.test(v)) ?? "";

/**
 * Título do Google: o nome do prédio primeiro, depois o bairro e o que foi
 * feito — "The Collection em Moema: reforma de 28,21 m² | Bewild". Nunca o
 * código interno do negócio.
 *
 * O nome vem na frente porque a busca que esta página atende é a do prédio
 * ("the collection moema"). "Reforma de apartamento em <bairro>" é da página
 * do bairro (/reforma/<bairro>) e do guia de SP: com 160 projetos abrindo o
 * título com essa frase, eles disputavam a mesma busca entre si (CONT-01 da
 * auditoria de 05/10/2026).
 */
export function projectSeoTitle(p: ProjectSeoInput | null | undefined): string {
  return brandTitle(projectSeoTitleFull(p));
}

/**
 * Título completo, sempre com " | Bewild" (teto `TITLE_MAX`). `projectSeoTitle`
 * aplica `brandTitle` por cima: a marca sai quando o conjunto passa de 60.
 */
function projectSeoTitleFull(p: ProjectSeoInput | null | undefined): string {
  if (!p) return "Reforma de apartamento em São Paulo | Bewild";

  const explicit = stripProjectCode((p.seo_title || "").trim());
  // Título escrito à mão (sem o código gerado) e já com contexto de busca: respeita.
  if (explicit && explicit === (p.seo_title || "").trim() && hasSearchContext(explicit)) return explicit;

  const suffix = " | Bewild";
  const area = areaLabel(p);
  const place = placeLabel(p) || "São Paulo";
  const what = titleWhat(p, area);
  let name = projectFriendlyName(p);
  // "Latitude Campo Belo" em Campo Belo → "Latitude em Campo Belo": o bairro não
  // se repete. Só sai como palavra inteira ("Solapa" em Lapa fica) e nunca de
  // um nome próprio ("Alto do Ipiranga").
  if (name) {
    const atEnd = new RegExp(`\\s*[-–—]?\\s*(?<![\\p{L}\\p{N}])${escapeRx(place)}\\s*$`, "iu");
    const rest = name.replace(atEnd, "");
    if (rest !== name && !PLACE_GLUE.test(rest)) name = tidyName(rest) || name;
  }
  if (!name) {
    const head = `${what.charAt(0).toUpperCase()}${what.slice(1)} em ${place}`;
    return `${truncateTitleBase(head, TITLE_MAX - suffix.length)}${suffix}`;
  }

  const build = (n: string) => `${n}${nameHasPlace(n, place) ? "" : ` em ${place}`}: ${what}${suffix}`;
  const full = build(name);
  if (full.length <= TITLE_MAX) return full;
  // Sem bairro no cadastro, "em São Paulo" sai antes de cortar o nome do prédio.
  const noPlace = `${name}: ${what}${suffix}`;
  if (!placeLabel(p) && noPlace.length <= TITLE_MAX) return noPlace;
  // Nome longo é cortado em palavra inteira; bairro e metragem ficam inteiros.
  const room = TITLE_MAX - build("").length;
  if (room >= 8 && /\s/.test(name.slice(1, room + 1))) {
    const cut = truncateTitleBase(name, room);
    return build(tidyName(cut) || cut);
  }
  // Sem espaço para isso: corta o conjunto no fim, em palavra inteira.
  const cut = truncateTitleBase(full.slice(0, -suffix.length), TITLE_MAX - suffix.length);
  return `${tidyName(cut) || cut}${suffix}`;
}

export function projectMetaDescription(
  p: ProjectSeoInput | null | undefined,
  fallback: string,
): string {
  if (!p) return fallback;
  const raw = stripProjectCode((p.seo_description || p.summary || "").trim());
  // "GO BALKON: reforma de…" → o nome do projeto já está no título, sai da descrição.
  const explicit = stripProjectCode(raw.replace(/^[A-ZÀ-Ú0-9][^.:a-zà-ú]{0,59}:\s*/, ""));

  if (explicit) {
    const sentence = explicit.charAt(0).toUpperCase() + explicit.slice(1);
    // Metragem exata do cadastro (ex.: 28,21 m²) abre a descrição quando o texto não a cita.
    const area = areaLabel(p);
    if (area && !/m²|m2\b/i.test(sentence)) {
      return clampDescription(`Projeto de ${area}. ${sentence}`);
    }
    return clampDescription(hasSearchContext(sentence) ? sentence : `${sentence} ${LOCAL_DESCRIPTION}`);
  }

  const noun =
    (p.project_type && TYPE_NOUN[p.project_type]) ||
    "Apartamento pronto após reforma completa";
  const area = areaLabel(p);
  const bairro = placeLabel(p);

  if (!area && !bairro) return `${fallback} ${LOCAL_DESCRIPTION}`;

  const parts = [noun];
  if (area) parts.push(`de ${area}`);
  if (bairro) parts.push(`em ${bairro}, São Paulo-SP`);
  return `${parts.join(" ")}. Projeto, obra e marcenaria integrados pela Bewild.`;
}


/** Projeto com o mínimo para comparar títulos entre páginas irmãs. */
export type ProjectSeoPeer = ProjectSeoInput & {
  id: string;
  created_at?: string | null;
};

/** Data de cadastro (dd/mm/aaaa) no fuso de São Paulo; vazio se inválida. */
export function projectRegistrationDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

/** Título com data cabe em ~100 caracteres; o essencial vem no começo. */
const DATED_TITLE_MAX = 100;

/**
 * Título único entre projetos do mesmo prédio. Quando outra página gera o
 * mesmo título, acrescenta "cadastro dd/mm/aaaa" (dado real do cadastro) — mas
 * só se a data realmente separa esta página das irmãs. Se duas irmãs têm a
 * mesma data, o título fica como está: data repetida não ajuda o Google.
 */
export function projectSeoTitleUnique(
  p: ProjectSeoPeer | null | undefined,
  peers: ProjectSeoPeer[],
): string {
  const full = projectSeoTitleFull(p);
  if (!p) return brandTitle(full);

  const group = peers.filter((o) => o.id !== p.id && projectSeoTitleFull(o) === full);
  if (group.length === 0) return brandTitle(full);

  const suffix = " | Bewild";
  if (!full.endsWith(suffix)) return brandTitle(full);
  // Numera as irmãs em ordem estável (cadastro, depois id): "(projeto 2)".
  // A data de cadastro, usada antes, não diz nada a quem busca o prédio e
  // levava o título a 80 caracteres (auditoria de 06/10/2026).
  const key = (o: ProjectSeoPeer) => `${o.created_at ?? ""}|${o.id}`;
  const n = [p, ...group].map(key).sort().indexOf(key(p)) + 1;
  const numbered = `${full.slice(0, -suffix.length)} (projeto ${n})`;
  return numbered.length <= DATED_TITLE_MAX ? brandTitle(numbered) : brandTitle(full);
}
