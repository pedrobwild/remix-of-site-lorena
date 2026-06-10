/**
 * BewildChatWidget — Sprint B4
 * Botão flutuante que abre painel de FAQ com chips clicáveis.
 * Chips = logos visuais (SVG) das plataformas + tópicos com ícone, NÃO texto genérico.
 * Sem backend — respostas estáticas do content.ts + respostas específicas de plataforma.
 *
 * Posição: canto inferior direito (acima do FloatingWhatsAppButton).
 */

import { useState, useRef, useEffect } from "react";
import { X, MessageSquare, ArrowRight, RotateCcw } from "lucide-react";
import { FAQS } from "./content";
import { whatsappHref } from "./content";

/* ─── Tipos ──────────────────────────────────────────────── */
interface ChatMessage {
  role: "bot" | "user";
  text: string;
}

/* ─── SVG chips de plataformas ───────────────────────────── */
function AirbnbLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" fill="#FF5A5F" aria-label="Airbnb">
      <path d="M16 3C12.2 3 8.8 5.7 7.1 9.8L2.2 22.4C1.8 23.4 1.6 24.5 1.6 25.4 1.6 28.5 4.1 30 6.9 30c2.2 0 4.2-1.1 5.4-3.1l3.7-5.9 3.7 5.9c1.2 2 3.2 3.1 5.4 3.1 2.8 0 5.3-1.5 5.3-4.6 0-1-.2-2.1-.7-3.1L24.9 9.8C23.2 5.7 19.8 3 16 3zm0 3.2c2.5 0 4.7 1.7 6.1 4.8l5.5 14.3c.3.7.4 1.3.4 1.8 0 1.3-.9 1.8-2.1 1.8-1 0-1.9-.6-2.5-1.6l-4.4-7a1.1 1.1 0 00-2 0l-4.4 7c-.6 1-1.5 1.6-2.5 1.6-1.2 0-2.1-.5-2.1-1.8 0-.5.1-1.1.4-1.8l5.5-14.3C11.3 7.9 13.5 6.2 16 6.2z" />
    </svg>
  );
}

function BookingLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" fill="#003580" aria-label="Booking.com">
      <rect x="4" y="5" width="10" height="22" rx="2" />
      <path d="M17 5h5.5a4 4 0 010 8H17V5z" />
      <path d="M17 17h6a4.5 4.5 0 010 9H17v-9z" />
    </svg>
  );
}

function VrboLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" aria-label="Vrbo">
      <circle cx="16" cy="16" r="14" fill="#1DA462" />
      <path d="M10 12l6 8 6-8" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" aria-label="WhatsApp">
      <circle cx="16" cy="16" r="14" fill="#25D366" />
      <path d="M22.5 19.5c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.8.2-.3.4-1 1.2-1.2 1.4-.2.2-.4.2-.7 0-.4-.2-1.5-.6-2.8-1.8-1-1-1.7-2.2-1.9-2.6-.2-.4 0-.6.2-.7l.6-.7c.2-.2.2-.4.3-.6 0-.2 0-.5-.1-.7l-1-2.3c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.8s1.2 3.3 1.4 3.5c.2.2 2.4 3.8 5.8 5.3.8.3 1.4.5 1.9.6.8.2 1.5.2 2.1.1.6-.1 2-.8 2.3-1.6.3-.8.3-1.4.2-1.6z" fill="white" />
    </svg>
  );
}

/* ─── Chips de navegação rápida ──────────────────────────── */
const QUICK_CHIPS = [
  {
    id: "airbnb",
    label: "Airbnb",
    Icon: AirbnbLogo,
    answer:
      "No Airbnb, a Be Wild cuida do anúncio completo: fotos profissionais, descrição otimizada, precificação dinâmica, resposta a hóspedes e gestão de avaliações. Seu imóvel aparece nos primeiros resultados.",
  },
  {
    id: "booking",
    label: "Booking.com",
    Icon: BookingLogo,
    answer:
      "No Booking.com, configuramos extranet, políticas, tarifas e disponibilidade. O calendário sincroniza automaticamente com Airbnb para evitar conflito de reservas.",
  },
  {
    id: "vrbo",
    label: "Vrbo",
    Icon: VrboLogo,
    answer:
      "O Vrbo atinge um público diferente — famílias e grupos que viajam pelos EUA e Europa. Expandimos sua presença para além do Airbnb e Booking quando o perfil do imóvel permite.",
  },
  {
    id: "whatsapp",
    label: "Falar agora",
    Icon: WhatsAppLogo,
    answer: "__WHATSAPP__",
  },
];

/* ─── Tópicos de FAQ mais comuns ──────────────────────────── */
const FAQ_QUICK = FAQS.slice(0, 5);

/* ─── Componente principal ───────────────────────────────── */
export default function BewildChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Olá! Sou a assistente da Be Wild. Escolha um tópico abaixo ou pergunte diretamente.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [phase, setPhase] = useState<"initial" | "chat">("initial");
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function addMessage(role: "bot" | "user", text: string) {
    setMessages((prev) => [...prev, { role, text }]);
  }

  function handleChip(chip: (typeof QUICK_CHIPS)[0]) {
    if (chip.answer === "__WHATSAPP__") {
      window.open(whatsappHref("Olá, quero saber mais sobre o BeWild Host Care"), "_blank");
      return;
    }
    setPhase("chat");
    addMessage("user", chip.label);
    setTimeout(() => addMessage("bot", chip.answer), 380);
  }

  function handleFaq(faq: { q: string; a: string }) {
    setPhase("chat");
    addMessage("user", faq.q);
    setTimeout(() => addMessage("bot", faq.a), 380);
  }

  function handleSend() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setPhase("chat");
    addMessage("user", trimmed);
    setInputValue("");

    // Busca FAQ mais próxima
    const lower = trimmed.toLowerCase();
    const matched = FAQS.find(
      (f) =>
        f.q.toLowerCase().includes(lower.split(" ")[0]) ||
        lower.includes(f.q.toLowerCase().split(" ")[1] || "")
    );

    setTimeout(() => {
      if (matched) {
        addMessage("bot", matched.a);
      } else {
        addMessage(
          "bot",
          "Essa pergunta merece uma resposta personalizada. Vou te conectar com nossa equipe pelo WhatsApp para você falar com alguém agora."
        );
        setTimeout(() => {
          window.open(whatsappHref(`Olá! Tenho uma dúvida: ${trimmed}`), "_blank");
        }, 900);
      }
    }, 440);
  }

  function handleReset() {
    setPhase("initial");
    setMessages([
      {
        role: "bot",
        text: "Olá! Sou a assistente da Be Wild. Escolha um tópico abaixo ou pergunte diretamente.",
      },
    ]);
  }

  return (
    <>
      {/* ── Botão flutuante ─────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed z-[90] transition-all duration-300 hover:scale-105"
        style={{
          bottom: "96px", // acima do WhatsApp
          right: "20px",
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "var(--bw-ink)",
          boxShadow: "0 8px 32px rgba(10,17,30,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid var(--bw-gold)",
        }}
        aria-label={open ? "Fechar chat" : "Abrir chat Be Wild"}
      >
        {open ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <MessageSquare className="h-5 w-5 text-bewild-gold" style={{ color: "var(--bw-gold)" }} />
        )}
        {/* Badge de notificação */}
        {!open && (
          <span
            className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white"
            style={{ background: "var(--bw-gold)" }}
          />
        )}
      </button>

      {/* ── Painel de chat ───────────────────────────────────── */}
      <div
        className="fixed z-[89] overflow-hidden"
        style={{
          bottom: "160px",
          right: "20px",
          width: "min(360px, calc(100vw - 32px))",
          borderRadius: "1.25rem",
          background: "#fff",
          boxShadow:
            "0 24px 80px rgba(10,17,30,0.22), 0 4px 16px rgba(10,17,30,0.12)",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.24s ease, transform 0.24s ease",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ background: "var(--bw-ink)", borderRadius: "1.25rem 1.25rem 0 0" }}
        >
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--bw-gold)" }}
          >
            <span className="text-xs font-bold text-bewild-ink" style={{ color: "var(--bw-ink)" }}>
              BW
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-none">Be Wild</p>
            <p className="text-white/50 text-xs mt-0.5">Responde em instantes</p>
          </div>
          {phase === "chat" && (
            <button
              onClick={handleReset}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Reiniciar conversa"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mensagens */}
        <div
          className="overflow-y-auto px-4 py-4 space-y-3"
          style={{ maxHeight: "280px", minHeight: "120px" }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl max-w-[85%]"
                style={{
                  background:
                    msg.role === "user"
                      ? "var(--bw-ink)"
                      : "var(--bw-cream, #F5F7F9)",
                  color: msg.role === "user" ? "#fff" : "var(--bw-text-body, #3d3d3d)",
                  borderRadius:
                    msg.role === "user"
                      ? "1rem 1rem 0.25rem 1rem"
                      : "1rem 1rem 1rem 0.25rem",
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Chips de plataforma — fase inicial */}
        {phase === "initial" && (
          <div className="px-4 pb-3">
            <p className="text-xs text-bewild-text-muted mb-2 font-medium">Plataformas</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => handleChip(chip)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 hover:shadow-sm hover:scale-[1.03]"
                  style={{
                    borderColor: "var(--bw-cream-200, #e9e2d5)",
                    background: "#fff",
                    color: "var(--bw-text-body, #3d3d3d)",
                  }}
                >
                  <chip.Icon />
                  {chip.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-bewild-text-muted mb-2 font-medium">Dúvidas frequentes</p>
            <div className="space-y-1.5">
              {FAQ_QUICK.map((faq, i) => (
                <button
                  key={i}
                  onClick={() => handleFaq(faq)}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl transition-all duration-150 hover:bg-bewild-cream flex items-center gap-2"
                  style={{ color: "var(--bw-text-body, #3d3d3d)" }}
                >
                  <ArrowRight className="h-3 w-3 flex-shrink-0" style={{ color: "var(--bw-gold)" }} />
                  <span className="line-clamp-1">{faq.q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div
          className="flex items-center gap-2 px-3 py-3 border-t"
          style={{ borderColor: "var(--bw-cream-200, #e9e2d5)" }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Faça uma pergunta..."
            className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
            style={{
              background: "var(--bw-cream, #f7f4ef)",
              color: "var(--bw-text-body, #3d3d3d)",
              border: "1.5px solid var(--bw-cream-200, #e9e2d5)",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 disabled:opacity-40"
            style={{
              background: "var(--bw-ink)",
            }}
            aria-label="Enviar"
          >
            <ArrowRight className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </>
  );
}
