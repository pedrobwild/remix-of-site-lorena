import { Mail, MessageCircle } from "lucide-react";
import { BewildLogo } from "./primitives";
import { CONTACT, NAV_LINKS, whatsappHref } from "./content";

/* Ícones de marca não disponíveis no lucide-react instalado — SVGs inline. */
function Instagram({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
    </svg>
  );
}
function Linkedin({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-bewild-ink py-14">
      <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <BewildLogo heightClass="h-7" />
            <p className="max-w-sm text-sm leading-relaxed text-white/60">
              Reformas, interiores e tecnologia para imóveis compactos que precisam performar.
            </p>
            <p className="text-sm text-white/45">{CONTACT.city}</p>
          </div>

          <nav aria-label="Rodapé — navegação">
            <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-wider text-bewild-blue-400">
              Navegação
            </p>
            <ul className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-wider text-bewild-blue-400">
              Contato
            </p>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a
                  href={whatsappHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white"
                >
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white"
                >
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4" /> {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href="/privacidade"
                  className="text-sm text-white/65 transition-colors hover:text-white"
                >
                  Política de privacidade
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/45">
            bewild. Projeto, obra e operação em um processo mais claro.
          </p>
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} bewild — evolução da BWild. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
