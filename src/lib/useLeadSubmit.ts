/**
 * Cola dos formulários de lead com o navegador: envio (`sendLead`), trava de
 * envio duplo, GA4, conversões de mídia (Meta/Google Ads), atribuição e foco
 * no primeiro erro.
 *
 * Por que um hook: os 6 formulários repetiam o mesmo `invoke` + timeout +
 * checagem de entrega, e cada cópia tinha um defeito diferente (erro da
 * função ignorado, popup aberto depois do `await`, `generate_lead` contado
 * mesmo sem entrega, `setState` depois de sair da página).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { readPersistedAttribution, readPrivacyVisitForLead } from "@/lib/analytics";
import { resolveLeadAttribution, type LeadAttribution } from "@/lib/campaignParams";
import { reportLead } from "@/lib/conversions";
import { isConsentAccepted } from "@/lib/cookieConsent";
import { currentAdConsentProof } from "@/lib/adConsentRecord";
import { trackEvent } from "@/lib/ga4";
import { googleAdsProfileVariables } from "@/lib/googleAdsProfileVariables";
import { buildLeadBody, type LeadPayload, type LeadTracking } from "@/lib/leadDelivery";
import {
  enqueueLead,
  leadDedupKey,
  listLeadOutbox,
  newSubmissionId,
  removeLeadFromOutbox,
} from "@/lib/leadOutbox";
import {
  deliveryParam,
  leadOutcomeOf,
  resolveQrLeadAttribution,
  type LeadOutcome,
  type QrUtmDefaults,
} from "@/lib/leadForm";
import { newEventId, readMetaBrowserIds } from "@/lib/metaPixel";
import { scrollBehavior } from "@/lib/reducedMotion";
import { sendLead, type SendLeadResult } from "@/lib/sendLead";

/**
 * Atribuição no momento do envio: URL atual → last-touch da sessão →
 * first-touch do visitante (mesma regra de /orcamento). Com `qrDefaults`
 * (/o e /p), só URL → padrão da peça impressa.
 */
export function collectLeadAttribution(qrDefaults?: QrUtmDefaults): LeadAttribution {
  const persisted = readPersistedAttribution();
  const common = {
    search: typeof window !== "undefined" ? window.location.search : "",
    referrer: typeof document !== "undefined" ? document.referrer : "",
    referrerHost: persisted.referrerHost,
    landingPath: persisted.landingPath,
    currentPath: typeof window !== "undefined" ? window.location.pathname : "",
  };
  if (qrDefaults) return resolveQrLeadAttribution(common, qrDefaults);
  return resolveLeadAttribution({
    ...common,
    sessionUtm: persisted.sessionUtm,
    firstUtm: persisted.firstUtm,
    clickIds: persisted.clickIds,
  });
}

/**
 * Dados do envio para a API de Conversões do Meta (via `notify-lead`): o id
 * do evento (o mesmo do Pixel no navegador), o aceite de cookies e, só com
 * aceite, os identificadores `_fbp`/`_fbc`. Sem aceite, o servidor não manda
 * nada ao Meta.
 */
export function collectLeadTracking(eventId: string): LeadTracking {
  if (!isConsentAccepted()) {
    return { event_id: eventId, consent_marketing: false, fbp: null, fbc: null };
  }
  let fbclid: string | null = null;
  let fbclidSeenAt: number | null = null;
  try {
    fbclid = new URLSearchParams(window.location.search).get("fbclid");
  } catch {
    fbclid = null;
  }
  if (!fbclid) {
    const click = readPersistedAttribution().clickIds;
    fbclid = click?.fbclid ?? null;
    fbclidSeenAt = click?.fbclidSeenAt ?? null;
  }
  return { event_id: eventId, consent_marketing: true, ...readMetaBrowserIds({ fbclid, fbclidSeenAt }), ...currentAdConsentProof() };
}

export function browserUserAgent(): string | null {
  return typeof navigator !== "undefined" ? navigator.userAgent : null;
}

/**
 * Abre o WhatsApp numa aba nova. Chamar SÓ de forma síncrona dentro do
 * gesto do usuário (clique/submit) — depois de um `await`, Safari e Chrome
 * mobile bloqueiam o popup.
 */
export function openWhatsapp(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Move o foco para o campo (ou para o primeiro controle de um grupo, como
 * uma linha de chips) e o centraliza — o nav fixo cobriria um campo no topo.
 */
export function focusField(id: string): void {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  const target = el.matches("input, select, textarea, button")
    ? el
    : el.querySelector<HTMLElement>("input, select, textarea, button");
  if (!target) return;
  target.focus({ preventScroll: true });
  target.scrollIntoView?.({
    block: "center",
    behavior: scrollBehavior(),
  });
}

type SubmitOptions = {
  /**
   * Roda de forma síncrona, já com a trava adquirida e antes de qualquer
   * `await` — o lugar de `openWhatsapp`.
   */
  beforeSend?: () => void;
  /**
   * O formulário já entregou os dados ao WhatsApp (mensagem pronta). Com
   * isso, mesmo sem confirmação do servidor, o lead existe por outro canal
   * e conta como `generate_lead`.
   */
  handedToWhatsapp?: boolean;
  /** Parâmetros extras do evento GA4 (objetivo, bairro…). */
  params?: Record<string, unknown>;
};

/**
 * Estado e envio de um formulário de lead.
 *
 * GA4: `generate_lead` sai no máximo UMA vez por formulário, com
 * `delivery` = confirmed | timeout | failed — quando o lead chegou, pode ter
 * chegado (timeout) ou já foi entregue ao WhatsApp. Falha sem WhatsApp vira
 * `lead_delivery_failed` (não infla a conversão; reenvio que der certo conta).
 *
 * Mídia paga (conversions.ts): no mesmo momento do `generate_lead`, o Lead
 * do Meta Pixel e a conversão do Google Ads nos formulários de cliente (o
 * SubmitApplication nos de parceiro, incorporadora e indicação), com a
 * correspondência avançada de quem enviou. Um id de evento por formulário:
 * reenvios usam o mesmo, e o servidor manda esse id à API de Conversões para
 * o Meta deduplicar.
 *
 * Caixa de saída (`leadOutbox.ts`, 09/11/2026): envio sem confirmação (falha
 * ou tempo esgotado) fica guardado no aparelho e é reenviado sozinho com o
 * mesmo `submission_id` — os eventos acima não mudam por isso. "Tentar de
 * novo" da mesma pessoa no mesmo formulário (form_path + WhatsApp + e-mail)
 * também reusa o id até uma entrega confirmada: se a fila já entregou o
 * pedido, o servidor responde `duplicate` em vez de gravar outro lead.
 */
export function useLeadSubmit({ method, timeoutMs }: { method: string; timeoutMs?: number }) {
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<LeadOutcome | null>(null);
  /** O último envio não confirmado ficou na caixa de saída do aparelho. */
  const [queued, setQueued] = useState(false);
  const inFlight = useRef(false);
  const counted = useRef(false);
  const mounted = useRef(false);
  const eventIdRef = useRef<string | null>(null);
  /** `submission_id` do último envio não confirmado e de quem era (`leadDedupKey`). */
  const submissionRef = useRef<{ key: string; id: string } | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const submit = useCallback(
    async (payload: LeadPayload, opts: SubmitOptions = {}): Promise<LeadOutcome | null> => {
      // Trava por ref: dois submits no mesmo tick (duplo clique, Enter
      // repetido) veem o mesmo `sending` antigo; a ref não.
      if (inFlight.current) return null;
      inFlight.current = true;
      setSending(true);
      opts.beforeSend?.();

      const eventId = eventIdRef.current ?? (eventIdRef.current = newEventId());
      let body: Record<string, unknown> | null = null;
      let result: SendLeadResult;
      try {
        const leadPayload: LeadPayload = {
          ...payload,
          privacy_visited_before_submit: payload.form_path === "/orcamento" ? readPrivacyVisitForLead() : null,
        };
        const tracking = collectLeadTracking(eventId);
        const draft = buildLeadBody(leadPayload, { tracking });
        // Mesmo id para a mesma pessoa/formulário até a entrega confirmada:
        // o reenvio da fila e o "Tentar de novo" levam o mesmo id, e o
        // notify-lead não grava de novo o que já gravou (nem na corrida dos
        // dois, pelo índice único). Sem envio anterior nesta tela, vale o da
        // pendência na fila (página recarregada).
        const key = leadDedupKey(draft);
        const submissionId =
          submissionRef.current?.key === key
            ? submissionRef.current.id
            : (listLeadOutbox().find((e) => leadDedupKey(e.body) === key)?.submission_id ?? newSubmissionId());
        submissionRef.current = { key, id: submissionId };
        body = { ...draft, submission_id: submissionId };
        result = await sendLead(leadPayload, {
          ...(timeoutMs ? { timeoutMs } : {}),
          tracking,
          submissionId,
        });
      } catch (err) {
        console.error("[notify-lead] envio falhou", err);
        result = { delivered: false, timedOut: false };
      } finally {
        inFlight.current = false;
      }

      const next = leadOutcomeOf(result);
      if (next !== "delivered") {
        console.error("[notify-lead] lead não confirmado", { form: payload.form_path, outcome: next });
      }
      // Sem confirmação (backend fora, rede caiu, tempo esgotado): o corpo fica
      // no aparelho e sai sozinho depois (leadOutbox.ts). Entregue: some
      // qualquer pendência anterior da mesma pessoa neste formulário.
      // Depois da entrega confirmada, um novo envio ("Refazer pedido") é outro
      // pedido e ganha outro id.
      let savedOnDevice = false;
      if (body) {
        if (next === "delivered") {
          removeLeadFromOutbox(body);
          submissionRef.current = null;
        } else savedOnDevice = enqueueLead(body as Record<string, unknown> & { submission_id: string });
      }

      // Bairro categorizado do pedido, nunca endereço livre nem bairro inferido da visita.
      const { location: _location, ...safeParams } = opts.params ?? {};
      const eventParams = { method, delivery: deliveryParam(next), ...safeParams };
      const counts = next !== "failed" || !!opts.handedToWhatsapp;
      if (counts && !counted.current) {
        counted.current = true;
        trackEvent("generate_lead", { ...eventParams, ...googleAdsProfileVariables({ bairro: payload.location }) });
        reportLead({
          eventId,
          formPath: payload.form_path,
          method,
          email: payload.email,
          phoneDigits: payload.whatsapp,
          name: payload.name,
          bairro: payload.location,
          objetivo: payload.objetivo,
          areaM2: payload.area_m2,
          chaves: payload.chaves,
          livesInSp: payload.lives_in_sp ?? null,
        });
      } else if (!counts) {
        trackEvent("lead_delivery_failed", eventParams);
      }

      if (mounted.current) {
        setOutcome(next);
        setQueued(savedOnDevice);
        setSending(false);
      }
      return next;
    },
    [method, timeoutMs],
  );

  const isMounted = useCallback(() => mounted.current, []);

  return { sending, outcome, queued, submit, isMounted };
}
