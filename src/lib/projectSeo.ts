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
  area_m2?: number | null;
  project_type?: string | null;
  seo_description?: string | null;
  summary?: string | null;
};

const TYPE_NOUN: Record<string, string> = {
  short_stay: "Studio para short stay",
  turn_key: "Apartamento reformado turn-key",
};

const CLOSING = "Projeto, obra, marcenaria e mobiliário em um único contrato pela Bewild.";

export function projectMetaDescription(
  p: ProjectSeoInput | null | undefined,
  fallback: string,
): string {
  if (!p) return fallback;
  const explicit = (p.seo_description || p.summary || "").trim();
  if (explicit) return explicit;

  const noun = (p.project_type && TYPE_NOUN[p.project_type]) || "Apartamento reformado";
  const area =
    typeof p.area_m2 === "number" && Number.isFinite(p.area_m2) && p.area_m2 > 0
      ? `${Math.round(p.area_m2)} m²`
      : "";
  const bairro = (p.neighborhood || "").trim();

  if (!area && !bairro) return fallback;

  const parts = [noun];
  if (area) parts.push(`de ${area}`);
  if (bairro) parts.push(`em ${bairro}, São Paulo`);
  return `${parts.join(" ")}. ${CLOSING}`;
}
