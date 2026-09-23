/**
 * Depoimentos do Instagram na home: as mesmas 3 postagens do @bewild.oficial
 * que o orçamento público (Bwild Engine) mostra, no embed oficial.
 *
 * Os iframes só são criados quando o bloco de depoimentos se aproxima da
 * tela — os 3 de uma vez, e não card a card: no celular os cards ficam
 * lado a lado num trilho horizontal, e um card fora da tela nunca
 * "intersecta" até o usuário arrastar (o depoimento só começaria a
 * carregar depois do swipe).
 *
 * O embed é da Meta (cookies/rastreamento de terceiros), então só monta
 * sozinho com cookies ACEITOS. Sem decisão ou com recusa, o card mostra o
 * botão "Carregar depoimento" (carrega só aquele, por escolha do visitante)
 * e o link direto para a postagem; se o visitante aceitar depois, os embeds
 * passam a montar sozinhos sem recarregar a página.
 *
 * A altura real vem do próprio Instagram por `postMessage`
 * ({ type: "MEASURE", details: { height } }), como no orçamento público.
 */
import { isConsentAccepted, onConsentChange } from "@/lib/cookieConsent";
import { closestElementFrom } from "@/lib/useHashRoute";

export const INSTAGRAM_PROFILE_HANDLE = "bewild.oficial";
export const INSTAGRAM_PROFILE_URL = `https://www.instagram.com/${INSTAGRAM_PROFILE_HANDLE}/`;

/** Postagens exibidas, na ordem (mesma lista do orçamento público). */
export const INSTAGRAM_TESTIMONIAL_POSTS = ["DZbjyUQNaOL", "DVyeOxXjQKI", "DQ2zDmujdso"] as const;

export type InstagramPostRef = { kind: "p" | "reel"; code: string; url: string; embedUrl: string };

const CODE_RE = /^[\w-]+$/;

export function instagramPostRef(code: string, kind: "p" | "reel" = "p"): InstagramPostRef | null {
  const c = (code ?? "").trim();
  if (!CODE_RE.test(c)) return null;
  return {
    kind,
    code: c,
    url: `https://www.instagram.com/${kind}/${c}/`,
    embedUrl: `https://www.instagram.com/${kind}/${c}/embed/`,
  };
}

const INITIAL_EMBED_HEIGHT = 640;
const INSTAGRAM_ORIGIN_RE = /^https:\/\/(www\.)?instagram\.com$/;

/** Extrai a altura de uma mensagem MEASURE do embed do Instagram (ou null). */
export function parseInstagramMeasure(data: unknown): number | null {
  let d: unknown = data;
  if (typeof d === "string") {
    try {
      d = JSON.parse(d);
    } catch {
      return null;
    }
  }
  const msg = d as { type?: string; details?: { height?: number } } | null;
  const h = msg?.details?.height;
  return msg?.type === "MEASURE" && typeof h === "number" && h > 0 ? Math.ceil(h) : null;
}

type Cleanup = () => void;

export function installInstagramEmbeds(root: HTMLElement): Cleanup {
  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-ig-post]"));
  if (cards.length === 0) return () => {};

  const frames = new Map<HTMLIFrameElement, HTMLElement>();

  const mount = (card: HTMLElement) => {
    const holder = card.querySelector<HTMLElement>("[data-ig-frame]");
    const ref = instagramPostRef(card.dataset.igPost ?? "", card.dataset.igKind === "reel" ? "reel" : "p");
    if (!holder || !ref || holder.querySelector("iframe")) return;
    const iframe = document.createElement("iframe");
    iframe.src = ref.embedUrl;
    iframe.title = `Depoimento de cliente no Instagram (${ref.code})`;
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("allow", "encrypted-media");
    iframe.setAttribute("allowtransparency", "true");
    iframe.style.height = `${INITIAL_EMBED_HEIGHT}px`;
    holder.replaceChildren(iframe);
    // Selo próprio de visualizações: o Instagram desenha "X curtidas" dentro
    // do iframe (inacessível), então cobrimos essa linha com o rótulo do card.
    if (card.dataset.igViewsLabel) {
      const badge = document.createElement("p");
      badge.className = "bwa-ig-views";
      badge.textContent = card.dataset.igViewsLabel;
      holder.appendChild(badge);
    }
    holder.dataset.igState = "loaded";
    frames.set(iframe, holder);
  };

  const onMessage = (event: MessageEvent) => {
    if (!INSTAGRAM_ORIGIN_RE.test(event.origin)) return;
    const height = parseInstagramMeasure(event.data);
    if (!height) return;
    for (const iframe of frames.keys()) {
      if (iframe.contentWindow === event.source) {
        iframe.style.height = `${height}px`;
        return;
      }
    }
  };
  window.addEventListener("message", onMessage);

  // Botão do card: carrega sob demanda (vale em qualquer estado de consentimento).
  const onClick = (e: Event) => {
    const btn = closestElementFrom(e.target)?.closest<HTMLButtonElement>("[data-ig-load]");
    if (!btn) return;
    const card = btn.closest<HTMLElement>("[data-ig-post]");
    if (card) mount(card);
  };
  root.addEventListener("click", onClick);

  let io: IntersectionObserver | null = null;
  let autoStarted = false;
  const startAutoMount = () => {
    if (autoStarted) return;
    autoStarted = true;
    if ("IntersectionObserver" in window) {
      // Observa o bloco (a seção `[data-instagram]`), não cada card — ver o
      // comentário no topo do arquivo sobre o trilho horizontal do celular.
      const block = cards[0].closest<HTMLElement>("[data-instagram]") ?? cards[0].parentElement ?? cards[0];
      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((en) => en.isIntersecting)) return;
          cards.forEach(mount);
          io?.disconnect();
        },
        { rootMargin: "400px 0px" },
      );
      io.observe(block);
    } else {
      cards.forEach(mount);
    }
  };

  let offConsent: (() => void) | null = null;
  if (isConsentAccepted()) {
    startAutoMount();
  } else {
    // Sem aceite (ainda não decidiu OU recusou): nada da Meta carrega sozinho.
    for (const card of cards) {
      const holder = card.querySelector<HTMLElement>("[data-ig-frame]");
      if (holder && !holder.querySelector("iframe")) holder.dataset.igState = "consent";
    }
    offConsent = onConsentChange((v) => {
      if (v === "accepted") startAutoMount();
    });
  }

  return () => {
    io?.disconnect();
    offConsent?.();
    window.removeEventListener("message", onMessage);
    root.removeEventListener("click", onClick);
  };
}
