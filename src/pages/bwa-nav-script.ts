/**
 * Header .bwa (menu desktop, dropdowns, menu mobile acessível e estado
 * "digitando" do <html>): o que o BwaNav de TODA página pública precisa.
 *
 * Saiu de home-bwa-script.ts em 09/11/2026: o BwaNav importava `initBwaNav`
 * de lá e, como o módulo é um só, a galeria, o FAQ, o vídeo, o mapa e os
 * reveals da home (~16 kB) iam no pacote inicial de todas as páginas
 * internas. A home continua usando estas mesmas funções (home-bwa-script.ts
 * importa daqui), com o contrato de `init*` descrito lá.
 */
import { isIncorporadorasEnabled } from "@/lib/incorporadorasFlag";

export type Cleanup = () => void;

export const NOOP: Cleanup = () => {};
const MENU_OPEN_CLASS = "bwa-menu-open";
/**
 * No <html> enquanto o foco está num campo de texto: no celular, a barra
 * "Solicitar orçamento" e o botão "Dúvidas" saem da frente do teclado
 * (home-bwa.css e site-assistant.css).
 *
 * É um atributo, não uma classe: trocar uma classe no <html> fazia o Chrome
 * recalcular o estilo do documento inteiro a cada toque num campo (MOB-03).
 */
const TYPING_ATTR = "data-bwa-typing";
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

const NON_TEXT_INPUTS = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

/** Campo em que se digita (abre o teclado no celular). */
function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(target.type);
  return target.isContentEditable === true;
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
export function trapTab(event: KeyboardEvent, containers: Element[]): void {
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
export function inertOutside(keep: Element[]): Cleanup {
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
 * `data-bwa-typing` no <html> enquanto um campo de texto tem o foco
 * (formulário do rodapé, /orcamento...). Escuta o document porque os campos
 * ficam fora da raiz do header; a limpeza tira o atributo.
 * ========================================================================= */
function installTypingState(signal: AbortSignal): Cleanup {
  const html = document.documentElement;
  const set = (typing: boolean) => {
    // Só escreve quando muda: de um campo para o outro nada é tocado.
    if (html.hasAttribute(TYPING_ATTR) !== typing) html.toggleAttribute(TYPING_ATTR, typing);
  };
  set(isTextEntry(document.activeElement));
  document.addEventListener("focusin", (event) => set(isTextEntry(event.target)), { signal });
  // Foco indo de um campo para outro: `relatedTarget` já é o próximo campo.
  document.addEventListener("focusout", (event) => set(isTextEntry(event.relatedTarget)), { signal });
  return () => html.removeAttribute(TYPING_ATTR);
}

/* =========================================================================
 * Header: estado "rolado" + menu mobile acessível.
 * Menu aberto: foco vai para o primeiro link, Tab fica preso no header +
 * menu, o resto da página fica `inert`, Esc fecha e devolve o foco ao botão.
 * ========================================================================= */
export function installNavChrome(root: HTMLElement, signal: AbortSignal): Cleanup {
  const body = document.body;
  const nav = root.querySelector<HTMLElement>("[data-nav]");
  const button = root.querySelector<HTMLButtonElement>("[data-menu-button]");
  const menu = root.querySelector<HTMLElement>("[data-mobile-menu]");
  const closeDropdowns = installNavDropdowns(root, signal);
  const stopTyping = installTypingState(signal);
  const release = () => {
    closeDropdowns();
    stopTyping();
  };

  if (nav) {
    const updateNav = () => nav.classList.toggle("bwa-scrolled", window.scrollY > 28);
    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true, signal });
  }

  if (!button || !menu) return release;

  const keep = nav ? [nav, menu] : [button, menu];
  let open = false;

  /*
   * `inert` no resto da página entra (e sai) um quadro DEPOIS de o menu
   * aparecer (ou sumir). Marcar a página inteira como inerte obriga o
   * navegador a recalcular o estilo de quase todos os elementos; feito dentro
   * do toque, isso segurava a abertura do menu (~100 ms num celular
   * intermediário — MOB-05). O foco já está no menu e o Tab já está preso
   * (trapTab) antes disso; a limpeza do componente desfaz na hora.
   */
  let undoInert: Cleanup | null = null;
  let inertSeq = 0;
  /** Devolve a função que leva o `inert` ao estado pedido — só a última pedida vale. */
  const inertSync = (wanted: boolean): (() => void) => {
    const seq = ++inertSeq;
    return () => {
      if (seq !== inertSeq) return;
      if (wanted && !undoInert) undoInert = inertOutside(keep);
      else if (!wanted && undoInert) {
        undoInert();
        undoInert = null;
      }
    };
  };
  const afterPaint = (run: () => void) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(run));
  };

  const setOpen = (next: boolean, restoreFocus = false) => {
    if (next === open) return;
    open = next;
    body.classList.toggle(MENU_OPEN_CLASS, next);
    button.setAttribute("aria-expanded", String(next));
    button.setAttribute("aria-label", next ? "Fechar menu" : "Abrir menu");
    afterPaint(inertSync(next));
    if (next) (focusablesIn([menu])[0] ?? button).focus({ preventScroll: true });
    else if (restoreFocus) button.focus({ preventScroll: true });
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
    // Desmontando: nada de esperar o próximo quadro para soltar a página.
    inertSync(false)();
    release();
  };
}

/* =========================================================================
 * Galeria de projetos: arrastar com o mouse, inércia e contador.
 * ========================================================================= */
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
