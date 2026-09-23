import type { ReactNode } from "react";

type Props = {
  kind?: "err" | "warn" | "ok";
  children: ReactNode;
  onClose?: () => void;
};

/**
 * Faixa de aviso/erro no topo das telas do painel Bewild. Substitui o
 * `window.alert` e — principalmente — o silêncio: várias ações ignoravam o
 * `{ error }` do supabase-js e a tela fingia que tinha dado certo.
 */
export default function AdminAlert({ kind = "err", children, onClose }: Props) {
  return (
    <div
      className={`bw-admin__alert${kind === "err" ? "" : ` bw-admin__alert--${kind}`}`}
      role={kind === "err" ? "alert" : "status"}
    >
      <div>{children}</div>
      {onClose && (
        <button type="button" className="bw-admin__alert-close" onClick={onClose} aria-label="Fechar aviso">
          ×
        </button>
      )}
    </div>
  );
}
