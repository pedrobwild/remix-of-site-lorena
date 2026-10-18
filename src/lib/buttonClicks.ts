/** Identificação de controles públicos, sem ler valores preenchidos ou queries. */
export const BUTTON_CLICK_SELECTOR = 'button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], [role="combobox"], a[data-cta], a[class*="btn"], a[class*="button"]';

const measuredClicks = new WeakSet<Event>();

export function claimButtonClick(event: Event): boolean {
  if (measuredClicks.has(event)) return false;
  measuredClicks.add(event);
  return true;
}

export function buttonClickDetails(element: HTMLElement): Record<string, string> | null {
  if (!element.matches(BUTTON_CLICK_SELECTOR)) return null;
  if (element.closest('[disabled], [aria-disabled="true"], [inert]')) return null;
  // Seletores podem conter o valor escolhido. Não enviar seu conteúdo nem inputs.
  const isChoice = element.matches('input, [role="combobox"], [role="checkbox"], [role="radio"], [role="switch"]');
  const text = isChoice ? "" : (element.getAttribute("aria-label") || element.textContent || "");
  const label = text.replace(/\S+@\S+\.\S+/g, "[e-mail]").replace(/\+?\d[\d\s().-]{7,}\d/g, "[telefone]").replace(/\s+/g, " ").trim().slice(0, 100);
  const cta = element.dataset.cta || element.id || label || (element.matches('[type="submit"]') ? "enviar-formulario" : element.getAttribute("role") || "botao-sem-rotulo");
  const section = element.closest("section[id], nav, header, footer, form[id]");
  return { cta: cta.slice(0, 100), label: label || cta.slice(0, 100), ...(section ? { section: section.id || section.tagName.toLowerCase() } : {}) };
}