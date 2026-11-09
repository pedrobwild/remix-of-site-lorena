// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";
import path from "node:path";
import { bwaShellPlugin } from "./scripts/bwaShell";

Object.assign(process.env, loadEnv(process.env.NODE_ENV || "development", process.cwd(), ""));

// Chaves públicas (publishable/anon) do backend. O .env é ignorado pelo git, então o
// build publicado não as recebia e o servidor quebrava com "supabaseUrl is required".
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aamlnkmqvjcowixdgqii.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbWxua21xdmpjb3dpeGRncWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjY4MTgsImV4cCI6MjA5NTk0MjgxOH0.7qzXsHAz4qq66hTb65KI5kqcrHvWmw73WCZtf_IsT0E";
const SUPABASE_PROJECT_ID = process.env.VITE_SUPABASE_PROJECT_ID || "aamlnkmqvjcowixdgqii";

// Cabeçalhos de cache dos estáticos de public/ (fotos, vídeos, marca, ícones),
// escritos no `_headers` que a hospedagem (Cloudflare) lê. Os arquivos de
// /assets/ já saem com hash e `immutable` (padrão do nitro); estes não têm
// hash, então 30 dias com revalidação em segundo plano — o PageSpeed apontava
// "/images/… sem cache" (25/10/2026). HTML continua com o cache curto definido
// em src/server.ts. O tipo do preset da Lovable só declara `preset/output/
// cloudflare`, mas repassa todas as opções ao nitro (`...userNitroOpts`).
const STATIC_CACHE = { headers: { "cache-control": "public, max-age=2592000, stale-while-revalidate=604800" } };
const NITRO_OPTIONS = {
  routeRules: {
    "/images/**": STATIC_CACHE,
    "/videos/**": STATIC_CACHE,
    "/brand/**": STATIC_CACHE,
    "/favicon-*.png": STATIC_CACHE,
    "/favicon.ico": STATIC_CACHE,
    "/og_final_v2.jpg": STATIC_CACHE,
  },
} as unknown as { preset?: string };

export default defineConfig({
  // Deriva src/pages/bwa-shell.css (parte de home-bwa.css que as páginas
  // internas usam) no início de cada build/dev — ver scripts/bwaShell.ts.
  plugins: [bwaShellPlugin(process.cwd())],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: NITRO_OPTIONS,
  vite: {
    resolve: { alias: {
      "entities/lib/decode.js": path.resolve("node_modules/entities/lib/decode.js"),
      "entities/lib/encode.js": path.resolve("node_modules/entities/lib/encode.js"),
      "entities": path.resolve("node_modules/entities"),
    } },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPABASE_KEY),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(SUPABASE_PROJECT_ID),
    },
  },
});
