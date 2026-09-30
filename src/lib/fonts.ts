/**
 * Fontes da Bewild: duas famílias, hospedadas no próprio site.
 *
 * - Manrope (variável 200–800): títulos e texto, no site inteiro.
 * - JetBrains Mono (variável 400–600): rótulos.
 *
 * O `@font-face` fica em `src/fonts.css`, que entra no CSS principal (já é
 * pedido no <head>). Aqui só montamos o `<link rel="preload">` dos arquivos
 * `latin` — o português não precisa de outro subconjunto no primeiro paint —
 * para o navegador baixar a fonte junto com o CSS, sem esperar o CSS ser
 * lido para descobrir que ela existe.
 *
 * Até 30/09/2026 o site pedia Manrope (7 pesos) e JetBrains Mono (3 pesos)
 * ao Google Fonts no <head> e injetava mais Playfair Display, Poppins,
 * Inter, Montserrat e DM Sans nas páginas internas: duas conexões a mais
 * (os dois domínios do Google Fonts) e uma folha de estilo que
 * bloqueava a renderização. Todas passaram a usar a Manrope.
 */
import manropeLatin from "@/assets/fonts/manrope-latin.woff2?url";
import jetbrainsMonoLatin from "@/assets/fonts/jetbrains-mono-latin.woff2?url";

export const FONT_FILES = {
  manropeLatin,
  jetbrainsMonoLatin,
} as const;

export const FONT_PRELOADS = [manropeLatin, jetbrainsMonoLatin].map((href) => ({
  rel: "preload",
  href,
  as: "font",
  type: "font/woff2",
  crossOrigin: "anonymous" as const,
}));
