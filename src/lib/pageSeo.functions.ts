import { createServerFn } from "@tanstack/react-start";
import { oneOf } from "@/lib/lightValidators";
import { resolvePageSeo } from "@/lib/pageSeo";
import type { PagesSeoMap } from "@/lib/publicPages";
import { readPublicSiteSettings } from "@/lib/siteSettingsServer";

/** Leitura pública sanitizada: nunca devolve outras configurações do site. */
export const loadPageSeo = createServerFn({ method: "GET" })
  .inputValidator(oneOf(["/portfolio", "/conteudos", "/servicos", "/orcamento", "/contato"] as const))
  .handler(async ({ data: path }) => {
    try {
      const settings = await readPublicSiteSettings();
      if (!settings) return resolvePageSeo(path);
      const typed = settings as { pages_seo?: PagesSeoMap | null };
      return resolvePageSeo(path, typed.pages_seo);
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
    const settings = await readPublicSiteSettings();
    if (!settings) return {};
    const typed = settings as { bastidores_seo?: unknown };
    const raw = typed.bastidores_seo;
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
    const settings = await readPublicSiteSettings();
    if (!settings) return {} as PagesSeoMap;
    const typed = settings as { pages_seo?: unknown };
    const raw = typed.pages_seo;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {} as PagesSeoMap;
    const out: PagesSeoMap = {};
    for (const [path, v] of Object.entries(raw as Record<string, unknown>)) {
      if (!v || typeof v !== "object") continue;
      const o = v as Record<string, unknown>;
      const entry: Record<string, string> = {};
      for (const k of ["title", "description", "og_title", "og_description", "og_image", "keywords"]) {
        if (typeof o[k] === "string" && (o[k] as string).trim()) entry[k] = (o[k] as string).trim();
      }
      out[path] = entry;
    }
    return out;
  } catch {
    return {} as PagesSeoMap;
  }
});
