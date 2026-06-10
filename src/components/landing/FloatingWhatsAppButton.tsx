import { MessageCircle } from "lucide-react";
import { whatsappHref } from "./content";

// ──────────────────────────────────────────────────────────────────
// FloatingWhatsAppButton — rebrand
// ANTES: bg-bewild-blue (azul claro antigo, não competia com gold).
// AGORA: o petróleo é o CTA PRIMÁRIO da página. Se o WhatsApp fosse
// petróleo, viraria um clone do botão principal e brigaria pelo clique.
// Solução: WhatsApp vira presença SECUNDÁRIA — ink discreto, borda sutil.
// O olho do cliente vê 1 ação primária (petróleo) e 1 atalho (este).
// ──────────────────────────────────────────────────────────────────

export default function FloatingWhatsAppButton() {
  return (
    <a
      href={whatsappHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com especialista no WhatsApp"
      className="group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-white/15 bg-bewild-ink/95 px-4 py-3.5 text-sm font-semibold text-white shadow-bewild-float backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-bewild-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bewild-blue-400 sm:bottom-7 sm:right-7"
    >
      {/* Ícone em verde WhatsApp — único sinal de cor, lê na hora */}
      <MessageCircle className="h-5 w-5 text-[#25D366]" aria-hidden="true" />
      <span className="hidden sm:inline">Falar com especialista</span>
    </a>
  );
}
