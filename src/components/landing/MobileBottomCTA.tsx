/**
 * MobileBottomCTA — botão fixo no bottom para mobile.
 * Sprint 2 — Componente proprietário.
 *
 * Aparece apenas em mobile/tablet (hidden sm:hidden).
 * Surge após 40% de scroll da página.
 * Uso: <MobileBottomCTA />
 */

import { useState, useEffect } from "react";
import { navigate } from "../../lib/useHashRoute";
import { ArrowRight } from "lucide-react";

export function MobileBottomCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      setVisible(scrolled > 0.12);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-transform duration-500 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="border-t border-white/10 bg-bewild-ink/95 backdrop-blur-md px-4 py-3">
        <button
          onClick={() => navigate("/diagnostico")}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-bewild-gold px-5 py-3.5 text-sm font-bold text-bewild-ink transition-all active:scale-[0.98]"
        >
          Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default MobileBottomCTA;
