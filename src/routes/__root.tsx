/// <reference types="vite/client" />
import { useEffect, useState, type ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useLocation,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";

import CookieBanner from "@/components/CookieBanner";
import MetaPixel from "@/components/MetaPixel";
import RootErrorBoundary from "@/components/RootErrorBoundary";
import SiteAssistant from "@/components/assistant/SiteAssistant";
import MaintenancePage from "@/pages/MaintenancePage";
import NotFoundPage from "@/pages/NotFoundPage";
import { MAINTENANCE_MODE } from "@/config/site";
import {
  installConsentWithdrawalGuard,
  isConsentAccepted,
  onConsentChange,
  openCookiePreferences,
} from "@/lib/cookieConsent";
import { initAnalytics } from "@/lib/analytics";
import { initGa4, trackPageView } from "@/lib/ga4";
import { FONT_PRELOADS } from "@/lib/fonts";
import {
  hasThirdPartyTrackers,
  isSeoAppliedFor,
  SEO_APPLIED_EVENT,
} from "@/lib/useSeo";
import { installCrashRecovery, markHealthy } from "@/lib/crashRecovery";
import {
  closestElementFrom,
  installLinkInterceptor,
  installNavigateEventBridge,
  normalizeInitialUrl,
  scrollToHashTarget,
} from "@/lib/useHashRoute";
import { ORG_JSONLD } from "@/lib/orgJsonLd";
import { DEFAULT_OG_IMAGE_ALT, DEFAULT_OG_IMAGE_URL, SITE_BASE } from "@/lib/routeHead";
import { reportLovableError } from "@/lib/lovable-error-reporting";

import appCss from "../styles.css?url";

// ported from main.tsx — bootstrap que precisava rodar antes do primeiro
// render: recuperação de crash, normalização de URLs legadas (#/rota,
// /blog*, /admin) e interceptação de <a> internos para navegação SPA.
if (typeof window !== "undefined") {
  installCrashRecovery();
  normalizeInitialUrl();
  installLinkInterceptor();
}

const HOME_TITLE = "Bewild | Reforma turnkey de apartamentos e studios em SP";
const HOME_DESCRIPTION =
  "Reforma completa de apartamentos em São Paulo: projeto, obra, marcenaria e mobília, com preço e prazo fechados. Veja os bastidores da equipe em obra.";
const HOME_KEYWORDS =
  "escritório de arquitetura em São Paulo, arquitetura e engenharia, projeto arquitetônico, projeto de interiores, engenharia civil São Paulo, reforma de apartamento em SP, bastidores de obra, equipe em obra, custo de reforma, empresa de reforma de apartamento SP, reforma turnkey São Paulo, Bewild";
const FAVICON_V = "?v=20260923";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        httpEquiv: "Content-Security-Policy",
        content: "object-src 'none'; base-uri 'self'",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0, viewport-fit=cover",
      },
      { name: "theme-color", content: "#FAF8F4" },
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESCRIPTION },
      { name: "keywords", content: HOME_KEYWORDS },
      { name: "author", content: "Bewild" },
      { name: "facebook-domain-verification", content: "83dfecxxe1w9isb98jjbyeodjqncb4" },
      { name: "google-site-verification", content: "canbXXgTsJp-eDoeP0t8X6R5rB9_-ufKXfhVJ-G_F90" },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      // rating e revisit-after removidos em 2026-09-30: nenhum buscador atual
      // lê essas metas; eram ruído no head de todas as páginas.
      { name: "geo.region", content: "BR-SP" },
      { name: "geo.placename", content: "São Paulo, Brasil" },
      // geo.position/ICBM removidos em 2026-09-30: apontavam para o centro da
      // cidade (Sé), não para o escritório (Rua Pitú, 72, Brooklin). A posição
      // oficial fica no Perfil da Empresa no Google (sameAs/hasMap do JSON-LD).
      { name: "DC.title", content: HOME_TITLE },
      { name: "language", content: "Portuguese" },
      // og:*/twitter:* específicos de página (title, description, url,
      // image) ficam nas rotas-folha via seoHead — root só carrega os
      // defaults amplos, senão sobrepõe a prévia social das páginas.
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: "Bewild" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: DEFAULT_OG_IMAGE_ALT },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "apple-mobile-web-app-title", content: "Bewild" },
      { name: "application-name", content: "Bewild" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/x-icon", href: `/favicon.ico${FAVICON_V}` },
      { rel: "icon", type: "image/png", sizes: "64x64", href: `/favicon-64.png${FAVICON_V}` },
      { rel: "apple-touch-icon", sizes: "180x180", href: `/favicon-180.png${FAVICON_V}` },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "preconnect", href: "https://aamlnkmqvjcowixdgqii.supabase.co", crossOrigin: "anonymous" },
      // Fontes hospedadas no site (src/fonts.css): preload só do subconjunto
      // latin das duas famílias, que é o que o primeiro paint usa.
      ...FONT_PRELOADS,
    ],
    scripts: [{ type: "application/ld+json", children: ORG_JSONLD }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => <NotFoundPage />,
  errorComponent: RootErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/** Espera máxima pelo `useSeo` da página nova antes de mandar o page_view. */
const PAGE_VIEW_SEO_WAIT_MS = 2000;
const currentPageKey = () => window.location.pathname + window.location.search;

// ported from main.tsx — page_view do GA4 depois que a página aplicou o
// próprio <head> (título certo), com teto de tempo para páginas sem useSeo.
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

const MAINTENANCE_EXEMPT = new Set(["/o", "/p"]);

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const adminMode = pathname === "/admin" || pathname.startsWith("/admin/");

  // ported from main.tsx — bootstrap único: analytics, consentimento LGPD,
  // delegação do link "Preferências de cookies" do rodapé.
  useEffect(() => {
    markHealthy();
    const cleanupAnalytics = initAnalytics();
    if (isConsentAccepted()) initGa4();
    const offGa4 = onConsentChange((v) => {
      if (v !== "accepted") return;
      initGa4();
      trackPageView(currentPageKey());
    });
    const offWithdrawal = installConsentWithdrawalGuard();
    const onDocClick = (e: MouseEvent) => {
      if (closestElementFrom(e.target)?.closest(".bwa-footer-cookie-prefs")) {
        e.preventDefault();
        openCookiePreferences();
      }
    };
    document.addEventListener("click", onDocClick);
    return () => {
      cleanupAnalytics?.();
      offGa4();
      offWithdrawal();
      document.removeEventListener("click", onDocClick);
    };
  }, []);

  // page_view do GA4 a cada navegação resolvida (deduplicado em ga4.ts) e o
  // `lovable:navigate` que o Pixel da Meta e o tracker interno escutam.
  useEffect(() => {
    let cancel = schedulePageView();
    const unsub = router.subscribe("onResolved", () => {
      cancel();
      cancel = schedulePageView();
    });
    const offNavigateBridge = installNavigateEventBridge(router);
    return () => {
      cancel();
      unsub();
      offNavigateBridge();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Entrando no /admin com trackers de terceiros carregados: recarrega para
  // o painel abrir limpo — trackers nunca são injetados em /admin.
  useEffect(() => {
    if (adminMode && hasThirdPartyTrackers()) window.location.reload();
  }, [adminMode]);

  // Deep link com âncora (/guia-do-investidor#faq, /#certeza): rola até a
  // seção, esperando seções montadas tarde (chunks lazy, dados do banco).
  useEffect(() => {
    if (!window.location.hash) return;
    return scrollToHashTarget(3000);
  }, [location.href]);

  // Gate de manutenção: mesmo comportamento do renderRoute legado.
  const underMaintenance =
    MAINTENANCE_MODE && !adminMode && !MAINTENANCE_EXEMPT.has(pathname);

  // Banner de cookies e assistente só entram após a hidratação: eles dependem
  // de estado do navegador (consentimento, viewport) e renderizá-los no SSR
  // causa divergência entre o HTML do servidor e o do cliente.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <QueryClientProvider client={queryClient}>
      <RootErrorBoundary>
        {underMaintenance ? <MaintenancePage /> : <Outlet />}
        {hydrated && !adminMode && !underMaintenance && <CookieBanner />}
        {hydrated && !adminMode && !underMaintenance && <SiteAssistant />}
        {/* Montado sempre (inclusive /admin) para acompanhar a URL; o próprio
            componente não dispara nada em /admin nem sem consentimento. */}
        <MetaPixel />
      </RootErrorBoundary>
    </QueryClientProvider>
  );
}

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#FAF8F4",
        color: "#11355B",
        fontFamily: "Manrope, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 448, textAlign: "center" }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Esta página não carregou</h1>
        <p style={{ opacity: 0.7, marginBottom: 24 }}>
          Algo deu errado do nosso lado. Você pode tentar de novo ou voltar para a página inicial.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            style={{
              padding: "10px 16px",
              borderRadius: 6,
              border: 0,
              background: "#11355B",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
          <a
            href="/"
            style={{
              padding: "10px 16px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#11355B",
              textDecoration: "none",
            }}
          >
            Página inicial
          </a>
        </div>
      </div>
    </div>
  );
}
