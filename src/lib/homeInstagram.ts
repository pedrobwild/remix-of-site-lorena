/**
 * Depoimentos do Instagram na home: as mesmas 3 postagens do @bewild.oficial
 * que o orçamento público (Bwild Engine) mostra, no embed oficial.
 *
 * O iframe só é criado quando o card se aproxima da tela. Quem recusou
 * cookies não recebe o embed automaticamente: o card mostra um botão
 * "Carregar depoimento" e o link direto para a postagem.
 *
 * A altura real vem do próprio Instagram por `postMessage`
 * ({ type: "MEASURE", details: { height } }), como no orçamento público.
 */
import { readConsent } from "@/lib/cookieConsent";

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
    iframe.loading = "lazy";
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("allow", "encrypted-media");
    iframe.setAttribute("allowtransparency", "true");
    iframe.style.height = `${INITIAL_EMBED_HEIGHT}px`;
    holder.replaceChildren(iframe);
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

  // Cookies recusados: nada carrega sozinho; o botão do card carrega sob demanda.
  const declined = readConsent() === "declined";
  const onClick = (e: Event) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-ig-load]");
    if (!btn) return;
    const card = btn.closest<HTMLElement>("[data-ig-post]");
    if (card) mount(card);
  };
  root.addEventListener("click", onClick);

  let io: IntersectionObserver | null = null;
  if (!declined) {
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (en.isIntersecting) {
              mount(en.target as HTMLElement);
              io?.unobserve(en.target);
            }
          }
        },
        { rootMargin: "400px 0px" },
      );
      cards.forEach((c) => io!.observe(c));
    } else {
      cards.forEach(mount);
    }
  } else {
    for (const card of cards) {
      const holder = card.querySelector<HTMLElement>("[data-ig-frame]");
      if (holder) holder.dataset.igState = "consent";
    }
  }

  return () => {
    io?.disconnect();
    window.removeEventListener("message", onMessage);
    root.removeEventListener("click", onClick);
  };
}
