import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolvePageSeo } from "@/lib/pageSeo";
import type { PagesSeoMap } from "@/lib/publicPages";

/** Leitura pública sanitizada: nunca devolve outras configurações do site. */
export const loadPageSeo = createServerFn({ method: "GET" })
  .inputValidator(z.enum(["/portfolio", "/conteudos", "/servicos", "/orcamento", "/contato"]))
  .handler(async ({ data: path }) => {
    try {
      const url = process.env["SUPABASE_URL"];
      const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
      if (!url || !key) return resolvePageSeo(path);
      const response = await fetch(`${url}/rest/v1/rpc/get_public_site_settings`, {
        method: "POST",
        headers: { apikey: key, "Content-Type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(2500),
      });
      if (!response.ok) return resolvePageSeo(path);
      const settings = await response.json() as { pages_seo?: PagesSeoMap | null };
      return resolvePageSeo(path, settings.pages_seo);
    } catch {
      return resolvePageSeo(path);
    }
  });
