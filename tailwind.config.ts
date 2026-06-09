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
          "gold-accessible": "#7A5C1E", // gold para eyebrows em fundo claro — ratio ≥5.7:1

          // ── Light mode tokens ────────────────────────
          cream:   "#F7F4EF",      // fundo principal editorial
          "cream-100": "#F2EFE8",  // cream levemente mais escuro
          "cream-200": "#E9E2D5",  // separadores, bordas creme
          parchment: "#EDE9E0",    // cards elevados sobre cream
          "text-primary": "#0A1628",  // texto principal
          "text-body": "#3D3D3D",     // parágrafos
          "text-muted": "#5C5C5C",    // textos secundários — ratio ≥7:1 em cream
          "text-label": "#6B6B6B",    // labels uppercase
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],  // títulos editoriais — serif
        body: ["Poppins", "system-ui", "sans-serif"],         // corpo — sans geométrica
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      maxWidth: {
        wrap: "76rem",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        // Light mode — inspirado em Tabas e Guesty
        "bewild-card":    "0px 1px 2px rgba(96,97,112,0.16), 0px 4px 16px rgba(96,97,112,0.08)",
        "bewild-card-hover": "0px 4px 20px rgba(96,97,112,0.22), 0px 12px 40px rgba(96,97,112,0.12)",
        "bewild-float":   "0 24px 60px -20px rgba(10,30,60,0.18)",
        "bewild-premium": "0 48px 100px 0 rgba(17,12,46,0.10)",  // Guesty modal shadow
        "bewild-gold":    "0 8px 24px rgba(214,166,75,0.25)",
        "bewild-section": "0 2px 2px 0 rgba(0,0,0,0.06)",        // Guesty dropdown shadow
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
