import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { navigate, routes } from "@/lib/useHashRoute";
import "@/styles/admin-login.css";

export default function LoginPage() {
  const { user, isAdmin, loading, signIn } = useAuth();
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) throw error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado";
      setError(msg);
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
              />
            </div>

            {error && (
              <p className="bw-login__error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="bw-login__submit"
              disabled={submitting}
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <a href={routes.home} className="bw-login__back">← Voltar ao site</a>
        </div>
      </main>
    </div>
  );
}
