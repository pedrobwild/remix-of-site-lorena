/**
 * Reenvio automático da caixa de saída de leads (`leadOutbox.ts`).
 *
 * Instalado pelo Root depois da hidratação, em toda página (inclusive
 * /admin: a fila é do aparelho, não da página). Dispara:
 *  - uma vez na instalação;
 *  - no evento `online` do navegador (sem esperar o intervalo da entrada);
 *  - quando a aba volta a ficar visível;
 *  - a cada ~3 min enquanto houver pendência e a aba estiver visível.
 *
 * O envio (`sendLeadBody`, que carrega o SDK do Supabase) só é importado
 * quando há algo na fila: a página comum não baixa nada a mais.
 *
 * Lead entregue pela fila gera só o evento GA4 `lead_outbox_delivered` —
 * nada de Pixel/Google Ads no navegador (o `generate_lead`/Lead interativo,
 * quando houve, já contou; o Lead do servidor sai pela API de Conversões
 * com o mesmo `event_id`, que o Meta deduplica).
 */
import { trackEvent } from "@/lib/ga4";
import {
  flushLeadOutbox,
  LEAD_OUTBOX_EVENT,
  listLeadOutbox,
  type LeadOutboxBody,
  type LeadOutboxEntry,
} from "@/lib/leadOutbox";

export const LEAD_OUTBOX_INTERVAL_MS = 3 * 60 * 1000;
/** Reenvio em segundo plano tolera uma função lenta (o cliente não espera). */
const BACKGROUND_TIMEOUT_MS = 15_000;

async function sendInBackground(body: LeadOutboxBody): Promise<{ delivered: boolean }> {
  const { sendLeadBody } = await import("@/lib/sendLead");
  return sendLeadBody(body, { timeoutMs: BACKGROUND_TIMEOUT_MS });
}

function reportDelivered(entry: LeadOutboxEntry, now: number): void {
  try {
    trackEvent("lead_outbox_delivered", {
      form_path: typeof entry.body.form_path === "string" ? entry.body.form_path : null,
      attempts: entry.attempts,
      minutes_queued: Math.max(0, Math.round((now - entry.queued_at) / 60_000)),
    });
  } catch {
    /* telemetria nunca derruba o reenvio */
  }
}

function tabVisible(): boolean {
  try {
    return typeof document === "undefined" || document.visibilityState !== "hidden";
  } catch {
    return true;
  }
}

/** Reenvia o que estiver pendente agora. Nunca lança. */
export async function flushLeadOutboxNow(opts: { ignoreBackoff?: boolean } = {}): Promise<void> {
  try {
    if (!listLeadOutbox().length) return;
    const { delivered } = await flushLeadOutbox(sendInBackground, opts);
    const now = Date.now();
    for (const entry of delivered) reportDelivered(entry, now);
  } catch {
    /* nunca lança */
  }
}

/**
 * Liga os gatilhos do reenvio. No servidor (sem `window`) não faz nada.
 * Devolve a função que desliga tudo.
 */
export function installLeadOutboxFlush(): () => void {
  if (typeof window === "undefined") return () => {};
  let timer: number | null = null;
  const stopTimer = () => {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  };
  const syncTimer = () => {
    try {
      if (listLeadOutbox().length) {
        if (timer === null) {
          timer = window.setInterval(() => {
            if (tabVisible()) void flushLeadOutboxNow().then(syncTimer);
          }, LEAD_OUTBOX_INTERVAL_MS);
        }
      } else {
        stopTimer();
      }
    } catch {
      stopTimer();
    }
  };
  const run = (ignoreBackoff = false) => {
    void flushLeadOutboxNow({ ignoreBackoff }).then(syncTimer);
  };
  const onOnline = () => run(true);
  const onVisibility = () => {
    if (tabVisible()) run();
  };
  try {
    window.addEventListener("online", onOnline);
    window.addEventListener(LEAD_OUTBOX_EVENT, syncTimer);
    document.addEventListener("visibilitychange", onVisibility);
    run();
  } catch {
    /* nunca lança */
  }
  return () => {
    stopTimer();
    try {
      window.removeEventListener("online", onOnline);
      window.removeEventListener(LEAD_OUTBOX_EVENT, syncTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    } catch {
      /* nada a limpar */
    }
  };
}
