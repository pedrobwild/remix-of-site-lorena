/**
 * Marcenaria na home: a mesma grade de referências do Catálogo Bwild que o
 * orçamento público (Bwild Engine) mostra, por cômodo.
 *
 * Leitura pública, somente leitura, direto no PostgREST do projeto do
 * catálogo com a chave anon (publicável por natureza: é a mesma que o
 * orçamento público e o próprio catalogobewild.com já expõem no navegador).
 * Nada do site sai daqui; só lemos `catalog_items` / `subcategories`.
 * Sem client do supabase-js: um `fetch` com timeout, cache por cômodo e
 * carregamento só quando a seção se aproxima da tela.
 */
export const CATALOG_URL = "https://umejnulhkmwyewepkdsl.supabase.co";
const CATALOG_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtZWpudWxoa213eWV3ZXBrZHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMDMyNDUsImV4cCI6MjA5ODg3OTI0NX0.Po1C96qq_sJ8VwV91xgepei_xspvLHU6_HsESmsKC3A";

export const CATALOG_FULL_URL = "https://catalogobewild.com";

export const CATALOG_ROOMS = [
  { slug: "sala", label: "Sala" },
  { slug: "cozinha", label: "Cozinha" },
  { slug: "dormitorio", label: "Dormitório" },
  { slug: "banheiros", label: "Banheiros" },
  { slug: "armarios-abertos", label: "Armários abertos" },
] as const;

export type CatalogRoomSlug = (typeof CATALOG_ROOMS)[number]["slug"];

export type CatalogItem = { id: string; image_url: string; caption: string | null };

const TIMEOUT_MS = 15000;
const STORAGE_OBJECT_PATH = "/storage/v1/object/public/";
const STORAGE_RENDER_PATH = "/storage/v1/render/image/public/";

/** Página de um cômodo no catálogo (abre em nova aba). */
export function catalogRoomUrl(slug: string): string {
  return `${CATALOG_FULL_URL}/modulos/${slug}`;
}

/**
 * Miniatura 4:3 via transformação de imagem do Storage (mesma regra do
 * catálogo). URLs fora do Storage voltam intactas.
 */
export function catalogThumbnailUrl(url: string, width = 800, height = 600): string {
  if (!url || !url.includes(STORAGE_OBJECT_PATH)) return url;
  const rendered = url.replace(STORAGE_OBJECT_PATH, STORAGE_RENDER_PATH);
  const sep = rendered.includes("?") ? "&" : "?";
  return `${rendered}${sep}width=${width}&height=${height}&resize=cover&quality=75`;
}

/** Normaliza a resposta do PostgREST; linhas sem imagem são descartadas. */
export function parseCatalogItems(raw: unknown): CatalogItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CatalogItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = r.id == null ? "" : String(r.id);
    const image = typeof r.image_url === "string" ? r.image_url.trim() : "";
    if (!id || !image) continue;
    const caption = typeof r.caption === "string" && r.caption.trim() ? r.caption.trim() : null;
    out.push({ id, image_url: image, caption });
  }
  return out;
}

async function getJson(path: string, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(`${CATALOG_URL}/rest/v1/${path}`, {
    signal,
    headers: {
      apikey: CATALOG_ANON_KEY,
      Authorization: `Bearer ${CATALOG_ANON_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Catálogo respondeu ${res.status}`);
  return res.json();
}

/**
 * Até `limit` itens do cômodo, com uma nova tentativa automática quando a
 * primeira falha (rede instável / cold start do catálogo).
 */
export async function fetchCatalogItems(slug: string, limit = 6): Promise<CatalogItem[]> {
  try {
    return await fetchCatalogItemsOnce(slug, limit);
  } catch {
    await new Promise((r) => setTimeout(r, 900));
    return fetchCatalogItemsOnce(slug, limit);
  }
}

/** Uma tentativa. Lança em erro de rede/HTTP. */
async function fetchCatalogItemsOnce(slug: string, limit = 6): Promise<CatalogItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const order = "order=sort_order.asc.nullslast,created_at.asc";
  const s = encodeURIComponent(slug);
  try {
    try {
      const raw = await getJson(
        `catalog_items?select=id,image_url,caption,sort_order,subcategories!inner(slug)&subcategories.slug=eq.${s}&${order}&limit=${limit}`,
        controller.signal,
      );
      return parseCatalogItems(raw);
    } catch {
      // Fallback sem embed `!inner` (FK ausente/renomeada): 2 requests.
      const subs = await getJson(`subcategories?select=id&slug=eq.${s}&limit=1`, controller.signal);
      const subId = Array.isArray(subs) && subs.length > 0 ? (subs[0] as { id?: string | number }).id : null;
      if (subId == null) return [];
      const raw = await getJson(
        `catalog_items?select=id,image_url,caption,sort_order&subcategory_id=eq.${encodeURIComponent(String(subId))}&${order}&limit=${limit}`,
        controller.signal,
      );
      return parseCatalogItems(raw);
    }
  } finally {
    clearTimeout(timer);
  }
}

type Cleanup = () => void;

function renderItems(grid: HTMLElement, items: CatalogItem[], roomLabel: string) {
  grid.replaceChildren();
  for (const item of items) {
    const fig = document.createElement("figure");
    fig.className = "bwa-marcenaria-item";
    const img = document.createElement("img");
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 800;
    img.height = 600;
    img.alt = item.caption || `Referência de marcenaria Bewild — ${roomLabel}`;
    img.src = catalogThumbnailUrl(item.image_url);
    img.addEventListener(
      "error",
      () => {
        if (img.src !== item.image_url) img.src = item.image_url;
      },
      { once: true },
    );
    fig.appendChild(img);
    if (item.caption) {
      const cap = document.createElement("figcaption");
      cap.textContent = item.caption;
      fig.appendChild(cap);
    }
    grid.appendChild(fig);
  }
}

function renderSkeleton(grid: HTMLElement, n = 6) {
  grid.replaceChildren();
  for (let i = 0; i < n; i++) {
    const ph = document.createElement("div");
    ph.className = "bwa-marcenaria-ph";
    ph.setAttribute("aria-hidden", "true");
    grid.appendChild(ph);
  }
}

/**
 * Liga a seção `[data-catalog]` da home: abas por cômodo, grade de
 * miniaturas carregada quando a seção se aproxima da tela, cache por cômodo
 * e mensagem honesta quando o catálogo não responde.
 */
export function installCatalogPreview(root: HTMLElement): Cleanup {
  const section = root.querySelector<HTMLElement>("[data-catalog]");
  const grid = section?.querySelector<HTMLElement>("[data-catalog-grid]");
  const status = section?.querySelector<HTMLElement>("[data-catalog-status]");
  const tabs = section ? Array.from(section.querySelectorAll<HTMLButtonElement>("[data-catalog-room]")) : [];
  if (!section || !grid || tabs.length === 0) return () => {};

  const cache = new Map<string, Promise<CatalogItem[]>>();
  let active = tabs.find((t) => t.getAttribute("aria-selected") === "true")?.dataset.catalogRoom ?? tabs[0].dataset.catalogRoom!;
  let started = false;
  let disposed = false;

  const labelOf = (slug: string) => tabs.find((t) => t.dataset.catalogRoom === slug)?.textContent?.trim() || slug;

  const show = async (slug: string) => {
    const roomLabel = labelOf(slug);
    if (!cache.has(slug)) {
      renderSkeleton(grid);
      if (status) status.textContent = "";
      cache.set(slug, fetchCatalogItems(slug, 6));
    }
    try {
      const items = await cache.get(slug)!;
      if (disposed || active !== slug) return;
      if (items.length === 0) {
        grid.replaceChildren();
        if (status) status.textContent = `Ainda não há referências publicadas em ${roomLabel.toLowerCase()}.`;
        return;
      }
      renderItems(grid, items, roomLabel);
      if (status) status.textContent = "";
    } catch {
      cache.delete(slug);
      if (disposed || active !== slug) return;
      grid.replaceChildren();
      if (status) status.textContent = `As referências de ${roomLabel.toLowerCase()} não carregaram agora. Abra o catálogo completo.`;
    }
  };

  const select = (slug: string) => {
    active = slug;
    for (const t of tabs) {
      const on = t.dataset.catalogRoom === slug;
      t.setAttribute("aria-selected", on ? "true" : "false");
    }
    const link = section.querySelector<HTMLAnchorElement>("[data-catalog-open]");
    if (link) link.href = catalogRoomUrl(slug);
    void show(slug);
  };

  const onClick = (e: Event) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-catalog-room]");
    if (!btn || !btn.dataset.catalogRoom) return;
    started = true;
    select(btn.dataset.catalogRoom);
  };
  section.addEventListener("click", onClick);

  const start = () => {
    if (started) return;
    started = true;
    select(active);
  };

  let io: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          start();
          io?.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(section);
  } else {
    start();
  }

  return () => {
    disposed = true;
    io?.disconnect();
    section.removeEventListener("click", onClick);
  };
}
