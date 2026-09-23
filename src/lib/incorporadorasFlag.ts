/**
 * Flag da página /parceiros/incorporadoras (case Leal Moreira).
 *
 * Com `INCORPORADORAS_PAGE_ENABLED = false` a rota responde como página não
 * encontrada para o público. A prévia interna é ligada com `?incorporadoras=1`
 * na URL (vale para a sessão) e desligada com `?incorporadoras=0`.
 */
import { useEffect, useState } from "react";
import { INCORPORADORAS_PAGE_ENABLED } from "@/config/site";

const FLAG_KEY = "bw_prev_incorporadoras";

/** Lê o parâmetro da URL, grava/limpa a sessão e diz se a prévia está ativa. */
function previewOn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(window.location.search).get("incorporadoras");
    if (q === "1") window.sessionStorage.setItem(FLAG_KEY, "1");
    if (q === "0") window.sessionStorage.removeItem(FLAG_KEY);
    return window.sessionStorage.getItem(FLAG_KEY) === "1";
  } catch {
    // Sessão indisponível (modo privado antigo, storage bloqueado): a prévia
    // ainda vale para a URL atual, sem persistir.
    try {
      return new URLSearchParams(window.location.search).get("incorporadoras") === "1";
    } catch {
      return false;
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
