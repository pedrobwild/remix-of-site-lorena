// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * Valores PÚBLICOS do backend (URL e chave anon/publishable — expostos em
 * qualquer bundle de front). Servem de fallback quando o ambiente de build
 * não fornece .env.
 */
const FALLBACK_ENV = {
  VITE_SUPABASE_URL: "https://aamlnkmqvjcowixdgqii.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbWxua21xdmpjb3dpeGRncWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjY4MTgsImV4cCI6MjA5NTk0MjgxOH0.7qzXsHAz4qq66hTb65KI5kqcrHvWmw73WCZtf_IsT0E",
  VITE_SUPABASE_PROJECT_ID: "aamlnkmqvjcowixdgqii",
} as const;

const pick = (key: keyof typeof FALLBACK_ENV) => process.env[key]?.trim() || FALLBACK_ENV[key];

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(pick("VITE_SUPABASE_URL")),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        pick("VITE_SUPABASE_PUBLISHABLE_KEY"),
      ),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(pick("VITE_SUPABASE_PROJECT_ID")),
    },
  },
});
