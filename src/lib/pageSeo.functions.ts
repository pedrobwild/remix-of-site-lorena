import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolvePageSeo } from "@/lib/pageSeo";
import type { PageSeoOverride, PagesSeoMap } from "@/lib/publicPages";

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

/**
 * Títulos/descrições dos posts dos Bastidores editados em /admin/seo, para o
 * ItemList de /servicos sair no HTML do servidor. Falha = sem sobreposições.
 */
export const loadBastidoresSeo = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return {};
    const response = await fetch(`${url}/rest/v1/rpc/get_public_site_settings`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return {};
    const settings = (await response.json()) as { bastidores_seo?: unknown };
    const raw = settings.bastidores_seo;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out: Record<string, { title?: string; description?: string }> = {};
    for (const [code, v] of Object.entries(raw as Record<string, unknown>)) {
      if (!v || typeof v !== "object") continue;
      const o = v as Record<string, unknown>;
      out[code] = {
        ...(typeof o.title === "string" ? { title: o.title } : {}),
        ...(typeof o.description === "string" ? { description: o.description } : {}),
      };
    }
    return out;
  } catch {
    return {};
  }
});

/**
 * Mapa completo da aba Páginas de /admin/seo, lido no servidor pelo loader do
 * root para cada rota aplicar no `head()` (HTML que o Google lê). Falha = {}.
 */
export const loadPagesSeoMap = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return {} as PagesSeoMap;
    const response = await fetch(`${url}/rest/v1/rpc/get_public_site_settings`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return {} as PagesSeoMap;
    const settings = (await response.json()) as { pages_seo?: unknown };
    const raw = settings.pages_seo;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {} as PagesSeoMap;
    const out: PagesSeoMap = {};
    for (const [path, v] of Object.entries(raw as Record<string, unknown>)) {
      if (!v || typeof v !== "object") continue;
      const o = v as Record<string, unknown>;
      const entry: PageSeoOverride = {};
      for (const k of ["title", "description", "og_title", "og_description", "og_image", "keywords"]) {
        if (typeof o[k] === "string" && (o[k] as string).trim()) entry[k] = (o[k] as string).trim();
      }
      if (o.noindex === true) entry.noindex = true;
      out[path] = entry;
    }
    return out;
  } catch {
    return {} as PagesSeoMap;
  }
});
