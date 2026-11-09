/**
 * Comportamento imperativo da home (HTML aprovado em home-bwa-body.ts). O
 * header .bwa (menu, dropdowns, menu mobile, estado "digitando") mora em
 * bwa-nav-script.ts, que o BwaNav das páginas internas importa direto — assim
 * o resto deste arquivo fica fora do pacote inicial delas.
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
import { withUtm } from "@/lib/utm";
import { reportContact } from "@/lib/conversions";
import { trackEvent } from "@/lib/ga4";
import { isConsentAccepted, onConsentChange } from "@/lib/cookieConsent";
import { prefersReducedMotion } from "@/lib/reducedMotion";
import { mountReclameAquiSealWhenVisible } from "@/lib/reclameAquiSeal";
import { installNavChrome, inertOutside, NOOP, trapTab, type Cleanup } from "./bwa-nav-script";

export type { Cleanup };
export { initBwaNav } from "./bwa-nav-script";

/** Abaixo de lg, as descrições ficam sempre legíveis em linha. */
const SERVICES_ACCORDION_QUERY = "(max-width: 1023px)";
/** Só com mouse (não no toque) o hover no índice troca o painel. */
const SERVICES_HOVER_QUERY = "(hover: hover) and (pointer: fine)";
/** Pausa antes de o hover trocar o painel: atravessar a lista não pisca 12 itens. */
const SERVICES_HOVER_DELAY_MS = 90;

function installGallery(root: HTMLElement, signal: AbortSignal, reducedMotion: boolean): Cleanup {
  const rail = root.querySelector<HTMLElement>("[data-gallery-rail]");
  if (!rail) return NOOP;
  const slides = Array.from(rail.querySelectorAll<HTMLElement>(".bwa-image-gallery-slide"));
  const current = root.querySelector<HTMLElement>("[data-gallery-current]");
  const progress = root.querySelector<HTMLElement>("[data-gallery-progress]");
  const prevButton = root.querySelector<HTMLButtonElement>("[data-gallery-prev]");
  const nextButton = root.querySelector<HTMLButtonElement>("[data-gallery-next]");

  let lastIndex = -1;
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
    if (index === lastIndex) return;
    lastIndex = index;
    if (current) current.textContent = String(index + 1).padStart(2, "0");
    if (progress) progress.style.transform = `scaleX(${index + 1})`;
    prevButton?.setAttribute("aria-disabled", String(index === 0));
    nextButton?.setAttribute("aria-disabled", String(index === slides.length - 1));
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

  prevButton?.addEventListener("click", () => move(-1), { signal });
  nextButton?.addEventListener("click", () => move(1), { signal });
  rail.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
      }
    },
    { signal },
  );

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
  // Contador inicial no próximo quadro: ler offsetLeft aqui, no meio da
  // montagem (que acabou de mexer no DOM), forçava um layout síncrono da
  // página inteira ("reflow forçado" do PageSpeed, 30/10/2026).
  requestStatus();

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
 * Serviços · 02 (#certeza) — mockup 1b (10/10/2026), imagem fixa (11/10/2026).
 *
 * HTML do servidor: cada item é <p class="bwa-services-item-title"><b>01</b>
 * <strong>Título.</strong></p> + <div class="bwa-services-item-detail"> com o
 * texto completo — legível sem JS e pela busca. A seção tem UMA imagem fixa
 * (equipe em obra) na coluna do detalhe; o clique no tópico só troca o texto.
 * O conteúdo do título ganha um <button class="bwa-services-trigger"> e:
 *  - ≥ lg com mouse (`is-indexed`): o painel recebe número,
 *    título e texto do item ativo (clique, foco ou hover); os
 *    detalhes em linha somem pelo CSS. Abre no item 01.
 *  - abaixo de lg ou sem mouse (`is-readable`): todos os detalhes em linha
 *    permanecem visíveis, sem controles que dependam de interação.
 * Girou o tablet: sai de um modo e entra no outro. A limpeza devolve o HTML
 * como veio.
 * ========================================================================= */
function installServicesIndex(root: HTMLElement, signal: AbortSignal): Cleanup {
  if (typeof window.matchMedia !== "function") return NOOP;
  const section = root.querySelector<HTMLElement>("[data-services]");
  const panel = section?.querySelector<HTMLElement>("[data-services-detail]");
  if (!section || !panel) return NOOP;

  type Item = {
    li: HTMLElement;
    title: HTMLElement;
    detail: HTMLElement;
    discipline: string;
    trigger: HTMLButtonElement;
  };
  const items: Item[] = [];
  section.querySelectorAll<HTMLElement>("[data-services-list]").forEach((list) => {
    const discipline = list.dataset.discipline ?? "";
    list.querySelectorAll<HTMLElement>(":scope > [data-services-item]").forEach((li) => {
      const title = li.querySelector<HTMLElement>(":scope > .bwa-services-item-title");
      const detail = li.querySelector<HTMLElement>(":scope > .bwa-services-item-detail");
      if (!title || !detail) return;
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "bwa-services-trigger";
      items.push({ li, title, detail, discipline, trigger });
    });
  });
  if (!items.length) return NOOP;

  if (!panel.id) panel.id = "bwa-services-panel";
  items.forEach((item, i) => {
    if (!item.detail.id) item.detail.id = `bwa-services-item-${i + 1}`;
    item.trigger.append(...Array.from(item.title.childNodes));
    item.title.appendChild(item.trigger);
    item.title.classList.add("has-trigger");
  });

  const accordionQuery = window.matchMedia(SERVICES_ACCORDION_QUERY);
  const hoverQuery = window.matchMedia(SERVICES_HOVER_QUERY);
  let mode: "indexed" | "readable" | null = null;
  let active = -1;
  let hoverTimer = 0;

  const cancelHover = () => {
    if (hoverTimer) window.clearTimeout(hoverTimer);
    hoverTimer = 0;
  };

  /** Painel = figura (com a disciplina em cima) + número e título + texto do item. */
  const select = (index: number) => {
    const item = items[index];
    if (!item || mode !== "indexed" || index === active) return;
    active = index;
    items.forEach((it, i) => {
      it.li.classList.toggle("is-active", i === index);
      it.trigger.setAttribute("aria-expanded", String(i === index));
      if (i === index) it.trigger.setAttribute("aria-current", "true");
      else it.trigger.removeAttribute("aria-current");
    });

    const inner = document.createElement("div");
    inner.className = "bwa-services-detail-inner";
    const head = document.createElement("p");
    head.className = "bwa-services-detail-head";
    const number = item.title.querySelector("b");
    const name = item.title.querySelector("strong");
    if (number) head.appendChild(number.cloneNode(true));
    if (name) head.appendChild(name.cloneNode(true));
    inner.appendChild(head);
    const text = item.detail.querySelector(".bwa-services-item-text");
    if (text) inner.appendChild(text.cloneNode(true));
    panel.replaceChildren(inner);
  };

  const enterIndexed = () => {
    cancelHover();
    mode = "indexed";
    active = -1;
    section.classList.add("is-indexed");
    section.classList.remove("is-readable");
    panel.hidden = false;
    panel.setAttribute("aria-live", "polite");
    items.forEach((item) => {
      item.li.classList.remove("is-open");
      if (!item.title.contains(item.trigger)) {
        item.trigger.append(...Array.from(item.title.childNodes));
        item.title.appendChild(item.trigger);
        item.title.classList.add("has-trigger");
      }
      item.trigger.setAttribute("aria-expanded", "false");
      item.trigger.setAttribute("aria-controls", panel.id);
    });
    select(0);
  };

  const enterReadable = () => {
    cancelHover();
    mode = "readable";
    active = -1;
    section.classList.add("is-readable");
    section.classList.remove("is-indexed");
    panel.hidden = true;
    panel.replaceChildren();
    panel.removeAttribute("aria-live");
    items.forEach((item) => {
      item.li.classList.remove("is-active", "is-open");
      item.trigger.removeAttribute("aria-current");
      item.trigger.removeAttribute("aria-expanded");
      item.trigger.removeAttribute("aria-controls");
      if (item.title.contains(item.trigger)) {
        item.title.append(...Array.from(item.trigger.childNodes));
        item.trigger.remove();
        item.title.classList.remove("has-trigger");
      }
    });
  };

  items.forEach((item, index) => {
    item.trigger.addEventListener(
      "click",
      () => {
        cancelHover();
        if (mode === "indexed") select(index);
      },
      { signal },
    );
    item.trigger.addEventListener(
      "mouseenter",
      () => {
        if (mode !== "indexed" || !hoverQuery.matches || index === active) return;
        cancelHover();
        hoverTimer = window.setTimeout(() => {
          hoverTimer = 0;
          select(index);
        }, SERVICES_HOVER_DELAY_MS);
      },
      { signal },
    );
    item.trigger.addEventListener("mouseleave", cancelHover, { signal });
    item.li.addEventListener("focusin", () => {
      cancelHover();
      select(index);
    }, { signal });
  });

  const sync = () => (accordionQuery.matches || !hoverQuery.matches ? enterReadable() : enterIndexed());
  sync();
  accordionQuery.addEventListener?.("change", sync, { signal });
  hoverQuery.addEventListener?.("change", sync, { signal });

  return () => {
    cancelHover();
    mode = null;
    section.classList.remove("is-indexed", "is-readable");
    panel.hidden = true;
    panel.replaceChildren();
    panel.removeAttribute("aria-live");
    items.forEach((item) => {
      item.li.classList.remove("is-active", "is-open");
      item.title.append(...Array.from(item.trigger.childNodes));
      item.trigger.remove();
      item.title.classList.remove("has-trigger");
    });
  };
}

/* =========================================================================
 * Barra fixa "Solicitar orçamento" do celular. Aparece só quando o botão
 * do herói sai da tela e some de novo do fechamento (#contato, que tem os
 * próprios botões) até o fim da página — nunca duas chamadas iguais na
 * mesma tela. Nasce com `is-hidden` no HTML (sem piscar antes do script).
 * Menu aberto e teclado aberto (`data-bwa-typing`) também a escondem, pelo CSS.
 *
 * A posição é lida na rolagem (um quadro por vez), não por
 * IntersectionObserver: um salto direto do rodapé para o meio da página
 * (âncora, Voltar) não cruza o fechamento e o observer não avisaria; e a
 * margem que resolveria isso é ignorada quando o site roda dentro de um
 * iframe de outro domínio (prévia do Lovable).
 * ========================================================================= */
function installMobileCta(root: HTMLElement, signal: AbortSignal): Cleanup {
  const bar = root.querySelector<HTMLElement>(".bwa-mobile-cta");
  if (!bar) return NOOP;
  const heroCta = root.querySelector<HTMLElement>(".bwa-hero-bottom");
  const finale = root.querySelector<HTMLElement>(".bwa-final");
  let pending = false;
  let frame = 0;

  const update = () => {
    pending = false;
    const vh = window.innerHeight;
    const hero = heroCta?.getBoundingClientRect();
    const heroVisible = !!hero && hero.bottom > 0 && hero.top < vh;
    // Fim da página: o topo do fechamento já passou da borda de baixo da tela.
    const atEnd = !!finale && finale.getBoundingClientRect().top < vh;
    bar.classList.toggle("is-hidden", heroVisible || atEnd);
  };
  const schedule = () => {
    if (pending) return;
    pending = true;
    frame = window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", schedule, { passive: true, signal });
  window.addEventListener("resize", schedule, { signal });
  // Primeira leitura no próximo quadro, não aqui: getBoundingClientRect logo
  // depois das escritas da montagem forçava um layout síncrono (reflow
  // forçado, PageSpeed 30/10/2026). A barra nasce `is-hidden` no HTML, então
  // esperar um quadro não mostra nada fora de hora.
  schedule();

  return () => {
    if (pending) window.cancelAnimationFrame(frame);
    pending = false;
    bar.classList.add("is-hidden");
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
 *
 * Só para o que ainda está ABAIXO da tela quando a página monta. O que o
 * visitante já vê (ou já passou, numa volta com a rolagem restaurada) fica
 * como veio do servidor. Até 30/10/2026 todos os blocos ganhavam
 * `bwa-reveal` (opacity: 0) na hidratação: o que já estava pintado sumia e
 * voltava em 0,8 s — no desktop, títulos e cards logo abaixo do hero; no
 * PageSpeed isso pesava no Speed Index (4,7 s no celular).
 *
 * A separação usa um IntersectionObserver sem margem (a resposta é
 * assíncrona, sem ler layout na montagem). Os blocos abaixo da tela ganham
 * `bwa-reveal` e passam para o observador da entrada; transform/opacity não
 * mexem no layout, então nada disso conta como CLS.
 * ========================================================================= */
const REVEAL_SELECTOR =
  ".bwa-title, .bwa-lead, .bwa-project-card, .bwa-proof-card, .bwa-objective, .bwa-audience-card, .bwa-services-list, .bwa-services-detail";

function installReveal(root: HTMLElement, reducedMotion: boolean): Cleanup {
  if (reducedMotion || typeof IntersectionObserver === "undefined") return NOOP;
  const elements = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
  if (!elements.length) return NOOP;

  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("bwa-visible");
        reveal.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  // `disconnect()` não descarta notificações já enfileiradas: depois da
  // limpeza, nada mais é escondido nem observado.
  let disposed = false;
  const sort = new IntersectionObserver((entries) => {
    if (disposed) return;
    entries.forEach((entry) => {
      const el = entry.target as HTMLElement;
      sort.unobserve(el);
      // Na tela ou acima dela: fica visível, sem animação. Retângulo vazio
      // (bloco dentro de uma seção com `content-visibility: auto` ainda não
      // desenhada, ou oculto com `hidden`) conta como "abaixo": entra com a
      // animação quando aparecer, como antes.
      const rect = entry.boundingClientRect;
      const empty = rect.width === 0 && rect.height === 0;
      if (entry.isIntersecting || (!empty && rect.bottom <= 0)) return;
      el.classList.add("bwa-reveal");
      reveal.observe(el);
    });
  });
  elements.forEach((el) => sort.observe(el));
  return () => {
    disposed = true;
    sort.disconnect();
    reveal.disconnect();
  };
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
      reportContact("whatsapp", "footer-whatsapp");
      window.open(`https://wa.me/${WHATS_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    },
    { signal },
  );
}

/* Selo Reclame Aqui no rodapé: só quando o rodapé chega perto da tela
 * (src/lib/reclameAquiSeal.ts). */
function installReclameAquiSeal(root: HTMLElement): Cleanup {
  return mountReclameAquiSealWhenVisible(root.querySelector<HTMLElement>("#ra-verified-seal"));
}

/* =========================================================================
 * API pública
 * ========================================================================= */

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

/**
 * Mapa interativo do escritório (seção #mapa da home). O embed do Google
 * Maps grava cookies próprios, então o iframe só entra no DOM com o
 * consentimento aceito ou quando o visitante clica em "Carregar mapa".
 */
function installHomeMap(root: HTMLElement, signal: AbortSignal): Cleanup {
  const frame = root.querySelector<HTMLElement>("[data-bwa-map]");
  if (!frame) return NOOP;
  const embed = frame.dataset.embed;
  if (!embed) return NOOP;

  const render = () => {
    if (frame.dataset.bwaMapLoaded === "1") return;
    frame.dataset.bwaMapLoaded = "1";
    const iframe = document.createElement("iframe");
    iframe.className = "bwa-map-iframe";
    iframe.title = "Mapa interativo do escritório da Bewild no Brooklin";
    iframe.src = embed;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    frame.replaceChildren(iframe);
  };

  frame
    .querySelector("[data-bwa-map-load]")
    ?.addEventListener("click", render, { signal });

  if (isConsentAccepted()) {
    render();
    return NOOP;
  }
  const unsubscribe = onConsentChange((value) => {
    if (value === "accepted") render();
  });
  return () => {
    unsubscribe();
    delete frame.dataset.bwaMapLoaded;
  };
}

/** Home inteira (header, galeria, FAQ, serviços, vídeo, reveals, barra do celular, rodapé). */
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
    installServicesIndex(root, signal),
    installVideoModal(root, signal),
    installReveal(root, reducedMotion),
    installHomeMap(root, signal),
    installMobileCta(root, signal),
    installReclameAquiSeal(root),
  ];
  installWhatsForm(root, signal);
  propagateCampaignToBudgetLinks(root);

  return () => {
    controller.abort();
    for (let i = cleanups.length - 1; i >= 0; i -= 1) cleanups[i]();
    delete root.dataset.bwaHomeInited;
  };
}

/**
 * Galeria "Atmosferas Bewild" fora da home (/servicos, desde 10/10/2026): só o
 * trilho com arrasto, inércia e contador — o HTML vem de
 * servicos-bwa-sections.ts. Mesmo contrato dos outros `init*`.
 */
export function initBwaGallery(root: HTMLElement | null): Cleanup {
  if (!root || root.dataset.bwaGalleryInited === "1") return NOOP;
  root.dataset.bwaGalleryInited = "1";
  const controller = new AbortController();
  const cleanup = installGallery(root, controller.signal, prefersReducedMotion());
  return () => {
    controller.abort();
    cleanup();
    delete root.dataset.bwaGalleryInited;
  };
}

/** Header .bwa das páginas internas (BwaNav). */
