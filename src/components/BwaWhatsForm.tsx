import { useState } from "react";
import type { FormEvent } from "react";
import { trackEvent } from "@/lib/ga4";

/**
 * BwaWhatsForm — formulário compacto no rodapé. Ao enviar, monta a mensagem
 * e abre a conversa direto no WhatsApp oficial da Bewild (sem backend).
 * A home usa o mesmo formulário em HTML estático (home-bwa-body.ts), ligado
 * pelo home-bwa-script.js — mantenha os dois em sincronia.
 */
const WHATS_NUMBER = "5511911906183";

export default function BwaWhatsForm() {
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = ["Olá! Me chamo " + nome.trim() + ".", mensagem.trim()]
      .filter(Boolean)
      .join(" ");
    trackEvent("cta_click", { location: "footer-whatsapp" });
    window.open(
      `https://wa.me/${WHATS_NUMBER}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <form className="bwa-footer-whats" data-whats-form onSubmit={handleSubmit}>
      <h3>Prefere falar agora?</h3>
      <p>Escreva o que você precisa e a conversa abre direto no nosso WhatsApp.</p>
      <label className="bwa-fw-field">
        <span>Seu nome</span>
        <input
          type="text"
          name="nome"
          required
          maxLength={80}
          placeholder="Como te chamamos?"
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </label>
      <label className="bwa-fw-field">
        <span>O que você precisa?</span>
        <textarea
          name="mensagem"
          rows={3}
          required
          maxLength={600}
          placeholder="Ex.: reforma de studio de 28 m² em Pinheiros"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
        />
      </label>
      <button type="submit" className="bwa-button bwa-button-light">
        Enviar no WhatsApp <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
