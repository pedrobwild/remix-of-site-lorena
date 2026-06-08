import type { Config } from "tailwindcss";

/**
 * Tailwind — tokens da marca **bewild**.
 * A paleta deriva da logo (nó azul em gradiente): azul profundo + petróleo,
 * preto com leve tom azulado, cinza concreto e off-white.
 * Mantemos `theme.extend` para não quebrar utilitários padrão usados em
 * outras rotas legadas (Lorena Alves).
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bewild: {
          ink: "#0A111E", // preto profundo azulado (base escura)
          night: "#0E1B30", // navy quase preto
          navy: "#102A4F", // azul profundo da marca
          blue: "#1E5BB8", // accent primário (azul da logo)
          "blue-600": "#1B4FA0",
          "blue-400": "#3B82C4", // azul claro do gradiente
          steel: "#5B6B7F", // cinza azulado
          concrete: "#8A8F98", // cinza concreto
          line: "#E4E6EA", // borda sutil em fundo claro
          bone: "#F6F5F2", // off-white
          paper: "#FFFFFF",
          gold: "#D6A64B",         // Signal Gold — CTA, selos, prova de valor
          "gold-600": "#B8882C",   // hover do gold
          "gold-400": "#E8BB6A",  // tint claro do gold
        },
      },
      fontFamily: {
        display: ["Manrope", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "Manrope", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      maxWidth: {
        wrap: "76rem",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        "bewild-card": "0 1px 2px rgba(16,42,79,0.04), 0 12px 40px -12px rgba(16,42,79,0.18)",
        "bewild-float": "0 24px 60px -20px rgba(10,17,30,0.45)",
        "bewild-premium": "0 12px 40px rgba(17,16,14,0.10)",
        "bewild-gold": "0 8px 24px rgba(214,166,75,0.25)",
      },
      keyframes: {
        "bewild-marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "bewild-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "bewild-marquee": "bewild-marquee 38s linear infinite",
        "bewild-float": "bewild-float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
