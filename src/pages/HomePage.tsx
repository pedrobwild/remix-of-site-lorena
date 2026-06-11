/**
 * HomePage — Nova Home BeWild (porte fiel do mock aprovado).
 *
 * O CSS vive em src/styles/home.css com TODOS os seletores prefixados
 * por `.bw-home` para não vazar para outras páginas. As únicas peças
 * GLOBAIS são o Header (transparente sobre hero escuro, sólido ao rolar
 * em rotas internas via correção em Header.tsx), o Footer (já enxuto) e
 * o FloatingCTA (renderizado no fim deste componente — fixed-position).
 *
 * Animações GSAP rodam dentro de um único useEffect com cleanup, e são
 * desligadas em `prefers-reduced-motion`.
 */
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useSeo } from "@/lib/useSeo";
import { FAQS, whatsappHref } from "@/components/landing/content";
import "@/styles/home.css";

const SITE_URL = "https://bewild.com.br";

/* ------- helpers ------- */
const HERO_IMG =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2400&auto=format&fit=crop";

const SLATS = [
  {
    tag: "O núcleo",
    name: "Reforma turn-key",
    desc: "Projeto, obra, compras, fornecedores, marcenaria, mobiliário e acabamento final coordenados em um único processo.",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1400&auto=format&fit=crop",
    note: "Slot · foto real de obra em andamento",
  },
  {
    tag: "Projeto",
    name: "Arquitetura personalizada",
    desc: "Cada imóvel recebe um estudo próprio de layout, circulação, marcenaria, iluminação, acabamentos e uso. Nada de copiar e colar projeto genérico.",
    img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1400&auto=format&fit=crop",
    note: "Slot · prancha/estudo real BeWild",
  },
  {
    tag: "Especialidade",
    name: "Studios para short stay",
    desc: "Soluções pensadas para foto, diária, experiência do hóspede, limpeza rápida, resistência e manutenção simples.",
    img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1400&auto=format&fit=crop",
    note: "Slot · studio compacto entregue",
  },
  {
    tag: "Interiores",
    name: "Marcenaria inteligente",
    desc: "Aproveitamento de cada centímetro com armários, bancadas, painéis, iluminação e móveis sob medida para studios compactos.",
    img: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?q=80&w=1400&auto=format&fit=crop",
    note: "Slot · close de marcenaria BeWild",
  },
  {
    tag: "Setup",
    name: "Mobiliário, eletros e enxoval",
    desc: "Curadoria de itens essenciais para o imóvel sair pronto para uso, anúncio e operação.",
    img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1400&auto=format&fit=crop",
    note: "Slot · cama feita + eletros",
  },
  {
    tag: "Tecnologia",
    name: "Acompanhamento sem caixa-preta",
    desc: "Portal, cronograma, fotos, relatórios e registros para reduzir incerteza e dar visibilidade total ao cliente.",
    img: "",
    note: "Slot · screenshot do portal (exemplo)",
  },
];

const STEPS = [
  { n: "01", h: "Diagnóstico do imóvel", p: "Analisamos metragem, planta, padrão do prédio, objetivo de uso, região, restrições e potencial do imóvel." },
  { n: "02", h: "Briefing e estratégia", p: "Entendemos se o imóvel será usado para short stay, long stay, uso misto ou moradia. A estratégia define o nível de investimento e as escolhas do projeto." },
  { n: "03", h: "Projeto de arquitetura personalizado", p: "Desenvolvemos layout, conceito, marcenaria, iluminação, acabamentos e soluções para o imóvel performar melhor no uso e na foto." },
  { n: "04", h: "Orçamento e escopo", p: "Organizamos o que está incluso, o que é opcional, quais itens impactam operação e quais escolhas afetam prazo, custo e percepção de valor." },
  { n: "05", h: "Planejamento da obra", p: "Cronograma, compras críticas, fornecedores, condomínio, lead times, marcenaria e sequência de execução." },
  { n: "06", h: "Execução e acompanhamento", p: "A obra avança com gestão técnica, fotos, relatórios, controle de etapas e comunicação centralizada." },
  { n: "07", h: "Entrega pronta para operar", p: "Finalização, limpeza, montagem, ajustes finais, fotos e imóvel pronto para uso, locação ou anúncio." },
];

const PROJ_ITEMS = [
  { n: "01", h: "Layout inteligente", p: "Cama, bancada, cozinha, armários, TV, circulação e apoio de malas para o espaço parecer maior e funcionar melhor." },
  { n: "02", h: "Marcenaria sob medida", p: "Armazenamento, painéis, bancadas e nichos que aumentam a percepção de qualidade e reduzem improvisos." },
  { n: "03", h: "Iluminação e percepção de valor", p: "A luz certa melhora a foto, a experiência do hóspede e a sensação de cuidado no imóvel." },
  { n: "04", h: "Materiais para uso real", p: "A escolha não é só estética. Consideramos limpeza, manutenção, resistência, reposição e custo total." },
  { n: "05", h: "Personalização sem perder eficiência", p: "O projeto respeita o imóvel e o perfil do investidor, sem escolhas que encarecem, atrasam ou prejudicam a operação." },
];

const DIFFS = [
  { icon: <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2.4"/><circle cx="19" cy="12" r="2.4"/><rect x="10" y="10" width="4" height="4" rx="1.2"/><path d="M7.4 12H10M14 12h2.6"/></svg>, h: "Operação ponta a ponta", p: "Um único time integra arquitetura, obra, compras, fornecedores, marcenaria, mobiliário e entrega." },
  { icon: <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h8M12 4v8M12 12v8"/></svg>, h: "Especialização em studios compactos", p: "Conhecemos as decisões críticas de imóveis pequenos: layout, armazenamento, eletros, circulação, iluminação e operação." },
  { icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2"/></svg>, h: "Foco em investidor", p: "Cada escolha considera prazo, custo, percepção de valor, manutenção e potencial de rentabilização." },
  { icon: <svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 8.5h6M9 12h6M9 15.5h4"/></svg>, h: "Transparência de escopo", p: "O cliente entende o que está incluso, o que é opcional e quais escolhas impactam preço ou prazo." },
  { icon: <svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="11" rx="2"/><path d="M9 19.5h6M12 16.2v3.3"/></svg>, h: "Portal de acompanhamento", p: "Fotos, relatórios, cronograma e atualizações para acompanhar a obra sem depender de mensagens soltas." },
  { icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.1"/><path d="M12 3.2v2.6M12 18.2v2.6M3.2 12h2.6M18.2 12h2.6M5.9 5.9l1.9 1.9M16.2 16.2l1.9 1.9M18.1 5.9l-1.9 1.9M7.8 16.2l-1.9 1.9"/></svg>, h: "Gestão técnica", p: "Cronograma, compras, lead times, fornecedores e execução tratados como partes do mesmo sistema." },
  { icon: <svg viewBox="0 0 24 24"><path d="M11 4.5l1.6 4.1 4.1 1.6-4.1 1.6L11 15.9l-1.6-4.1-4.1-1.6 4.1-1.6z"/><path d="M18 15.5v4M16 17.5h4"/></svg>, h: "Acabamentos pensados para operação", p: "Bonito na foto, resistente no uso, simples de limpar e mais fácil de manter." },
  { icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.8"/><path d="M4.2 12h15.6M12 4.2c2.7 2.3 2.7 13.3 0 15.6M12 4.2c-2.7 2.3-2.7 13.3 0 15.6"/></svg>, h: "Experiência remota", p: "Ideal para quem comprou imóvel em São Paulo, mas mora em outra cidade, estado ou país." },
];

const AUDIENCE = [
  { icon: <svg viewBox="0 0 24 24"><path d="M3.5 18.5v-8h17v8M3.5 13.5h17M3.5 10.5V6"/><path d="M6.5 10.5V8.8h5v1.7"/></svg>, h: "Investidor de short stay", p: "Para quem quer preparar o imóvel para Airbnb, Booking ou locação por temporada." },
  { icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.8"/><path d="M14.9 9.1l-1.7 4.1-4.1 1.7 1.7-4.1z"/></svg>, h: "Investidor iniciante", p: "Para quem comprou o primeiro studio e quer fazer certo desde o começo." },
  { icon: <svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.4" height="6.4" rx="1.4"/><rect x="13.6" y="4" width="6.4" height="6.4" rx="1.4"/><rect x="4" y="13.6" width="6.4" height="6.4" rx="1.4"/><rect x="13.6" y="13.6" width="6.4" height="6.4" rx="1.4"/></svg>, h: "Investidor de portfólio", p: "Para quem tem múltiplas unidades e precisa de padrão, processo e escala." },
  { icon: <svg viewBox="0 0 24 24"><path d="M10.6 13.4L4.2 11 20 4.5 13.6 19.8l-3-6.4z"/><path d="M10.6 13.4l3.6-3.6"/></svg>, h: "Cliente remoto", p: "Para quem mora fora de São Paulo, em outro estado ou fora do Brasil." },
  { icon: <svg viewBox="0 0 24 24"><path d="M4 11l8-6.5L20 11M6 10v9h12v-9"/><circle cx="12" cy="14.4" r="2.5"/><path d="M12 13.2v1.4l1 .7"/></svg>, h: "Proprietário de uso misto", p: "Para quem quer usar o imóvel em parte do ano e rentabilizar no restante." },
  { icon: <svg viewBox="0 0 24 24"><circle cx="7" cy="8" r="2.4"/><circle cx="17" cy="8" r="2.4"/><circle cx="12" cy="16.8" r="2.4"/><path d="M9.4 8h5.2M8.2 10l2.6 4.6M15.8 10l-2.6 4.6"/></svg>, h: "Parceiros imobiliários", p: "Para corretores e incorporadoras que querem entregar uma solução mais completa ao comprador." },
];

const COMPARE_ROWS: Array<[string, string, string]> = [
  ["Arquitetura", "Projeto isolado, nem sempre conectado à obra.", "Projeto personalizado já pensado para execução, uso e operação."],
  ["Orçamento", "Múltiplos fornecedores e risco de lacunas.", "Escopo centralizado e itens organizados por etapa."],
  ["Obra", "Cliente cobra e coordena.", "Gestão técnica e acompanhamento estruturado."],
  ["Marcenaria", "Fornecedor separado.", "Integrada ao projeto e à sequência da obra."],
  ["Comunicação", "Mensagens soltas.", "Portal, registros e atualizações."],
  ["Entrega", "Imóvel reformado, mas nem sempre pronto para operar.", "Imóvel pensado para uso, foto, anúncio e operação."],
];

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useSeo({
    title: "BeWild — Reforma turn-key de studios em São Paulo",
    description:
      "Projeto, obra, marcenaria, mobiliário e tecnologia de acompanhamento em um processo único. A BeWild prepara studios para short stay, long stay e investidor remoto, do cru ao pronto para rentabilizar.",
    canonicalPath: "/",
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "BeWild",
        url: SITE_URL,
        description:
          "Reforma turn-key de studios em São Paulo: arquitetura personalizada, obra, marcenaria, mobiliário e portal de acompanhamento em um único processo.",
        areaServed: "São Paulo, Brasil",
      },
    ],
  });

  /* ============================================================
     COMPORTAMENTOS — porte da IIFE do mock para um useEffect único.
     ============================================================ */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    /* ---- Floating CTA: aparece após ~90% da primeira dobra ---- */
    const fcta = root.querySelector<HTMLElement>("#fcta");
    if (fcta) {
      if (sessionStorage.getItem("fctaOff")) {
        fcta.classList.remove("show");
      } else {
        const onS = () => {
          if (window.scrollY > window.innerHeight * 0.9) {
            fcta.classList.add("show");
            window.removeEventListener("scroll", onS);
          }
        };
        window.addEventListener("scroll", onS, { passive: true });
        cleanups.push(() => window.removeEventListener("scroll", onS));
      }
      const x = root.querySelector<HTMLElement>("#fctaX");
      const onX = () => {
        fcta.classList.remove("show");
        sessionStorage.setItem("fctaOff", "1");
      };
      x?.addEventListener("click", onX);
      cleanups.push(() => x?.removeEventListener("click", onX));

      const diag = root.querySelector<HTMLElement>("#diagnostico");
      if (diag) {
        const io = new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => {
              fcta.style.opacity = e.isIntersecting ? "0" : "";
              fcta.style.pointerEvents = e.isIntersecting ? "none" : "";
            }),
          { threshold: 0.2 },
        );
        io.observe(diag);
        cleanups.push(() => io.disconnect());
      }
    }

    /* ---- Reveals ---- */
    const ro = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            ro.unobserve(e.target);
          }
        }),
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" },
    );
    root.querySelectorAll(".rv").forEach((el) => ro.observe(el));
    cleanups.push(() => ro.disconnect());

    /* ---- Contadores de credibilidade ---- */
    const count = (el: HTMLElement) => {
      const t = +(el.dataset.count || "0");
      const t0 = performance.now();
      const dur = 1300;
      const tick = (n: number) => {
        const p = Math.min((n - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(t * e));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const seen = new WeakSet<Element>();
    const co = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting && !seen.has(e.target)) {
            seen.add(e.target);
            const el = e.target as HTMLElement;
            if (reduce) el.textContent = el.dataset.count || "";
            else count(el);
          }
        }),
      { threshold: 0.6 },
    );
    root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => co.observe(el));
    cleanups.push(() => co.disconnect());

    /* ---- Lâminas ---- */
    const slats = Array.from(root.querySelectorAll<HTMLElement>(".slat"));
    const dotsBox = root.querySelector<HTMLElement>("#gDots");
    if (dotsBox && slats.length) {
      dotsBox.innerHTML = "";
      slats.forEach((_, i) => {
        const d = document.createElement("span");
        d.className = "gal-dot" + (i === 0 ? " on" : "");
        dotsBox.appendChild(d);
      });
      const ds = Array.from(dotsBox.children);
      let gi = 0;
      let auto: ReturnType<typeof setInterval> | null = null;
      const go = (i: number) => {
        gi = (i + slats.length) % slats.length;
        slats.forEach((s, j) => s.classList.toggle("on", j === gi));
        ds.forEach((d, j) => d.classList.toggle("on", j === gi));
      };
      const stop = () => {
        if (auto) {
          clearInterval(auto);
          auto = null;
        }
      };
      const prev = root.querySelector<HTMLButtonElement>("#gPrev");
      const next = root.querySelector<HTMLButtonElement>("#gNext");
      const onNext = () => { stop(); go(gi + 1); };
      const onPrev = () => { stop(); go(gi - 1); };
      next?.addEventListener("click", onNext);
      prev?.addEventListener("click", onPrev);
      const canHover = window.matchMedia("(hover: hover)").matches;
      const slatHandlers: Array<[HTMLElement, () => void, (() => void) | null]> = [];
      slats.forEach((s, i) => {
        const onClick = () => { stop(); go(i); };
        const onEnter = canHover ? () => { stop(); go(i); } : null;
        s.addEventListener("click", onClick);
        if (onEnter) s.addEventListener("mouseenter", onEnter);
        slatHandlers.push([s, onClick, onEnter]);
      });
      if (!reduce) auto = setInterval(() => go(gi + 1), 4800);
      cleanups.push(() => {
        stop();
        next?.removeEventListener("click", onNext);
        prev?.removeEventListener("click", onPrev);
        slatHandlers.forEach(([s, c, e]) => {
          s.removeEventListener("click", c);
          if (e) s.removeEventListener("mouseenter", e);
        });
      });
    }

    /* ---- FAQ acordeão ---- */
    const qas = Array.from(root.querySelectorAll<HTMLElement>(".qa"));
    const qaHandlers: Array<[HTMLElement, () => void]> = [];
    qas.forEach((qa) => {
      const q = qa.querySelector<HTMLButtonElement>(".qa-q");
      const a = qa.querySelector<HTMLElement>(".qa-a");
      if (!q || !a) return;
      if (qa.classList.contains("open")) a.style.maxHeight = a.scrollHeight + "px";
      const handler = () => {
        const isOpen = qa.classList.contains("open");
        root.querySelectorAll<HTMLElement>(".qa.open").forEach((o) => {
          o.classList.remove("open");
          const aa = o.querySelector<HTMLElement>(".qa-a");
          if (aa) aa.style.maxHeight = "0px";
        });
        if (!isOpen) {
          qa.classList.add("open");
          a.style.maxHeight = a.scrollHeight + "px";
        }
      };
      q.addEventListener("click", handler);
      qaHandlers.push([q, handler]);
    });
    cleanups.push(() => qaHandlers.forEach(([q, h]) => q.removeEventListener("click", h)));

    /* =====================================================
       GSAP — só roda fora de prefers-reduced-motion.
       ===================================================== */
    if (reduce) {
      root.querySelectorAll<HTMLElement>(".hl>span").forEach((s) => (s.style.transform = "none"));
      return () => cleanups.forEach((c) => c());
    }

    const ctx = gsap.context(() => {
      /* HERO — entrada cinematográfica */
      gsap.set(".hl>span", { yPercent: 110 });
      gsap.set("#hEye,#hLead,#hMicro,#hCtas,#hCue", { y: 24, opacity: 0 });
      gsap.set("#heroMedia", { scale: 1.08 });
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .to("#heroMedia", { scale: 1, duration: 1.8, ease: "power2.out" }, 0)
        .to("#hEye", { y: 0, opacity: 1, duration: 0.8 }, 0.3)
        .to(".hl>span", { yPercent: 0, duration: 1.1, stagger: 0.14, ease: "power4.out" }, 0.4)
        .to("#hLead", { y: 0, opacity: 1, duration: 0.9 }, 0.95)
        .to("#hMicro", { y: 0, opacity: 1, duration: 0.9 }, 1.05)
        .to("#hCtas", { y: 0, opacity: 1, duration: 0.9 }, 1.2)
        .to("#hCue", { y: 0, opacity: 1, duration: 0.9 }, 1.35);

      /* HERO — saída coreografada (pin ≥768px) */
      ScrollTrigger.matchMedia({
        "(min-width: 768px)": () => {
          const hp = gsap.timeline({
            scrollTrigger: { trigger: "#hero", start: "top top", end: "+=90%", pin: true, scrub: 0.8 },
          });
          hp.fromTo("#heroMedia", { scale: 1 }, { scale: 1.12, yPercent: 6, ease: "none", immediateRender: false }, 0)
            .to(".hero-veil", { opacity: 0.55, ease: "none" }, 0)
            .to("#hCue", { opacity: 0, y: 10, ease: "none" }, 0)
            .fromTo("#hCtas", { y: 0, opacity: 1 }, { y: -34, opacity: 0, ease: "none", immediateRender: false }, 0)
            .fromTo("#hMicro", { y: 0, opacity: 1 }, { y: -44, opacity: 0, ease: "none", immediateRender: false }, 0.04)
            .fromTo("#hLead", { y: 0, opacity: 1 }, { y: -54, opacity: 0, ease: "none", immediateRender: false }, 0.08)
            .fromTo(".hl>span", { yPercent: 0 }, { yPercent: -115, ease: "none", stagger: 0.07, immediateRender: false }, 0.1)
            .fromTo("#hEye", { y: 0, opacity: 1 }, { y: -50, opacity: 0, ease: "none", immediateRender: false }, 0.14);
        },
      });

      /* COMO FUNCIONA — horizontal pinned ≥901px */
      ScrollTrigger.matchMedia({
        "(min-width: 901px)": () => {
          const track = root.querySelector<HTMLElement>("#htrack");
          if (!track) return;
          const dist = () => track.scrollWidth - window.innerWidth;
          const tween = gsap.to(track, {
            x: () => -dist(),
            ease: "none",
            scrollTrigger: {
              trigger: "#hwrap",
              start: "top top",
              end: () => "+=" + dist(),
              pin: "#como-funciona",
              scrub: 0.8,
              invalidateOnRefresh: true,
              onUpdate(self) {
                const fill = root.querySelector<HTMLElement>("#hfill");
                if (fill) fill.style.width = self.progress * 100 + "%";
                const n = Math.min(7, Math.max(1, Math.round(self.progress * 6) + 1));
                const now = root.querySelector<HTMLElement>("#hnow");
                if (now) now.textContent = String(n).padStart(2, "0");
              },
            },
          });
          gsap.utils.toArray<HTMLElement>(".hcard").forEach((c) => {
            gsap.fromTo(
              c,
              { opacity: 0.45, scale: 0.96 },
              {
                opacity: 1,
                scale: 1,
                ease: "none",
                scrollTrigger: { trigger: c, containerAnimation: tween, start: "left 80%", end: "left 45%", scrub: true },
              },
            );
          });
          gsap.utils.toArray<HTMLElement>(".hnum-big").forEach((nb) => {
            const parent = nb.parentElement!;
            gsap.fromTo(
              nb,
              { x: 70 },
              {
                x: -70,
                ease: "none",
                scrollTrigger: { trigger: parent, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
              },
            );
          });

          /* STACK — cartão anterior recua e escurece */
          const cards = gsap.utils.toArray<HTMLElement>(".stack-card");
          cards.forEach((card, i) => {
            if (i === cards.length - 1) return;
            const st = { trigger: cards[i + 1], start: "top bottom", end: "top top", scrub: true } as const;
            gsap.to(card, { scale: 0.94, y: -14, ease: "none", scrollTrigger: st });
            const dim = card.querySelector<HTMLElement>(".card-dim");
            if (dim) gsap.to(dim, { opacity: 0.45, ease: "none", scrollTrigger: st });
          });
        },
        "(max-width: 900px)": () => {
          gsap.to("#vfill", {
            height: "100%",
            ease: "none",
            scrollTrigger: { trigger: ".vlist", start: "top 75%", end: "bottom 60%", scrub: 0.6 },
          });
        },
      });

      /* Portal — elevação + barra */
      gsap.fromTo(
        "#portal",
        { opacity: 0, y: 80, scale: 0.94 },
        {
          opacity: 1, y: 0, scale: 1, ease: "none",
          scrollTrigger: { trigger: "#portal", start: "top 88%", end: "top 48%", scrub: 0.6 },
        },
      );
      gsap.fromTo(
        "#ptBar",
        { width: 0 },
        { width: "52%", duration: 1.2, ease: "power2.out", scrollTrigger: { trigger: "#portal", start: "top 60%" } },
      );

      /* Parallax leve no vcard */
      root.querySelectorAll<HTMLElement>("[data-par]").forEach((el) => {
        gsap.to(el, {
          y: -22,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1.2 },
        });
      });

      /* Parallax no poster do depoimento */
      const dvImg = root.querySelector<HTMLElement>(".dv img");
      if (dvImg) {
        gsap.fromTo(
          dvImg,
          { yPercent: -5 },
          { yPercent: 5, ease: "none", scrollTrigger: { trigger: ".dv", start: "top bottom", end: "bottom top", scrub: 1 } },
        );
      }
    }, root);

    cleanups.push(() => ctx.revert());
    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <div ref={rootRef} className="bw-home">
      {/* ============ HERO ============ */}
      <section className="hero on-dark" id="hero">
        <div className="hero-media" id="heroMedia">
          <img src={HERO_IMG} alt="" />
        </div>
        <div className="hero-ovl" />
        <div className="grain" />
        <div className="hero-veil" />
        <div className="hero-in">
          <span className="eyebrow" id="hEye">
            BeWild · Reforma turn-key de studios · São Paulo
          </span>
          <h1 style={{ marginTop: "1rem" }}>
            <span className="hl"><span>Reforma turn-key de studios,</span></span>
            <span className="hl"><span className="it it-g">do cru ao pronto para rentabilizar.</span></span>
          </h1>
          <p className="lead" id="hLead">
            Projeto de arquitetura, obra, marcenaria, mobiliário e tecnologia de acompanhamento em um processo único, para você não precisar virar gerente da própria reforma.
          </p>
          <p className="hero-micro" id="hMicro">
            Da entrega das chaves ao imóvel pronto para foto, anúncio e operação
          </p>
          <div className="hero-ctas" id="hCtas">
            <a href="/diagnostico" className="btn btn-p">Solicitar diagnóstico <span className="ar">→</span></a>
            <a href="/portfolio" className="btn btn-g" style={{ color: "#fff" }}>Ver reformas entregues</a>
          </div>
        </div>
        <div className="cue" id="hCue">Role para descer</div>
      </section>

      {/* ============ O PROBLEMA ============ */}
      <section className="bg-frio pad">
        <div className="wrap split">
          <div>
            <span className="eyebrow rv">O problema</span>
            <h2 className="rv d1" style={{ marginTop: "1rem" }}>
              Reformar um studio para renda <span className="it it-b">não precisa ser sua segunda profissão.</span>
            </h2>
            <p className="lead rv d2" style={{ marginTop: "1.3rem" }}>
              A BeWild integra arquitetura, engenharia, obra e inteligência de mercado em um único processo, para quem precisa reformar e não quer carregar o pesadelo de cuidar de uma obra sozinho, muitas vezes à distância. Você acompanha. A gente executa.
            </p>
          </div>
          <div>
            {[
              "Orçamentos que começam baixos e crescem no meio da obra.",
              "Fornecedores que não conversam entre si.",
              "Projeto bonito, mas difícil de executar.",
              "Studio pronto visualmente, mas ruim de operar.",
              "Cliente acompanhando tudo por WhatsApp, sem rastreabilidade.",
              "Imóvel parado enquanto deveria estar gerando receita.",
            ].map((t, i) => (
              <div key={i} className={`risk rv${i ? " d" + Math.min(3, Math.floor(i / 2) + 1) : ""}`}><i />{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ O QUE FAZEMOS ============ */}
      <section className="bg-home pad" id="o-que-fazemos">
        <div className="wrap">
          <div className="gal-head">
            <div>
              <span className="eyebrow rv">O que fazemos</span>
              <h2 className="rv d1" style={{ marginTop: "1rem" }}>
                Mais que uma reforma. <span className="it it-b">Um imóvel pronto para operar.</span>
              </h2>
              <p className="lead rv d2" style={{ marginTop: ".7rem" }}>
                Arquitetura, obra, interiores, tecnologia e inteligência de investimento em uma entrega única.
              </p>
            </div>
            <div className="gal-nav rv d2">
              <button className="gal-btn" id="gPrev" aria-label="Anterior">←</button>
              <button className="gal-btn" id="gNext" aria-label="Próximo">→</button>
            </div>
          </div>

          <div className="gal" id="gal">
            {SLATS.map((s, i) => (
              <article key={i} className={"slat" + (i === 0 ? " on" : "")}>
                <div className="slat-bg">{s.img && <img src={s.img} alt="" />}</div>
                <div className="slat-sh" />
                <span className="slat-tag"><span className="selo">{s.tag}</span></span>
                <span className="slot-note">{s.note}</span>
                <p className="slat-desc">{s.desc}</p>
                <h3 className="slat-name">{s.name}</h3>
              </article>
            ))}
          </div>
          <div className="gal-dots" id="gDots" />
        </div>
      </section>

      {/* ============ COMO FUNCIONA ============ */}
      <section className="bg-areia hsec" id="como-funciona">
        <div className="wrap" style={{ paddingTop: "clamp(5rem,11vh,7.5rem)" }}>
          <span className="eyebrow rv">Como funciona</span>
          <h2 className="rv d1" style={{ marginTop: "1rem" }}>
            Um processo claro, <span className="it it-b">do diagnóstico à entrega.</span>
          </h2>
        </div>

        <div className="hwrap" id="hwrap">
          <div className="htrack" id="htrack">
            {STEPS.map((s) => (
              <article key={s.n} className="hcard">
                <span className="hnum-big">{s.n}</span>
                <span className="hnum">{s.n}</span>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
              </article>
            ))}
          </div>
          <div className="hprog">
            <div className="hbar"><div className="hfill" id="hfill" /></div>
            <span className="hcount"><b id="hnow">01</b> / 07</span>
          </div>

          <div className="vlist wrap">
            <div className="vline" />
            <div className="vfill" id="vfill" />
            {STEPS.map((s) => (
              <div key={s.n} className="vitem">
                <span className="hnum">{s.n}</span>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: "clamp(3rem,8vh,5rem)" }} />
      </section>

      {/* ============ STACK ============ */}
      <section className="stack-zone" id="diferenciais">
        <div className="stack">
          {/* CARTÃO 1 — PROJETO PERSONALIZADO */}
          <article className="stack-card sc-white">
            <div className="card-dim" />
            <div className="wrap proj">
              <div className="proj-l">
                <div className="vcard" data-par>
                  <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1400&auto=format&fit=crop" alt="" />
                  <span className="slot-note">Slot · planta humanizada / estudo BeWild</span>
                </div>
                <p className="vcap" style={{ fontSize: ".8rem" }}>
                  Um studio de 19, 22 ou 28 m² não permite decisões aleatórias. Cada centímetro precisa justificar sua existência. Por isso, a BeWild desenvolve projeto de arquitetura personalizado para cada imóvel: layout, circulação, iluminação, marcenaria, armazenamento, eletros, pontos técnicos, estética e objetivo de uso.
                </p>
              </div>
              <div>
                <span className="eyebrow">Projeto personalizado</span>
                <h2 style={{ marginTop: ".8rem", fontSize: "clamp(1.8rem,3vw,2.5rem)" }}>
                  Arquitetura para cada metro quadrado <span className="it it-b">trabalhar melhor.</span>
                </h2>
                <p className="lead" style={{ margin: ".7rem 0 1.2rem", fontSize: ".95rem" }}>
                  Em studios compactos, projeto não é decoração. É estratégia de uso, operação e rentabilidade.
                </p>
                {PROJ_ITEMS.map((it) => (
                  <div key={it.n} className="pitem">
                    <span className="n">{it.n}</span>
                    <div>
                      <h4>{it.h}</h4>
                      <p>{it.p}</p>
                    </div>
                  </div>
                ))}
                <p style={{ marginTop: "1.3rem" }}>
                  <a href="/diagnostico" className="btn btn-p">
                    Quero um projeto para meu studio <span className="ar">→</span>
                  </a>
                </p>
              </div>
            </div>
            <div className="card-dots"><span className="on" /><span /><span /></div>
          </article>

          {/* CARTÃO 2 — DIFERENCIAIS */}
          <article className="stack-card sc-ink on-dark">
            <div className="card-dim" />
            <div className="wrap">
              <span className="eyebrow">Diferenciais</span>
              <h2 style={{ marginTop: ".8rem" }}>
                Por que a BeWild <span className="it it-g">é diferente.</span>
              </h2>
              <p className="lead" style={{ marginTop: ".7rem" }}>
                O trabalho não termina no desenho bonito. Ele precisa fechar tecnicamente, caber no orçamento, andar na obra e funcionar depois da entrega.
              </p>
              <div className="grid g4" style={{ marginTop: "2rem" }}>
                {DIFFS.map((d) => (
                  <div key={d.h} className="card">
                    <span className="ic">{d.icon}</span>
                    <h4>{d.h}</h4>
                    <p>{d.p}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-dots"><span /><span className="on" /><span /></div>
          </article>

          {/* CARTÃO 3 — CREDIBILIDADE */}
          <article className="stack-card sc-tese on-dark">
            <div className="card-dim" />
            <div className="wrap" style={{ textAlign: "center" }}>
              <span className="eyebrow">Credibilidade</span>
              <h2 style={{ marginTop: ".8rem" }}>
                Credibilidade não é promessa. <span className="it it-g">É processo visível.</span>
              </h2>
              <div className="cred" style={{ textAlign: "left" }}>
                <div className="cstat"><span className="num" data-count="55">0</span><span className="suf">dias úteis</span><small>referência de prazo para obras padrão, sujeito ao escopo</small></div>
                <div className="cstat"><span className="num" data-count="5">0</span><span className="suf">anos</span><small>garantia de mão de obra geral, quando aplicável ao contrato</small></div>
                <div className="cstat"><span className="num" data-count="10">0</span><span className="num">+</span><span className="suf">anos</span><small>garantia em marcenaria selecionada, conforme fornecedor/escopo</small></div>
                <div className="cstat"><span className="num" data-count="100">0</span><span className="num">%</span><span className="suf">turn-key</span><small>projeto, obra, mobiliário e entrega coordenados</small></div>
              </div>
              <ul className="cchecks" style={{ textAlign: "left" }}>
                {[
                  "Contrato e escopo claros.",
                  "Fotos e relatórios de acompanhamento.",
                  "Projeto aprovado antes da execução.",
                  "Compras críticas planejadas.",
                  "Gestão de fornecedores.",
                  "Entrega com checklist final.",
                ].map((t) => (
                  <li key={t}><span className="tk">✓</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="card-dots"><span /><span /><span className="on" /></div>
          </article>
        </div>
      </section>

      {/* ============ PORTFÓLIO PREVIEW ============ */}
      <section className="bg-white pad" id="portfolio">
        <div className="wrap">
          <span className="eyebrow rv">Portfólio</span>
          <h2 className="rv d1" style={{ marginTop: "1rem" }}>
            Reformas reais para imóveis <span className="it it-b">que precisam performar.</span>
          </h2>
          <div className="grid g2" style={{ marginTop: "2.6rem" }}>
            <article className="card pcase rv">
              <div className="ph">
                <img src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1600&auto=format&fit=crop" alt="" />
                <span className="slot-note">Slot · foto real do studio entregue</span>
              </div>
              <div className="bd">
                <span className="selo">Short stay</span>
                <h3>Studio compacto para short stay</h3>
                <div className="kv"><b>Desafio</b><span>Transformar uma planta pequena em um imóvel funcional, bonito e fácil de operar.</span></div>
                <div className="kv"><b>Solução</b><span>Marcenaria inteligente, bancada compacta, iluminação estratégica, eletros adequados e acabamento resistente.</span></div>
                <div className="kv res"><b>Resultado</b><span>Unidade pronta para fotos, anúncio e operação.</span></div>
              </div>
            </article>
            <article className="card pcase rv d1">
              <div className="ph">
                <img src="https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1600&auto=format&fit=crop" alt="" />
                <span className="slot-note">Slot · antes/depois mesmo ângulo</span>
              </div>
              <div className="bd">
                <span className="selo">Turn-key</span>
                <h3>Studio recém-entregue na planta</h3>
                <div className="kv"><b>Desafio</b><span>Sair do apartamento cru para uma unidade mobiliada sem o cliente precisar coordenar múltiplos fornecedores.</span></div>
                <div className="kv"><b>Solução</b><span>Projeto personalizado, obra turn-key, compras planejadas e montagem final.</span></div>
                <div className="kv res"><b>Resultado</b><span>Imóvel entregue com visual consistente, layout otimizado e pronto para uso.</span></div>
              </div>
            </article>
          </div>
          <p className="mono-note rv" style={{ textAlign: "center", marginTop: "1.8rem" }}>
            Cases ilustrativos até a publicação das fotos reais das reformas entregues
          </p>
          <p className="rv d1" style={{ textAlign: "center", marginTop: "1.4rem" }}>
            <a href="/portfolio" className="btn btn-g" style={{ color: "var(--ink)" }}>
              Ver portfólio completo <span className="ar">→</span>
            </a>
          </p>
        </div>
      </section>

      {/* ============ DEPOIMENTO ============ */}
      <section className="bg-frio pad">
        <div className="wrap depo">
          <div className="rv">
            <div className="dv">
              <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1600&auto=format&fit=crop" alt="" />
              <button className="dplay" aria-label="Assistir depoimento">
                <svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" /></svg>
              </button>
              <span className="slot-note">Slot · vídeo do depoimento da cliente · legendado</span>
            </div>
          </div>
          <div>
            <span className="eyebrow rv">Depoimento</span>
            <h2 className="rv d1" style={{ marginTop: "1rem" }}>
              Quem já passou pela obra <span className="it it-b">conta melhor do que a gente.</span>
            </h2>
            <blockquote className="dq rv d2" style={{ marginTop: "1.4rem" }}>
              [Transcrever aqui a frase mais forte do depoimento em vídeo da cliente.]
            </blockquote>
            <span className="dby rv d3">Cliente BeWild · Studio reformado em São Paulo</span>
            <p className="mono-note rv d3" style={{ marginTop: "1rem", display: "block" }}>
              Depoimento real · vídeo na íntegra ao lado
            </p>
          </div>
        </div>
      </section>

      {/* ============ TECNOLOGIA · PORTAL ============ */}
      <section className="bg-home pad">
        <div className="wrap split" style={{ alignItems: "center" }}>
          <div>
            <span className="eyebrow rv">Tecnologia · Portal</span>
            <h2 className="rv d1" style={{ marginTop: "1rem" }}>
              Obra com visibilidade. <span className="it it-b">Gestão sem caixa-preta.</span>
            </h2>
            <p className="lead rv d2" style={{ marginTop: "1.2rem" }}>
              Acompanhamento por WhatsApp ajuda, mas não pode ser o único banco de dados da obra. Por isso, a BeWild trabalha com portal, registros, fotos, cronograma e informações organizadas para dar mais previsibilidade ao cliente e mais controle para a operação.
            </p>
            <ul className="chk2 rv d3">
              {[
                "Cronograma por etapa",
                "Fotos de evolução",
                "Relatórios de acompanhamento",
                "Registro de decisões",
                "Controle de escopo",
                "Compras e fornecedores",
                "Visão clara do que está em andamento",
              ].map((t) => (
                <li key={t}><span className="tk">✓</span>{t}</li>
              ))}
            </ul>
          </div>
          <div className="portal" id="portal">
            <div className="pt-bar">
              <span className="lbl">Portal BeWild · Exemplo</span>
              <span className="pt-chip">Em obra</span>
            </div>
            <p className="pt-title">Studio Urban Flex · 22 m²</p>
            <div className="pt-cron"><span>Cronograma</span><b>52% concluído</b></div>
            <div className="pt-track"><div className="pt-fillbar" id="ptBar" /></div>
            <div className="pt-step done">
              <span style={{ display: "flex", gap: ".7rem", alignItems: "center" }}>
                <span className="tk" style={{ color: "var(--gold-400)" }}>✓</span>Demolição e remoção
              </span>
            </div>
            <div className="pt-step done">
              <span style={{ display: "flex", gap: ".7rem", alignItems: "center" }}>
                <span className="tk" style={{ color: "var(--gold-400)" }}>✓</span>Elétrica e hidráulica
              </span>
            </div>
            <div className="pt-step">
              <span style={{ display: "flex", gap: ".7rem", alignItems: "center" }}>
                <span className="o" />Marcenaria sob medida
              </span>
              <span className="pt-now">Em andamento</span>
            </div>
            <div className="pt-step">
              <span style={{ display: "flex", gap: ".7rem", alignItems: "center" }}>
                <span className="o" />Acabamentos e pintura
              </span>
            </div>
            <div className="pt-step">
              <span style={{ display: "flex", gap: ".7rem", alignItems: "center" }}>
                <span className="o" />Montagem e enxoval
              </span>
            </div>
            <div className="pt-thumbs"><div>◉</div><div>◉</div><div>◉</div></div>
            <div className="pt-rep">Relatório semanal #6: marcenaria instalada, elétrica revisada.</div>
            <div className="pt-foot">Interface ilustrativa do portal de acompanhamento</div>
          </div>
        </div>
      </section>

      {/* ============ COMPARATIVO ============ */}
      <section className="bg-frio pad">
        <div className="wrap">
          <span className="eyebrow rv">Comparativo</span>
          <h2 className="rv d1" style={{ marginTop: "1rem" }}>
            O custo invisível de <span className="it it-b">coordenar tudo sozinho.</span>
          </h2>
          <div className="tbl rv d2">
            <div className="trow thead">
              <div />
              <div>Reforma tradicional</div>
              <div className="bw">BeWild turn-key</div>
            </div>
            {COMPARE_ROWS.map(([label, bad, good]) => (
              <div key={label} className="trow">
                <div className="tlabel">{label}</div>
                <div className="tx"><i>✗</i>{bad}</div>
                <div className="tv"><i>✓</i>{good}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PARA QUEM É ============ */}
      <section className="bg-white pad">
        <div className="wrap">
          <span className="eyebrow rv">Para quem é</span>
          <h2 className="rv d1" style={{ marginTop: "1rem" }}>
            Para quem quer reformar <span className="it it-b">sem virar gerente de obra.</span>
          </h2>
          <div className="grid g3" style={{ marginTop: "2.6rem" }}>
            {AUDIENCE.map((a, i) => (
              <div key={a.h} className={`card rv${i ? " d" + Math.min(2, i) : ""}`}>
                <span className="ic">{a.icon}</span>
                <h4>{a.h}</h4>
                <p>{a.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="bg-home pad">
        <div className="wrap">
          <div style={{ textAlign: "center" }}>
            <span className="eyebrow rv">FAQ</span>
            <h2 className="rv d1" style={{ marginTop: "1rem" }}>Perguntas frequentes</h2>
          </div>
          <div className="faq rv d2">
            {FAQS.map((f, i) => (
              <div key={f.q} className={"qa" + (i === 0 ? " open" : "")}>
                <button className="qa-q">{f.q}<span className="pl">+</span></button>
                <div className="qa-a"><p>{f.a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="bg-areia pad cta-fim" id="diagnostico">
        <div className="wrap">
          <span className="eyebrow rv">Diagnóstico</span>
          <h2 className="rv d1">
            Quer transformar seu studio em <span className="it it-b">um ativo pronto para operar?</span>
          </h2>
          <p className="lead rv d2" style={{ margin: "0 auto 2rem" }}>
            Envie os dados do seu imóvel e receba uma análise inicial de escopo, projeto e próximos passos. Sem compromisso.
          </p>
          <div className="rv d3" style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/diagnostico" className="btn btn-p">Solicitar diagnóstico <span className="ar">→</span></a>
            <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="btn btn-g" style={{ color: "var(--ink)" }}>
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ============ FLOATING CTA ============ */}
      <aside className="fcta" id="fcta">
        <button className="x" id="fctaX" aria-label="Fechar">✕</button>
        <h5>Quer um diagnóstico do seu studio?</h5>
        <a href="/diagnostico" className="btn btn-p">Solicitar <span className="ar">→</span></a>
        <span className="mono-note">Consultivo · sem compromisso</span>
      </aside>
    </div>
  );
}
