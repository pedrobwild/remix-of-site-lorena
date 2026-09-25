/**
 * Bastidores (home, logo abaixo das disciplinas Arquitetura e Engenharia):
 * slider com os 6 posts do @bewild.oficial do time em obra.
 *
 * Os posts são o embed oficial do Instagram, montados por
 * installInstagramEmbeds (homeInstagram.ts), com a mesma regra de cookies
 * dos depoimentos. Este arquivo cuida só do slider: setas, barra de
 * progresso e contador.
 */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function installBastidores(root: HTMLElement): () => void {
  const section = root.querySelector<HTMLElement>("[data-bastidores]");
  if (!section) return () => {};
  const rail = section.querySelector<HTMLElement>("[data-bst-rail]");
  const cards = Array.from(section.querySelectorAll<HTMLElement>("[data-bst-card]"));
  if (!rail || cards.length === 0) return () => {};

  const total = cards.length;
  const prev = section.querySelector<HTMLButtonElement>("[data-bst-prev]");
  const next = section.querySelector<HTMLButtonElement>("[data-bst-next]");
  const progress = section.querySelector<HTMLElement>("[data-bst-progress]");
  const count = section.querySelector<HTMLElement>("[data-bst-count]");
  const step = () => {
    const first = cards[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(rail).columnGap || "0") || 0;
    return first + gap;
  };
  const update = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    const ratio = max > 0 ? rail.scrollLeft / max : 1;
    if (progress) progress.style.transform = `scaleX(${(1 / total + (1 - 1 / total) * ratio).toFixed(3)})`;
    const s = step() || 1;
    if (count) count.textContent = `${pad(Math.min(total, Math.round(rail.scrollLeft / s) + 1))} / ${pad(total)}`;
    if (prev) prev.disabled = rail.scrollLeft <= 2;
    if (next) next.disabled = rail.scrollLeft >= max - 2;
  };
  const goPrev = () => rail.scrollBy({ left: -step(), behavior: "smooth" });
  const goNext = () => rail.scrollBy({ left: step(), behavior: "smooth" });
  prev?.addEventListener("click", goPrev);
  next?.addEventListener("click", goNext);
  rail.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);

  update();

  return () => {
    prev?.removeEventListener("click", goPrev);
    next?.removeEventListener("click", goNext);
    rail.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
  };
}
