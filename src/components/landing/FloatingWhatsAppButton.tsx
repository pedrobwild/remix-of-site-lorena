import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";

/** Card flutuante "Quer um diagnóstico do seu studio?" — substitui o widget antigo. */
export default function FloatingWhatsAppButton() {
  const [closed, setClosed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname.startsWith("/diagnostico")) return;
    const t = window.setTimeout(() => setShow(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  if (!show || closed) return null;
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/diagnostico"))
    return null;

  return (
    <div
      role="complementary"
      aria-label="Convite para diagnóstico"
      className="fixed bottom-5 right-5 z-40 max-w-[300px] animate-fade-in rounded-2xl border border-white/10 bg-bewild-ink p-4 text-white shadow-[0_24px_60px_-20px_rgba(10,17,30,0.55)] sm:bottom-7 sm:right-7"
    >
      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label="Fechar"
        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pr-6 font-display text-base font-semibold leading-snug">
        Quer um diagnóstico do seu studio?
      </p>
      <a
        href="/diagnostico"
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-bewild-blue px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_34px_-14px_rgba(0,76,127,0.55)] transition-all hover:bg-[#005C99] hover:-translate-y-0.5"
      >
        Solicitar <ArrowRight className="h-4 w-4" />
      </a>
      <p className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.28em] text-[#C9A24B]">
        Consultivo · Sem compromisso
      </p>
    </div>
  );
}
