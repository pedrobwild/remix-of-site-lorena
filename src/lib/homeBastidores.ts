/**
 * Bastidores (home, logo abaixo das disciplinas Arquitetura e Engenharia):
 * 6 reels do @bewild.oficial com o time em obra.
 *
 * A faixa mostra só capas estáticas (public/images/bastidores/<código>.jpg).
 * Nada da Meta carrega na página: o embed oficial do Instagram só é criado
 * dentro do lightbox, quando o visitante abre um vídeo. Mesma regra de
 * consentimento dos depoimentos (homeInstagram.ts): com cookies aceitos o
 * embed monta sozinho; sem aceite, o lightbox mostra a capa com
 * "Carregar vídeo aqui" (carrega só aquele, por escolha do visitante) e o
 * link direto para o Instagram.
 *
 * Os cards usam `data-bst-post` (e não `data-ig-post`) de propósito:
 * installInstagramEmbeds monta todo `[data-ig-post]` da home.
 *
 * Capa ausente ou quebrada: a <img> é removida e fica o fundo azul da marca.
 */
import { isConsentAccepted } from "@/lib/cookieConsent";
import { instagramPostRef, parseInstagramMeasure } from "@/lib/homeInstagram";
import { trackEvent } from "@/lib/ga4";

type BastidorItem = {
  code: string;
  kind: "p" | "reel";
  tag: string;
  title: string;
  desc: string;
  poster: string | null;
};

const INSTAGRAM_ORIGIN_RE = /^https:\/\/(www\.)?instagram\.com$/;
const INITIAL_EMBED_HEIGHT = 640;

const ARROW_SVG =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 10h14M12 5l5 5-5 5"/></svg>';

const LIGHTBOX_HTML = `
  <button type="button" class="bwa-bst-lb-close" aria-label="Fechar vídeo" data-bst-close>
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16"/></svg>
  </button>
  <div class="bwa-bst-lb-box">
    <div class="bwa-bst-lb-player" data-bst-player></div>
    <aside class="bwa-bst-lb-aside">
      <p class="bwa-bst-lb-kicker" data-bst-kicker></p>
      <h3 class="bwa-bst-lb-title" id="bwa-bst-lb-title" data-bst-title></h3>
      <p class="bwa-bst-lb-desc" data-bst-desc></p>
      <a class="bwa-bastidores-ig" href="#" target="_blank" rel="noopener noreferrer" data-bst-link>Ver no Instagram <span aria-hidden="true">→</span></a>
      <div class="bwa-bst-lb-nav">
        <button type="button" class="bwa-bst-lb-arrow bwa-bst-lb-prev" aria-label="Vídeo anterior" data-bst-prev>${ARROW_SVG}</button>
        <button type="button" class="bwa-bst-lb-arrow" aria-label="Próximo vídeo" data-bst-next>${ARROW_SVG}</button>
      </div>
    </aside>
  </div>`;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function installBastidores(root: HTMLElement): () => void {
  const section = root.querySelector<HTMLElement>("[data-bastidores]");
  if (!section) return () => {};
  const tiles = Array.from(section.querySelectorAll<HTMLElement>("[data-bst-post]"));
  if (tiles.length === 0) return () => {};

  const items: BastidorItem[] = tiles.map((tile) => ({
    code: tile.dataset.bstPost ?? "",
    kind: tile.dataset.bstKind === "reel" ? "reel" : "p",
    tag: tile.dataset.bstTag ?? "",
    title: tile.dataset.bstTitle ?? "",
    desc: tile.dataset.bstDesc ?? "",
    poster: tile.querySelector("img")?.getAttribute("src") ?? null,
  }));
  const total = items.length;

  // Capa que não carregou: some a <img>, fica o fundo da marca (erro não borbulha → captura).
  const onImgError = (e: Event) => {
    const t = e.target;
    if (t instanceof HTMLImageElement && section.contains(t)) {
      const idx = tiles.findIndex((tile) => tile.contains(t));
      if (idx >= 0) items[idx].poster = null;
      t.remove();
    }
  };
  section.addEventListener("error", onImgError, true);
  // Capa que já falhou antes deste install.
  tiles.forEach((tile, idx) => {
    const img = tile.querySelector("img");
    if (img && img.complete && img.naturalWidth === 0 && img.currentSrc) {
      items[idx].poster = null;
      img.remove();
    }
  });

  let lb: HTMLDivElement | null = null;
  let player: HTMLElement | null = null;
  let iframe: HTMLIFrameElement | null = null;
  let current = 0;
  let lastFocus: HTMLElement | null = null;
  let prevOverflow = "";

  const onMessage = (event: MessageEvent) => {
    if (!iframe || !INSTAGRAM_ORIGIN_RE.test(event.origin)) return;
    if (event.source !== iframe.contentWindow) return;
    const h = parseInstagramMeasure(event.data);
    if (h) iframe.style.height = `${h}px`;
  };

  const mountEmbed = (item: BastidorItem) => {
    if (!player) return;
    const ref = instagramPostRef(item.code, item.kind);
    if (!ref) return;
    const frame = document.createElement("iframe");
    frame.src = ref.embedUrl;
    frame.title = `Vídeo da Bewild no Instagram: ${item.title}`;
    frame.setAttribute("scrolling", "no");
    frame.setAttribute("allow", "encrypted-media; autoplay");
    frame.setAttribute("allowtransparency", "true");
    frame.style.height = `${INITIAL_EMBED_HEIGHT}px`;
    player.replaceChildren(frame);
    player.dataset.state = "loaded";
    iframe = frame;
  };

  const renderGate = (item: BastidorItem) => {
    if (!player) return;
    iframe = null;
    const gate = document.createElement("div");
    gate.className = "bwa-bst-lb-gate";
    if (item.poster) gate.style.backgroundImage = `url("${item.poster}")`;
    const note = document.createElement("p");
    note.textContent = "O vídeo é exibido pelo Instagram.";
    const load = document.createElement("button");
    load.type = "button";
    load.className = "bwa-bst-lb-load";
    load.textContent = "Carregar vídeo aqui";
    load.addEventListener("click", () => mountEmbed(item));
    gate.append(note, load);
    player.replaceChildren(gate);
    player.dataset.state = "consent";
  };

  const show = (i: number) => {
    if (!lb) return;
    current = (i + total) % total;
    const item = items[current];
    const ref = instagramPostRef(item.code, item.kind);
    lb.querySelector("[data-bst-kicker]")!.textContent = `${pad(current + 1)} / ${pad(total)} · ${item.tag}`;
    lb.querySelector("[data-bst-title]")!.textContent = item.title;
    lb.querySelector("[data-bst-desc]")!.textContent = item.desc;
    const link = lb.querySelector<HTMLAnchorElement>("[data-bst-link]");
    if (link && ref) link.href = ref.url;
    if (isConsentAccepted()) mountEmbed(item);
    else renderGate(item);
  };

  const focusables = (): HTMLElement[] =>
    lb
      ? Array.from(lb.querySelectorAll<HTMLElement>("button, a[href], iframe")).filter(
          (el) => !el.hasAttribute("disabled"),
        )
      : [];

  const onKeydown = (e: KeyboardEvent) => {
    if (!lb?.hasAttribute("data-open")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowRight") {
      show(current + 1);
    } else if (e.key === "ArrowLeft") {
      show(current - 1);
    } else if (e.key === "Tab") {
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const build = () => {
    const el = document.createElement("div");
    el.className = "bwa-bst-lb";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "bwa-bst-lb-title");
    el.innerHTML = LIGHTBOX_HTML;
    // No body: um ancestral com transform (reveals da home) quebraria o position:fixed.
    document.body.appendChild(el);
    player = el.querySelector<HTMLElement>("[data-bst-player]");
    el.querySelector("[data-bst-close]")?.addEventListener("click", () => close());
    el.querySelector("[data-bst-prev]")?.addEventListener("click", () => show(current - 1));
    el.querySelector("[data-bst-next]")?.addEventListener("click", () => show(current + 1));
    el.addEventListener("click", (e) => {
      if (e.target === el) close();
    });
    lb = el;
  };

  const open = (i: number) => {
    if (!lb) build();
    if (!lb) return;
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    show(i);
    lb.setAttribute("data-open", "");
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lb.querySelector<HTMLElement>("[data-bst-close]")?.focus();
    trackEvent("bastidores_video_open", { post: items[current].code, position: current + 1 });
  };

  function close() {
    if (!lb?.hasAttribute("data-open")) return;
    lb.removeAttribute("data-open");
    player?.replaceChildren();
    iframe = null;
    document.body.style.overflow = prevOverflow;
    lastFocus?.focus();
  }

  const onClick = (e: Event) => {
    const t = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-bst-post]") : null;
    if (!t) return;
    const idx = tiles.indexOf(t);
    if (idx >= 0) open(idx);
  };

  section.addEventListener("click", onClick);
  document.addEventListener("keydown", onKeydown);
  window.addEventListener("message", onMessage);

  return () => {
    close();
    section.removeEventListener("click", onClick);
    section.removeEventListener("error", onImgError, true);
    document.removeEventListener("keydown", onKeydown);
    window.removeEventListener("message", onMessage);
    lb?.remove();
    lb = null;
    player = null;
  };
}
