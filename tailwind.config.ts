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
          // ── Base escura (dark sections) ─────────────────────────
          ink:    "#0A2540",  // tinta — petróleo quase preto (era #0A111E)
          night:  "#0E2C4A",  // navy de respiro (era #0E1B30)
          navy:   "#003B63",  // petróleo profundo de fundo (era #102A4F)

          // ── Azul de marca = AÇÃO PRIMÁRIA ───────────────────────
          blue:        "#004C7F",  // ★ cor principal da marca — CTA primário
          "blue-600":  "#003B63",  // hover do CTA (mais escuro = afunda)
          "blue-400":  "#006AA8",  // accent claro / links / detalhes em dark
          "blue-300":  "#3D8FC4",  // tint p/ eyebrows e ícones em dark

          // ── Neutros ─────────────────────────────────────────────
          steel:    "#516372",  // cinza azulado — texto secundário em claro
          concrete: "#8A8F98",  // cinza concreto — legendas
          line:     "#E4E7EB",  // borda sutil em fundo claro
          bone:     "#F5F7F9",  // ⚠ realinhado ao "respiro" (era #F6F5F2)
          paper:    "#FFFFFF",

          // ── GOLD = SELO DE PROVA (nunca mais botão) ─────────────
          gold:            "#C9A24B",  // selos, números de prova, "pronto p/ operar"
          "gold-600":      "#A8852F",  // hover de selo (raro)
          "gold-400":      "#DCBE7A",  // tint claro do selo
          "gold-accessible": "#6E5418", // gold p/ TEXTO em fundo claro — ratio ≥ 5.7:1

          // ── Light mode tokens ───────────────────────────────────
          cream:       "#F5F7F9",  // ⚠ era #F7F4EF (creme). Agora frio, alinhado ao branco/petróleo
          "cream-100": "#EEF2F5",
          "cream-200": "#E4E7EB",  // separadores
          parchment:   "#FFFFFF",  // cards elevados agora são brancos puros
          "text-primary": "#0A2540",
          "text-body":    "#3D3D3D",
          "text-muted":   "#5C5C5C",
          "text-label":   "#505050",
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
        "bewild-float":   "0 24px 60px -20px rgba(0,76,127,0.18)",
        "bewild-premium": "0 48px 100px 0 rgba(10,37,64,0.10)",  // modal shadow petróleo
        "bewild-gold":    "0 8px 24px rgba(201,162,75,0.25)",     // selo — usa-se raramente
        "bewild-blue":    "0 8px 24px rgba(0,76,127,0.22)",       // sombra CTA petróleo
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
