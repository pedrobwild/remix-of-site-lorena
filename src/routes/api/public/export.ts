import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = process.env["SUPABASE_URL"];
        if (!url) return Response.json({ error: "Consulta indisponível." }, { status: 503 });
        const { proxyExport } = await import("@/lib/apiExport.server");
        try { return await proxyExport(request, url); }
        catch { return Response.json({ error: "Consulta indisponível. Tente novamente." }, { status: 502 }); }
      },
      POST: () => Response.json({ error: "Acesso somente leitura. Use GET." }, { status: 405, headers: { Allow: "GET" } }),
    },
  },
});