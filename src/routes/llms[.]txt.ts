/**
 * GET /llms.txt — modelo src/content/llms.txt com artigos, bairros e vídeos
 * preenchidos pelo servidor (ver src/lib/sitemapServer.ts). /.well-known/llms.txt
 * é a mesma resposta: src/server.ts reescreve o caminho para cá.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        const { responderSitemap } = await import("@/lib/sitemapServer");
        return responderSitemap("llms");
      },
    },
  },
});
