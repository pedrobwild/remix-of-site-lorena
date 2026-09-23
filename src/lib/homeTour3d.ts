/**
 * Tour virtual 3D na home (bloco `#tour-3d`, logo depois de "Atmosferas
 * Bewild" e antes dos depoimentos): os 3 cômodos do projeto lado a lado, com
 * os links do Enscape — a mesma mídia que o orçamento público (Bwild Engine)
 * mostra na aba "Tour 3D" (`Tour3DViewer.tsx`), com os mesmos atributos de
 * iframe.
 *
 * Diferenças deliberadas em relação ao orçamento público:
 *  - lá é um cômodo por vez (abas); aqui os 3 ficam na mesma linha;
 *  - o viewer é um app WebGL pesado: nada monta antes de o bloco se aproximar
 *    da tela, e os 3 montam escalonados (como no Engine);
 *  - é embed de terceiro (Enscape/Chaos), então segue a regra de LGPD dos
 *    outros embeds da home (Instagram, mapa do /contato): monta sozinho só com
 *    cookies ACEITOS. Sem aceite, o card mostra "Explorar em 3D" e carrega
 *    aquele tour por escolha do visitante;
 *  - com toque ou tela estreita nenhum iframe entra na página — arrastar o
 *    dedo sobre o viewer gira a câmera e prenderia a rolagem da home. O toque
 *    abre o tour num <dialog> de tela cheia (como o Engine faz no celular), e o
 *    iframe sai da página ao fechar;
 *  - no desktop, o tour carregado fica sob uma capa transparente: a roda do
 *    mouse continua rolando a página por cima dele. Um clique libera o tour;
 *    quando o mouse sai do card, a capa volta.
 */
import { isConsentAccepted, onConsentChange } from "@/lib/cookieConsent";
import { trackEvent } from "@/lib/ga4";
import { closestElementFrom } from "@/lib/useHashRoute";

export type Tour3DRoom = { id: string; label: string; viewId: string };

/**
 * Cômodos exibidos, na ordem da home: links do Enscape (Web Standalone) lidos
 * dos QR codes do projeto que o Pedro enviou em 23/09/2026. O HTML da home
 * (`home-bwa-body.ts`) traz os mesmos dados em `data-tour3d-*`; o teste
 * `homeTour3d.test.ts` impede que os dois se desencontrem.
 */
export const TOUR3D_ROOMS: readonly Tour3DRoom[] = [
  { id: "cozinha-estar", label: "Cozinha / Estar", viewId: "48c6d935-b812-4e73-ac78-1fee136d0119" },
  { id: "dormitorio", label: "Dormitório", viewId: "2644b907-7537-49f2-a373-247c5d6d1976" },
  { id: "banho", label: "Banho", viewId: "6aba3d40-628d-42d8-99a9-70f9bcb133ce" },
];

/** Tours dentro da página só com mouse e tela larga; no resto, <dialog>. Espelhado em home-bwa.css. */
export const TOUR3D_INLINE_QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

/** Mesmo `allow` do iframe do orçamento público (Tour3DViewer do Engine). */
export const TOUR3D_IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; magnetometer; xr-spatial-tracking; fullscreen";

/** Intervalo entre um iframe e o seguinte na montagem automática (o Engine usa 1,5 s). */
export const TOUR3D_STAGGER_MS = 1200;

const VIEW_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** URL do viewer do Enscape para um id de visualização (UUID), ou null se o id não for um UUID. */
export function enscapeViewUrl(viewId: string): string | null {
  const id = String(viewId ?? "")
    .trim()
    .toLowerCase();
  return VIEW_ID_RE.test(id) ? `https://api2.enscape3d.com/v3/view/${id}` : null;
}

type Cleanup = () => void;
type Card = { frame: HTMLElement; id: string; label: string; url: string };
type FullscreenCapable = HTMLElement & { webkitRequestFullscreen?: () => void };

const ACTIVE_ATTR = "data-tour3d-active";

function createTourIframe(card: Card, eager: boolean, onLoad: () => void): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  // `loading` antes do `src`: o pedido só sai quando o iframe entra no DOM.
  iframe.setAttribute("loading", eager ? "eager" : "lazy");
  iframe.setAttribute("allow", TOUR3D_IFRAME_ALLOW);
  iframe.setAttribute("allowfullscreen", "");
  iframe.title = `Tour 3D — ${card.label}`;
  iframe.src = card.url;
  // Sem `signal` de propósito: o listener morre com o iframe, e uma limpeza
  // no meio do carregamento (StrictMode) não pode deixar o card em "loading".
  iframe.addEventListener("load", onLoad, { once: true });
  return iframe;
}

function isFullscreen(el: Element): boolean {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return (document.fullscreenElement ?? doc.webkitFullscreenElement ?? null) === el;
}

export function installTour3d(root: HTMLElement): Cleanup {
  const block = root.querySelector<HTMLElement>("[data-tour3d]");
  if (!block) return () => {};

  const cards: Card[] = [];
  block.querySelectorAll<HTMLElement>("[data-tour3d-view]").forEach((el) => {
    const frame = el.querySelector<HTMLElement>("[data-tour3d-frame]");
    const url = enscapeViewUrl(el.dataset.tour3dView ?? "");
    if (!frame || !url) return;
    cards.push({
      frame,
      url,
      id: el.dataset.tour3dRoom ?? "",
      label: (el.dataset.tour3dLabel ?? "").trim() || "Tour 3D",
    });
  });
  if (cards.length === 0) return () => {};

  const controller = new AbortController();
  const { signal } = controller;
  const timers: number[] = [];
  const tracked = new Set<string>();

  const inlineMode = (): boolean => {
    try {
      return window.matchMedia(TOUR3D_INLINE_QUERY).matches;
    } catch {
      return false;
    }
  };
  const cardOf = (el: Element | null) =>
    el ? cards.find((c) => c.frame.parentElement?.contains(el)) : undefined;
  const track = (card: Card, mode: "inline" | "dialog" | "fullscreen") => {
    const key = `${card.id}:${mode}`;
    if (tracked.has(key)) return;
    tracked.add(key);
    trackEvent("tour3d_open", { room: card.id, mode });
  };

  /* ---------------- Tour dentro do card (desktop) ---------------- */

  /** Monta o iframe no card. `activate`: o visitante pediu — libera a interação na hora. */
  const mountInline = (card: Card, activate: boolean) => {
    let iframe = card.frame.querySelector("iframe");
    if (!iframe) {
      iframe = createTourIframe(card, activate, () => {
        card.frame.dataset.tour3dState = "ready";
      });
      card.frame.dataset.tour3dState = "loading";
      card.frame.prepend(iframe);
    }
    if (activate) {
      card.frame.setAttribute(ACTIVE_ATTR, "");
      iframe.focus({ preventScroll: true });
    }
  };

  // A capa volta quando o mouse sai do tour. Enquanto o ponteiro está sobre o
  // iframe, os eventos vão para o documento do Enscape; o primeiro movimento
  // que chega aqui fora do card devolve a capa.
  document.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse") return;
      const target = closestElementFrom(event.target);
      for (const card of cards) {
        if (!card.frame.hasAttribute(ACTIVE_ATTR) || isFullscreen(card.frame)) continue;
        if (target && card.frame.contains(target)) continue;
        card.frame.removeAttribute(ACTIVE_ATTR);
      }
    },
    { signal, passive: true }
  );

  /* ---------------- Tela cheia em <dialog> (toque/tela estreita) ---------------- */

  let dialog: HTMLDialogElement | null = null;
  let dialogTitle: HTMLElement | null = null;
  let dialogStage: HTMLElement | null = null;
  let fallbackReturnFocus: HTMLElement | null = null;

  const releaseDialogFrame = () => {
    dialogStage?.querySelector("iframe")?.remove();
    dialogStage?.removeAttribute("data-tour3d-state");
  };

  const closeDialog = () => {
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      if (dialog.open) dialog.close(); // dispara "close" → releaseDialogFrame
      return;
    }
    // Navegador sem <dialog> nativo.
    dialog.removeAttribute("open");
    releaseDialogFrame();
    fallbackReturnFocus?.focus({ preventScroll: true });
    fallbackReturnFocus = null;
  };

  const ensureDialog = (): HTMLDialogElement => {
    if (dialog) return dialog;
    const el = document.createElement("dialog");
    el.className = "bwa-tour3d-dialog";
    el.setAttribute("aria-labelledby", "bwa-tour3d-dialog-title");
    el.innerHTML =
      '<div class="bwa-tour3d-dialog-bar">' +
      '<p class="bwa-tour3d-dialog-title" id="bwa-tour3d-dialog-title"></p>' +
      '<button type="button" class="bwa-tour3d-dialog-close" data-tour3d-close>Fechar</button>' +
      "</div>" +
      '<div class="bwa-tour3d-dialog-stage" data-tour3d-stage>' +
      '<p class="bwa-tour3d-dialog-loading" aria-hidden="true">Carregando tour 3D…</p>' +
      "</div>" +
      '<p class="bwa-tour3d-dialog-hint">Arraste para olhar em volta</p>';
    dialogTitle = el.querySelector<HTMLElement>(".bwa-tour3d-dialog-title");
    dialogStage = el.querySelector<HTMLElement>("[data-tour3d-stage]");
    el.addEventListener("close", releaseDialogFrame, { signal });
    el.addEventListener(
      "click",
      (event) => {
        if (closestElementFrom(event.target)?.closest("[data-tour3d-close]")) closeDialog();
      },
      { signal }
    );
    // Fora da árvore da home: no fallback sem top layer, nenhum ancestral com
    // transform/overflow recorta o `position: fixed`. A limpeza remove.
    document.body.appendChild(el);
    dialog = el;
    return el;
  };

  const openDialog = (card: Card) => {
    const el = ensureDialog();
    if (dialogTitle) dialogTitle.textContent = card.label;
    releaseDialogFrame();
    const stage = dialogStage;
    if (stage) {
      stage.dataset.tour3dState = "loading";
      stage.prepend(
        createTourIframe(card, true, () => {
          stage.dataset.tour3dState = "ready";
        })
      );
    }
    if (typeof el.showModal === "function") {
      // Top layer: foco preso no diálogo, resto da página inerte, Esc fecha e
      // o foco volta sozinho para o botão que abriu.
      if (!el.open) el.showModal();
      return;
    }
    fallbackReturnFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    el.setAttribute("open", "");
    el.querySelector<HTMLElement>("[data-tour3d-close]")?.focus({ preventScroll: true });
  };

  // Esc no fallback sem <dialog> nativo (o nativo já trata).
  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key !== "Escape" ||
        !dialog?.hasAttribute("open") ||
        typeof dialog.close === "function"
      )
        return;
      closeDialog();
    },
    { signal }
  );

  /* ---------------- Botões dos cards ---------------- */

  const expand = (card: Card) => {
    if (!inlineMode()) {
      openDialog(card);
      track(card, "dialog");
      return;
    }
    mountInline(card, true);
    track(card, "fullscreen");
    const frame = card.frame as FullscreenCapable;
    try {
      if (typeof frame.requestFullscreen === "function") {
        void frame.requestFullscreen().catch(() => openDialog(card));
        return;
      }
      if (typeof frame.webkitRequestFullscreen === "function") {
        frame.webkitRequestFullscreen();
        return;
      }
    } catch {
      /* cai no diálogo abaixo */
    }
    openDialog(card);
  };

  block.addEventListener(
    "click",
    (event) => {
      const target = closestElementFrom(event.target);
      const start = target?.closest<HTMLElement>("[data-tour3d-start]");
      const more = target?.closest<HTMLElement>("[data-tour3d-expand]");
      const card = cardOf(start ?? more ?? null);
      if (!card) return;
      if (more) {
        expand(card);
        return;
      }
      if (inlineMode()) {
        mountInline(card, true);
        track(card, "inline");
      } else {
        openDialog(card);
        track(card, "dialog");
      }
    },
    { signal }
  );

  /* ---------------- Montagem automática (desktop + cookies aceitos) ---------------- */

  let io: IntersectionObserver | null = null;
  let autoStarted = false;
  const autoMount = () => {
    if (!inlineMode()) return;
    cards.forEach((card, i) => {
      if (i === 0) mountInline(card, false);
      else timers.push(window.setTimeout(() => mountInline(card, false), i * TOUR3D_STAGGER_MS));
    });
  };
  const startAutoMount = () => {
    if (autoStarted) return;
    autoStarted = true;
    if (!("IntersectionObserver" in window)) {
      autoMount();
      return;
    }
    io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io?.disconnect();
        io = null;
        autoMount();
      },
      { rootMargin: "300px 0px" }
    );
    io.observe(block);
  };

  let offConsent: Cleanup | null = null;
  if (isConsentAccepted()) {
    startAutoMount();
  } else {
    // Sem aceite (não decidiu OU recusou): nada do Enscape carrega sozinho.
    offConsent = onConsentChange((value) => {
      if (value === "accepted") startAutoMount();
    });
  }

  return () => {
    controller.abort();
    io?.disconnect();
    offConsent?.();
    timers.forEach((t) => window.clearTimeout(t));
    if (dialog) {
      try {
        if (dialog.open && typeof dialog.close === "function") dialog.close();
      } catch {
        /* já fechado */
      }
      dialog.remove();
      dialog = null;
    }
  };
}
