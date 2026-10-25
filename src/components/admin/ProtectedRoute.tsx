import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/useAuth";
import { navigate, routes } from "@/lib/useHashRoute";

type Props = { children: ReactNode };

/**
 * Bloqueia o render do painel para quem não está logado / não é admin.
 *
 * O redirect para `/admin/login` é disparado em `useEffect` — chamar
 * `navigate()` durante o render gera double-navigate sob React Strict Mode
 * e abre janela para loops quando o estado de auth oscila. Enquanto o
 * efeito não roda, devolvemos o mesmo estado de "carregando" que o
 * fallback inicial, evitando piscar UI vazia no caminho.
 *
 * Falha ao VERIFICAR o acesso (rede, instabilidade) não é "sem permissão":
 * mostramos o erro com "tentar de novo" — o store já tenta sozinho com
 * backoff. Depois que o acesso foi confirmado, erros posteriores não tiram
 * mais o admin da tela (ver useAuth).
 */
export default function ProtectedRoute({ children }: Props) {
  const { user, isAdmin, loading, adminError, retryAdminCheck } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate(routes.adminLogin);
  }, [loading, user]);

  if (loading || !user) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__inner mono">carregando…</div>
      </div>
    );
  }

  if (!isAdmin && adminError) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__inner" role="alert">
          <p className="mono" style={{ marginBottom: 8 }}>
            Não foi possível verificar seu acesso ao painel agora.
          </p>
          <p className="mono" style={{ marginBottom: 16, opacity: 0.7, fontSize: 12 }}>
            {adminError} · tentando de novo automaticamente.
          </p>
          <button type="button" className="admin-btn" onClick={retryAdminCheck}>
            tentar de novo
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-loading">
        <div className="admin-loading__inner">
          <p className="mono" style={{ marginBottom: 16 }}>
            Sua conta não tem permissão para acessar o painel.
          </p>
          <a href={routes.home} className="admin-btn">
            voltar ao site
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
