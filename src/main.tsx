import React, { Fragment, useEffect, useRef, useState } from "react";
import ReactDOM, { type Root as ReactRoot } from "react-dom/client";
import CookieBanner from "./components/CookieBanner";
import MetaPixel from "./components/MetaPixel";
import RootErrorBoundary from "./components/RootErrorBoundary";
import SiteAssistant from "./components/assistant/SiteAssistant";

import {
  useHashRoute,
  installLinkInterceptor,
  installScrollMemory,
  normalizeInitialUrl,
  closestElementFrom,
  isAdminRoute,
  readSavedScroll,
  restoreScrollPosition,
  routeKeyOf,
  scrollToHashTarget,
  type Route,
} from "./lib/useHashRoute";
import {
  installConsentWithdrawalGuard,
  isConsentAccepted,
  onConsentChange,
  openCookiePreferences,
} from "./lib/cookieConsent";
import { initAnalytics } from "./lib/analytics";
import { initGa4, trackPageView } from "./lib/ga4";
import { captureFbclid } from "./lib/metaPixel";
import { hasThirdPartyTrackers, isSeoAppliedFor, SEO_APPLIED_EVENT } from "./lib/useSeo";
import { installCrashRecovery, markHealthy } from "./lib/crashRecovery";
import { renderRoute } from "./router";
import "./index.css";

declare global {
  interface Window {
    /** Fecha o splash do index.html (idempotente). Definido pelo script inline. */
    __bwSplashDone?: () => void;
  }
}

installCrashRecovery();
// Antes do primeiro render: `#/rota` legado, `/blog*` e `/admin` já viram a
// URL canônica — a 404 nunca chega a renderizar (nem a registrar) para elas.
normalizeInitialUrl();
installScrollMemory();
installLinkInterceptor();

const TRANSITION_MS = 380;
/** Espera máxima pelo `useSeo` da página nova antes de mandar o page_view. */
const PAGE_VIEW_SEO_WAIT_MS = 2000;

const currentPageKey = () => window.location.pathname + window.location.search;

/**
 * page_view do GA4 da página atual, depois que ela aplicou o próprio <head>
 * (título certo). Páginas lazy (guia) montam depois do swap: espera o evento
 * `seo:applied`, com teto de tempo para páginas sem `useSeo`.
 */
function schedulePageView(): () => void {
  const pathname = window.location.pathname;
  const key = currentPageKey();
  let done = false;
  const send = () => {
    if (done) return;
    done = true;
    stop();
    trackPageView(key);
  };
  const onApplied = () => {
    if (isSeoAppliedFor(pathname)) send();
  };
  const timer = window.setTimeout(send, PAGE_VIEW_SEO_WAIT_MS);
  const stop = () => {
    window.clearTimeout(timer);
    window.removeEventListener(SEO_APPLIED_EVENT, onApplied);
  };
  if (isSeoAppliedFor(pathname)) send();
  else window.addEventListener(SEO_APPLIED_EVENT, onApplied);
  return () => {
    done = true;
    stop();
  };
}

function Root() {
  const route = useHashRoute();
  // Cursor customizado removido — cursor padrão do navegador em todas as rotas.

  // "displayed" é a rota que está renderizada no DOM. Quando a rota real muda,
  // disparamos um fade-out, trocamos `displayed` no meio e fazemos fade-in.
  const [displayed, setDisplayed] = useState<Route>(route);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const lastRouteKey = useRef<string>(routeKeyOf(route));
  const lastPageKey = useRef<string>(currentPageKey());
  // Voltar/Avançar: `undefined` = navegação normal; número/null = posição
  // salva na entrada do histórico para a qual o usuário voltou.
  const popScroll = useRef<number | null | undefined>(undefined);
  // Entrada no site: reload / Voltar vindo de outro site trazem a posição no
  // history.state (lida antes de qualquer save sobrescrever).
  const initialDisplayed = useRef(displayed);
  const [initialScroll] = useState(readSavedScroll);

  // Bootstrap único: analytics, consentimento, splash.
  useEffect(() => {
    markHealthy();
    // Primeiro commit feito: fecha o splash do index.html (a trava de 1,4 s
    // de lá fica só como segurança).
    window.__bwSplashDone?.();

    const cleanupAnalytics = initAnalytics();
    // Meta: guarda o fbclid da entrada para atribuir o lead ao anúncio mesmo
    // que o formulário seja enviado em outra página (e sem cookies aceitos).
    captureFbclid();
    // GA4: inicializa agora (se já há consentimento salvo) ou no "Aceitar".
    // O page_view da entrada sai do efeito de página abaixo; no aceite
    // tardio, a página já está montada e com título — envia na hora.
    if (isConsentAccepted()) initGa4();
    const offGa4 = onConsentChange((v) => {
      if (v !== "accepted") return;
      initGa4();
      trackPageView(currentPageKey());
    });
    // Retirada do consentimento (aqui ou em outra aba): revoga nos SDKs,
    // apaga cookies de trackers e recarrega limpo.
    const offWithdrawal = installConsentWithdrawalGuard();

    // Delegação global para "Preferências de cookies" (inclui o link
    // dentro do footer da home injetado via dangerouslySetInnerHTML).
    const onDocClick = (e: MouseEvent) => {
      if (closestElementFrom(e.target)?.closest(".bwa-footer-cookie-prefs")) {
        e.preventDefault();
        openCookiePreferences();
      }
    };
    document.addEventListener("click", onDocClick);

    const onPop = () => {
      popScroll.current = readSavedScroll();
    };
    window.addEventListener("popstate", onPop);

    return () => {
      cleanupAnalytics?.();
      offGa4();
      offWithdrawal();
      document.removeEventListener("click", onDocClick);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  useEffect(() => {
    const nextKey = routeKeyOf(route);
    const pageKey = currentPageKey();
    const pageChanged = pageKey !== lastPageKey.current;
    lastPageKey.current = pageKey;

    if (nextKey === lastRouteKey.current) {
      // A rota voltou para o que já está sendo exibido em meio a uma
      // transição (ex.: A → B → A em rajada): o timer da fase anterior
      // foi cancelado pelo cleanup, mas `phase` ficou em "out" e nunca
      // mais é reposto, deixando a tela permanentemente invisível.
      // Reposicionar para "in" aqui garante que o conteúdo volte a aparecer.
      setPhase("in");
      // Mesma página, outra entrada do histórico (âncora/querystring):
      // Voltar restaura a posição salva; link novo com outra query vai ao
      // topo; âncora pura fica com o scroll nativo.
      const saved = popScroll.current;
      popScroll.current = undefined;
      if (typeof saved === "number") return restoreScrollPosition(saved);
      if (saved === undefined && pageChanged && !window.location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
      return;
    }

    // Entrando no /admin com trackers de terceiros já carregados (Clarity e
    // Hotjar gravam a tela; o painel mostra dados de leads): recarrega para o
    // painel abrir limpo — trackers nunca são injetados em /admin.
    if (isAdminRoute(route) && hasThirdPartyTrackers()) {
      window.location.reload();
      return;
    }

    // Fase 1: fade-out da rota atual
    setPhase("out");
    const swapTimer = window.setTimeout(() => {
      // Troca o conteúdo no momento "invisível". Volta ao topo, exceto no
      // Voltar/Avançar com posição salva (restaurada depois que a página
      // nova montar — efeito de `displayed` abaixo).
      if (typeof popScroll.current !== "number") {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
      setDisplayed(route);
      lastRouteKey.current = nextKey;
      // Fase 2: fade-in da nova rota
      requestAnimationFrame(() => setPhase("in"));
    }, TRANSITION_MS);

    return () => window.clearTimeout(swapTimer);
  }, [route]);

  // Página exibida montou: posiciona a rolagem.
  //  - Voltar/Avançar (ou reload) com posição salva → restaura, tentando por
  //    alguns frames enquanto o conteúdo cresce (lista vinda do banco).
  //  - Deep link com âncora (/guia-do-investidor#faq, /#certeza) → rola até
  //    a seção, esperando seções montadas tarde (chunks lazy).
  useEffect(() => {
    const saved = displayed === initialDisplayed.current ? initialScroll : popScroll.current;
    popScroll.current = undefined;
    if (typeof saved === "number") return restoreScrollPosition(saved);
    return scrollToHashTarget();
  }, [displayed, initialScroll]);

  // page_view do GA4 — só quando a página exibida é a da URL (fora do fade)
  // e depois que ela aplicou o próprio título. Deduplicado por caminho+query
  // em ga4.ts: âncoras e re-renders não contam de novo.
  const displayedKey = routeKeyOf(displayed);
  const currentKey = routeKeyOf(route);
  useEffect(() => {
    if (displayedKey !== currentKey) return;
    return schedulePageView();
  }, [displayed, route, displayedKey, currentKey]);

  const adminMode = isAdminRoute(displayed);

  return (
    <>
      <div
        className={`route-transition route-transition--${phase}`}
        style={{ ["--route-transition-ms" as string]: `${TRANSITION_MS}ms` }}
      >
        {/* key = rota: trocar de post/projeto remonta a página (estado limpo). */}
        <Fragment key={displayedKey}>{renderRoute(displayed)}</Fragment>
      </div>
      {/* Banner mantido na home por conformidade LGPD (MetaPixel ativo) — exceção consciente à paridade visual */}
      {!adminMode && <CookieBanner />}
      {!adminMode && <SiteAssistant />}
      {/* Montado sempre (inclusive /admin) para acompanhar a URL; o próprio
          componente não dispara nada em /admin nem sem consentimento. */}
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
