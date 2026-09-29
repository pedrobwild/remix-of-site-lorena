import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { prerenderPosts } from "./scripts/prerenderPosts";
import { prerenderGuia } from "./scripts/prerenderGuia";

/**
 * Valores PÚBLICOS do backend (URL e chave anon/publishable — expostos em
 * qualquer bundle de front). Servem de fallback: o build do Lovable não
 * fornece .env, e sem eles o site sairia sem backend.
 */
const FALLBACK_ENV = {
  VITE_SUPABASE_URL: "https://aamlnkmqvjcowixdgqii.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbWxua21xdmpjb3dpeGRncWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjY4MTgsImV4cCI6MjA5NTk0MjgxOH0.7qzXsHAz4qq66hTb65KI5kqcrHvWmw73WCZtf_IsT0E",
  VITE_SUPABASE_PROJECT_ID: "aamlnkmqvjcowixdgqii",
} as const;

export default defineConfig(({ mode }) => {
  // `loadEnv` lê .env, .env.local, .env.[mode] e as variáveis VITE_* do
  // processo — o mesmo que o Vite expõe em import.meta.env. Antes o config lia
  // só `process.env` (que o Vite NÃO popula a partir do .env) e o `define`
  // abaixo sobrescrevia o .env com o fallback: um .env apontando para outro
  // projeto era ignorado em silêncio.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const pick = (key: keyof typeof FALLBACK_ENV) => env[key]?.trim() || FALLBACK_ENV[key];

  return {
    plugins: [
      react(),
      prerenderPosts({
        supabaseUrl: pick("VITE_SUPABASE_URL"),
        supabaseKey: pick("VITE_SUPABASE_PUBLISHABLE_KEY"),
      }),
      prerenderGuia(),
    ],
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(pick("VITE_SUPABASE_URL")),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(pick("VITE_SUPABASE_PUBLISHABLE_KEY")),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(pick("VITE_SUPABASE_PROJECT_ID")),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      // Evita duas cópias do React (erro "reading 'useState'" de null).
      dedupe: ["react", "react-dom", "react/jsx-runtime"],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react/jsx-runtime"],
    },
    server: {
      host: "::",
      port: 8080,
    },
  };
});
