/**
 * Stub de provisionamento de lead.
 *
 * No app original o guia gravava leads no próprio banco. Aqui a captação
 * acontece em /orcamento, então este módulo só mantém a assinatura usada
 * pelas seções portadas.
 */

export type PendingProvision = {
  neighborhood: string | null;
};

export function loadPendingProvision(): PendingProvision | null {
  return null;
}
