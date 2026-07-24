import React, { useEffect, useRef, useState } from "react";
import ReactDOM, { type Root as ReactRoot } from "react-dom/client";
import CookieBanner from "./components/CookieBanner";
import MetaPixel from "./components/MetaPixel";
import RootErrorBoundary from "./components/RootErrorBoundary";

import { useHashRoute, installLinkInterceptor, type Route } from "./lib/useHashRoute";
import { openCookiePreferences } from "./lib/cookieConsent";
import { initAnalytics } from "./lib/analytics";
import { initGa4, trackPageView } from "./lib/ga4";
import { onConsentChange, isConsentAccepted } from "./lib/cookieConsent";
import { installCrashRecovery, markHealthy } from "./lib/crashRecovery";
import { renderRoute } from "./router";
import "./index.css";

installCrashRecovery();
installLinkInterceptor();

const TRANSITION_MS = 380;

function isAdminRoute(route: Route) {
  return route.name.startsWith("admin-");
}

function routeKeyOf(route: Route) {
  if (route.name === "bewild-project") return `bewild-project:${route.slug}`;
  if (route.name === "bewild-post") return `bewild-post:${route.slug}`;
  if (route.name === "admin-bewild-edit") return `admin-bewild-edit:${route.slug}`;
  if (route.name === "admin-projetos-edit") return `admin-projetos-edit:${route.slug}`;
  return route.name;
}

function Root() {
  const route = useHashRoute();
  // Cursor customizado removido — cursor padrão do navegador em todas as rotas.


  // Inicializa analytics uma vez no mount
  useEffect(() => {
    markHealthy();
    const cleanup = initAnalytics();
    // GA4: tenta inicializar agora (caso já tenha consentimento salvo) e
    // assina mudanças do banner para inicializar no momento do "Aceitar".
    if (isConsentAccepted()) initGa4();
    const off = onConsentChange((v) => {
      if (v === "accepted") initGa4();
    });
    return () => {
      cleanup?.();
      off();
    };
  }, []);

  // Dispara page_view do GA4 a cada mudança de rota (router hash custom).
  useEffect(() => {
    trackPageView(window.location.pathname + window.location.search);
  }, [route]);

  // Fresh-load em /#foo: rola até a seção após primeira renderização
  // (o efeito de transição só cobre trocas SPA subsequentes).
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash || hash.startsWith("/")) return;
    if (route.name !== "home") return;
    const id = window.setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
    }, TRANSITION_MS + 60);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Se a nova rota é a home e a URL tem #foo (âncora cross-page vinda de
      // uma página interna, ex.: /faq → /#certeza), rola para a seção correta
      // depois do fade-in. Caso contrário, volta ao topo (comportamento antigo).
      const hash = window.location.hash.replace(/^#/, "");
      const isSectionAnchor = route.name === "home" && hash && !hash.startsWith("/");
      if (isSectionAnchor) {
        requestAnimationFrame(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
          else window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
      lastRouteKey.current = nextKey;
      // Fase 2: fade-in da nova rota
      requestAnimationFrame(() => setPhase("in"));
    }, TRANSITION_MS);

    return () => window.clearTimeout(swapTimer);
  }, [route]);

  const adminMode = isAdminRoute(displayed);


  return (
    <>
      <div
        className={`route-transition route-transition--${phase}`}
        style={{ ["--route-transition-ms" as string]: `${TRANSITION_MS}ms` }}
      >
        {renderRoute(displayed)}
      </div>
      {/* Banner mantido na home por conformidade LGPD (MetaPixel ativo) — exceção consciente à paridade visual */}
      {!adminMode && <CookieBanner />}
      <MetaPixel />
    </>
  );

}

const rootElement = document.getElementById("root")!;
const globalWithRoot = window as typeof window & { __bewildReactRoot?: ReactRoot };
const reactRoot = globalWithRoot.__bewildReactRoot ?? ReactDOM.createRoot(rootElement);
globalWithRoot.__bewildReactRoot = reactRoot;

reactRoot.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <Root />
    </RootErrorBoundary>
  </React.StrictMode>
);
