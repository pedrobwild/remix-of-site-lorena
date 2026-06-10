/**
 * CaseLaminas — 3-panel accordion (Antes / Pronto / Operando)
 * - Default active: index 1 (Pronto)
 * - Hover (desktop com hover real) ativa; click/tap também
 * - SEM auto-avanço
 * - Mobile (≤900px): empilhado, mantém comportamento de clique
 */
import { useState, type ReactNode } from "react";

export interface CaseLaminaData {
  key: "antes" | "pronto" | "operando";
  pillVariant: "neutral" | "gold" | "blue";
  pillLabel: string;
  label: string; // ANTES / PRONTO PARA HOSPEDAR / OPERANDO
  title: string;
  media?: ReactNode; // ImagePlaceholder
  content: ReactNode;
}

interface Props {
  laminas: CaseLaminaData[];
  defaultActive?: number;
}

const variantClass = {
  neutral: "",
  gold: "status-pill--gold",
  blue: "status-pill--blue",
};

export function CaseLaminas({ laminas, defaultActive = 1 }: Props) {
  const [active, setActive] = useState(defaultActive);

  return (
    <div className="laminas" role="tablist">
      {laminas.map((l, i) => {
        const isActive = i === active;
        return (
          <button
            key={l.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`${l.label}: ${l.title}`}
            className={`lamina ${isActive ? "is-active" : ""}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
          >
            {l.media && <div className="lamina__media">{l.media}</div>}
            <div className="lamina__shade" />
            <span className={`status-pill ${variantClass[l.pillVariant]} lamina__pill`}>
              <span className="dot" />
              {l.pillLabel}
            </span>
            {!isActive && <span className="lamina__title-vertical">{l.title}</span>}
            <div className="lamina__content">
              <div className="lamina__label">{l.label}</div>
              <h3 className="lamina__title">{l.title}</h3>
              {l.content}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default CaseLaminas;
