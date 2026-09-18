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
  short_stay: "Studio para short stay",
  turn_key: "Apartamento reformado turn-key",
};

const LOCAL_DESCRIPTION =
  "Arquitetura em São Paulo-SP e projetos de reforma em São Paulo pela Bewild.";

const hasLocalContext = (value: string) =>
  /s[aã]o paulo|\bsp\b/i.test(value) && /arquitetura|reforma/i.test(value);

export function projectSeoTitle(p: ProjectSeoInput | null | undefined): string {
  if (!p) return "Projeto de reforma em São Paulo | Bewild";
  const explicit = (p.seo_title || "").trim();
  if (explicit && hasLocalContext(explicit)) return explicit;

  const base = explicit || (p.title || "Projeto").trim();
  return `${base} | Projeto de reforma em São Paulo | Bewild`;
}

export function projectMetaDescription(
  p: ProjectSeoInput | null | undefined,
  fallback: string,
): string {
  if (!p) return fallback;
  const explicit = (p.seo_description || p.summary || "").trim();
  if (explicit) return hasLocalContext(explicit) ? explicit : `${explicit} ${LOCAL_DESCRIPTION}`;

  const noun = (p.project_type && TYPE_NOUN[p.project_type]) || "Apartamento reformado";
  const area =
    typeof p.area_m2 === "number" && Number.isFinite(p.area_m2) && p.area_m2 > 0
      ? `${Math.round(p.area_m2)} m²`
      : "";
  const bairro = (p.neighborhood || p.location || "").trim();

  if (!area && !bairro) return `${fallback} ${LOCAL_DESCRIPTION}`;

  const parts = [noun];
  if (area) parts.push(`de ${area}`);
  if (bairro) parts.push(`em ${bairro}, São Paulo-SP`);
  return `${parts.join(" ")}. ${LOCAL_DESCRIPTION}`;
}
