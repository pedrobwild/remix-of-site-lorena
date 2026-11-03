export type AdsActionMetrics = { id: string; name: string; conversions: number; allConversions: number };

// Ação do pedido enviada pelo formulário, não a cópia importada do GA4.
export const REQUEST_ACTION_ID = "7805140492";

export function leadCost(cost: number, actions: AdsActionMetrics[]) {
  const request = actions.find(action => action.id === REQUEST_ACTION_ID);
  const requests = request?.allConversions ?? 0;
  return { requests, costPerLead: requests > 0 ? cost / requests : null, requestAction: request?.name ?? null };
}