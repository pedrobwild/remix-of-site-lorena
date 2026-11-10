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
import { publicRpc } from "@/integrations/supabase/publicRest";
import { serverMemo } from "@/lib/serverMemo";
import { pageSeoOverride, type PagesSeoMap } from "@/lib/publicPages";
import { PROVA_FRASE } from "@/content/provas";

/*
 * Uma intenção por página (decisão do Pedro, 10/11/2026; auditoria de SEO,
 * rodada 4, ação 1). A busca "reforma de studio(s)" é da página de serviço
 * /reforma-de-studio-sao-paulo; a home fica com a marca e a reforma turnkey.
 * Até 10/11 o título era "Reforma de studios em São Paulo: 6 fases reais" e a
 * descrição listava as fases (170 caracteres): "reforma de studios" caía na
 * home na posição 37. As 6 fases ficam só em /como-funciona.
 * O título salvo em /admin/seo para a home está vazio (10/11/2026), então este
 * padrão é o que sai em produção; og:* e twitter:* derivam dele (seoHead).
 */
export const HOME_DEFAULT_TITLE = "Bewild | Reforma turnkey de studios e apartamentos em SP";
export const HOME_DEFAULT_DESCRIPTION = `Reforma completa de studios e apartamentos compactos em SP: preço e prazo em contrato, 5 anos de garantia e ${PROVA_FRASE}. Peça orçamento.`;
export const HOME_KEYWORDS =
  "reforma turnkey em São Paulo, reforma de compactos, reforma de apartamento compacto, reforma de apartamento pequeno em SP, reforma para Airbnb, reforma para aluguel, empresa de reforma em São Paulo, Bewild";

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
      async () => {
        const { data, error } = await publicRpc<HomeSeoSettings>("get_public_site_settings");
        if (error) throw error;
        return (data as HomeSeoSettings | null) ?? null;
      },
      { keep: (v) => v !== null },
    );
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), SERVER_TIMEOUT_MS));
    return resolveHomeSeo(await Promise.race([read, timeout]));
  } catch {
    return resolveHomeSeo(null);
  }
}
