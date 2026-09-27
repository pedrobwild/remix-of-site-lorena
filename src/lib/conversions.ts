/**
 * Conversões de mídia paga (Meta Pixel e Google Ads) e sinais para públicos,
 * num lugar só.
 *
 * - Lead: formulário de CLIENTE entregue (ou já entregue ao WhatsApp), com
 *   parâmetros sem dado pessoal para segmentar (objetivo, faixa de metragem,
 *   etapa do imóvel, se mora em SP).
 * - SubmitApplication: cadastro de parceiro, de incorporadora e indicação.
 *   Não viram Lead de propósito: quem preenche não é cliente, e contar como
 *   Lead ensinaria as campanhas a buscar o público errado. (No GA4 todos
 *   continuam como `generate_lead`.)
 * - Contact: clique em WhatsApp/telefone/e-mail e o formulário rápido do
 *   rodapé que abre o WhatsApp.
 * - ViewContent: projeto (/portfolio/<slug>), conteúdo (/conteudos/<slug>),
 *   guia do investidor, portfólio e páginas de serviço.
 * - IniciouFormulario (próprio): primeira interação com um formulário —
 *   público de quem começou e não enviou.
 * - VisitanteEngajado (próprio): uma vez por sessão, com 60 s de tela ativa
 *   ou 75% de rolagem numa página longa.
 *
 * No envio de qualquer formulário, a correspondência avançada manual
 * (metaPixel.ts) leva ao Pixel o e-mail, o telefone e o nome de QUEM ENVIOU
 * (em /indique-um-amigo, os campos do payload são os de quem indica; os do
 * indicado ficam só na mensagem e nunca vão à Meta).
 *
 * Todos passam pelos portões de metaPixel.ts e googleAds.ts (aceite de
 * cookies, fora do /admin). A lista de formulários de cliente é espelhada
 * em supabase/functions/_shared/meta-capi.ts (AD_LEAD_FORMS).
 */
import { trackGoogleAdsAudienceEvent, trackGoogleAdsConversion } from "@/lib/googleAds";
import { metaUserDataFrom, setMetaUserData, trackMetaCustomEvent, trackMetaEvent } from "@/lib/metaPixel";

export const AD_LEAD_FORMS: readonly string[] = ["/diagnostico", "/orcamento", "/contato", "/o", "/p"];

/** Formulários que não são de cliente → SubmitApplication com a categoria. */
export const APPLICATION_FORMS: Readonly<Record<string, string>> = {
  "/parceiros": "parceiro",
  "/parceiros/incorporadoras": "incorporadora",
  "/indique-um-amigo": "indicacao",
};

export function isAdLeadForm(formPath: string | null | undefined): boolean {
  return !!formPath && AD_LEAD_FORMS.includes(formPath);
}

// ---------------------------------------------------------------------------
// Parâmetros do Lead (sem dado pessoal)
// ---------------------------------------------------------------------------

/** "Locação tradicional" → "locacao_tradicional" (até 40 caracteres). */
export function slugParam(raw: string | null | undefined): string | null {
  const v = (raw ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)
    .replace(/_+$/g, "");
  return v || null;
}

/** Faixa de metragem — o número exato não ajuda a segmentar. */
export function areaBucket(m2: number | null | undefined): string | null {
  if (typeof m2 !== "number" || !Number.isFinite(m2) || m2 <= 0) return null;
  if (m2 <= 30) return "ate_30";
  if (m2 <= 45) return "31_45";
  if (m2 <= 70) return "46_70";
  if (m2 <= 100) return "71_100";
  return "acima_100";
}

/** Resposta de "Já tem as chaves?" → etapa do imóvel. */
export function etapaImovel(chaves: string | null | undefined): string | null {
  const v = slugParam(chaves);
  if (!v) return null;
  if (v === "sim") return "com_chaves";
  if (v === "ainda_nao" || v === "nao") return "sem_chaves";
  if (v === "estou_comprando") return "comprando";
  return v;
}

export type LeadSignalInput = {
  objetivo?: string | null;
  areaM2?: number | null;
  chaves?: string | null;
  livesInSp?: boolean | null;
};

/** Parâmetros extras do Lead; só entram os que existem. */
export function leadSignalParams(input: LeadSignalInput): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  const objetivo = slugParam(input.objetivo);
  if (objetivo) out.objetivo = objetivo;
  const faixa = areaBucket(input.areaM2);
  if (faixa) out.faixa_m2 = faixa;
  const etapa = etapaImovel(input.chaves);
  if (etapa) out.etapa_imovel = etapa;
  if (typeof input.livesInSp === "boolean") out.mora_em_sp = input.livesInSp;
  return out;
}

// ---------------------------------------------------------------------------
// Envio de formulário
// ---------------------------------------------------------------------------

export function reportLead(
  input: {
    eventId: string;
    formPath: string | null | undefined;
    method: string;
    email?: string | null;
    phoneDigits?: string | null;
    name?: string | null;
  } & LeadSignalInput,
): void {
  const formPath = input.formPath ?? "";
  const application = APPLICATION_FORMS[formPath];
  if (!isAdLeadForm(formPath) && !application) return;

  // Correspondência avançada antes do evento (dados de quem enviou).
  setMetaUserData(metaUserDataFrom({ email: input.email, phoneDigits: input.phoneDigits, name: input.name }));

  if (application) {
    trackMetaEvent(
      "SubmitApplication",
      { content_name: input.method, content_category: application },
      { eventId: input.eventId },
    );
    // No Google não é conversão (não é lead de cliente), mas entra nos
    // públicos com a mesma categoria — remarketing vê o mesmo público.
    trackGoogleAdsAudienceEvent("submit_application", { content_name: input.method, content_category: application });
    return;
  }

  const signals = leadSignalParams(input);
  trackMetaEvent(
    "Lead",
    { content_name: input.method, content_category: formPath, ...signals },
    { eventId: input.eventId },
  );
  trackGoogleAdsConversion("lead", {
    transactionId: input.eventId,
    email: input.email,
    phoneDigits: input.phoneDigits,
    name: input.name,
    params: signals,
  });
}

export function reportContact(channel: "whatsapp" | "phone" | "email", source: string): void {
  trackMetaEvent("Contact", { content_name: source, content_category: channel });
  // Contato por e-mail não é conversão de mídia no Google Ads (só WhatsApp/telefone);
  // como evento de público, entra nos três canais.
  if (channel !== "email") {
    trackGoogleAdsConversion("contact", { params: { content_name: source, content_category: channel } });
  } else {
    trackGoogleAdsAudienceEvent("contact", { content_name: source, content_category: channel });
  }
}

// ---------------------------------------------------------------------------
// Páginas vistas (ViewContent)
// ---------------------------------------------------------------------------

/** Páginas de serviço e de apoio à decisão → id curto no ViewContent. */
export const SERVICE_PAGES: Readonly<Record<string, string>> = {
  "/reforma-de-apartamento-sao-paulo": "reforma-apartamento",
  "/reforma-de-studio-sao-paulo": "reforma-studio",
  "/reforma-de-cobertura-sao-paulo": "reforma-cobertura",
  "/marcenaria": "marcenaria",
  "/como-funciona": "como-funciona",
  "/onde-atuamos": "onde-atuamos",
  "/autorizacao-condominio": "autorizacao-condominio",
  "/escopo": "escopo",
};

export type PageContent = { category: "projeto" | "conteudo" | "guia" | "portfolio" | "servico"; id: string };

/** O que a página mostra, para o ViewContent; `null` = página sem ViewContent. */
export function pageContentFor(pathname: string): PageContent | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  const project = /^\/portfolio\/([a-z0-9-]+)$/.exec(path);
  if (project) return { category: "projeto", id: project[1] };
  const post = /^\/conteudos\/([a-z0-9-]+)$/.exec(path);
  if (post) return { category: "conteudo", id: post[1] };
  if (path === "/guia-do-investidor") return { category: "guia", id: "guia-do-investidor" };
  if (path === "/portfolio") return { category: "portfolio", id: "portfolio" };
  const service = SERVICE_PAGES[path];
  if (service) return { category: "servico", id: service };
  return null;
}

export function reportViewContent(slug: string): void {
  if (!slug) return;
  reportPageContent({ category: "projeto", id: slug });
}

export function reportPageContent(content: PageContent | null): void {
  if (!content || !content.id) return;
  trackMetaEvent("ViewContent", {
    content_type: "product",
    content_ids: [content.id],
    content_category: content.category,
  });
  // Espelho no Google: view_item com o mesmo id e categoria (remarketing).
  trackGoogleAdsAudienceEvent("view_item", { items: [{ id: content.id }], content_category: content.category });
}

/** Slug do projeto quando o caminho é /portfolio/<slug>; senão `null`. */
export function projectSlugFromPath(pathname: string): string | null {
  const m = /^\/portfolio\/([a-z0-9-]+)\/?$/.exec(pathname);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
// Formulário iniciado e visitante engajado
// ---------------------------------------------------------------------------

/** Páginas com formulário de lead/cadastro → nome curto do formulário. */
export const FORM_PAGES: Readonly<Record<string, string>> = {
  "/orcamento": "orcamento",
  "/contato": "contato",
  "/o": "lp-obra",
  "/p": "lp-panfleto",
  "/parceiros": "parceiros",
  "/parceiros/incorporadoras": "incorporadoras",
  "/indique-um-amigo": "indique",
};

export function formKeyForPath(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  return FORM_PAGES[path] ?? null;
}

export function reportFormStart(form: string): void {
  if (!form) return;
  trackMetaCustomEvent("IniciouFormulario", { content_category: form });
  trackGoogleAdsAudienceEvent("form_start", { content_category: form });
}

/** Categoria da página para o VisitanteEngajado ("outra" quando não há). */
export function pageCategoryFor(pathname: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  const content = pageContentFor(path);
  if (content) return content.category;
  if (formKeyForPath(path)) return "formulario";
  return "outra";
}

export function reportEngaged(reason: "tempo" | "rolagem", pathname: string): void {
  trackMetaCustomEvent("VisitanteEngajado", { motivo: reason, content_category: pageCategoryFor(pathname) });
  trackGoogleAdsAudienceEvent("visitante_engajado", { motivo: reason, content_category: pageCategoryFor(pathname) });
}
