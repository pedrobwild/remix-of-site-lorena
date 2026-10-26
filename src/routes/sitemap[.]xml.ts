/**
 * GET /sitemap.xml — gerado pelo servidor a partir do banco (ver
 * src/lib/sitemapServer.ts). Substitui o public/sitemap.xml gravado no
 * prebuild, que a hospedagem não regenerava. O robots.txt e o Search Console
 * continuam apontando para este endereço.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { responderSitemap } = await import("@/lib/sitemapServer");
        return responderSitemap("xml");
      },
    },
  },
});
