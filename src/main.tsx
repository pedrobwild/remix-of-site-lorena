import React, { useEffect, useRef, useState } from "react";
import ReactDOM, { type Root as ReactRoot } from "react-dom/client";
import CookieBanner from "./components/CookieBanner";
import RootErrorBoundary from "./components/RootErrorBoundary";
import { useCustomCursor } from "./lib/useCustomCursor";
import { useHashRoute, installLinkInterceptor, type Route } from "./lib/useHashRoute";
import { initAnalytics } from "./lib/analytics";
import { installCrashRecovery, markHealthy } from "./lib/crashRecovery";
import { renderRoute } from "./router";
import { useBwRevealObserver } from "./lib/useBwMotion";
import EmConstrucao from "./pages/EmConstrucao";
import "./index.css"
import "./bwild-design.css";

// Modo construção: quando true, qualquer rota cai em /emconstrucao.
// Vire para false quando o novo site estiver pronto.
const MODO_CONSTRUCAO = true;

// Bypass do modo construção para desenvolvimento:
// - Sempre liberado no preview do Lovable (id-preview--*.lovable.app) e localhost
// - Liberado em qualquer host via ?bypass=1 (persiste em localStorage)
// - Para sair do bypass: ?bypass=0
function devBypassConstrucao(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("bypass");
    if (q === "1") localStorage.setItem("bw-bypass-construcao", "1");
    if (q === "0") localStorage.removeItem("bw-bypass-construcao");
    const host = window.location.hostname;
    const isLovablePreview = host.startsWith("id-preview--") || host.endsWith(".lovableproject.com");
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (isLovablePreview || isLocal) return true;
    return localStorage.getItem("bw-bypass-construcao") === "1";
  } catch {
    return false;
  }
}
const BYPASS_CONSTRUCAO = devBypassConstrucao();

installCrashRecovery();
installLinkInterceptor();

const TRANSITION_MS = 380;

function isAdminRoute(route: Route) {
  return route.name.startsWith("admin-");
}

function routeKeyOf(route: Route) {
  if (route.name === "project") return `project:${route.slug}`;
  if (route.name === "admin-project-edit") return `admin-edit:${route.slug}`;
  if (route.name === "blog-post") return `blog:${route.slug}`;
  if (route.name === "blog-tag") return `blog-tag:${route.slug}`;
  if (route.name === "admin-blog-edit") return `admin-blog-edit:${route.slug}`;
  return route.name;
}

function Root() {
  const route = useHashRoute();

  // Modo construção: redireciona qualquer rota para /emconstrucao e
  // renderiza a página isolada, sem Header/Footer/widgets do site.
  useEffect(() => {
    if (!MODO_CONSTRUCAO || BYPASS_CONSTRUCAO) return;
    if (window.location.pathname !== "/emconstrucao") {
      window.history.replaceState({}, "", "/emconstrucao");
      window.dispatchEvent(new Event("lovable:navigate"));
    }
  }, [route]);
  if (MODO_CONSTRUCAO && !BYPASS_CONSTRUCAO) {
    return <EmConstrucao />;
  }

  const isAdmin = route.name.startsWith("admin");
  useCustomCursor(!isAdmin);

  // Cursor Be Wild gold em light mode
  useEffect(() => {
    document.body.classList.add("bwild-light-cursor");
    return () => document.body.classList.remove("bwild-light-cursor");
  }, []);

  // Scroll reveal observer global ([data-bw-reveal] → .bw-in)
  useBwRevealObserver();

  // Inicializa analytics uma vez no mount
  useEffect(() => {
    markHealthy();
    const cleanup = initAnalytics();
    return cleanup;
  }, []);

  // "displayed" é a rota que está renderizada no DOM. Quando a rota real muda,
  // disparamos um fade-out, trocamos `displayed` no meio e fazemos fade-in.
  const [displayed, setDisplayed] = useState<Route>(route);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const lastRouteKey = useRef<string>(routeKeyOf(route));

  useEffect(() => {
    const nextKey = routeKeyOf(route);
    if (nextKey === lastRouteKey.current) {
      // A rota voltou para o que já está sendo exibido em meio a uma
      // transição (ex.: A → B → A em rajada): o timer da fase anterior
      // foi cancelado pelo cleanup, mas `phase` ficou em "out" e nunca
      // mais é reposto, deixando a tela permanentemente invisível.
      // Reposicionar para "in" aqui garante que o conteúdo volte a aparecer.
      setPhase("in");
      return;
    }

    // Fase 1: fade-out da rota atual
    setPhase("out");
    const swapTimer = window.setTimeout(() => {
      // Troca o conteúdo e volta ao topo no momento "invisível"
      setDisplayed(route);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      lastRouteKey.current = nextKey;
      // Fase 2: fade-in da nova rota
      requestAnimationFrame(() => setPhase("in"));
    }, TRANSITION_MS);

    return () => window.clearTimeout(swapTimer);
  }, [route]);

  const adminMode = isAdminRoute(displayed);

  // O elemento `.cursor` é criado/removido pelo próprio `useCustomCursor`
  // — manter um <div className="cursor"> renderizado aqui em paralelo
  // duplicava a responsabilidade e abria janela para dois nodes coexistirem
  // se o hook fosse desabilitado/habilitado durante a vida do app. (M7)
  return (
    <>
      <div
        className={`route-transition route-transition--${phase}`}
        style={{ ["--route-transition-ms" as string]: `${TRANSITION_MS}ms` }}
      >
        {renderRoute(displayed)}
      </div>
      {!adminMode && <CookieBanner />}
    </>
  );
}

const rootElement = document.getElementById("root")!;
const globalWithRoot = window as typeof window & { __lorenaReactRoot?: ReactRoot };
const reactRoot = globalWithRoot.__lorenaReactRoot ?? ReactDOM.createRoot(rootElement);
globalWithRoot.__lorenaReactRoot = reactRoot;

reactRoot.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <Root />
    </RootErrorBoundary>
  </React.StrictMode>
);
