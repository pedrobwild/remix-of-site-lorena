/**
 * Flag da página /parceiros/incorporadoras (case Leal Moreira).
 *
 * Com `INCORPORADORAS_PAGE_ENABLED = false` a rota responde como página não
 * encontrada para o público. A prévia interna é ligada com `?incorporadoras=1`
 * na URL (vale para a sessão) e desligada com `?incorporadoras=0`.
 *
 * Nos endereços de prévia do Lovable e no ambiente local a prévia já vem
 * ligada, sem parâmetro nenhum, para quem revisa pelo editor. No domínio
 * publicado nada muda: só a flag libera a página.
 */
import { useEffect, useState } from "react";
import { INCORPORADORAS_PAGE_ENABLED } from "@/config/site";

const FLAG_KEY = "bw_prev_incorporadoras";

/** true em host de prévia do Lovable ou em ambiente local. */
function isPreviewHost(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const host = window.location.hostname.toLowerCase();
    return (
      host.startsWith("id-preview--") ||
      host.startsWith("preview--") ||
      host.endsWith(".lovableproject.com") ||
      host === "localhost" ||
      host === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

/** Lê o parâmetro da URL, grava/limpa a sessão e diz se a prévia está ativa. */
function previewOn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(window.location.search).get("incorporadoras");
    // Em host de prévia a página já vem ligada, então "0" fica guardado na
    // sessão para continuar desligada nas navegações seguintes.
    if (q === "1") window.sessionStorage.setItem(FLAG_KEY, "1");
    if (q === "0") window.sessionStorage.setItem(FLAG_KEY, "0");
    const saved = window.sessionStorage.getItem(FLAG_KEY);
    if (saved === "1") return true;
    if (saved === "0") return false;
    return isPreviewHost();
  } catch {
    // Sessão indisponível (modo privado antigo, storage bloqueado): a prévia
    // ainda vale para a URL atual, sem persistir.
    try {
      const q = new URLSearchParams(window.location.search).get("incorporadoras");
      if (q === "1") return true;
      return q !== "0" && isPreviewHost();
    } catch {
      return isPreviewHost();
    }
  }
}

/** true quando a página deve ser renderizada (publicada ou em prévia interna). */
export function isIncorporadorasEnabled(): boolean {
  if (INCORPORADORAS_PAGE_ENABLED) return true;
  return previewOn();
}

/** true quando a página só aparece por causa da prévia interna. */
export function isIncorporadorasPreview(): boolean {
  if (INCORPORADORAS_PAGE_ENABLED) return false;
  return previewOn();
}

/** Versão reativa à navegação da SPA (útil em menus). */
export function useIncorporadorasEnabled(): boolean {
  const [on, setOn] = useState(isIncorporadorasEnabled);
  useEffect(() => {
    const sync = () => setOn(isIncorporadorasEnabled());
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("lovable:navigate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("lovable:navigate", sync);
    };
  }, []);
  return on;
}
