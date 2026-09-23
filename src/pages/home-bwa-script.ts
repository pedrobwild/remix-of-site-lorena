/**
 * Comportamento imperativo da home (HTML aprovado em home-bwa-body.ts) e do
 * header .bwa das páginas internas (BwaNav).
 *
 * Contrato de cada `init*`:
 *  - recebe a RAIZ do componente e só consulta o DOM dentro dela. Nada de
 *    varrer o `document`: o handler de resize antigo escrevia `max-height`
 *    inline em todo `.bwa-faq-item.bwa-open` do site, e o item que o
 *    visitante fechava em /faq, /parceiros e /autorizacao-condominio
 *    continuava aberto;
 *  - devolve a limpeza que desfaz TUDO o que instalou: listeners (um
 *    AbortController por init), IntersectionObservers, rAF pendentes, modal
 *    de vídeo e menu mobile abertos, `body.style.overflow`, a classe
 *    `bwa-menu-open` do <body> e o `inert` aplicado ao resto da página. Sem
 *    isso, abrir o vídeo da home e voltar deixava a página seguinte sem
 *    rolagem, e o menu aberto "vazava" para a rota seguinte;
 *  - é idempotente: uma segunda chamada na mesma raiz sem limpeza entre elas
 *    devolve um no-op (o StrictMode monta, desmonta e remonta o mesmo DOM).
 *
 * Removido nesta versão: os blocos "certainty", "scope" e "story" do script
 * original — o HTML da home não tem mais `.bwa-certainty-item`,
 * `[data-scope-item]` nem `[data-story-step]` — e `initBwaFaqAccordions`,
 * que nenhuma página chamava (os acordeões internos são React).
 */
import { isIncorporadorasEnabled } from "@/lib/incorporadorasFlag";
import { withUtm } from "@/lib/utm";
import { trackEvent } from "@/lib/ga4";
import { prefersReducedMotion } from "@/lib/reducedMotion";

export type Cleanup = () => void;

const NOOP: Cleanup = () => {};
const MENU_OPEN_CLASS = "bwa-menu-open";
/** Acima desta largura o header mostra os links e o menu mobile some (home-bwa.css). */
const DESKTOP_NAV_QUERY = "(min-width: 1181px)";
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "video[controls]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function isRendered(el: HTMLElement): boolean {
  return el.getClientRects().length > 0;
}

/** Elementos focáveis e visíveis dentro dos contêineres, na ordem do DOM. */
function focusablesIn(containers: Element[]): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const container of containers) {
    container.querySelectorAll<HTMLElement>(FOCUSABLE).forEach((el) => {
      if (isRendered(el) && !el.closest("[inert]")) out.push(el);
    });
  }
  return out;
}

/** Mantém o Tab circulando dentro dos contêineres (menu aberto, modal). */
function trapTab(event: KeyboardEvent, containers: Element[]): void {
  if (event.key !== "Tab") return;
  const items = focusablesIn(containers);
  if (!items.length) {
    event.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  const inside = !!active && containers.some((c) => c.contains(active));
  if (!inside) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Marca como `inert` tudo o que está fora de `keep` (os irmãos de cada
 * ancestral até o <body>, inclusive o que o React põe em portal no body) e
 * devolve a função que desfaz exatamente o que foi marcado.
 */
function inertOutside(keep: Element[]): Cleanup {
  const path = new Set<Element>();
  for (const el of keep) {
    for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) path.add(n);
  }
  const parents = new Set<Element>([document.body]);
  path.forEach((n) => {
    if (n.parentElement) parents.add(n.parentElement);
  });
  const marked: Element[] = [];
  parents.forEach((parent) => {
    for (const child of Array.from(parent.children)) {
      if (path.has(child) || child.hasAttribute("inert")) continue;
      if (child.tagName === "SCRIPT" || child.tagName === "STYLE" || child.tagName === "LINK") continue;
      child.setAttribute("inert", "");
      marked.push(child);
    }
  });
  return () => marked.forEach((el) => el.removeAttribute("inert"));
}

/* =========================================================================
 * Dropdown "Parceiros" do menu desktop (padrão disclosure, sem role="menu").
 * Vale para os dois headers: o da home (HTML estático) e o BwaNav (JSX).
 * O item "Incorporadoras" nasce com `hidden` no HTML da home e só aparece
 * quando a flag/prévia de incorporadoras está ligada.
 * ========================================================================= */
function installNavDropdowns(root: HTMLElement, signal: AbortSignal): Cleanup {
  const wrappers = Array.from(root.querySelectorAll<HTMLElement>("[data-nav-dd]"));
  const incorpOn = isIncorporadorasEnabled();
  // Itens condicionais do menu (desktop e mobile) só aparecem com a flag ou em prévia.
  if (incorpOn) {
    root
      .querySelectorAll<HTMLElement>("[data-incorp-gated]")
      .forEach((el) => el.removeAttribute("hidden"));
  }
  if (!wrappers.length) return NOOP;

  const closers: Cleanup[] = [];
  const canHover =
    typeof window.matchMedia === "function" ? window.matchMedia("(hover: hover)").matches : false;

  for (const wrapper of wrappers) {
    const button = wrapper.querySelector<HTMLButtonElement>("[data-nav-dd-button]");
    const panel = wrapper.querySelector<HTMLElement>("[data-nav-dd-panel]");
    if (!button || !panel) continue;

    let open = false;
    let closeTimer = 0;
    // Em telas com mouse o painel já abre no hover: o primeiro clique não pode fechá-lo.
    let abertoPorHover = false;

    const setOpen = (next: boolean, restoreFocus = false) => {
      window.clearTimeout(closeTimer);
      if (next === open) return;
      open = next;
      wrapper.classList.toggle("bwa-open", next);
      button.setAttribute("aria-expanded", String(next));
      if (!next && restoreFocus) button.focus({ preventScroll: true });
    };

    setOpen(false);
    button.setAttribute("aria-expanded", "false");
    closers.push(() => setOpen(false));

    // Clique e toque: o próprio <button> já responde a Enter e Espaço.
    button.addEventListener(
      "click",
      () => {
        if (abertoPorHover) {
          abertoPorHover = false;
          setOpen(true);
          return;
        }
        setOpen(!open);
      },
      { signal },
    );
    button.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setOpen(true);
          focusablesIn([panel])[0]?.focus({ preventScroll: true });
        }
      },
      { signal },
    );
    wrapper.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false, true);
        }
      },
      { signal },
    );
    // O foco saiu do dropdown (Tab para o próximo link do menu): fecha.
    wrapper.addEventListener(
      "focusout",
      (event) => {
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !wrapper.contains(next)) setOpen(false);
      },
      { signal },
    );
    // Navegou por um item: fecha antes de a SPA trocar de página.
    panel.addEventListener(
      "click",
      (event) => {
        if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
      },
      { signal },
    );

    if (canHover) {
      wrapper.addEventListener(
        "mouseenter",
        () => {
          if (!open) abertoPorHover = true;
          setOpen(true);
        },
        { signal },
      );
      wrapper.addEventListener(
        "mouseleave",
        () => {
          window.clearTimeout(closeTimer);
          closeTimer = window.setTimeout(() => {
            abertoPorHover = false;
            setOpen(false);
          }, 220);
        },
        { signal },
      );
    }
  }

  const closeAll = () => closers.forEach((c) => c());
  // Clique fora e navegação da SPA fecham qualquer painel aberto.
  document.addEventListener(
    "pointerdown",
    (event) => {
      const target = event.target;
      if (target instanceof Node && wrappers.some((w) => w.contains(target))) return;
      closeAll();
    },
    { signal },
  );
  window.addEventListener("popstate", closeAll, { signal });
  window.addEventListener("lovable:navigate", closeAll, { signal });

  return closeAll;
}

/* =========================================================================
 * Header: estado "rolado" + menu mobile acessível.
 * Menu aberto: foco vai para o primeiro link, Tab fica preso no header +
 * menu, o resto da página fica `inert`, Esc fecha e devolve o foco ao botão.
 * ========================================================================= */
function installNavChrome(root: HTMLElement, signal: AbortSignal): Cleanup {
  const body = document.body;
  const nav = root.querySelector<HTMLElement>("[data-nav]");
  const button = root.querySelector<HTMLButtonElement>("[data-menu-button]");
  const menu = root.querySelector<HTMLElement>("[data-mobile-menu]");
  const closeDropdowns = installNavDropdowns(root, signal);

  if (nav) {
    const updateNav = () => nav.classList.toggle("bwa-scrolled", window.scrollY > 28);
    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true, signal });
  }

  if (!button || !menu) return closeDropdowns;

  const keep = nav ? [nav, menu] : [button, menu];
  let open = false;
  let releaseInert: Cleanup = NOOP;

  const setOpen = (next: boolean, restoreFocus = false) => {
    if (next === open) return;
    open = next;
    body.classList.toggle(MENU_OPEN_CLASS, next);
    button.setAttribute("aria-expanded", String(next));
    button.setAttribute("aria-label", next ? "Fechar menu" : "Abrir menu");
    if (next) {
      releaseInert = inertOutside(keep);
      (focusablesIn([menu])[0] ?? button).focus({ preventScroll: true });
    } else {
      releaseInert();
      releaseInert = NOOP;
      if (restoreFocus) button.focus({ preventScroll: true });
    }
  };

  // Estado inicial coerente: menu fechado.
  body.classList.remove(MENU_OPEN_CLASS);
  button.setAttribute("aria-expanded", "false");

  button.addEventListener("click", () => setOpen(!open, true), { signal });
  // Link do menu: fecha antes de a SPA navegar (o foco segue a nova página).
  menu.addEventListener(
    "click",
    (event) => {
      if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
    },
    { signal },
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false, true);
        return;
      }
      trapTab(event, keep);
    },
    { signal },
  );
  // Girou o tablet / alargou a janela: o menu mobile deixa de existir.
  const desktop = typeof window.matchMedia === "function" ? window.matchMedia(DESKTOP_NAV_QUERY) : null;
  desktop?.addEventListener?.(
    "change",
    (event) => {
      if (event.matches) setOpen(false);
    },
    { signal },
  );

  return () => {
    setOpen(false);
    closeDropdowns();
  };
}

/* =========================================================================
 * Galeria de projetos: arrastar com o mouse, inércia e contador.
 * ========================================================================= */
function installGallery(root: HTMLElement, signal: AbortSignal, reducedMotion: boolean): Cleanup {
  const rail = root.querySelector<HTMLElement>("[data-gallery-rail]");
  if (!rail) return NOOP;
  const slides = Array.from(rail.querySelectorAll<HTMLElement>(".bwa-image-gallery-slide"));
  const current = root.querySelector<HTMLElement>("[data-gallery-current]");
  const progress = root.querySelector<HTMLElement>("[data-gallery-progress]");

  let statusFrame = 0;
  let momentumFrame = 0;
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let scrollStart = 0;
  let lastX = 0;
  let lastTime = 0;
  let velocity = 0;
  let dragAxis: "x" | "y" | null = null;
  let didDrag = false;

  const activeIndex = () => {
    const railCenter = rail.scrollLeft + rail.clientWidth / 2;
    let index = 0;
    let closest = Infinity;
    slides.forEach((slide, i) => {
      const distance = Math.abs(slide.offsetLeft + slide.clientWidth / 2 - railCenter);
      if (distance < closest) {
        closest = distance;
        index = i;
      }
    });
    return index;
  };

  const updateStatus = () => {
    if (!slides.length) return;
    const index = activeIndex();
    if (current) current.textContent = String(index + 1).padStart(2, "0");
    if (progress) progress.style.transform = `scaleX(${index + 1})`;
  };

  const requestStatus = () => {
    if (statusFrame) return;
    statusFrame = window.requestAnimationFrame(() => {
      statusFrame = 0;
      updateStatus();
    });
  };

  const stopMomentum = () => {
    if (!momentumFrame) return;
    window.cancelAnimationFrame(momentumFrame);
    momentumFrame = 0;
  };

  const settle = () => {
    if (reducedMotion || !slides.length) return;
    slides[activeIndex()]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const release = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    if (rail.hasPointerCapture?.(event.pointerId)) rail.releasePointerCapture(event.pointerId);
    rail.classList.remove("bwa-dragging");
    pointerId = null;

    if (dragAxis !== "x" || reducedMotion) {
      dragAxis = null;
      return;
    }

    let v = velocity;
    const coast = () => {
      v *= 0.92;
      if (Math.abs(v) < 0.18) {
        momentumFrame = 0;
        settle();
        return;
      }
      rail.scrollLeft -= v * 16;
      momentumFrame = window.requestAnimationFrame(coast);
    };
    momentumFrame = window.requestAnimationFrame(coast);
    dragAxis = null;
  };

  const move = (direction: -1 | 1) => {
    if (!slides.length) return;
    stopMomentum();
    const target = Math.max(0, Math.min(slides.length - 1, activeIndex() + direction));
    slides[target]?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  root.querySelector("[data-gallery-prev]")?.addEventListener("click", () => move(-1), { signal });
  root.querySelector("[data-gallery-next]")?.addEventListener("click", () => move(1), { signal });

  rail.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType === "touch" || event.button !== 0) return;
      stopMomentum();
      pointerId = event.pointerId;
      rail.setPointerCapture?.(event.pointerId);
      startX = event.clientX;
      startY = event.clientY;
      scrollStart = rail.scrollLeft;
      lastX = event.clientX;
      lastTime = performance.now();
      velocity = 0;
      dragAxis = null;
      didDrag = false;
    },
    { signal },
  );
  rail.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerId !== pointerId) return;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      if (!dragAxis && Math.hypot(deltaX, deltaY) > 6) {
        dragAxis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
        if (dragAxis === "x") rail.classList.add("bwa-dragging");
      }
      if (dragAxis !== "x") return;
      event.preventDefault();
      didDrag = true;
      rail.scrollLeft = scrollStart - deltaX;
      const now = performance.now();
      velocity = (event.clientX - lastX) / Math.max(1, now - lastTime);
      lastX = event.clientX;
      lastTime = now;
    },
    { signal },
  );
  rail.addEventListener("pointerup", release, { signal });
  rail.addEventListener("pointercancel", release, { signal });
  rail.addEventListener("dragstart", (event) => event.preventDefault(), { signal });
  // Soltar o arraste em cima de um card não pode abrir o link do card.
  rail.addEventListener(
    "click",
    (event) => {
      if (!didDrag) return;
      event.preventDefault();
      event.stopPropagation();
      didDrag = false;
    },
    { capture: true, signal },
  );
  rail.addEventListener("scroll", requestStatus, { passive: true, signal });
  updateStatus();

  return () => {
    stopMomentum();
    if (statusFrame) window.cancelAnimationFrame(statusFrame);
    statusFrame = 0;
    rail.classList.remove("bwa-dragging");
  };
}

/* =========================================================================
 * FAQ da home (acordeão com altura animada por max-height inline).
 * ========================================================================= */
function installFaqAccordion(root: HTMLElement, signal: AbortSignal): Cleanup {
  const items = Array.from(root.querySelectorAll<HTMLElement>(".bwa-faq-item"));
  if (!items.length) return NOOP;

  const setOpen = (item: HTMLElement, open: boolean) => {
    const answer = item.querySelector<HTMLElement>(".bwa-faq-answer");
    const question = item.querySelector<HTMLElement>(".bwa-faq-question");
    if (!answer || !question) return;
    item.classList.toggle("bwa-open", open);
    question.setAttribute("aria-expanded", String(open));
    answer.style.maxHeight = open ? `${answer.scrollHeight}px` : "0px";
  };

  items.forEach((item, i) => {
    const answer = item.querySelector<HTMLElement>(".bwa-faq-answer");
    const question = item.querySelector<HTMLElement>(".bwa-faq-question");
    if (answer && question) {
      if (!answer.id) answer.id = `bwa-home-faq-${i + 1}`;
      question.setAttribute("aria-controls", answer.id);
    }
    setOpen(item, item.classList.contains("bwa-open"));
    question?.addEventListener("click", () => setOpen(item, !item.classList.contains("bwa-open")), { signal });
  });

  // Texto que quebra em outra largura muda a altura da resposta aberta.
  let frame = 0;
  window.addEventListener(
    "resize",
    () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        root.querySelectorAll<HTMLElement>(".bwa-faq-item.bwa-open .bwa-faq-answer").forEach((answer) => {
          answer.style.maxHeight = `${answer.scrollHeight}px`;
        });
      });
    },
    { signal },
  );

  return () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  };
}

/* =========================================================================
 * Modal do depoimento em vídeo.
 * ========================================================================= */
function installVideoModal(root: HTMLElement, signal: AbortSignal): Cleanup {
  const modal = root.querySelector<HTMLElement>("[data-video-modal]");
  if (!modal) return NOOP;
  const trigger = root.querySelector<HTMLElement>("[data-video-demo]");
  const closeButton = root.querySelector<HTMLElement>("[data-close-modal]");
  const video = root.querySelector<HTMLVideoElement>("[data-video-element]");

  let isOpen = false;
  let previousOverflow = "";
  let returnFocus: HTMLElement | null = null;
  let releaseInert: Cleanup = NOOP;

  const setModal = (open: boolean, restoreFocus = true) => {
    if (open === isOpen) return;
    isOpen = open;
    modal.classList.toggle("bwa-open", open);
    if (open) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : trigger;
      releaseInert = inertOutside([modal]);
      closeButton?.focus({ preventScroll: true });
      try {
        void video?.play()?.catch(() => {});
      } catch {
        /* autoplay bloqueado: o visitante usa os controles do player */
      }
      return;
    }
    document.body.style.overflow = previousOverflow;
    releaseInert();
    releaseInert = NOOP;
    try {
      video?.pause();
      if (video) video.currentTime = 0;
    } catch {
      /* player ainda sem mídia carregada */
    }
    if (restoreFocus) (returnFocus ?? trigger)?.focus({ preventScroll: true });
    returnFocus = null;
  };

  trigger?.addEventListener("click", () => setModal(true), { signal });
  closeButton?.addEventListener("click", () => setModal(false), { signal });
  modal.addEventListener(
    "click",
    (event) => {
      if (event.target === modal) setModal(false);
    },
    { signal },
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (!isOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setModal(false);
        return;
      }
      trapTab(event, [modal]);
    },
    { signal },
  );

  // Desmontou com o vídeo aberto (ex.: botão Voltar): devolve a rolagem.
  return () => setModal(false, false);
}

/* =========================================================================
 * Entrada suave dos blocos (desligada com prefers-reduced-motion).
 * ========================================================================= */
const REVEAL_SELECTOR =
  ".bwa-title, .bwa-lead, .bwa-project-card, .bwa-proof-card, .bwa-objective, .bwa-audience-card, .bwa-discipline";

function installReveal(root: HTMLElement, reducedMotion: boolean): Cleanup {
  const elements = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
  elements.forEach((el) => el.classList.add("bwa-reveal"));

  if (reducedMotion || typeof IntersectionObserver === "undefined") {
    elements.forEach((el) => el.classList.add("bwa-visible"));
    return NOOP;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("bwa-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  elements.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}

/* =========================================================================
 * Formulário do rodapé → abre direto no WhatsApp. Mesma lógica de
 * src/components/BwaWhatsForm.tsx (rodapé das páginas internas).
 * ========================================================================= */
const WHATS_NUMBER = "5511911906183";

function installWhatsForm(root: HTMLElement, signal: AbortSignal): void {
  const form = root.querySelector<HTMLFormElement>("[data-whats-form]");
  if (!form) return;
  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      const nome = (form.querySelector<HTMLInputElement>('input[name="nome"]')?.value ?? "").trim();
      const mensagem = (form.querySelector<HTMLTextAreaElement>('textarea[name="mensagem"]')?.value ?? "").trim();
      const text = [`Olá! Me chamo ${nome}.`, mensagem].filter(Boolean).join(" ");
      trackEvent("cta_click", { location: "footer-whatsapp" });
      window.open(`https://wa.me/${WHATS_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    },
    { signal },
  );
}

/* Selo Reclame Aqui no rodapé (uma vez por contêiner). */
function installReclameAquiSeal(root: HTMLElement): void {
  const holder = root.querySelector<HTMLElement>("#ra-verified-seal");
  if (!holder || holder.querySelector("script")) return;
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.id = "ra-embed-verified-seal";
  script.src = "https://s3.amazonaws.com/raichu-beta/ra-verified/bundle.js";
  script.setAttribute("data-id", "SEpqak1Mcm9aM09nMm0wbDpid2lsZC1yZWZvcm1hcw==");
  script.setAttribute("data-target", "ra-verified-seal");
  script.setAttribute("data-model", "horizontal_1");
  holder.appendChild(script);
}

/* =========================================================================
 * API pública
 * ========================================================================= */

/** Home inteira (header, galeria, FAQ, vídeo, reveals, rodapé). */
/**
 * Propaga a origem da campanha (UTMs) para os links de orçamento da home.
 * O clique normal já passa pela navegação SPA (que carrega os parâmetros),
 * mas o href precisa carregá-los também para abrir em nova aba/cópia de link.
 */
function propagateCampaignToBudgetLinks(root: HTMLElement): void {
  const target = withUtm("/orcamento");
  if (target === "/orcamento") return;
  root.querySelectorAll<HTMLAnchorElement>('a[href="/orcamento"]').forEach((a) => {
    a.setAttribute("href", target);
  });
}

export function initHomeBwa(root: HTMLElement | null): Cleanup {
  if (!root || root.dataset.bwaHomeInited === "1") return NOOP;
  root.dataset.bwaHomeInited = "1";

  const controller = new AbortController();
  const { signal } = controller;
  const reducedMotion = prefersReducedMotion();
  const cleanups: Cleanup[] = [
    installNavChrome(root, signal),
    installGallery(root, signal, reducedMotion),
    installFaqAccordion(root, signal),
    installVideoModal(root, signal),
    installReveal(root, reducedMotion),
  ];
  installWhatsForm(root, signal);
  installReclameAquiSeal(root);
  propagateCampaignToBudgetLinks(root);

  return () => {
    controller.abort();
    for (let i = cleanups.length - 1; i >= 0; i -= 1) cleanups[i]();
    delete root.dataset.bwaHomeInited;
  };
}

/** Header .bwa das páginas internas (BwaNav). */
export function initBwaNav(root: HTMLElement | null): Cleanup {
  if (!root || root.dataset.bwaNavInited === "1") return NOOP;
  root.dataset.bwaNavInited = "1";

  const controller = new AbortController();
  const closeNav = installNavChrome(root, controller.signal);

  return () => {
    controller.abort();
    closeNav();
    delete root.dataset.bwaNavInited;
  };
}
