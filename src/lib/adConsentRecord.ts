/**
 * Prova do aceite publicitário do aviso de cookies.
 *
 * Cada escolha no aviso (aceitar ou recusar) vira um registro no servidor com
 * a versão do texto e a hora. O pedido de orçamento leva o id do registro
 * vigente e a chave do aparelho; o envio ao Google Ads confere o aceite na
 * hora do pedido E a escolha mais recente daquele aparelho. Sem registro
 * (falha de rede, aceite antigo), nada é enviado.
 */
import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "bewild_consent_visitor";
const RECORD_KEY = "bewild_consent_record";
const UUID_RE = /^[0-9a-f-]{36}$/;

function read(key: string): string | null {
  try {
    const v = window.localStorage.getItem(key);
    return v && UUID_RE.test(v) ? v : null;
  } catch {
    return null;
  }
}

function visitorKey(): string | null {
  const existing = read(VISITOR_KEY);
  if (existing) return existing;
  try {
    const key = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_KEY, key);
    return key;
  } catch {
    return null;
  }
}

/** Grava a escolha. Recusa apaga o registro vigente antes de responder. */
export async function recordAdConsent(choice: "accepted" | "declined", version: number): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RECORD_KEY);
  } catch {
    /* segue */
  }
  const key = visitorKey();
  if (!key) return;
  const { data, error } = await supabase.rpc("record_ad_consent", {
    p_visitor_key: key,
    p_choice: choice,
    p_notice_version: `v${version}`,
  });
  if (error || typeof data !== "string") {
    console.warn("[consentimento] registro não gravado");
    return;
  }
  if (choice === "accepted") {
    try {
      window.localStorage.setItem(RECORD_KEY, data);
    } catch {
      /* sem prova local: o pedido sai sem registro */
    }
  }
}

/** Registro de aceite vigente para anexar ao pedido (ou nulos). */
export function currentAdConsentProof(): { consent_record_id: string | null; consent_visitor_key: string | null } {
  if (typeof window === "undefined") return { consent_record_id: null, consent_visitor_key: null };
  const record = read(RECORD_KEY);
  const key = read(VISITOR_KEY);
  return record && key ? { consent_record_id: record, consent_visitor_key: key } : { consent_record_id: null, consent_visitor_key: null };
}
