/**
 * Proteção contra perder um formulário do painel com alterações não salvas.
 *
 * - Fechar/recarregar a aba: `beforeunload` (o navegador mostra o aviso dele).
 * - Navegação interna: o SPA troca de página interceptando cliques em
 *   `<a href="/...">` (installLinkInterceptor, fase de bolha). Aqui um
 *   listener na fase de CAPTURA pergunta antes; se o admin cancelar, o clique
 *   é anulado (`preventDefault`) e o interceptor já ignora eventos anulados.
 *
 * O botão Voltar do navegador (popstate) não dá para bloquear de forma
 * confiável no SPA — o `beforeunload` cobre fechar e recarregar.
 */
import { useEffect, useRef } from "react";
import { closestElementFrom } from "@/lib/useHashRoute";

export const UNSAVED_CHANGES_MESSAGE =
  "Há alterações não salvas neste formulário. Sair mesmo assim e descartar as alterações?";

/** `true` quando o clique vai trocar de página dentro do próprio site. */
export function isInAppNavigationClick(e: MouseEvent, currentHref: string): boolean {
  if (e.defaultPrevented || e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const anchor = closestElementFrom(e.target)?.closest("a");
  if (!anchor) return false;
  const a = anchor as HTMLAnchorElement;
  const rawHref = a.getAttribute("href");
  if (!rawHref || rawHref.startsWith("#")) return false;
  if (a.target && a.target !== "_self") return false;
  if (a.hasAttribute("download")) return false;
  let url: URL;
  let current: URL;
  try {
    url = new URL(a.href, currentHref);
    current = new URL(currentHref);
  } catch {
    return false;
  }
  if (url.origin !== current.origin) return false;
  return url.pathname !== current.pathname || url.search !== current.search;
}

export function useUnsavedChangesGuard(dirty: boolean, message: string = UNSAVED_CHANGES_MESSAGE) {
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    if (!dirty) return;

    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      e.preventDefault();
      // Chrome/Edge antigos exigem returnValue para mostrar o aviso.
      e.returnValue = "";
    }

    function onClickCapture(e: MouseEvent) {
      if (!dirtyRef.current) return;
      if (!isInAppNavigationClick(e, window.location.href)) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [dirty, message]);
}

/** Pergunta antes de uma ação programática (ex.: botão "Cancelar" que navega). */
export function confirmDiscardChanges(dirty: boolean, message: string = UNSAVED_CHANGES_MESSAGE) {
  return !dirty || window.confirm(message);
}
