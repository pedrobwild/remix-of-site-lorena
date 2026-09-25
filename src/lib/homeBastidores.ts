/**
 * Bastidores (home, logo abaixo das disciplinas Arquitetura e Engenharia):
 * slider com 6 vídeos do time em obra (os mesmos reels do @bewild.oficial,
 * servidos pelo próprio site em /videos/bastidores/<código>.mp4 + .jpg).
 *
 * - O arquivo de vídeo só é pedido quando o card aparece na tela
 *   (preload="none" + data-src), então a página não fica mais pesada.
 * - Card visível (60% ou mais) toca sozinho, sem som e em loop; fora da tela
 *   pausa. Nada da Meta é carregado: não depende de cookies.
 * - O ícone de som (ou o toque no vídeo) liga o som daquele vídeo e silencia
 *   os outros. Se o vídeo com som sair da tela, ele pausa e volta ao mudo.
 * - Com "reduzir movimento" ou economia de dados, nada toca sozinho: o
 *   toque no vídeo ou no ícone dá o play com som.
 * - Arquivo ausente (404): fica a capa/fundo da marca e o ícone de som some;
 *   o link "Ver no Instagram" continua.
 */
import { trackEvent } from "@/lib/ga4";

const PLAY_RATIO = 0.6;

function prefersNoAutoplay(): boolean {
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
  } catch {
    /* ignore */
  }
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(conn?.saveData);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function installBastidores(root: HTMLElement): () => void {
  const section = root.querySelector<HTMLElement>("[data-bastidores]");
  if (!section) return () => {};
  const rail = section.querySelector<HTMLElement>("[data-bst-rail]");
  const cards = Array.from(section.querySelectorAll<HTMLElement>("[data-bst-card]"));
  if (!rail || cards.length === 0) return () => {};

  const manual = prefersNoAutoplay();
  const total = cards.length;
  const videos = cards.map((c) => c.querySelector<HTMLVideoElement>("video"));
  const soundBtns = cards.map((c) => c.querySelector<HTMLButtonElement>("[data-bst-sound]"));
  const visible = new Array<boolean>(total).fill(false);
  const cleanups: Array<() => void> = [];

  const ensureSrc = (v: HTMLVideoElement | null) => {
    if (!v || v.getAttribute("src")) return;
    const src = v.dataset.src;
    if (src) {
      v.setAttribute("src", src);
      v.preload = "metadata";
    }
  };

  const safePlay = (v: HTMLVideoElement) => {
    try {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {
      /* ignore */
    }
  };

  const setSound = (i: number, on: boolean) => {
    const v = videos[i];
    const btn = soundBtns[i];
    if (v) v.muted = !on;
    if (btn) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      const name = cards[i].querySelector(".bwa-bastidores-name")?.textContent ?? "";
      btn.setAttribute("aria-label", `${on ? "Desativar" : "Ativar"} som do vídeo: ${name}`);
    }
  };

  const toggleSound = (i: number) => {
    const v = videos[i];
    if (!v) return;
    const turnOn = v.muted || v.paused;
    videos.forEach((other, j) => {
      if (j !== i && other && !other.muted) {
        setSound(j, false);
        if (manual) other.pause();
      }
    });
    ensureSrc(v);
    if (turnOn) {
      setSound(i, true);
      safePlay(v);
      trackEvent("bastidores_sound_on", { post: cards[i].dataset.bstPost, position: i + 1 });
    } else {
      setSound(i, false);
      if (manual) v.pause();
    }
  };

  // Vídeo que não existe (ainda): esconde o ícone de som.
  videos.forEach((v, i) => {
    if (!v) return;
    const onError = () => {
      cards[i].classList.add("bwa-bastidores-card--sem-video");
      soundBtns[i]?.setAttribute("hidden", "");
    };
    v.addEventListener("error", onError);
    cleanups.push(() => v.removeEventListener("error", onError));
  });

  // Visibilidade real (o trilho recorta os cards fora dele).
  let io: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const i = cards.indexOf(en.target as HTMLElement);
          if (i < 0) continue;
          const v = videos[i];
          if (en.isIntersecting) ensureSrc(v);
          visible[i] = en.intersectionRatio >= PLAY_RATIO;
          if (!v) continue;
          if (visible[i]) {
            if (!manual) safePlay(v);
          } else if (!v.paused) {
            v.pause();
            if (!v.muted) setSound(i, false);
          }
        }
      },
      { threshold: [0, 0.01, PLAY_RATIO] },
    );
    cards.forEach((c) => io!.observe(c));
  } else {
    videos.forEach(ensureSrc);
  }

  const onClick = (e: Event) => {
    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    const btn = t.closest<HTMLElement>("[data-bst-sound]");
    const vid = t.closest<HTMLVideoElement>(".bwa-bastidores-video");
    const card = (btn ?? vid)?.closest<HTMLElement>("[data-bst-card]");
    if (card) {
      const i = cards.indexOf(card);
      if (i >= 0) toggleSound(i);
      return;
    }
    const ig = t.closest<HTMLElement>("[data-bst-ig]");
    const igCard = ig?.closest<HTMLElement>("[data-bst-card]");
    if (igCard) trackEvent("bastidores_instagram_click", { post: igCard.dataset.bstPost });
  };
  section.addEventListener("click", onClick);
  cleanups.push(() => section.removeEventListener("click", onClick));

  // Setas, progresso e contador.
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
  cleanups.push(() => {
    prev?.removeEventListener("click", goPrev);
    next?.removeEventListener("click", goNext);
    rail.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
  });
  update();

  return () => {
    io?.disconnect();
    cleanups.forEach((fn) => fn());
    videos.forEach((v) => {
      try {
        v?.pause();
      } catch {
        /* ignore */
      }
    });
  };
}
