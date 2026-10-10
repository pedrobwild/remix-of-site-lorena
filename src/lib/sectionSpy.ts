/**
 * Marca, numa fila de atalhos "Nesta página", o link do bloco que está na
 * tela (`aria-current="location"`), como um índice que acompanha a rolagem.
 *
 * Regra: o bloco atual é o ÚLTIMO cujo topo já passou da linha `offset`
 * (cabeçalho fixo + fila de atalhos). Antes do primeiro bloco, nenhum link
 * fica marcado. Lê o DOM só num requestAnimationFrame por rolagem e não
 * escreve nada na raiz do documento (MOB-03).
 *
 * Usado em /servicos (ServicosPage.tsx), restrito ao <main> da página.
 */
export type SectionSpyOptions = {
  /** Seletor dos links, relativo a `root`. */
  links?: string;
  /** Linha (px do topo da janela) abaixo da qual um bloco conta como "atual". */
  offset?: number;
};

export function installSectionSpy(root: HTMLElement | null, options: SectionSpyOptions = {}): () => void {
  if (!root || typeof window === "undefined") return () => {};
  const selector = options.links ?? "[data-section-spy] a[href^='#']";
  const offset = options.offset ?? 140;
  const targets = Array.from(root.querySelectorAll<HTMLAnchorElement>(selector))
    .map((link) => {
      const id = decodeURIComponent(link.getAttribute("href")?.slice(1) ?? "");
      const section = id ? root.ownerDocument.getElementById(id) : null;
      return section ? { link, section } : null;
    })
    .filter((t): t is { link: HTMLAnchorElement; section: HTMLElement } => t !== null);
  if (targets.length === 0) return () => {};

  let frame = 0;
  const update = () => {
    frame = 0;
    let current: (typeof targets)[number] | null = null;
    for (const target of targets) {
      if (target.section.getBoundingClientRect().top <= offset) current = target;
    }
    for (const target of targets) {
      if (target === current) target.link.setAttribute("aria-current", "location");
      else target.link.removeAttribute("aria-current");
    }
  };
  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    if (frame) window.cancelAnimationFrame(frame);
    for (const target of targets) target.link.removeAttribute("aria-current");
  };
}
