import { useEffect, useState } from "react";
import { checkAdminStatus, useAuth } from "@/lib/useAuth";
import { translateAuthError } from "@/lib/authErrors";
import { navigate, routes } from "@/lib/useHashRoute";
import "@/styles/admin-login.css";

const NO_ACCESS_MESSAGE =
  "Esta conta não tem acesso ao painel. Entre com um e-mail autorizado ou fale com o responsável pelo site.";

export default function LoginPage() {
  const { user, isAdmin, loading, adminError, signIn, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Bewild | Painel Admin";
  }, []);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate(routes.adminDashboard);
    }
  }, [loading, user, isAdmin]);

  if (!loading && user && isAdmin) return null;

  // Já há uma sessão aberta com uma conta que não é admin (ex.: voltou ao
  // /admin/login depois de ser barrado). Sem aviso, o formulário parecia
  // simplesmente "não funcionar".
  const signedInWithoutAccess = !loading && !!user && !isAdmin && !adminError && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Informe o e-mail e a senha.");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await signIn(cleanEmail, password);
      if (error) {
        setError(translateAuthError(error));
        return;
      }
      const userId = data.user?.id ?? data.session?.user.id;
      if (!userId) {
        setError("Não foi possível entrar. Tente de novo.");
        return;
      }
      // Confere o acesso aqui mesmo: uma conta válida sem acesso ficava parada
      // no formulário, sem nenhuma mensagem.
      const access = await checkAdminStatus(userId);
      if (access.error !== null) {
        await signOut();
        setError(
          `Não foi possível verificar o acesso ao painel (${access.error}). Tente de novo em instantes.`,
        );
        return;
      }
      if (!access.isAdmin) {
        await signOut();
        setError(NO_ACCESS_MESSAGE);
        setPassword("");
        return;
      }
      // Admin: o efeito acima navega para o painel quando o estado atualizar.
    } catch (err) {
      setError(translateAuthError(err instanceof Error ? { message: err.message } : null));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bw-login">
      <aside className="bw-login__brandside" aria-hidden="true">
        <a href={routes.home} className="bw-login__brand" aria-label="Bewild, início">
          <img src="/brand/bewild-logo-branca.png" alt="" />
        </a>
        <div className="bw-login__pitch">
          <div className="bw-login__eyebrow">Painel Bewild</div>
          <h2 className="bw-login__headline">
            Operação de reformas turn-key, com tudo no mesmo lugar.
          </h2>
          <p className="bw-login__sub">
            Leads, projetos e conteúdos do site Bewild em um único painel.
          </p>
        </div>
        <p className="bw-login__legal">Bewild · São Paulo</p>
      </aside>

      <main className="bw-login__formside">
        <div className="bw-login__card">
          <a href={routes.home} className="bw-login__card-brand" aria-label="Bewild, início">
            <img src="/brand/bewild-logo-cropped.png" alt="Bewild" />
          </a>

          <h1 className="bw-login__title">Acessar o painel</h1>
          <p className="bw-login__lede">Entre com seu e-mail autorizado.</p>

          {signedInWithoutAccess && (
            <div className="bw-login__notice" role="status">
              <p>
                Você está conectado como <strong>{user?.email ?? "uma conta"}</strong>, que não tem
                acesso ao painel.
              </p>
              <button
                type="button"
                className="bw-login__notice-btn"
                onClick={() => {
                  setError(null);
                  void signOut();
                }}
              >
                Sair e entrar com outra conta
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bw-login__form" noValidate>
            <div className="bw-login__field">
              <label className="bw-login__label" htmlFor="bw-login-email">
                E-mail
              </label>
              <input
                id="bw-login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="voce@bewild.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bw-login__input"
                aria-invalid={!!error}
                aria-describedby={error ? "bw-login-error" : undefined}
              />
            </div>

            <div className="bw-login__field">
              <label className="bw-login__label" htmlFor="bw-login-password">
                Senha
              </label>
              <input
                id="bw-login-password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bw-login__input"
                aria-invalid={!!error}
                aria-describedby={error ? "bw-login-error" : undefined}
              />
            </div>

            {error && (
              <p className="bw-login__error" role="alert" id="bw-login-error">
                {error}
              </p>
            )}

            <button type="submit" className="bw-login__submit" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <a href={routes.home} className="bw-login__back">← Voltar ao site</a>
        </div>
      </main>
    </div>
  );
}
