import { MessageCircle } from "lucide-react";
import { whatsappHref } from "./content";

/** Botão flutuante de WhatsApp — canto inferior direito. */
export default function FloatingWhatsAppButton() {
  return (
    <a
      href={whatsappHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com especialista no WhatsApp"
      className="group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-bewild-blue px-4 py-3.5 text-sm font-semibold text-white shadow-bewild-float transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:bottom-7 sm:right-7"
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      <span className="hidden sm:inline">Falar com especialista</span>
    </a>
  );
}
