/**
 * StickyDiagnosticPanel — painel lateral fixo no desktop.
 * Sprint 2 — Componente proprietário.
 *
 * Surge após 35% de scroll, apenas desktop (lg+).
 * Posição: fixed, lado direito, vertical center.
 * Uso: <StickyDiagnosticPanel />
 */

import { useState, useEffect } from "react";
import { navigate } from "../../lib/useHashRoute";
import { ArrowRight, X, Search } from "lucide-react";

export function StickyDiagnosticPanel() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      setVisible(scrolled > 0.35);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Não renderiza em páginas de formulário onde já existe CTA principal
  // (evita cobrir o card do formulário no /diagnostico e /simulador).
  if (typeof window !== "undefined") {
    const path = window.location.hash.replace(/^#/, "") || window.location.pathname;
    if (path === "/diagnostico" || path === "/simulador") return null;
  }

  if (dismissed) return null;

  return (
    <div
      className={`fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden lg:block transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12 pointer-events-none"
      }`}
    >
      <div className="w-52 rounded-2xl border border-bewild-gold/20 bg-bewild-ink/95 backdrop-blur-md shadow-bewild-premium p-4">
        {/* Fechar */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-white/25 hover:text-white/60 transition-colors"
          aria-label="Fechar painel"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Ícone */}
        <div className="h-9 w-9 rounded-xl bg-bewild-gold/10 border border-bewild-gold/20 flex items-center justify-center mb-3">
          <Search className="h-4 w-4 text-bewild-gold" />
        </div>

        {/* Copy */}
        <p className="text-xs font-semibold text-white leading-snug mb-1">
          Seu imóvel tem potencial para short stay?
        </p>
        <p className="text-[11px] text-white/65 leading-relaxed mb-4">
          Diagnóstico gratuito. Sem compromisso.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate("/diagnostico")}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-bewild-blue px-3 py-2.5 text-xs font-bold text-white transition-all hover:bg-bewild-blue-600"
        >
          Diagnosticar <ArrowRight className="h-3.5 w-3.5" />
        </button>

        {/* Prova micro */}
        <p className="mt-3 text-center text-[9px] text-white/50 leading-tight">
          Consultivo · Sem promessa de resultado
        </p>
      </div>
    </div>
  );
}

export default StickyDiagnosticPanel;
