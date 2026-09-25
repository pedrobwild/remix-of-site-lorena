/**
 * Conversões de mídia paga (Meta Pixel e Google Ads) num lugar só.
 *
 * - Lead: formulário de CLIENTE entregue (ou já entregue ao WhatsApp). Os
 *   formulários de parceiros e de indicação ficam de fora de propósito: quem
 *   preenche não é cliente, e contar como Lead ensinaria as campanhas a
 *   buscar o público errado. (No GA4 todos continuam como `generate_lead`.)
 * - Contact: clique em WhatsApp/telefone/e-mail e o formulário rápido do
 *   rodapé que abre o WhatsApp.
 * - ViewContent: visita a uma página de projeto (/portfolio/<slug>).
 *
 * Todos passam pelos portões de metaPixel.ts e googleAds.ts (aceite de
 * cookies, fora do /admin). A lista de formulários de cliente é espelhada
 * em supabase/functions/_shared/meta-capi.ts (AD_LEAD_FORMS).
 */
import { trackGoogleAdsConversion } from "@/lib/googleAds";
import { trackMetaEvent } from "@/lib/metaPixel";

export const AD_LEAD_FORMS: readonly string[] = ["/diagnostico", "/orcamento", "/contato", "/o", "/p"];

export function isAdLeadForm(formPath: string | null | undefined): boolean {
  return !!formPath && AD_LEAD_FORMS.includes(formPath);
}

export function reportLead(input: {
  eventId: string;
  formPath: string | null | undefined;
  method: string;
  email?: string | null;
  phoneDigits?: string | null;
}): void {
  if (!isAdLeadForm(input.formPath)) return;
  trackMetaEvent(
    "Lead",
    { content_name: input.method, content_category: input.formPath },
    { eventId: input.eventId },
  );
  trackGoogleAdsConversion("lead", {
    transactionId: input.eventId,
    email: input.email,
    phoneDigits: input.phoneDigits,
  });
}

export function reportContact(channel: "whatsapp" | "phone" | "email", source: string): void {
  trackMetaEvent("Contact", { content_name: source, content_category: channel });
  // Contato por e-mail não é conversão de mídia no Google Ads (só WhatsApp/telefone).
  if (channel !== "email") trackGoogleAdsConversion("contact");
}

export function reportViewContent(slug: string): void {
  if (!slug) return;
  trackMetaEvent("ViewContent", {
    content_type: "product",
    content_ids: [slug],
    content_category: "projeto",
  });
}

/** Slug do projeto quando o caminho é /portfolio/<slug>; senão `null`. */
export function projectSlugFromPath(pathname: string): string | null {
  const m = /^\/portfolio\/([a-z0-9-]+)\/?$/.exec(pathname);
  return m ? m[1] : null;
}
