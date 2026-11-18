/**
 * Tráfego interno — aparelhos do time da Bewild fora do analytics próprio.
 *
 * Até 18/11/2026 só as rotas /admin eram ignoradas: o Pedro e o time navegando
 * no site público contavam como visitantes (ex.: 22/09/2026, 685 pageviews de
 * 9 visitantes, 23% dos pageviews do mês). Agora o aparelho fica marcado:
 *
 * - abrir qualquer rota /admin marca o aparelho (quem entra no painel é do time);
 * - `?bw_interno=1` em qualquer página marca (time sem login no painel);
 * - `?bw_interno=0` desmarca (para testar como visitante).
 *
 * A marca é uma chave própria no localStorage, não um identificador: não diz
 * quem é a pessoa e não sai do aparelho. Ela só faz o tracker (`track`,
 * engajamento, cliques) ficar em silêncio. O registro LGPD do banner
 * (`logConsentAudit`) continua saindo, porque é prova do controlador.
 * `purgeAnalyticsStorage` (recusa de cookies) não apaga a marca.
 */

export const INTERNAL_TRAFFIC_KEY = "bw:interno";
export const INTERNAL_TRAFFIC_PARAM = "bw_interno";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Liga ou desliga a marca de aparelho interno. Nunca lança. */
export function setInternalTraffic(on: boolean): void {
  const s = storage();
  if (!s) return;
  try {
    if (on) s.setItem(INTERNAL_TRAFFIC_KEY, "1");
    else s.removeItem(INTERNAL_TRAFFIC_KEY);
  } catch {
    /* storage cheio ou bloqueado: segue sem marca */
  }
}

/** O aparelho foi marcado como do time? */
export function isInternalTraffic(): boolean {
  const s = storage();
  if (!s) return false;
  try {
    return s.getItem(INTERNAL_TRAFFIC_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Lê `?bw_interno=1|0` da URL atual e atualiza a marca. Valor diferente de
 * 1/0 (ou ausente) não muda nada. Devolve o estado depois da leitura.
 */
export function syncInternalTrafficFromSearch(search: string): boolean {
  try {
    const v = new URLSearchParams(search).get(INTERNAL_TRAFFIC_PARAM);
    if (v === "1") setInternalTraffic(true);
    else if (v === "0") setInternalTraffic(false);
  } catch {
    /* query inválida: ignora */
  }
  return isInternalTraffic();
}
