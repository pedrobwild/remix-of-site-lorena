import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { prerenderPosts } from "./scripts/prerenderPosts";
import { prerenderGuia } from "./scripts/prerenderGuia";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aamlnkmqvjcowixdgqii.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbWxua21xdmpjb3dpeGRncWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjY4MTgsImV4cCI6MjA5NTk0MjgxOH0.7qzXsHAz4qq66hTb65KI5kqcrHvWmw73WCZtf_IsT0E";
const SUPABASE_PROJECT_ID = process.env.VITE_SUPABASE_PROJECT_ID || "aamlnkmqvjcowixdgqii";

export default defineConfig({
  plugins: [react(), prerenderPosts(), prerenderGuia()],
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPABASE_PUBLISHABLE_KEY),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(SUPABASE_PROJECT_ID),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
});
