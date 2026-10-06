import homeBwaCssUrl from "../pages/home-bwa.css?url";
import bwaInternalCssUrl from "../pages/bwa-internal.css?url";
import { BWA_CSS_PRECEDENCE } from "@/lib/routeHead";

/** Sem URL não há o que carregar (nos testes o `?url` do Vite vem vazio, e o React reclama de `href=""`). */
const SHEETS = [homeBwaCssUrl, bwaInternalCssUrl].filter(Boolean);

/**
 * Folhas do sistema `.bwa` (header, menu, rodapé, tokens `--bwa-*`) como
 * `<link>` renderizado pelo React dentro do BwaNav.
 *
 * As rotas já mandam as duas folhas no HTML do servidor pelo `seoHead()`
 * (src/lib/routeHead.ts, rodada de SEO de 06/10). Este componente declara o
 * MESMO recurso onde o BwaNav é renderizado, para o que o `seoHead` não cobre:
 * a página 404 e qualquer rota cujo `head` não passe por ele. Antes, nesses
 * casos, as folhas eram criadas num efeito, depois da hidratação — a página
 * aparecia no tema escuro legado e só então trocava de tema e de lugar
 * (MOB-04; em /orcamento, antes do `seoHead`: CLS 0,21 no celular).
 *
 * Como o React trata `<link rel="stylesheet" precedence>`:
 *  - no servidor, sobe o link para o `<head>` do HTML inicial;
 *  - agrupa por `precedence` (ver BWA_CSS_PRECEDENCE): as duas ficam por último;
 *  - nunca duplica (chave = href) e nunca remove: continuam no `<head>` ao
 *    trocar de rota, como já era de propósito;
 *  - numa navegação interna (uma transição do React), segura a troca de página
 *    até a folha carregar.
 *
 * A home não usa este componente: lá home-bwa.css entra pelo `head` da rota
 * "/" (src/routes/index.tsx) e bwa-internal.css não é carregada.
 */
export function BwaInternalStylesheets() {
  return (
    <>
      {SHEETS.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence={BWA_CSS_PRECEDENCE} />
      ))}
    </>
  );
}
