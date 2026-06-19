/**
 * MaintenancePage — página de espera que substitui todo o site público
 * enquanto MAINTENANCE_MODE === true (ver src/config/site.ts).
 *
 * Autocontida: sem nav, sem footer, sem sticky CTA. NOINDEX para o
 * Google não indexar o conteúdo de espera.
 */
import { CONTACT, whatsappHref } from "../components/landing/content";
import { useSeo } from "../lib/useSeo";

export default function MaintenancePage() {
  useSeo({
    title: "Bewild — Site em manutenção",
    description: "Estamos finalizando o novo site da Bewild. Voltamos em breve.",
    noindex: true,
  });

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        position: "relative",
        backgroundColor: "#0B2545",
        backgroundImage:
          "linear-gradient(rgba(11,37,69,0.78), rgba(11,37,69,0.92)), url('/hero-studio-desktop.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 560, width: "100%", display: "grid", gap: 28, justifyItems: "center" }}>
        <img
          src="/brand/bewild-logo-branca.png"
          alt="Bewild"
          style={{ width: "clamp(140px, 28vw, 200px)", height: "auto" }}
        />
        <h1
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(28px, 5vw, 44px)",
            lineHeight: 1.15,
            margin: 0,
            color: "#fff",
          }}
        >
          Site em manutenção
        </h1>
        <p
          style={{
            fontSize: "clamp(16px, 2.2vw, 18px)",
            lineHeight: 1.55,
            margin: 0,
            color: "rgba(255,255,255,0.82)",
            maxWidth: 460,
          }}
        >
          Estamos finalizando o novo site da Bewild. Voltamos em breve.
        </p>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            margin: 0,
            color: "rgba(255,255,255,0.6)",
            maxWidth: 460,
          }}
        >
          Reforma turn-key de studios para short stay em São Paulo.
        </p>
        <a
          href={whatsappHref(CONTACT.whatsappText)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: "#2F86B8",
            color: "#fff",
            padding: "14px 28px",
            borderRadius: 999,
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 16,
            textDecoration: "none",
            minHeight: 48,
            marginTop: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          Falar no WhatsApp
        </a>
      </div>
    </main>
  );
}
