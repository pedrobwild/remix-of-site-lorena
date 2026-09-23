/**
 * Cola dos formulários de lead com o navegador: envio (`sendLead`), trava de
 * envio duplo, GA4, atribuição e foco no primeiro erro.
 *
 * Por que um hook: os 6 formulários repetiam o mesmo `invoke` + timeout +
 * checagem de entrega, e cada cópia tinha um defeito diferente (erro da
 * função ignorado, popup aberto depois do `await`, `generate_lead` contado
 * mesmo sem entrega, `setState` depois de sair da página).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { readPersistedAttribution } from "@/lib/analytics";
import { resolveLeadAttribution, type LeadAttribution } from "@/lib/campaignParams";
import { trackEvent } from "@/lib/ga4";
import type { LeadPayload } from "@/lib/leadDelivery";
import {
  deliveryParam,
  leadOutcomeOf,
  resolveQrLeadAttribution,
  type LeadOutcome,
  type QrUtmDefaults,
} from "@/lib/leadForm";
import { scrollBehavior } from "@/lib/reducedMotion";
import { sendLead, type SendLeadResult } from "@/lib/sendLead";

/**
 * Atribuição no momento do envio: URL atual → last-touch da sessão →
 * first-touch do visitante (mesma regra de /diagnostico). Com `qrDefaults`
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
  });
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
 */
export function useLeadSubmit({ method, timeoutMs }: { method: string; timeoutMs?: number }) {
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<LeadOutcome | null>(null);
  const inFlight = useRef(false);
  const counted = useRef(false);
  const mounted = useRef(false);

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

      let result: SendLeadResult;
      try {
        result = await sendLead(payload, timeoutMs ? { timeoutMs } : undefined);
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

      const eventParams = { method, delivery: deliveryParam(next), ...opts.params };
      const counts = next !== "failed" || !!opts.handedToWhatsapp;
      if (counts && !counted.current) {
        counted.current = true;
        trackEvent("generate_lead", eventParams);
      } else if (!counts) {
        trackEvent("lead_delivery_failed", eventParams);
      }

      if (mounted.current) {
        setOutcome(next);
        setSending(false);
      }
      return next;
    },
    [method, timeoutMs],
  );

  const isMounted = useCallback(() => mounted.current, []);

  return { sending, outcome, submit, isMounted };
}
