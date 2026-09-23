/**
 * Roteador da SPA — fonte de verdade do despacho de rotas.
 *
 * Toda rota desconhecida cai no `<NotFoundPage />` final — o teste em
 * `src/__tests__/router.test.tsx` valida que essa cadeia funciona
 * de ponta a ponta.
 */
import { useSeo } from "./lib/useSeo";
import App from "./App";
import BewildPortfolioPage from "./pages/BewildPortfolioPage";
import BewildProjectPage from "./pages/BewildProjectPage";
import BewildConteudosPage from "./pages/BewildConteudosPage";
import BewildPostPage from "./pages/BewildPostPage";

import DiagnosticoPage from "./pages/DiagnosticoPage";
import FaqPage from "./pages/FaqPage";
import AutorizacaoCondominioPage from "./pages/AutorizacaoCondominioPage";
import ContatoPage from "./pages/ContatoPage";
import OrcamentoPage from "./pages/OrcamentoPage";
import EscopoPage from "./pages/EscopoPage";
import ComoFuncionaPage from "./pages/ComoFuncionaPage";
import OndeAtuamosPage from "./pages/OndeAtuamosPage";
import ReformaApartamentoSpPage from "./pages/ReformaApartamentoSpPage";
import ReformaStudioSpPage from "./pages/ReformaStudioSpPage";
import ReformaCoberturaSpPage from "./pages/ReformaCoberturaSpPage";
import MarcenariaPage from "./pages/MarcenariaPage";
import ParceirosPage from "./pages/ParceirosPage";
import IndiquePage from "./pages/IndiquePage";
import MarcasParceriasPage from "./pages/MarcasParceriasPage";
import PrivacidadePage from "./pages/PrivacidadePage";
import LpObraPage from "./pages/LpObraPage";
import LpPanfletoPage from "./pages/LpPanfletoPage";
import NotFoundPage from "./pages/NotFoundPage";
import MaintenancePage from "./pages/MaintenancePage";
import { MAINTENANCE_MODE } from "./config/site";
import { lazy, Suspense, type ReactNode } from "react";

// Admin em chunks separados: o visitante público não baixa recharts, dnd-kit
// e todo o painel (o bundle único tinha ~1,45 MB / 414 kB gzip).
// O guia carrega framer-motion, recharts e maplibre: fica em chunk próprio.
const GuiaInvestidorPage = lazy(() => import("./pages/GuiaInvestidorPage"));
const LoginPage = lazy(() => import("./pages/admin/LoginPage"));
const BewildOverviewPage = lazy(() => import("./pages/admin/BewildOverviewPage"));
const BewildLeadsAdminPage = lazy(() => import("./pages/admin/BewildLeadsAdminPage"));
const BewildQualificacaoAdminPage = lazy(() => import("./pages/admin/BewildQualificacaoAdminPage"));
const BewildMensagensAdminPage = lazy(() => import("./pages/admin/BewildMensagensAdminPage"));
const BewildDiagnosticoAdminPage = lazy(() => import("./pages/admin/BewildDiagnosticoAdminPage"));
const BewildConteudosAdminPage = lazy(() => import("./pages/admin/BewildConteudosAdminPage"));
const BewildPostFormPage = lazy(() => import("./pages/admin/BewildPostFormPage"));
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage"));
const SeoPage = lazy(() => import("./pages/admin/SeoPage"));
const Seo404Page = lazy(() => import("./pages/admin/Seo404Page"));
const SeoIndexacaoPage = lazy(() => import("./pages/admin/SeoIndexacaoPage"));
const RastreamentoPage = lazy(() => import("./pages/admin/RastreamentoPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const BewildProjectsListPage = lazy(() => import("./pages/admin/BewildProjectsListPage"));
const BewildProjectFormPage = lazy(() => import("./pages/admin/BewildProjectFormPage"));
const FaqAdminPage = lazy(() => import("./pages/admin/FaqAdminPage"));
const IndicacoesAdminPage = lazy(() => import("./pages/admin/IndicacoesAdminPage"));
const TypographyPage = lazy(() => import("./pages/admin/TypographyPage"));

import ProtectedRoute from "./components/admin/ProtectedRoute";
import type { Route } from "./lib/useHashRoute";

function AdminChunk({ children }: { children: ReactNode }) {
  // Todo o /admin (inclusive o login) fica fora dos buscadores. O robots.txt
  // só impede o rastreamento; um link externo ainda poderia indexar a URL.
  useSeo({ title: "Painel · Bewild", noindex: true });
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
  if (route.name === "orcamento") return <OrcamentoPage />;
  if (route.name === "faq") return <FaqPage />;
  if (route.name === "autorizacao-condominio") return <AutorizacaoCondominioPage />;
  if (route.name === "contato") return <ContatoPage />;
  if (route.name === "escopo") return <EscopoPage />;
  if (route.name === "como-funciona") return <ComoFuncionaPage />;
  if (route.name === "onde-atuamos") return <OndeAtuamosPage />;
  if (route.name === "reforma-apartamento-sp") return <ReformaApartamentoSpPage />;
  if (route.name === "reforma-studio-sp") return <ReformaStudioSpPage />;
  if (route.name === "reforma-cobertura-sp") return <ReformaCoberturaSpPage />;
  if (route.name === "marcenaria") return <MarcenariaPage />;
  if (route.name === "parceiros") return <ParceirosPage />;
  if (route.name === "indique-um-amigo") return <IndiquePage />;
  if (route.name === "marcas-e-parcerias") return <MarcasParceriasPage />;
  if (route.name === "guia-do-investidor")
    return (
      <Suspense fallback={null}>
        <GuiaInvestidorPage />
      </Suspense>
    );
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
  if (route.name === "admin-indexacao")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <SeoIndexacaoPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-rastreamento")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <RastreamentoPage />
        </ProtectedRoute>
      </AdminChunk>
    );
  if (route.name === "admin-indicacoes")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <IndicacoesAdminPage />
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
  if (route.name === "admin-qualificacao")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <BewildQualificacaoAdminPage />
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
  if (route.name === "admin-diagnostico" || route.name === "admin-orcamentos")
    return (
      <AdminChunk>
        <ProtectedRoute>
          <BewildDiagnosticoAdminPage />
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
