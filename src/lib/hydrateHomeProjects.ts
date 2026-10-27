/**
 * hydrateHomeProjects — troca os 3 cards estáticos da seção "Projetos" da home
 * por um slider com os 6 projetos publicados MAIS ACESSADOS (visitas em
 * /portfolio/:slug nos últimos 90 dias), via RPC `top_projects`.
 *
 * Desktop: loop infinito automático (pausa no hover/foco). Celular e tablet em
 * pé (até 820 px, relatório mobile de 27/10/2026): arraste manual com encaixe
 * de card, parte do próximo card visível e indicador de posição — parar,
 * observar e abrir um projeto específico sem correr atrás do trilho. Nada é
 * duplicado nessa versão (o loop duplicava a lista com `aria-hidden`).
 *
 * A lista é congelada por 7 dias (cache em localStorage): o ranking só é
 * atualizado quando o cache expira, para a home não mudar todo dia.
 *
 * Só substitui o markup se houver ao menos 3 itens válidos — caso contrário,
 * os cards estáticos permanecem como fallback.
 */
import { supabase } from "@/integrations/supabase/client";
import { devWarn } from "@/lib/devLog";
import { formatAreaM2 } from "@/lib/formatArea";
import { optimizedImageUrl, optimizedSrcSet } from "@/lib/imageUrl";
import { projectFriendlyName } from "@/lib/projectSeo";
import { scrollBehavior } from "@/lib/reducedMotion";

/**
 * Larguras da capa nos cards da home: o slider usa 78vw no celular e até
 * 320 px no desktop (home-bwa.css, .bwa-pslider-track .bwa-pgrid-card).
 * As capas originais do bucket são PNG de ~2,7 MB (até ~11 MB): o card pede
 * a versão redimensionada do endpoint de render, como o /portfolio já faz.
 */
const CARD_WIDTHS = [480, 640, 960] as const;
const CARD_SIZES = "(max-width: 820px) 78vw, 400px";

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

export { formatAreaM2 };

function cardHtml(p: TopProject): string {
  const where = p.neighborhood || p.location || "São Paulo";
  // Nome sem o código interno do cliente ("AB - …"), como no <title> do projeto.
  const name = projectFriendlyName(p) || p.title;
  const cover = p.cover_url ?? "";
  const srcset = cover ? optimizedSrcSet(cover, CARD_WIDTHS) : undefined;
  const srcsetAttrs = srcset ? ` srcset="${esc(srcset)}" sizes="${CARD_SIZES}"` : "";
  const meta = [
    formatAreaM2(p.area_m2),
    p.project_type ? (TYPE_LABEL[p.project_type] ?? "Reforma completa") : "Reforma completa",
    where,
  ]
    .filter(Boolean)
    .join(" · ");

  return `<article class="bwa-pgrid-card">
      <a href="/portfolio/${esc(p.slug)}" aria-label="Ver projeto ${esc(name)}">
        <span class="bwa-pgrid-media"><img src="${esc(cover ? optimizedImageUrl(cover, 640) : "")}"${srcsetAttrs} alt="${esc(name)} — ${esc(where)}" loading="lazy" decoding="async"></span>
        <span class="bwa-pgrid-meta">
          <strong>${esc(name)}</strong>
          <span class="bwa-pgrid-data">${esc(meta)}</span>
          <span class="bwa-pgrid-link">ver projeto →</span>
        </span>
      </a>
    </article>`;
}

const CACHE_KEY = "bwa:home-projects:v1";
/** 7 dias: o ranking exibido na home só muda quando este prazo vence. */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function readCache(): TopProject[] | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts?: number; items?: TopProject[] };
    if (!parsed || typeof parsed.ts !== "number" || !Array.isArray(parsed.items)) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.items;
  } catch {
    return null;
  }
}

function writeCache(items: TopProject[]): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items }));
  } catch {
    /* modo privado / cota cheia: segue sem cache */
  }
}

/** Mesma largura em que o CSS troca a grade de 3 colunas pela coluna única. */
const MANUAL_SLIDER_QUERY = "(max-width: 820px)";

function isManualSlider(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(MANUAL_SLIDER_QUERY).matches;
}

/** Slider em loop infinito (desktop): a lista é duplicada e o trilho corre metade da largura. */
function renderLoopSlider(grid: HTMLElement, items: TopProject[]): void {
  const cards = items.map(cardHtml).join("\n");
  grid.classList.add("bwa-pslider");
  grid.innerHTML = `<div class="bwa-pslider-track" style="--bwa-pslider-count:${items.length}">${cards}\n${cards.replace(
    /<article class="bwa-pgrid-card">/g,
    '<article class="bwa-pgrid-card" aria-hidden="true">',
  )}</div>`;
  grid.querySelectorAll<HTMLElement>('[aria-hidden="true"] a').forEach((a) => {
    a.setAttribute("tabindex", "-1");
  });
}

/**
 * Carrossel manual (celular): trilho rolável com scroll-snap e uma barra de
 * posição com um botão por projeto. A barra fica FORA do trilho rolável, logo
 * abaixo dele, para o alvo de toque (44 px) não concorrer com o arraste.
 * O botão ativo leva `aria-current="true"` e o texto diz "Projeto N de M".
 */
function renderManualSlider(grid: HTMLElement, items: TopProject[]): void {
  const cards = items.map(cardHtml).join("\n");
  grid.classList.add("bwa-pslider", "bwa-pslider--manual");
  grid.setAttribute("aria-roledescription", "carrossel");
  grid.innerHTML = `<div class="bwa-pslider-track" style="--bwa-pslider-count:${items.length}">${cards}</div>`;

  // Idempotente: em dev o efeito da home roda duas vezes (StrictMode) e a
  // barra de posição não pode ser inserida em dobro.
  grid.parentElement?.querySelectorAll(".bwa-pslider-nav").forEach((old) => old.remove());
  const nav = document.createElement("div");
  nav.className = "bwa-shell bwa-pslider-nav";
  nav.setAttribute("role", "group");
  nav.setAttribute("aria-label", "Posição no carrossel de projetos");
  nav.innerHTML = items
    .map(
      (_, i) =>
        `<button type="button" class="bwa-pslider-dot"${i === 0 ? ' aria-current="true"' : ""}><span class="sr-only">Projeto ${i + 1} de ${items.length}</span></button>`,
    )
    .join("");
  grid.insertAdjacentElement("afterend", nav);

  const track = grid.querySelector<HTMLElement>(".bwa-pslider-track");
  const cardEls = Array.from(grid.querySelectorAll<HTMLElement>(".bwa-pgrid-card"));
  const dots = Array.from(nav.querySelectorAll<HTMLButtonElement>(".bwa-pslider-dot"));
  if (!track || !cardEls.length) return;

  const setActive = (index: number) => {
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  };

  // Card ativo = o que está mais perto da borda esquerda da área visível.
  let frame = 0;
  const onScroll = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      const left = grid.scrollLeft;
      let best = 0;
      let bestDist = Infinity;
      cardEls.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft - track.offsetLeft - left);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    });
  };
  grid.addEventListener("scroll", onScroll, { passive: true });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      const card = cardEls[i];
      if (!card) return;
      grid.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: scrollBehavior() });
      setActive(i);
    });
  });
}

function renderSlider(grid: HTMLElement, items: TopProject[]): void {
  if (isManualSlider()) renderManualSlider(grid, items);
  else renderLoopSlider(grid, items);
}

export async function hydrateHomeProjects(): Promise<void> {
  const grid = document.querySelector<HTMLElement>(".bwa-pgrid");
  if (!grid) return;

  const cached = readCache();
  if (cached && cached.length >= 3) {
    renderSlider(grid, cached);
    return;
  }

  try {
    const { data, error } = await supabase.rpc("top_projects", { p_limit: 6, p_days: 90 });
    if (error) {
      devWarn("[hydrateHomeProjects] rpc falhou:", error);
      return;
    }
    const items = ((data ?? []) as TopProject[]).filter((p) => !!p.cover_url && !!p.slug).slice(0, 6);
    if (items.length < 3) return; // mantém o fallback estático

    writeCache(items);
    renderSlider(grid, items);
  } catch (err) {
    devWarn("[hydrateHomeProjects] erro inesperado:", err);
  }
}
