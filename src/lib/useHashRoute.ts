import { useEffect, useState } from "react";
import { carryCampaignParams } from "./campaignParams";

export type Route =
  | { name: "home"; anchor?: string }
  | { name: "portfolio" }
  | { name: "diagnostico" }
  | { name: "orcamento" }
  | { name: "faq" }
  | { name: "autorizacao-condominio" }
  | { name: "contato" }
  | { name: "escopo" }
  | { name: "como-funciona" }
  | { name: "onde-atuamos" }
  | { name: "parceiros" }
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
  | { name: "admin-settings" }
  | { name: "admin-bewild" }
  | { name: "admin-bewild-new" }
  | { name: "admin-bewild-edit"; slug: string }
  | { name: "admin-faq" }
  | { name: "admin-typography" }
  | { name: "admin-leads" }
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
  | { name: "not-found" };

function parsePath(rawPath: string): Route {
  const path = (rawPath.split("?")[0] || "").replace(/\/+$/, "") || "/";

  if (path === "/" || path === "") return { name: "home" };
  if (path === "/portfolio") return { name: "portfolio" };

  if (path === "/o") return { name: "lp-obra" };
  if (path === "/p") return { name: "lp-panfleto" };
  if (path === "/diagnostico") return { name: "diagnostico" };
  // Página real de pedido de orçamento (entrega no mesmo canal do /contato).
  if (path === "/orcamento") return { name: "orcamento" };
  if (path === "/faq") return { name: "faq" };
  if (path === "/autorizacao-condominio") return { name: "autorizacao-condominio" };
  if (path === "/contato") return { name: "contato" };
  if (path === "/escopo") return { name: "escopo" };
  if (path === "/como-funciona") return { name: "como-funciona" };
  if (path === "/onde-atuamos") return { name: "onde-atuamos" };
  if (path === "/parceiros") return { name: "parceiros" };
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
  if (path === "/admin/settings") return { name: "admin-settings" };
  if (path === "/admin/faq") return { name: "admin-faq" };
  if (path === "/admin/bewild") return { name: "admin-bewild" };
  if (path === "/admin/bewild/new") return { name: "admin-bewild-new" };
  const adminBewildEdit = path.match(/^\/admin\/bewild\/([a-z0-9-]+)$/);
  if (adminBewildEdit) return { name: "admin-bewild-edit", slug: adminBewildEdit[1] };
  if (path === "/admin/typography") return { name: "admin-typography" };
  if (path === "/admin/leads") return { name: "admin-leads" };
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

  return { name: "not-found" };
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


function migrateLegacyHashIfNeeded(): void {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith("/")) return;
  window.history.replaceState({}, "", hash || "/");
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseLocation());

  useEffect(() => {
    migrateLegacyHashIfNeeded();
    if (window.location.pathname === "/admin") {
      window.history.replaceState({}, "", "/admin/dashboard");
      window.dispatchEvent(new Event("lovable:navigate"));
    }
    // 301 client-side: /blog* → /conteudos* (URL canônica) — blog legado removido.
    const p = window.location.pathname;
    if (p === "/blog" || p === "/blog/" || p.startsWith("/blog/")) {
      const newPath = "/conteudos" + p.slice(5);
      window.history.replaceState({}, "", newPath + window.location.search);
    }
    setRoute(parseLocation());

    const onChange = () => setRoute(parseLocation());
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
  diagnostico: "/diagnostico",
  orcamento: "/orcamento",
  faq: "/faq",
  autorizacaoCondominio: "/autorizacao-condominio",
  contato: "/contato",
  escopo: "/escopo",
  comoFunciona: "/como-funciona",
  ondeAtuamos: "/onde-atuamos",
  parceiros: "/parceiros",
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
  adminSettings: "/admin/settings",
  adminFaq: "/admin/faq",
  adminTypography: "/admin/typography",
  adminLeads: "/admin/leads",
  adminQualificacao: "/admin/qualificacao",
  adminMensagens: "/admin/mensagens",
  adminOrcamentos: "/admin/orcamentos",
  adminDiagnostico: "/admin/diagnostico",
  lpObra: "/o",
  lpPanfleto: "/p",
};

// Navega programaticamente sem recarregar a página. Preserva o hash quando
// presente (ex.: "/#certeza" a partir de uma página interna), para que o
// handler de hashchange/route em main.tsx possa rolar até a seção-âncora.
export function navigate(href: string) {
  const cleaned = href.startsWith("#") ? href.slice(1) : href;
  // Navegação interna carrega utm_*/gclid/fbclid da URL atual, para que o
  // lead enviado em /diagnostico mantenha a origem da campanha.
  const target = carryCampaignParams(
    cleaned.startsWith("/") ? cleaned : `/${cleaned}`,
    window.location.search,
  );
  window.history.pushState({}, "", target);
  const hashIdx = target.indexOf("#");
  if (hashIdx === -1) {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
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
