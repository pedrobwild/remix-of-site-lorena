import { Suspense, type ReactNode } from "react";
import { useSeo } from "@/lib/useSeo";
import adminLegacyCssUrl from "@/styles/admin-legacy.css?url";
import adminFontScopeCssUrl from "@/styles/admin-font-scope.css?url";

/** Depois das folhas `bwa` (ver BWA_CSS_PRECEDENCE): o painel sobrescreve o site. */
export const ADMIN_CSS_PRECEDENCE = "admin";

/** Sem URL não há o que carregar (nos testes o `?url` do Vite vem vazio). */
const ADMIN_SHEETS = [adminLegacyCssUrl, adminFontScopeCssUrl].filter(Boolean);

/**
 * Invólucro das rotas /admin (portado do router legado na migração):
 * todo o painel (inclusive o login) fica fora dos buscadores, e as páginas
 * lazy carregam sob Suspense.
 *
 * As folhas do painel (admin-legacy.css, que era a parte do admin em
 * src/index.css, e admin-font-scope.css) entram aqui como
 * `<link rel="stylesheet" precedence>` a partir de um `?url`, e não por
 * `import "x.css"` em ProtectedRoute/AdminLayout: esses módulos caem num
 * chunk compartilhado do Rollup (o `index-*.css` que toda página pública
 * carrega), e o CSS importado por eles ia junto — medido em 25/10/2026, o
 * seletor `[class^="admin-"] *` estava no CSS da home. Com `?url` o arquivo
 * vira um asset avulso que só o painel referencia; o React sobe o link para
 * o <head> no servidor, não duplica e segura a transição até carregar.
 */
export default function AdminChunk({ children }: { children: ReactNode }) {
  useSeo({ title: "Painel · Bewild", noindex: true });
  return (
    <>
      {ADMIN_SHEETS.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence={ADMIN_CSS_PRECEDENCE} />
      ))}
      <Suspense fallback={null}>{children}</Suspense>
    </>
  );
}
