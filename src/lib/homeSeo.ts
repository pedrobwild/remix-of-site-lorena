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
import { serverMemo } from "@/lib/serverMemo";
import { pageSeoOverride, type PagesSeoMap } from "@/lib/publicPages";

export const HOME_DEFAULT_TITLE = "Reforma de studios e apartamentos compactos em SP | Bewild";
export const HOME_DEFAULT_DESCRIPTION =
  "Reforma de studios e apartamentos compactos em São Paulo para alugar ou morar. Projeto e obra em um só contrato, preço e prazo fechados. Peça seu orçamento.";
export const HOME_KEYWORDS =
  "reforma de compactos, reforma de studio SP, reforma de studios em São Paulo, reforma de apartamento compacto, reforma de apartamento pequeno em SP, reforma para Airbnb, reforma para aluguel, empresa de reforma em São Paulo, Bewild";

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
 * padrão e o `useSeo` do cliente corrige depois. No servidor passa pelo
 * `serverMemo` (60 s, só leitura bem-sucedida): teto de atraso de uma edição
 * no painel aparecer no HTML, igual às demais páginas.
 */
export async function loadHomeSeo(): Promise<HomeSeo> {
  try {
    const read = serverMemo(
      "home:seo-settings",
      () =>
        supabase.rpc("get_public_site_settings").then(({ data, error }) => {
          if (error) throw error;
          return (data as HomeSeoSettings | null) ?? null;
        }),
      { keep: (v) => v !== null },
    );
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), SERVER_TIMEOUT_MS));
    return resolveHomeSeo(await Promise.race([read, timeout]));
  } catch {
    return resolveHomeSeo(null);
  }
}
}
