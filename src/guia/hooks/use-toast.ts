/**
 * Stub de toast.
 *
 * O guia original montava um Toaster global. Nesta página o toast não é
 * essencial (só confirma cópia/salvamento), então mantemos a assinatura
 * sem UI para não arrastar mais dependências.
 */

export type ToastInput = {
  title?: string;
  description?: string;
  variant?: string;
  duration?: number;
};

export function toast(_input: ToastInput): void {
  /* no-op */
}

export function useToast() {
  return { toast, toasts: [] as ToastInput[], dismiss: () => {} };
}
