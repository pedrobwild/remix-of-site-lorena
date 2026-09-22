/**
 * Roteador da SPA — fonte de verdade do despacho de rotas.
 *
 * Toda rota desconhecida cai no `<NotFoundPage />` final — o teste em
 * `src/__tests__/router.test.tsx` valida que essa cadeia funciona
 * de ponta a ponta.
 */
import App from "./App";
import BewildPortfolioPage from "./pages/BewildPortfolioPage";
import BewildProjectPage from "./pages/BewildProjectPage";
import BewildConteudosPage from "./pages/BewildConteudosPage";
import BewildPostPage from "./pages/BewildPostPage";

import DiagnosticoPage from "./pages/DiagnosticoPage";
import FaqPage from "./pages/FaqPage";
import ContatoPage from "./pages/ContatoPage";
import EscopoPage from "./pages/EscopoPage";
import ComoFuncionaPage from "./pages/ComoFuncionaPage";
import OndeAtuamosPage from "./pages/OndeAtuamosPage";
import PrivacidadePage from "./pages/PrivacidadePage";
import LpObraPage from "./pages/LpObraPage";
import LpPanfletoPage from "./pages/LpPanfletoPage";
import NotFoundPage from "./pages/NotFoundPage";
import MaintenancePage from "./pages/MaintenancePage";
import { MAINTENANCE_MODE } from "./config/site";
import { lazy, Suspense, type ReactNode } from "react";

// Admin em chunks separados: o visitante público não baixa recharts, dnd-kit
// e todo o painel (o bundle único tinha ~1,45 MB / 414 kB gzip).
const LoginPage = lazy(() => import("./pages/admin/LoginPage"));
const BewildOverviewPage = lazy(() => import("./pages/admin/BewildOverviewPage"));
const BewildLeadsAdminPage = lazy(() => import("./pages/admin/BewildLeadsAdminPage"));
const BewildMensagensAdminPage = lazy(() => import("./pages/admin/BewildMensagensAdminPage"));
const BewildConteudosAdminPage = lazy(() => import("./pages/admin/BewildConteudosAdminPage"));
const BewildPostFormPage = lazy(() => import("./pages/admin/BewildPostFormPage"));
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage"));
const SeoPage = lazy(() => import("./pages/admin/SeoPage"));
const Seo404Page = lazy(() => import("./pages/admin/Seo404Page"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const BewildProjectsListPage = lazy(() => import("./pages/admin/BewildProjectsListPage"));
const BewildProjectFormPage = lazy(() => import("./pages/admin/BewildProjectFormPage"));
const FaqAdminPage = lazy(() => import("./pages/admin/FaqAdminPage"));
const TypographyPage = lazy(() => import("./pages/admin/TypographyPage"));

import ProtectedRoute from "./components/admin/ProtectedRoute";
import type { Route } from "./lib/useHashRoute";

function AdminChunk({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export function renderRoute(route: Route) {
  // Gate de manutenção: esconde o site público principal (inclusive 404)
  // enquanto a flag está ligada. Rotas /admin/* continuam normais, e as
  // LPs fantasma /o e /p também passam — são páginas noindex acessadas só
  // por QR/URL direta. Remover/revisar essa exceção no go-live do site.
  const MAINTENANCE_EXEMPT = new Set(["lp-obra", "lp-panfleto"]);
  if (MAINTENANCE_MODE && !route.name?.startsWith("admin") && !MAINTENANCE_EXEMPT.has(route.name)) {
    return <MaintenancePage />;
  }

  if (route.name === "portfolio") return <BewildPortfolioPage />;
  if (route.name === "bewild-project") return <BewildProjectPage slug={route.slug} />;
  if (route.name === "conteudos") return <BewildConteudosPage />;
  if (route.name === "bewild-post") return <BewildPostPage slug={route.slug} />;

  if (route.name === "diagnostico") return <DiagnosticoPage />;
  if (route.name === "faq") return <FaqPage />;
  if (route.name === "contato") return <ContatoPage />;
  if (route.name === "escopo") return <EscopoPage />;
  if (route.name === "como-funciona") return <ComoFuncionaPage />;
  if (route.name === "onde-atuamos") return <OndeAtuamosPage />;
  if (route.name === "privacidade") return <PrivacidadePage />;
  if (route.name === "lp-obra") return <LpObraPage />;
  if (route.name === "lp-panfleto") return <LpPanfletoPage />;
  if (route.name === "admin-login")
    return (
      <AdminChunk>
        <LoginPage />
      </AdminChunk>
    );
  if (route.name === "admin-dashboard")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <BewildOverviewPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-analytics")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <AnalyticsPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-seo")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <SeoPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-seo-404")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <Seo404Page />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-settings")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-bewild")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <BewildProjectsListPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-bewild-new")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <BewildProjectFormPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-bewild-edit")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <BewildProjectFormPage slug={route.slug} />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-faq")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <FaqAdminPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-typography")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <TypographyPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-leads")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <BewildLeadsAdminPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-mensagens")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <BewildMensagensAdminPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-projetos")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <BewildProjectsListPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-projetos-new")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <BewildProjectFormPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-projetos-edit")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <BewildProjectFormPage slug={route.slug} />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-conteudos")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <BewildConteudosAdminPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-conteudos-new")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <BewildPostFormPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-conteudos-edit")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <BewildPostFormPage slug={route.slug} />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "home") return <App />;
  return <NotFoundPage />;
}
