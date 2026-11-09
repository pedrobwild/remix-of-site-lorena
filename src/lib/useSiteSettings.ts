import { useEffect, useState } from "react";
import { publicRpc } from "@/integrations/supabase/publicRest";
import { devWarn } from "@/lib/devLog";
import type { PagesSeoMap } from "@/lib/publicPages";

export type SiteSettings = {
  id: number;
  site_title: string | null;
  site_description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address_street: string | null;
  address_city: string | null;
  address_region: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  pinterest_url: string | null;
  default_og_image: string | null;

  // Identidade profissional
  cnpj: string | null;
  cau: string | null;
  whatsapp_number: string | null;

  // SEO base
  seo_default_title: string | null;
  seo_default_description: string | null;
  seo_og_image: string | null;
  seo_twitter_handle: string | null;
  seo_canonical_base: string | null;
  seo_robots: string | null;

  // SEO avançado — verificações
  google_site_verification: string | null;
  bing_site_verification: string | null;
  yandex_verification: string | null;
  facebook_domain_verification: string | null;
  pinterest_site_verification: string | null;

  // Analytics & pixels
  google_analytics_id: string | null;
  google_tag_manager_id: string | null;
  google_ads_conversion_id: string | null;
  /** Rótulo da conversão de lead no Google Ads (a parte depois de "AW-…/"). */
  google_ads_lead_label: string | null;
  /** Rótulo da conversão de contato (WhatsApp/telefone) no Google Ads. */
  google_ads_contact_label: string | null;
  /** Rótulo da conversão de cadastro (parceiro, incorporadora, indicação) no Google Ads. */
  google_ads_application_label: string | null;
  meta_pixel_id: string | null;
  /** Código de teste da API de Conversões do Meta (vazio = eventos reais). */
  meta_capi_test_event_code: string | null;
  hotjar_id: string | null;
  clarity_id: string | null;

  // SEO extras
  seo_keywords: string | null;
  seo_author: string | null;
  seo_geo_region: string | null;
  seo_geo_placename: string | null;
  seo_geo_position: string | null;

  // Local business
  business_type: string | null;
  business_founding_year: string | null;
  business_price_range: string | null;
  business_postal_code: string | null;
  business_opening_hours: string | null;
  google_maps_url: string | null;
  google_business_profile_url: string | null;

  seo_custom_head_html: string | null;
  seo_last_audit_at: string | null;
  seo_last_search_console_submit: string | null;
  home_seo_title: string | null;
  home_seo_description: string | null;
  home_og_title: string | null;
  home_og_description: string | null;
  home_og_image: string | null;
  bastidores_seo: Record<string, { title?: string; description?: string }> | null;
  /** Título/descrição/Open Graph por caminho de página pública (ver publicPages.ts). */
  pages_seo: PagesSeoMap | null;
};

const DEFAULTS: SiteSettings = {
  id: 1,
  site_title: "Bewild",
  site_description:
    "Bewild prepara studios para short stay com processo de obra disciplinado e operação pronta para escalar.",
  contact_email: "contato@bewild.com.br",
  contact_phone: null,
  address_street: null,
  address_city: "São Paulo",
  address_region: "SP",
  instagram_url: "https://instagram.com/bewild",
  linkedin_url: null,
  pinterest_url: null,
  default_og_image: null,

  // Identidade oficial da Bewild (decisão de 17/09/2026). Estes defaults não
  // são "enquanto carrega": a coluna `cnpj` ainda não existe em produção, então
  // `organizationJsonLd` (schema.org da organização) publica exatamente o que está
  // aqui. Os valores anteriores eram herdados do site anterior. Travados em
  // src/lib/__tests__/identidadeOficial.test.ts.
  cnpj: "47.350.338/0001-37",
  cau: "A162437-7",
  whatsapp_number: "5511911906183",

  seo_default_title: "Bewild — Studios prontos para short stay",
  seo_default_description:
    "Bewild prepara studios para short stay com processo de obra disciplinado e operação pronta para escalar.",
  seo_og_image: null,
  seo_twitter_handle: null,
  seo_canonical_base: "https://bewild.com.br",
  seo_robots: "index, follow",

  google_site_verification: null,
  bing_site_verification: null,
  yandex_verification: null,
  facebook_domain_verification: null,
  pinterest_site_verification: null,

  google_analytics_id: null,
  google_tag_manager_id: null,
  google_ads_conversion_id: null,
  google_ads_lead_label: null,
  google_ads_contact_label: null,
  google_ads_application_label: null,
  meta_pixel_id: null,
  meta_capi_test_event_code: null,
  hotjar_id: null,
  clarity_id: null,

  seo_keywords: null,
  seo_author: "Bewild",
  seo_geo_region: "BR-SP",
  seo_geo_placename: "São Paulo, SP",
  // Sem coordenada padrão: o valor antigo (-23.5505;-46.6333) era o centro de SP,
  // não o escritório. Só publicar se o admin informar a coordenada real.
  seo_geo_position: null,

  business_type: "ProfessionalService",
  business_founding_year: null,
  business_price_range: "$$$",
  business_postal_code: null,
  business_opening_hours: null,
  google_maps_url: null,
  google_business_profile_url: null,

  seo_custom_head_html: null,
  seo_last_audit_at: null,
  seo_last_search_console_submit: null,
  home_seo_title: null,
  home_seo_description: null,
  home_og_title: null,
  home_og_description: null,
  home_og_image: null,
  bastidores_seo: {},
  pages_seo: {},
};

/**
 * IDs reais dos trackers em produção (lidos de `site_settings` em 09/11/2026).
 * Só entram quando o banco não responde ou a coluna vem vazia: de 06/11 a
 * 08/11/2026 o backend da Lovable Cloud ficou pausado ~41 h e, como os IDs só
 * vinham do banco, Pixel da Meta e Google Ads não carregaram em nenhuma
 * página. Valor preenchido no banco sempre vence. Trocou um ID no painel?
 * Atualize aqui também (para desligar um tracker é preciso tirá-lo daqui).
 * O GA4 principal não depende disto: é fixo em `GA4_MEASUREMENT_ID` (ga4.ts);
 * `google_analytics_id` é um GA4 extra e o GTM não é usado — ficam sem padrão.
 */
export const TRACKER_DEFAULTS = {
  meta_pixel_id: "644216424824915",
  google_ads_conversion_id: "AW-16893787587",
  google_ads_lead_label: "NY8ECIz844kdEMP7yvc-",
  google_ads_contact_label: "wMWECJmtp6AdEMP7yvc-",
  google_ads_application_label: "1AYaCKflp6AdEMP7yvc-",
} as const satisfies Partial<Record<keyof SiteSettings, string>>;

type TrackerKey = keyof typeof TRACKER_DEFAULTS;
const TRACKER_KEYS = Object.keys(TRACKER_DEFAULTS) as TrackerKey[];

/**
 * Linha do banco sobre os DEFAULTS; tracker vazio (null, ausente ou só
 * espaços) cai no ID de produção.
 */
export function mergeSiteSettings(row: Record<string, unknown> | null | undefined): SiteSettings {
  const merged = { ...DEFAULTS, ...(row ?? {}) } as SiteSettings;
  for (const key of TRACKER_KEYS) {
    const value = merged[key];
    if (typeof value !== "string" || !value.trim()) merged[key] = TRACKER_DEFAULTS[key];
  }
  return merged;
}

/**
 * Usado quando a leitura falha. Antes da primeira resposta,
 * `getCachedSiteSettings` continua sem trackers: injetar o padrão já na
 * montagem prenderia esse ID (o script não é trocado depois) mesmo que o
 * banco tivesse outro.
 */
const OFFLINE_DEFAULTS: SiteSettings = mergeSiteSettings(null);

/** Teto da leitura: backend pausado pode segurar a conexão sem responder. */
export const SITE_SETTINGS_TIMEOUT_MS = 6000;

let cache: SiteSettings | null = null;
let inflight: Promise<SiteSettings> | null = null;

/**
 * Settings já carregadas (ou DEFAULTS) — síncrono. Permite aplicar SEO da
 * rota na hora, sem esperar a rede; `fetchSiteSettings` refina depois.
 */
export function getCachedSiteSettings(): SiteSettings {
  return cache ?? DEFAULTS;
}

/**
 * Lê `site_settings` (linha única). Nunca rejeita: em erro devolve o último
 * valor bom (ou DEFAULTS) SEM cachear — a próxima chamada tenta de novo.
 * Antes o `{ error }` do supabase-js era ignorado e DEFAULTS ficavam em cache
 * a sessão inteira (trackers, verificações e og:image sumiam até o reload), e
 * uma exceção deixava `inflight` preso para sempre.
 */
export async function fetchSiteSettings(force = false): Promise<SiteSettings> {
  if (cache && !force) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), SITE_SETTINGS_TIMEOUT_MS) : null;
    try {
      const { data, error } = await publicRpc<Record<string, unknown>>(
        "get_public_site_settings",
        {},
        controller ? { signal: controller.signal } : undefined,
      );
      if (error) {
        devWarn("[useSiteSettings] leitura falhou (não cacheado):", error);
        return cache ?? OFFLINE_DEFAULTS;
      }
      cache = mergeSiteSettings(data as Record<string, unknown> | null);
      return cache;
    } catch (err) {
      devWarn("[useSiteSettings] leitura lançou (não cacheado):", err);
      return cache ?? OFFLINE_DEFAULTS;
    } finally {
      if (timer) clearTimeout(timer);
      inflight = null;
    }
  })();
  return inflight;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let mounted = true;
    fetchSiteSettings()
      .then((s) => {
        if (!mounted) return;
        setSettings(s);
        setLoading(false);
      })
      .catch(() => {
        // fetchSiteSettings não rejeita; guarda contra regressão futura.
        if (!mounted) return;
        setSettings(OFFLINE_DEFAULTS);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { settings, loading };
}

export function invalidateSiteSettings() {
  cache = null;
}
