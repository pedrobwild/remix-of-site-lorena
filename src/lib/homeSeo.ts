/**
 * Título, descrição e Open Graph da home que saem no HTML do servidor.
 *
 * O painel /admin/seo (aba Home e aba Páginas) grava os textos em
 * `site_settings`. Até 08/10/2026 só o cliente os lia (useSeo), depois do
 * carregamento: o HTML bruto, que o Google e os aplicativos de mensagem leem,
 * saía sempre com o título fixo. Aqui a mesma regra do cliente — a aba
 * "Páginas" vence a aba "Home", e campo vazio cai no texto padrão — roda no
 * loader da rota "/".
 */
import { supabase } from "@/integrations/supabase/client";
import { pageSeoOverride, type PagesSeoMap } from "@/lib/publicPages";

export const HOME_DEFAULT_TITLE = "Reforma de apartamentos e studios em São Paulo | Bewild";
export const HOME_DEFAULT_DESCRIPTION =
  "Reforma completa de apartamentos e studios em São Paulo: projeto, obra, marcenaria e mobília em um só contrato, preço e prazo fechados, 5 anos de garantia.";

export type HomeSeoSettings = {
  home_seo_title?: string | null;
  home_seo_description?: string | null;
  home_og_title?: string | null;
  home_og_description?: string | null;
  home_og_image?: string | null;
  pages_seo?: PagesSeoMap | null;
};

export type HomeSeo = {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
};

const clean = (v?: string | null) => (v ?? "").trim() || undefined;

export function resolveHomeSeo(settings?: HomeSeoSettings | null): HomeSeo {
  const ov = pageSeoOverride(settings?.pages_seo, "/");
  return {
    title: ov.title || clean(settings?.home_seo_title) || HOME_DEFAULT_TITLE,
    description: ov.description || clean(settings?.home_seo_description) || HOME_DEFAULT_DESCRIPTION,
    ogTitle: ov.og_title || clean(settings?.home_og_title),
    ogDescription: ov.og_description || clean(settings?.home_og_description),
    ogImage: ov.og_image || clean(settings?.home_og_image),
  };
}

/** Espera máxima pelo banco no servidor: passou disso, sai o texto padrão. */
const SERVER_TIMEOUT_MS = 2500;

/**
 * Loader da home. Nunca rejeita: falha ou demora do banco devolve o texto
 * padrão e o `useSeo` do cliente corrige depois. Sem cache em módulo — o
 * isolate do servidor serviria o título antigo depois de uma edição no painel.
 */
export async function loadHomeSeo(): Promise<HomeSeo> {
  try {
    const read = supabase.rpc("get_public_site_settings").then(({ data, error }) => {
      if (error) throw error;
      return (data as HomeSeoSettings | null) ?? null;
    });
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), SERVER_TIMEOUT_MS));
    return resolveHomeSeo(await Promise.race([read, timeout]));
  } catch {
    return resolveHomeSeo(null);
  }
}
