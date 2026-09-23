import { useEffect, useState } from "react";
import { carryCampaignParams } from "./campaignParams";

export type Route =
  | { name: "home"; anchor?: string }
  | { name: "portfolio" }
  | { name: "orcamento" }
  | { name: "faq" }
  | { name: "autorizacao-condominio" }
  | { name: "contato" }
  | { name: "escopo" }
  | { name: "como-funciona" }
  | { name: "onde-atuamos" }
  | { name: "reforma-apartamento-sp" }
  | { name: "reforma-studio-sp" }
  | { name: "reforma-cobertura-sp" }
  | { name: "marcenaria" }
  | { name: "parceiros" }
  | { name: "incorporadoras" }
  | { name: "indique-um-amigo" }
  | { name: "marcas-e-parcerias" }
  | { name: "guia-do-investidor" }
  | { name: "privacidade" }
  | { name: "bewild-project"; slug: string }
  | { name: "conteudos" }
  | { name: "bewild-post"; slug: string }
  | { name: "lp-obra" }
  | { name: "lp-panfleto" }

  | { name: "admin-login" }
  | { name: "admin-dashboard" }
  | { name: "admin-analytics" }
  | { name: "admin-seo" }
  | { name: "admin-seo-404" }
  | { name: "admin-indexacao" }
  | { name: "admin-rastreamento" }
  | { name: "admin-settings" }
  | { name: "admin-bewild" }
  | { name: "admin-bewild-new" }
  | { name: "admin-bewild-edit"; slug: string }
  | { name: "admin-faq" }
  | { name: "admin-typography" }
  | { name: "admin-leads" }
  | { name: "admin-indicacoes" }
  | { name: "admin-qualificacao" }
  | { name: "admin-mensagens" }
  | { name: "admin-diagnostico" }
  | { name: "admin-orcamentos" }
  | { name: "admin-projetos" }
  | { name: "admin-projetos-new" }
  | { name: "admin-projetos-edit"; slug: string }
  | { name: "admin-conteudos" }
  | { name: "admin-conteudos-new" }
  | { name: "admin-conteudos-edit"; slug: string }
  /** `path` diferencia uma 404 da outra (chave de rota / remount). */
  | { name: "not-found"; path?: string };

/**
 * Redirecionamentos legados, resolvidos ANTES do primeiro render e em toda
 * navegação SPA (antes eram um efeito pós-montagem: a 404 renderizava
 * primeiro, registrava um falso 404 em `seo_404_log` e piscava na tela).
 *  - `/admin` → `/admin/dashboard`
 *  - `/blog*` → `/conteudos*` (blog legado removido; URL canônica nova)
 *  - `/diagnostico` → `/orcamento` (página removida; o pedido de orçamento
 *    é a única entrada de lead)
 */
export function normalizeLegacyPath(pathname: string): string {
  if (/^\/admin\/?$/.test(pathname)) return "/admin/dashboard";
  const blog = pathname.match(/^\/blog(\/.*)?$/);
  if (blog) return "/conteudos" + (blog[1] && blog[1] !== "/" ? blog[1] : "");
  if (pathname === "/diagnostico") return "/orcamento";
  return pathname;
}

/** Aplica `normalizeLegacyPath` à parte de caminho de um href relativo. */
function normalizeLegacyHref(href: string): string {
  const cut = href.search(/[?#]/);
  const pathPart = cut === -1 ? href : href.slice(0, cut);
  const rest = cut === -1 ? "" : href.slice(cut);
  return normalizeLegacyPath(pathPart) + rest;
}

function parsePath(rawPath: string): Route {
  const path = normalizeLegacyPath(
    (rawPath.split("#")[0].split("?")[0] || "").replace(/\/+$/, "") || "/",
  );

  if (path === "/" || path === "") return { name: "home" };
  if (path === "/portfolio") return { name: "portfolio" };

  if (path === "/o") return { name: "lp-obra" };
  if (path === "/p") return { name: "lp-panfleto" };
  // Página de pedido de orçamento (entrega no mesmo canal do /contato).
  // /diagnostico foi removida e virou redirect legado para /orcamento.
  if (path === "/orcamento") return { name: "orcamento" };
  if (path === "/faq") return { name: "faq" };
  if (path === "/autorizacao-condominio") return { name: "autorizacao-condominio" };
  if (path === "/contato") return { name: "contato" };
  if (path === "/escopo") return { name: "escopo" };
  if (path === "/como-funciona") return { name: "como-funciona" };
  if (path === "/onde-atuamos") return { name: "onde-atuamos" };
  if (path === "/reforma-de-apartamento-sao-paulo") return { name: "reforma-apartamento-sp" };
  if (path === "/reforma-de-studio-sao-paulo") return { name: "reforma-studio-sp" };
  if (path === "/reforma-de-cobertura-sao-paulo") return { name: "reforma-cobertura-sp" };
  if (path === "/marcenaria") return { name: "marcenaria" };
  if (path === "/parceiros") return { name: "parceiros" };
  // Página atrás de flag (INCORPORADORAS_PAGE_ENABLED): o router decide entre
  // a página e a 404. A rota existe aqui para manter a paridade de rotas.
  if (path === "/parceiros/incorporadoras") return { name: "incorporadoras" };
  if (path === "/indique-um-amigo") return { name: "indique-um-amigo" };
  if (path === "/marcas-e-parcerias") return { name: "marcas-e-parcerias" };
  if (path === "/guia-do-investidor") return { name: "guia-do-investidor" };
  if (path === "/privacidade") return { name: "privacidade" };

  const bewildProjMatch = path.match(/^\/portfolio\/([a-z0-9-]+)$/);
  if (bewildProjMatch) return { name: "bewild-project", slug: bewildProjMatch[1] };

  // Conteúdos (público) — canônico (Bewild). Sem tags.
  if (path === "/conteudos") return { name: "conteudos" };
  const conteudosMatch = path.match(/^\/conteudos\/([a-z0-9-]+)$/);
  if (conteudosMatch) return { name: "bewild-post", slug: conteudosMatch[1] };

  // Admin
  if (path === "/admin/login") return { name: "admin-login" };
  if (path === "/admin/dashboard") return { name: "admin-dashboard" };
  if (path === "/admin/analytics") return { name: "admin-analytics" };
  if (path === "/admin/seo") return { name: "admin-seo" };
  if (path === "/admin/seo/404") return { name: "admin-seo-404" };
  if (path === "/admin/indexacao") return { name: "admin-indexacao" };
  if (path === "/admin/rastreamento") return { name: "admin-rastreamento" };
  if (path === "/admin/settings") return { name: "admin-settings" };
  if (path === "/admin/faq") return { name: "admin-faq" };
  if (path === "/admin/bewild") return { name: "admin-bewild" };
  if (path === "/admin/bewild/new") return { name: "admin-bewild-new" };
  const adminBewildEdit = path.match(/^\/admin\/bewild\/([a-z0-9-]+)$/);
  if (adminBewildEdit) return { name: "admin-bewild-edit", slug: adminBewildEdit[1] };
  if (path === "/admin/typography") return { name: "admin-typography" };
  if (path === "/admin/leads") return { name: "admin-leads" };
  if (path === "/admin/indicacoes") return { name: "admin-indicacoes" };
  if (path === "/admin/qualificacao") return { name: "admin-qualificacao" };
  if (path === "/admin/mensagens") return { name: "admin-mensagens" };
  if (path === "/admin/diagnostico") return { name: "admin-diagnostico" };
  // Alias pedido pelo dono: mesma página de submissões do /diagnostico.
  if (path === "/admin/orcamentos") return { name: "admin-orcamentos" };
  if (path === "/admin/projetos") return { name: "admin-projetos" };
  if (path === "/admin/projetos/novo") return { name: "admin-projetos-new" };
  const adminProjetosEdit = path.match(/^\/admin\/projetos\/([a-z0-9-]+)$/);
  if (adminProjetosEdit) return { name: "admin-projetos-edit", slug: adminProjetosEdit[1] };
  if (path === "/admin/conteudos/novo") return { name: "admin-conteudos-new" };
  const adminConteudosEdit = path.match(/^\/admin\/conteudos\/([a-z0-9-]+)$/);
  if (adminConteudosEdit) return { name: "admin-conteudos-edit", slug: adminConteudosEdit[1] };
  if (path === "/admin/conteudos") return { name: "admin-conteudos" };

  return { name: "not-found", path };
}

/**
 * Função pura: lê `window.location` e devolve a `Route`, sem efeitos.
 */
function parseLocation(): Route {
  const hash = window.location.hash.replace(/^#/, "");
  if (hash.startsWith("/")) {
    return parsePath(hash);
  }
  // Âncora pura (#foo): só vira home-anchor se já estamos na home.
  // Em outras rotas, preserva a rota atual e deixa o scroll nativo agir.
  const pathname = window.location.pathname || "/";
  if (hash && !hash.startsWith("/") && (pathname === "/" || pathname === "")) {
    return { name: "home", anchor: hash };
  }
  return parsePath(pathname);
}

/** Exportado para teste: resolve um caminho (com ou sem query) para a Route. */
export { parsePath as parseRoutePath };

/**
 * Chave estável da página exibida: `name`, mais o `slug` quando existe (troca
 * de post/projeto remonta a página) e o caminho no caso da 404 (cada URL
 * inexistente é uma página própria). Âncora e querystring não entram.
 */
export function routeKeyOf(route: Route): string {
  if ("slug" in route && route.slug) return `${route.name}:${route.slug}`;
  if (route.name === "not-found") return `not-found:${route.path ?? ""}`;
  return route.name;
}

export function isAdminRoute(route: Route): boolean {
  return route.name.startsWith("admin-");
}

function migrateLegacyHashIfNeeded(): void {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith("/")) return;
  window.history.replaceState(window.history.state, "", hash || "/");
}

function replaceLegacyPathIfNeeded(): void {
  const { pathname, search, hash } = window.location;
  const next = normalizeLegacyPath(pathname);
  if (next !== pathname) window.history.replaceState(window.history.state, "", next + search + hash);
}

/**
 * Reescreve a URL de entrada (hash-route legado `#/x`, `/blog*`, `/admin`)
 * com `replaceState`. Chamar antes do primeiro render. Idempotente.
 */
export function normalizeInitialUrl(): void {
  if (typeof window === "undefined") return;
  migrateLegacyHashIfNeeded();
  replaceLegacyPathIfNeeded();
}

const sameRoute = (a: Route, b: Route) => JSON.stringify(a) === JSON.stringify(b);

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseLocation());

  useEffect(() => {
    // Normalmente já feito pelo bootstrap (main.tsx); aqui por segurança.
    normalizeInitialUrl();
    // Mantém a identidade do objeto quando nada mudou: um objeto novo aqui
    // re-disparava os efeitos de rota do Root (page_view duplicado).
    setRoute((prev) => {
      const next = parseLocation();
      return sameRoute(prev, next) ? prev : next;
    });

    const onChange = () => {
      replaceLegacyPathIfNeeded();
      setRoute(parseLocation());
    };
    window.addEventListener("popstate", onChange);
    window.addEventListener("hashchange", onChange);
    window.addEventListener("lovable:navigate", onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("lovable:navigate", onChange);
    };
  }, []);

  return route;
}

// Helper para construir links de forma consistente — URLs limpas.
export const routes = {
  home: "/",
  portfolio: "/portfolio",
  orcamento: "/orcamento",
  faq: "/faq",
  autorizacaoCondominio: "/autorizacao-condominio",
  contato: "/contato",
  escopo: "/escopo",
  comoFunciona: "/como-funciona",
  ondeAtuamos: "/onde-atuamos",
  reformaApartamentoSp: "/reforma-de-apartamento-sao-paulo",
  reformaStudioSp: "/reforma-de-studio-sao-paulo",
  reformaCoberturaSp: "/reforma-de-cobertura-sao-paulo",
  marcenaria: "/marcenaria",
  parceiros: "/parceiros",
  incorporadoras: "/parceiros/incorporadoras",
  indiqueUmAmigo: "/indique-um-amigo",
  marcasEParcerias: "/marcas-e-parcerias",
  guiaDoInvestidor: "/guia-do-investidor",
  privacidade: "/privacidade",
  bewildProject: (slug: string) => `/portfolio/${slug}`,
  blog: "/conteudos",
  conteudos: "/conteudos",
  conteudosPost: (slug: string) => `/conteudos/${slug}`,
  adminLogin: "/admin/login",
  adminDashboard: "/admin/dashboard",
  adminAnalytics: "/admin/analytics",
  adminSeo: "/admin/seo",
  adminSeo404: "/admin/seo/404",
  adminIndexacao: "/admin/indexacao",
  adminRastreamento: "/admin/rastreamento",
  adminSettings: "/admin/settings",
  adminFaq: "/admin/faq",
  adminTypography: "/admin/typography",
  adminLeads: "/admin/leads",
  adminIndicacoes: "/admin/indicacoes",
  adminQualificacao: "/admin/qualificacao",
  adminMensagens: "/admin/mensagens",
  adminOrcamentos: "/admin/orcamentos",
  adminDiagnostico: "/admin/diagnostico",
  lpObra: "/o",
  lpPanfleto: "/p",
};

// ---------------------------------------------------------------------------
// Memória de rolagem (Voltar/Avançar)
// ---------------------------------------------------------------------------
//
// `history.scrollRestoration = "manual"`: a troca de página da SPA acontece
// no meio de um fade (main.tsx), depois que o navegador já teria restaurado
// a posição — e com a página errada no DOM. A posição de cada entrada fica em
// `history.state` (gravada ao parar de rolar, antes de navegar e no
// `pagehide`) e o Root a reaplica depois que a página exibida monta.

const SCROLL_STATE_KEY = "__bwScrollY";
let scrollSaveTimer: number | undefined;
let scrollMemoryInstalled = false;

function cancelPendingScrollSave(): void {
  if (scrollSaveTimer !== undefined) window.clearTimeout(scrollSaveTimer);
  scrollSaveTimer = undefined;
}

/** Grava a rolagem atual no `history.state` da entrada corrente. */
export function saveScrollPosition(): void {
  try {
    const state = window.history.state;
    const base = state && typeof state === "object" ? (state as Record<string, unknown>) : {};
    window.history.replaceState({ ...base, [SCROLL_STATE_KEY]: Math.round(window.scrollY) }, "");
  } catch {
    /* Safari limita replaceState em rajada — perder uma posição é aceitável */
  }
}

/** Posição salva na entrada corrente do histórico (ou `null`). */
export function readSavedScroll(): number | null {
  try {
    const state = window.history.state as Record<string, unknown> | null;
    const v = state && typeof state === "object" ? state[SCROLL_STATE_KEY] : undefined;
    return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
  } catch {
    return null;
  }
}

export function installScrollMemory(): void {
  if (typeof window === "undefined" || scrollMemoryInstalled) return;
  scrollMemoryInstalled = true;
  try {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  } catch {
    /* navegador sem suporte: fica o comportamento nativo */
  }
  window.addEventListener(
    "scroll",
    () => {
      cancelPendingScrollSave();
      // Debounce (e não throttle): uma escrita por gesto, bem abaixo do
      // limite de replaceState do Safari.
      scrollSaveTimer = window.setTimeout(saveScrollPosition, 150);
    },
    { passive: true },
  );
  // Um save pendente da página que ficou para trás não pode cair na entrada
  // para a qual o usuário acabou de voltar.
  window.addEventListener("popstate", cancelPendingScrollSave);
  window.addEventListener("pagehide", saveScrollPosition);
}

const USER_SCROLL_EVENTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/**
 * Repete `step` a cada frame até ele devolver `true`, estourar `timeoutMs` ou
 * o usuário interagir (nunca "puxa" a página de volta contra a vontade dele).
 * Devolve a função que cancela.
 */
function retryEachFrame(step: () => boolean, timeoutMs: number): () => void {
  if (step()) return () => undefined;
  const started = Date.now();
  let raf = 0;
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.cancelAnimationFrame(raf);
    USER_SCROLL_EVENTS.forEach((ev) => window.removeEventListener(ev, stop));
  };
  USER_SCROLL_EVENTS.forEach((ev) => window.addEventListener(ev, stop, { passive: true }));
  const tick = () => {
    if (stopped) return;
    if (step() || Date.now() - started > timeoutMs) {
      stop();
      return;
    }
    raf = window.requestAnimationFrame(tick);
  };
  raf = window.requestAnimationFrame(tick);
  return stop;
}

/**
 * Restaura a rolagem `y`, tentando por alguns frames enquanto o conteúdo
 * cresce (ex.: lista do portfólio chegando do banco).
 */
export function restoreScrollPosition(y: number, timeoutMs = 2500): () => void {
  return retryEachFrame(() => {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: Math.min(y, max), left: 0, behavior: "auto" });
    return max >= y - 1;
  }, timeoutMs);
}

/**
 * Rola até o alvo de `location.hash` (deep link `/guia-do-investidor#faq`),
 * esperando algumas frações de segundo por seções montadas tardiamente
 * (chunks lazy, conteúdo vindo do banco). Hash de rota legado (`#/x`) e hash
 * vazio são ignorados. Devolve a função que cancela.
 */
export function scrollToHashTarget(timeoutMs = 3000): () => void {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw || raw.startsWith("/")) return () => undefined;
  let id = raw;
  try {
    id = decodeURIComponent(raw);
  } catch {
    /* hash malformado: tenta literal */
  }
  return retryEachFrame(() => {
    const el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: "auto", block: "start" });
    return true;
  }, timeoutMs);
}

// Navega programaticamente sem recarregar a página. Preserva o hash quando
// presente (ex.: "/#certeza" a partir de uma página interna); o Root
// (main.tsx) rola até a seção — ou volta ao topo — quando a página nova monta.
// `replace: true` substitui a entrada atual (redirecionamentos: o Voltar não
// pode devolver o usuário para a URL que redireciona de novo).
export function navigate(href: string, opts: { replace?: boolean } = {}) {
  const cleaned = href.startsWith("#") ? href.slice(1) : href;
  // Navegação interna carrega utm_*/gclid/fbclid da URL atual, para que o
  // lead enviado em /orcamento mantenha a origem da campanha.
  const target = carryCampaignParams(
    normalizeLegacyHref(cleaned.startsWith("/") ? cleaned : `/${cleaned}`),
    window.location.search,
  );
  // A posição da página que fica para trás vai para o histórico dela.
  cancelPendingScrollSave();
  saveScrollPosition();
  if (opts.replace) window.history.replaceState({}, "", target);
  else window.history.pushState({}, "", target);
  window.dispatchEvent(new Event("lovable:navigate"));
}

/**
 * Resolve o `event.target` para o Element mais próximo que responda a
 * `closest`. `event.target` é tipado como `EventTarget` e nem sempre é um
 * Element: em eventos sintéticos despachados direto no `document` (comum em
 * bots, extensões e WebViews instrumentadas) ele é o próprio `Document`, que
 * não tem `closest` — daí o `b.closest is not a function` registrado 26 vezes
 * em `crash_reports`. Nós de texto sobem para o `parentElement`.
 *
 * Exportado para teste. Ver FE-01 em docs/auditoria/rodada-2026-09-22.md.
 */
export function closestElementFrom(target: EventTarget | null): Element | null {
  let node: unknown = target;
  // Text/Comment node → sobe para o elemento que o contém.
  if (node && typeof node === "object" && "nodeType" in node) {
    const n = node as Node;
    if (n.nodeType !== 1) node = (n as { parentElement?: Element | null }).parentElement ?? null;
  }
  if (!node) return null;
  const el = node as { closest?: unknown };
  return typeof el.closest === "function" ? (node as Element) : null;
}

// Intercepta cliques em <a href="/..."> internos para usar pushState
export function installLinkInterceptor() {
  if (typeof window === "undefined") return;
  if ((window as unknown as { __linkInterceptorInstalled?: boolean }).__linkInterceptorInstalled) {
    return;
  }
  (window as unknown as { __linkInterceptorInstalled?: boolean }).__linkInterceptorInstalled = true;

  document.addEventListener("click", (e) => {
    const me = e as MouseEvent;
    if (me.defaultPrevented) return;
    if (me.button !== 0) return;
    if (me.metaKey || me.ctrlKey || me.shiftKey || me.altKey) return;

    const target = closestElementFrom(me.target)?.closest("a");
    if (!target) return;
    const a = target as HTMLAnchorElement;
    if (!a.href) return;
    if (a.target && a.target !== "_self") return;
    if (a.hasAttribute("download")) return;
    const rel = a.getAttribute("rel");
    if (rel && rel.includes("external")) return;

    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return;

    const href = a.getAttribute("href") || "";

    if (href.startsWith("#")) return;

    if (url.hash && url.hash.startsWith("#/")) {
      e.preventDefault();
      navigate(url.hash.slice(1));
      return;
    }

    if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
      if (/\.[a-z0-9]+$/i.test(url.pathname)) return;
      e.preventDefault();
      navigate(url.pathname + url.search + url.hash);
    }
  });
}
