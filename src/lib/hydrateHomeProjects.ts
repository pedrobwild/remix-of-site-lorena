/**
 * hydrateHomeProjects — troca os 3 cards estáticos da seção "Projetos" da home
 * por um slider em loop infinito com os 6 projetos publicados MAIS ACESSADOS
 * (visitas em /portfolio/:slug nos últimos 90 dias), via RPC `top_projects`.
 *
 * A lista é congelada por 7 dias (cache em localStorage): o ranking só é
 * atualizado quando o cache expira, para a home não mudar todo dia.
 *
 * Só substitui o markup se houver ao menos 3 itens válidos — caso contrário,
 * os cards estáticos permanecem como fallback.
 */
import { supabase } from "@/integrations/supabase/client";
import { devWarn } from "@/lib/devLog";

type TopProject = {
  slug: string;
  title: string;
  cover_url: string | null;
  project_type: string | null;
  neighborhood: string | null;
  location: string | null;
  area_m2: number | null;
  duration: string | null;
  views: number;
};

const TYPE_LABEL: Record<string, string> = {
  short_stay: "Short stay",
  turn_key: "Turn-key",
  planta: "Planta",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const AREA_FORMAT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** "27,5 m²" (pt-BR) — antes saía "27.5 m²". `null` para área ausente/inválida. */
export function formatAreaM2(area: number | null | undefined): string | null {
  if (typeof area !== "number" || !Number.isFinite(area) || area <= 0) return null;
  return `${AREA_FORMAT.format(area)} m²`;
}

function cardHtml(p: TopProject): string {
  const where = p.neighborhood || p.location || "São Paulo";
  const meta = [
    formatAreaM2(p.area_m2),
    p.project_type ? (TYPE_LABEL[p.project_type] ?? "Reforma completa") : "Reforma completa",
    where,
  ]
    .filter(Boolean)
    .join(" · ");

  return `<article class="bwa-pgrid-card">
      <a href="/portfolio/${esc(p.slug)}" aria-label="Ver projeto ${esc(p.title)}">
        <span class="bwa-pgrid-media"><img src="${esc(p.cover_url ?? "")}" alt="${esc(p.title)} — ${esc(where)}" loading="lazy" decoding="async"></span>
        <span class="bwa-pgrid-meta">
          <strong>${esc(p.title)}</strong>
          <span class="bwa-pgrid-data">${esc(meta)}</span>
          <span class="bwa-pgrid-link">ver projeto →</span>
        </span>
      </a>
    </article>`;
}

export async function hydrateHomeProjects(): Promise<void> {
  const grid = document.querySelector<HTMLElement>(".bwa-pgrid");
  if (!grid) return;

  try {
    const { data, error } = await supabase.rpc("top_projects", { p_limit: 3, p_days: 90 });
    if (error) {
      devWarn("[hydrateHomeProjects] rpc falhou:", error);
      return;
    }
    const items = ((data ?? []) as TopProject[]).filter((p) => !!p.cover_url && !!p.slug);
    if (items.length < 3) return; // mantém o fallback estático

    grid.innerHTML = items.map(cardHtml).join("\n");
  } catch (err) {
    devWarn("[hydrateHomeProjects] erro inesperado:", err);
  }
}
