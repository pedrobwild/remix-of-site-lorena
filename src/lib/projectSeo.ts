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
  typeof p.area_m2 === "number" && Number.isFinite(p.area_m2) && p.area_m2 > 0
    ? `${Math.round(p.area_m2)} m²`
    : "";

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
  const what = ["Reforma de apartamento", area ? `de ${area}` : "", `em ${place || "São Paulo"}`]
    .filter(Boolean)
    .join(" ");
  const name = projectFriendlyName(p);
  const withName = `${what} — ${name}${suffix}`;
  if (name && withName.length <= 65) return withName;
  return `${truncateTitleBase(what, 65 - suffix.length)}${suffix}`;
}

export function projectMetaDescription(
  p: ProjectSeoInput | null | undefined,
  fallback: string,
): string {
  if (!p) return fallback;
  const raw = stripProjectCode((p.seo_description || p.summary || "").trim());
  // "GO BALKON: reforma de…" → o nome do projeto já está no título, sai da descrição.
  const explicit = stripProjectCode(raw.replace(/^[^.:]{1,60}:\s*/, ""));

  if (explicit) {
    const sentence = explicit.charAt(0).toUpperCase() + explicit.slice(1);
    return hasSearchContext(sentence) ? sentence : `${sentence} ${LOCAL_DESCRIPTION}`;
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

