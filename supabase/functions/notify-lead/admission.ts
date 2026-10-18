/** Pedidos recusados por IP nunca consomem a cota compartilhada existente. */
export async function admitLead(
  checkIp: () => Promise<boolean>,
  checkDay: () => Promise<boolean>,
): Promise<boolean> {
  if (!await checkIp()) return false;
  return await checkDay();
}