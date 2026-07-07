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
import PrivacidadePage from "./pages/PrivacidadePage";
import LpObraPage from "./pages/LpObraPage";
import LpPanfletoPage from "./pages/LpPanfletoPage";
import NotFoundPage from "./pages/NotFoundPage";
import MaintenancePage from "./pages/MaintenancePage";
import { MAINTENANCE_MODE } from "./config/site";
import LoginPage from "./pages/admin/LoginPage";

import BewildOverviewPage from "./pages/admin/BewildOverviewPage";
import BewildLeadsAdminPage from "./pages/admin/BewildLeadsAdminPage";
import BewildConteudosAdminPage from "./pages/admin/BewildConteudosAdminPage";
import BewildPostFormPage from "./pages/admin/BewildPostFormPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import SeoPage from "./pages/admin/SeoPage";
import Seo404Page from "./pages/admin/Seo404Page";
import SettingsPage from "./pages/admin/SettingsPage";
import BewildProjectsListPage from "./pages/admin/BewildProjectsListPage";
import BewildProjectFormPage from "./pages/admin/BewildProjectFormPage";
import FaqAdminPage from "./pages/admin/FaqAdminPage";
import TypographyPage from "./pages/admin/TypographyPage";

import ProtectedRoute from "./components/admin/ProtectedRoute";
import type { Route } from "./lib/useHashRoute";

export function renderRoute(route: Route) {
  // Gate de manutenção: esconde o site público principal (inclusive 404)
  // enquanto a flag está ligada. Rotas /admin/* continuam normais, e as
  // LPs fantasma /o e /p também passam — são páginas noindex acessadas só
  // por QR/URL direta. Remover/revisar essa exceção no go-live do site.
  const MAINTENANCE_EXEMPT = new Set([
    "lp-obra",
    "lp-panfleto",
  ]);
  if (MAINTENANCE_MODE && !route.name?.startsWith("admin") && !MAINTENANCE_EXEMPT.has(route.name)) {
    return <MaintenancePage />;
  }


  if (route.name === "portfolio") return <BewildPortfolioPage />;
  if (route.name === "bewild-project") return <BewildProjectPage slug={route.slug} />;
  if (route.name === "conteudos") return <BewildConteudosPage />;
  if (route.name === "bewild-post") return <BewildPostPage slug={route.slug} />;

  if (route.name === "diagnostico") return <DiagnosticoPage />;
  if (route.name === "faq") return <FaqPage />;
  if (route.name === "privacidade") return <PrivacidadePage />;
  if (route.name === "lp-obra") return <LpObraPage />;
  if (route.name === "lp-panfleto") return <LpPanfletoPage />;
  if (route.name === "admin-login") return <LoginPage />;
  if (route.name === "admin-dashboard")
    return (
      <ProtectedRoute>
        <BewildOverviewPage />
      </ProtectedRoute>
    );
  if (route.name === "admin-analytics")
    return (
      <ProtectedRoute>
        <AnalyticsPage />
      </ProtectedRoute>
    );
  if (route.name === "admin-seo")
    return (
      <ProtectedRoute>
        <SeoPage />
      </ProtectedRoute>
    );
  if (route.name === "admin-seo-404")
    return (
      <ProtectedRoute>
        <Seo404Page />
      </ProtectedRoute>
    );
  if (route.name === "admin-settings")
    return (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    );
  if (route.name === "admin-bewild")
    return (
      <ProtectedRoute>
        <BewildProjectsListPage />
      </ProtectedRoute>
    );
  if (route.name === "admin-bewild-new")
    return (
      <ProtectedRoute>
        <BewildProjectFormPage />
      </ProtectedRoute>
    );
  if (route.name === "admin-bewild-edit")
    return (
      <ProtectedRoute>
        <BewildProjectFormPage slug={route.slug} />
      </ProtectedRoute>
    );
  if (route.name === "admin-faq")
    return (
      <ProtectedRoute>
        <FaqAdminPage />
      </ProtectedRoute>
    );
  if (route.name === "admin-typography")
    return (
      <ProtectedRoute>
        <TypographyPage />
      </ProtectedRoute>
    );
  if (route.name === "admin-leads")
    return (
      <ProtectedRoute>
        <BewildLeadsAdminPage />
      </ProtectedRoute>
    );
  if (route.name === "admin-projetos")
    return (
      <ProtectedRoute>
        <BewildProjectsListPage />
      </ProtectedRoute>
    );
  if (route.name === "admin-projetos-new")
    return (
      <ProtectedRoute>
        <BewildProjectFormPage />
      </ProtectedRoute>
    );
  if (route.name === "admin-projetos-edit")
    return (
      <ProtectedRoute>
        <BewildProjectFormPage slug={route.slug} />
      </ProtectedRoute>
    );
  if (route.name === "admin-conteudos")
    return (
      <ProtectedRoute>
        <BewildConteudosAdminPage />
      </ProtectedRoute>
    );
  if (route.name === "admin-conteudos-new")
    return (
      <ProtectedRoute>
        <BewildPostFormPage />
      </ProtectedRoute>
    );
  if (route.name === "admin-conteudos-edit")
    return (
      <ProtectedRoute>
        <BewildPostFormPage slug={route.slug} />
      </ProtectedRoute>
    );
  if (route.name === "home") return <App />;
  return <NotFoundPage />;
}
