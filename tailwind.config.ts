import type { Config } from "tailwindcss";

/**
 * Tailwind — tokens da marca **Bewild**.
 * A paleta deriva da logo (nó azul em gradiente): azul profundo + petróleo,
 * preto com leve tom azulado, cinza concreto e off-white.
 * Mantemos `theme.extend` para não quebrar utilitários padrão usados em
 * rotas internas legadas.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* ── Tokens do /guia-do-investidor ──
           Declarados só dentro de `.guia-root` (src/pages/guia-investidor.css).
           Fora dessa rota as variáveis não existem, então estas utilitárias
           não são usadas por nenhuma outra página. */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        gold: { DEFAULT: "hsl(var(--gold))", light: "hsl(var(--gold-light))" },
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
        },
      },
      fontFamily: {
        // Bewild brand: Playfair (serif) para títulos, Poppins (sans light) para corpo.
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["Poppins", "Inter", "system-ui", "sans-serif"],
        // Compat com rotas internas legadas que ainda chamam font-sans/Manrope.
        sans: ["Poppins", "Inter", "system-ui", "sans-serif"],
        manrope: ["Manrope", "Inter", "system-ui", "sans-serif"],
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
        // /guia-do-investidor
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        elevated: "var(--shadow-elevated)",
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
        // /guia-do-investidor
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        "fade-in": { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in-up": { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { "0%": { transform: "scale(0.96)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        "slide-in-right": { "0%": { transform: "translateX(100%)" }, "100%": { transform: "translateX(0)" } },
      },
      animation: {
        "bewild-marquee": "bewild-marquee 38s linear infinite",
        "bewild-float": "bewild-float 6s ease-in-out infinite",
        // /guia-do-investidor
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 3s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out both",
        "fade-in-up": "fade-in-up 0.5s ease-out both",
        "scale-in": "scale-in 0.3s ease-out both",
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
