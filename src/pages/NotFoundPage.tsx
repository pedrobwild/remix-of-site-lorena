import { useEffect, useState } from "react";
import { useSeo } from "../lib/useSeo";
import { routes, navigate } from "../lib/useHashRoute";
import { logNotFound, lookupActiveRedirect } from "../lib/notFoundLog";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";
/* Só post.css — ver nota em PrivacidadePage.tsx. */
import "@/styles/post.css";

/**
 * Página 404 dedicada — design Bewild (.bw-home.bw-post).
 *
 * Como Lovable Hosting é SPA-fallback (toda URL inexistente recebe 200 + index.html),
 * o Search Console pode classificar páginas como "soft-404" se renderizarmos a home
 * em URLs inexistentes. Aqui:
 *  - <meta name="robots" content="noindex, follow"> impede indexação
 *  - <title> e H1 começam explicitamente com "404"
 *  - Conteúdo curto e sinalético — Googlebot detecta soft-404 pelo conteúdo
 *  - Links úteis (home, portfólio, blog) ajudam usuário e crawler a se reorientar
 *  - Registra a URL na tabela seo_404_log para curadoria no admin
 *  - Se o admin já configurou um redirect para este path, redireciona automaticamente
 */
export default function NotFoundPage() {
  const [redirecting, setRedirecting] = useState(false);

  useSeo({
    title: "404 · Página não encontrada · Bewild",
    description:
      "A página solicitada não existe ou foi movida. Conheça o portfólio de reformas de apartamentos e imóveis prontos da Bewild em São Paulo.",
    canonicalPath: "/404",
    ogType: "website",
    noindex: true,
  });

  useEffect(() => {
    const path = window.location.pathname || "/";
    const referrer = document.referrer || null;

    void logNotFound(path, referrer);

    let cancelled = false;
    void (async () => {
      const target = await lookupActiveRedirect(path);
      if (cancelled || !target) return;
      setRedirecting(true);
      window.setTimeout(() => {
        if (target.startsWith("http")) {
          window.location.replace(target);
        } else {
          navigate(target.startsWith("/") ? target : `/${target}`);
        }
      }, 60);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (redirecting) {
    return (
      <div className="bw-home bw-post">
        <BwaNav />
        <main id="main" tabIndex={-1} aria-live="polite">
          <section className="pt-hero">
            <div className="container">
              <div className="pt-cat">Redirecionando</div>
              <h1 className="pt-title" data-testid="not-found-h1">
                404 · Levando você ao lugar certo.
              </h1>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="bw-home bw-post">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">Erro 404</div>
            <h1 className="pt-title" data-testid="not-found-h1">
              404 · Essa página não existe.
            </h1>
            <p className="pt-excerpt">
              O endereço acessado não corresponde a nenhuma página da Bewild.
              O link pode estar incorreto, a página pode ter sido movida ou
              a URL pode conter um erro de digitação.
            </p>
            {/* CTAs no padrão .bwa-button da home (antes usavam .btn/.btn-cyan/
                .btn-primary, classes que só existem escopadas em .bw-lp — na
                prática os dois links renderizavam como texto puro). */}
            <div
              className="pt-cta__act"
              style={{ justifyContent: "flex-start", marginTop: 28 }}
            >
              <a href={routes.home} className="pt-btn">
                Voltar à página inicial <span className="ar" aria-hidden="true">→</span>
              </a>
              <a href={routes.diagnostico} className="pt-btn outline">
                Solicitar Orçamento <span className="ar" aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>

        <section className="pt-body-section">
          <div className="container">
            <div className="pt-rel-head">
              <span className="n">002</span>
              <h2>Para onde ir agora</h2>
              <span className="ln" />
            </div>
            <ul className="pt-404-links">
              <li>
                <a href={routes.portfolio}>Ver reformas entregues</a>
              </li>
              <li>
                <a href={routes.blog}>Conteúdos sobre studios e short stay</a>
              </li>
              <li>
                <a href={routes.faq}>Perguntas frequentes</a>
              </li>
              <li>
                <a href={routes.privacidade}>Política de privacidade</a>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
