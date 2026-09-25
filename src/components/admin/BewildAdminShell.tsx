/**
 * BewildAdminShell — layout topbar do painel Bewild (spec v4).
 *
 * - Branding "Bewild · Painel" à esquerda.
 * - Abas do dia a dia: Visão geral · Leads · Qualificação · Mensagens ·
 *   Diagnósticos · Projetos · Conteúdos.
 * - Menu "Site" com as telas de configuração (Analytics, FAQ, SEO, URLs 404,
 *   Indexação, Rastreamento, Integrações, Configurações) — antes não havia
 *   link para elas a partir deste painel. Tela deste layout aberta pelo menu
 *   usa `active="site"` (nenhuma aba principal acesa).
 * - Botão Sair à direita (encerra sessão Supabase).
 * - Sem sidebar. Independente do AdminLayout antigo (legado).
 *
 * Os ícones são SVGs do lucide-react (que já é usado no projeto), conforme
 * o guardrail "ícones em SVG, nunca emoji".
 */
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  MessagesSquare,
  ListChecks,
  ClipboardList,
  FolderKanban,
  Newspaper,
  LogOut,
  Menu,
  Settings2,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { navigate, routes } from "@/lib/useHashRoute";
import "@/styles/admin-bewild.css";

export type BewildAdminTab =
  | "overview"
  | "leads"
  | "qualificacao"
  | "diagnostico"
  | "mensagens"
  | "projetos"
  | "conteudos"
  | "site";

type Props = {
  children: ReactNode;
  active: BewildAdminTab;
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
};

const TABS: { key: BewildAdminTab; label: string; href: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Visão geral", href: "/admin/dashboard", icon: LayoutDashboard },
  { key: "leads", label: "Leads", href: "/admin/leads", icon: Inbox },
  { key: "qualificacao", label: "Qualificação", href: "/admin/qualificacao", icon: ListChecks },
  { key: "mensagens", label: "Mensagens", href: "/admin/mensagens", icon: MessagesSquare },
  { key: "diagnostico", label: "Diagnósticos", href: "/admin/diagnostico", icon: ClipboardList },
  { key: "projetos", label: "Projetos", href: "/admin/projetos", icon: FolderKanban },
  { key: "conteudos", label: "Conteúdos", href: "/admin/conteudos", icon: Newspaper },
];

/** Telas do layout antigo (AdminLayout) — configuração do site. */
const SITE_LINKS: { label: string; href: string }[] = [
  { label: "Analytics", href: routes.adminAnalytics },
  { label: "FAQ", href: routes.adminFaq },
  { label: "SEO", href: routes.adminSeo },
  { label: "URLs 404", href: routes.adminSeo404 },
  { label: "Indexação", href: routes.adminIndexacao },
  { label: "Rastreamento", href: routes.adminRastreamento },
  { label: "Integrações", href: routes.adminIntegracoes },
  { label: "Configurações", href: routes.adminSettings },
];

export default function BewildAdminShell({
  children,
  active,
  title,
  eyebrow,
  description,
  actions,
}: Props) {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const moreRef = useRef<HTMLDetailsElement | null>(null);

  // Fecha o menu "Site" ao clicar fora ou apertar Esc.
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const el = moreRef.current;
      if (el?.open && !el.contains(e.target as Node)) el.open = false;
    }
    function onKey(e: KeyboardEvent) {
      const el = moreRef.current;
      if (e.key === "Escape" && el?.open) {
        el.open = false;
        el.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Fecha o drawer mobile ao trocar de aba
  useEffect(() => {
    setMobileOpen(false);
  }, [active]);

  // Título da aba do navegador no painel: "Bewild | Painel Admin · {título}".
  useEffect(() => {
    document.title = title
      ? `Bewild | Painel Admin · ${title}`
      : "Bewild | Painel Admin";
  }, [title]);

  async function handleSignOut() {
    await signOut();
    navigate(routes.adminLogin);
  }

  return (
    <div className={`bw-admin${mobileOpen ? " bw-admin--mobile-open" : ""}`}>
      <header className="bw-admin__topbar">
        <div className="bw-admin__topbar-inner">
          <a href="/admin/dashboard" className="bw-admin__brand" aria-label="Bewild · Painel — início">
            <span><b>B</b>ewild</span>
            <span className="bw-admin__brand-dot" aria-hidden>·</span>
            <span className="bw-admin__brand-sub">Painel</span>
          </a>

          <nav className="bw-admin__tabs" aria-label="Navegação do painel">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = t.key === active;
              return (
                <a
                  key={t.key}
                  href={t.href}
                  className={`bw-admin__tab${isActive ? " is-active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon aria-hidden />
                  <span>{t.label}</span>
                </a>
              );
            })}
            <details className="bw-admin__more" ref={moreRef}>
              <summary className={`bw-admin__tab bw-admin__more-toggle${active === "site" ? " is-active" : ""}`}>
                <Settings2 aria-hidden />
                <span>Site</span>
                <ChevronDown aria-hidden className="bw-admin__more-caret" />
              </summary>
              <ul className="bw-admin__more-menu">
                {SITE_LINKS.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="bw-admin__more-link">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </nav>

          <div className="bw-admin__right">
            {user?.email && (
              <span className="bw-admin__user" title={user.email}>
                {user.email}
              </span>
            )}
            <button
              type="button"
              className="bw-admin__menu-btn"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileOpen}
            >
              <Menu aria-hidden />
            </button>
            <button
              type="button"
              className="bw-admin__signout"
              onClick={handleSignOut}
              title="Encerrar sessão"
            >
              <LogOut aria-hidden />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="bw-admin__content">
        <div className="bw-admin__page-head">
          <div className="bw-admin__page-head-text">
            {eyebrow && <span className="bw-admin__eyebrow">{eyebrow}</span>}
            <h1 className="bw-admin__page-title">{title}</h1>
            {description && <p className="bw-admin__page-desc">{description}</p>}
          </div>
          {actions && <div className="bw-admin__page-actions">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
