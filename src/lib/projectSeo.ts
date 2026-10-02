import { formatAreaM2 } from "./hydrateHomeProjects";
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
const CODE_PREFIX = /^[A-ZÀ-Ú][A-ZÀ-Ú&0-9]{0,4}\s*[-–—]\s*/;

/** Remove o código interno: ele não diz nada para quem vê o resultado no Google. */
export function stripProjectCode(value: string): string {
  return value.replace(CODE_PREFIX, "").trim();
}

const LOWER_WORDS = new Set(["de", "da", "do", "das", "dos", "e", "em", "no", "na"]);

/** Nomes vêm em CAIXA ALTA no admin; no título do Google fica melhor capitalizado. */
function humanizeName(value: string): string {
  const clean = stripProjectCode(value);
  if (!clean) return "";
  if (clean !== clean.toUpperCase()) return clean;
  return clean
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i > 0 && LOWER_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
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
  return shortened || value.slice(0, maxLength).trim();
};

const areaLabel = (p: ProjectSeoInput) =>
  formatAreaM2(p.area_m2) ?? "";

/** Só o que o cadastro diz: projeto ainda não executado não é "reforma". */
const titleNoun = (p: ProjectSeoInput) =>
  p.status === "em_projeto"
    ? "Projeto de interiores de apartamento"
    : p.status === "em_obra"
      ? "Reforma de apartamento em obra"
      : "Reforma de apartamento";

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

const placeLabel = (p: ProjectSeoInput) => (p.neighborhood || p.location || "").trim();

/**
 * Título do Google: o que interessa primeiro (reforma + metragem + bairro) e,
 * quando couber, o nome do projeto — nunca o código interno do negócio.
 */
export function projectSeoTitle(p: ProjectSeoInput | null | undefined): string {
  if (!p) return "Reforma de apartamento em São Paulo | Bewild";

  const explicit = stripProjectCode((p.seo_title || "").trim());
  // Título escrito à mão (sem o código gerado) e já com contexto de busca: respeita.
  if (explicit && explicit === (p.seo_title || "").trim() && hasSearchContext(explicit)) return explicit;

  const suffix = " | Bewild";
  const area = areaLabel(p);
  const place = placeLabel(p);
  const what = [titleNoun(p), area ? `de ${area}` : "", `em ${place || "São Paulo"}`]
    .filter(Boolean)
    .join(" ");
  let name = projectFriendlyName(p);
  // Bairro já aparece antes; repetir no nome só gasta espaço no resultado.
  if (place) {
    const rx = new RegExp(`\\s*[-–—]?\\s*${place.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
    name = name.replace(rx, "").trim() || name;
  }
  // Nome do projeto entra no fim, truncado, para cada URL ter um título único.
  const nameRoom = 78 - (what.length + 3 + suffix.length);
  if (name && nameRoom >= 8) return `${what} — ${truncateTitleBase(name, nameRoom)}${suffix}`;
  return `${truncateTitleBase(what, 78 - suffix.length)}${suffix}`;

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
  const base = projectSeoTitle(p);
  if (!p) return base;

  const group = peers.filter((o) => o.id !== p.id && projectSeoTitle(o) === base);
  if (group.length === 0) return base;

  const date = projectRegistrationDate(p.created_at);
  if (!date) return base;
  if (group.some((o) => projectRegistrationDate(o.created_at) === date)) return base;

  const suffix = " | Bewild";
  if (!base.endsWith(suffix)) return base;
  const dated = `${base.slice(0, -suffix.length)} (cadastro ${date})${suffix}`;
  if (dated.length <= DATED_TITLE_MAX) return dated;
  // Muito longo: mantém o nome inteiro e tira só a palavra "cadastro".
  const short = `${base.slice(0, -suffix.length)} (${date})${suffix}`;
  return short.length <= DATED_TITLE_MAX ? short : base;
}
