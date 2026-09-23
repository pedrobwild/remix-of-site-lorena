/**
 * safeHref — valida uma URL que veio do banco (ou de qualquer fonte não
 * confiável) antes de ela virar `href`.
 *
 * O React 18 ainda renderiza `href="javascript:..."` (só avisa no console em
 * desenvolvimento), então um valor malicioso em `assistant_kb.acoes[].url`
 * executaria script no clique. Lista de permissão, não de bloqueio:
 *
 *  - caminho do próprio site: `/…` (nunca `//…`, que é outro domínio);
 *  - `https:` (inclui `https://wa.me/…`), sem usuário/senha embutidos;
 *  - `mailto:` e `tel:`.
 *
 * Qualquer outra coisa — `javascript:`, `data:`, `vbscript:`, `http:`,
 * `//host`, `/\host` (o navegador trata `\` como `/`), caracteres de
 * controle (o parser de URL remove TAB/LF, o que reabriria os casos acima) —
 * devolve `null`, e quem chama simplesmente não renderiza o link.
 */

const TEL_RE = /^tel:\+?[\d\s().-]{3,}$/i;
const MAILTO_RE = /^mailto:[^\s@]+@[^\s@]+$/i;

/** TAB, LF, NUL e demais controles C0 + DEL. */
function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

export function safeHref(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const value = url.trim();
  if (!value || hasControlChar(value) || value.includes("\\")) return null;

  // Caminho do próprio site (a SPA trata a navegação).
  if (value.startsWith("/")) return value.startsWith("//") ? null : value;

  if (/^mailto:/i.test(value)) {
    // Endereço antes de `?` (assunto/corpo continuam permitidos).
    const address = value.split("?")[0];
    return MAILTO_RE.test(address) ? value : null;
  }
  if (/^tel:/i.test(value)) return TEL_RE.test(value) ? value : null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || !parsed.hostname) return null;
  // `https://bewild.com.br@golpe.com` abre golpe.com: nunca aceitar credenciais.
  if (parsed.username || parsed.password) return null;
  return parsed.href;
}

/** `true` para URLs absolutas (abrem em nova aba); caminhos, mailto e tel ficam na aba atual. */
export function isExternalHref(href: string): boolean {
  return /^https:/i.test(href);
}
