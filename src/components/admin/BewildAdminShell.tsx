/**
 * BewildAdminShell — layout topbar do painel Bewild (spec v4).
 *
 * - Branding "Bewild · Painel" à esquerda.
 * - 4 abas: Visão geral · Leads · Projetos · Conteúdos.
 * - Botão Sair à direita (encerra sessão Supabase).
 * - Sem sidebar. Independente do AdminLayout antigo (Lorena/Be Wild).
 *
 * Os ícones são SVGs do lucide-react (que já é usado no projeto), conforme
 * o guardrail "ícones em SVG, nunca emoji".
 */
import { ReactNode, useEffect, useState } from "react";
import { LayoutDashboard, Inbox, FolderKanban, Newspaper, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { navigate, routes } from "@/lib/useHashRoute";
import "@/styles/admin-bewild.css";

export type BewildAdminTab = "overview" | "leads" | "projetos" | "conteudos";

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
  { key: "projetos", label: "Projetos", href: "/admin/projetos", icon: FolderKanban },
  { key: "conteudos", label: "Conteúdos", href: "/admin/conteudos", icon: Newspaper },
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
