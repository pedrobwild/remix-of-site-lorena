export function initHomeBwa() {
    // Guard de idempotência colado no próprio <nav data-nav>: se a home
    // remonta (route change), o nó é recriado e o guard é naturalmente
    // resetado. Em StrictMode (mount→cleanup→mount) o nó persiste e o
    // guard evita duplicação de listeners — sem ele, cada acordeão
    // recebe 2 handlers e abre/fecha no mesmo clique. Nada da lógica
    // original abaixo é alterado.
    const _nav = document.querySelector("[data-nav]");
    if (!_nav) return;
    if (_nav.dataset.bwaInited === "1") return;
    _nav.dataset.bwaInited = "1";


      const body = document.body;
      const nav = document.querySelector("[data-nav]");
      const menuButton = document.querySelector("[data-menu-button]");
      const mobileMenu = document.querySelector("[data-mobile-menu]");
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const setExpandedPanel = (item, open, detailSelector, buttonSelector) => {
        const detail = item.querySelector(detailSelector);
        const button = item.querySelector(buttonSelector);
        if (!detail || !button) return;

        item.classList.toggle("bwa-open", open);
        button.setAttribute("aria-expanded", String(open));
        detail.style.maxHeight = open ? detail.scrollHeight + "px" : "0px";
      };

      const updateNav = () => {
        nav.classList.toggle("bwa-scrolled", window.scrollY > 28);
      };

      updateNav();
      window.addEventListener("scroll", updateNav, { passive: true });

      if (menuButton && mobileMenu) {
        menuButton.addEventListener("click", () => {
          const open = !body.classList.contains("bwa-menu-open");
          body.classList.toggle("bwa-menu-open", open);
          menuButton.setAttribute("aria-expanded", String(open));
          menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
        });

        mobileMenu.querySelectorAll("a").forEach((link) => {
          link.addEventListener("click", () => {
            body.classList.remove("bwa-menu-open");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.setAttribute("aria-label", "Abrir menu");
          });
        });
      }

      document.querySelectorAll(".bwa-certainty-item").forEach((item) => {
        const button = item.querySelector(".bwa-certainty-toggle");
        setExpandedPanel(
          item,
          item.classList.contains("bwa-open"),
          ".bwa-certainty-detail",
          ".bwa-certainty-toggle"
        );

        button.addEventListener("click", () => {
          const willOpen = !item.classList.contains("bwa-open");
          document.querySelectorAll(".bwa-certainty-item").forEach((other) => {
            setExpandedPanel(
              other,
              other === item && willOpen,
              ".bwa-certainty-detail",
              ".bwa-certainty-toggle"
            );
          });
        });
      });

      const galleryRail = document.querySelector("[data-gallery-rail]");
      const gallerySlides = galleryRail ? [...galleryRail.querySelectorAll(".bwa-image-gallery-slide")] : [];
      const galleryCurrent = document.querySelector("[data-gallery-current]");
      const galleryProgress = document.querySelector("[data-gallery-progress]");
      let galleryStatusFrame = 0;
      let galleryAnimationFrame = 0;
      let galleryPointerId = null;
      let galleryPointerStartX = 0;
      let galleryPointerStartY = 0;
      let galleryScrollStart = 0;
      let galleryLastX = 0;
      let galleryLastTime = 0;
      let galleryVelocity = 0;
      let galleryDragAxis = null;
      let galleryDidDrag = false;

      const updateGalleryStatus = () => {
        if (!galleryRail || !gallerySlides.length) return;
        const railCenter = galleryRail.scrollLeft + galleryRail.clientWidth / 2;
        let activeIndex = 0;
        let closestDistance = Infinity;
        gallerySlides.forEach((slide, index) => {
          const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
          const distance = Math.abs(slideCenter - railCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            activeIndex = index;
          }
        });
        if (galleryCurrent) galleryCurrent.textContent = String(activeIndex + 1).padStart(2, "0");
        if (galleryProgress) galleryProgress.style.transform = `scaleX(${activeIndex + 1})`;
      };

      const requestGalleryStatusUpdate = () => {
        if (galleryStatusFrame) return;
        galleryStatusFrame = window.requestAnimationFrame(() => {
          galleryStatusFrame = 0;
          updateGalleryStatus();
        });
      };

      const stopGalleryMomentum = () => {
        if (!galleryAnimationFrame) return;
        window.cancelAnimationFrame(galleryAnimationFrame);
        galleryAnimationFrame = 0;
      };

      const settleGallery = () => {
        if (!galleryRail || reducedMotion) return;
        const railCenter = galleryRail.scrollLeft + galleryRail.clientWidth / 2;
        const closestSlide = gallerySlides.reduce((closest, slide) => {
          const distance = Math.abs(slide.offsetLeft + slide.clientWidth / 2 - railCenter);
          return distance < closest.distance ? { slide, distance } : closest;
        }, { slide: gallerySlides[0], distance: Infinity }).slide;
        closestSlide?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      };

      const releaseGalleryPointer = (event) => {
        if (!galleryRail || event.pointerId !== galleryPointerId) return;
        if (galleryRail.hasPointerCapture?.(event.pointerId)) {
          galleryRail.releasePointerCapture(event.pointerId);
        }
        galleryRail.classList.remove("bwa-dragging");
        galleryPointerId = null;

        if (galleryDragAxis !== "x" || reducedMotion) {
          galleryDragAxis = null;
          return;
        }

        let velocity = galleryVelocity;
        const coast = () => {
          if (!galleryRail) return;
          velocity *= .92;
          if (Math.abs(velocity) < .18) {
            galleryAnimationFrame = 0;
            settleGallery();
            return;
          }
          galleryRail.scrollLeft -= velocity * 16;
          galleryAnimationFrame = window.requestAnimationFrame(coast);
        };
        galleryAnimationFrame = window.requestAnimationFrame(coast);
        galleryDragAxis = null;
      };

      const moveGallery = (direction) => {
        if (!galleryRail || !gallerySlides.length) return;
        stopGalleryMomentum();
        const railCenter = galleryRail.scrollLeft + galleryRail.clientWidth / 2;
        let activeIndex = 0;
        let closestDistance = Infinity;
        gallerySlides.forEach((slide, index) => {
          const distance = Math.abs(slide.offsetLeft + slide.clientWidth / 2 - railCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            activeIndex = index;
          }
        });
        const targetIndex = Math.max(0, Math.min(gallerySlides.length - 1, activeIndex + direction));
        gallerySlides[targetIndex]?.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "nearest",
          inline: "center"
        });
      };

      document.querySelector("[data-gallery-prev]")?.addEventListener("click", () => moveGallery(-1));
      document.querySelector("[data-gallery-next]")?.addEventListener("click", () => moveGallery(1));
      galleryRail?.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "touch" || event.button !== 0) return;
        stopGalleryMomentum();
        galleryPointerId = event.pointerId;
        galleryRail.setPointerCapture(event.pointerId);
        galleryPointerStartX = event.clientX;
        galleryPointerStartY = event.clientY;
        galleryScrollStart = galleryRail.scrollLeft;
        galleryLastX = event.clientX;
        galleryLastTime = performance.now();
        galleryVelocity = 0;
        galleryDragAxis = null;
        galleryDidDrag = false;
      });
      galleryRail?.addEventListener("pointermove", (event) => {
        if (!galleryRail || event.pointerId !== galleryPointerId) return;
        const deltaX = event.clientX - galleryPointerStartX;
        const deltaY = event.clientY - galleryPointerStartY;
        if (!galleryDragAxis && Math.hypot(deltaX, deltaY) > 6) {
          galleryDragAxis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
          if (galleryDragAxis === "x") {
            galleryRail.classList.add("bwa-dragging");
          }
        }
        if (galleryDragAxis !== "x") return;
        event.preventDefault();
        galleryDidDrag = true;
        galleryRail.scrollLeft = galleryScrollStart - deltaX;
        const now = performance.now();
        const elapsed = Math.max(1, now - galleryLastTime);
        galleryVelocity = (event.clientX - galleryLastX) / elapsed;
        galleryLastX = event.clientX;
        galleryLastTime = now;
      });
      galleryRail?.addEventListener("pointerup", releaseGalleryPointer);
      galleryRail?.addEventListener("pointercancel", releaseGalleryPointer);
      galleryRail?.addEventListener("dragstart", (event) => event.preventDefault());
      galleryRail?.addEventListener("click", (event) => {
        if (!galleryDidDrag) return;
        event.preventDefault();
        event.stopPropagation();
        galleryDidDrag = false;
      }, true);
      galleryRail?.addEventListener("scroll", requestGalleryStatusUpdate, { passive: true });
      updateGalleryStatus();

      const storySteps = [...document.querySelectorAll("[data-story-step]")];
      const storyImages = [...document.querySelectorAll("[data-story-image]")];
      const storyAperture = document.querySelector("[data-story-aperture]");
      const storyCaption = document.querySelector("[data-story-caption]");
      const storyCaptionIndex = document.querySelector("[data-story-caption-index]");

      const activateStory = (index) => {
        storySteps.forEach((step, stepIndex) => {
          step.classList.toggle("bwa-active", stepIndex === index);
        });

        storyImages.forEach((image, imageIndex) => {
          image.classList.toggle("bwa-active", imageIndex === index);
        });

        const step = storySteps[index];
        if (step && storyAperture) {
          storyAperture.style.setProperty("--bwa-aperture", step.dataset.aperture || "0%");
        }
        if (step && storyCaption) {
          storyCaption.textContent = step.dataset.caption || "";
        }
        if (step && storyCaptionIndex) {
          storyCaptionIndex.textContent = step.dataset.captionIndex || "";
        }
      };

      if (storySteps.length && "IntersectionObserver" in window) {
        const storyObserver = new IntersectionObserver(
          (entries) => {
            const visible = entries
              .filter((entry) => entry.isIntersecting)
              .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (!visible) return;
            const index = storySteps.indexOf(visible.target);
            if (index >= 0) activateStory(index);
          },
          {
            rootMargin: "-30% 0px -35% 0px",
            threshold: [0.15, 0.35, 0.55]
          }
        );

        storySteps.forEach((step) => storyObserver.observe(step));
      }

      const scopeItems = [...document.querySelectorAll("[data-scope-item]")];
      const scopeImages = [...document.querySelectorAll("[data-scope-image]")];

      const activateScope = (item) => {
        const index = Number(item.dataset.scopeItem);
        scopeItems.forEach((other) => {
          setExpandedPanel(
            other,
            other === item,
            ".bwa-scope-detail",
            ".bwa-scope-toggle"
          );
        });
        scopeImages.forEach((image, imageIndex) => {
          image.classList.toggle("bwa-active", imageIndex === index);
        });
      };

      scopeItems.forEach((item) => {
        setExpandedPanel(
          item,
          item.classList.contains("bwa-open"),
          ".bwa-scope-detail",
          ".bwa-scope-toggle"
        );
        item.querySelector(".bwa-scope-toggle").addEventListener("click", () => activateScope(item));
      });

      document.querySelectorAll(".bwa-faq-item").forEach((item) => {
        const button = item.querySelector(".bwa-faq-question");

        setExpandedPanel(
          item,
          item.classList.contains("bwa-open"),
          ".bwa-faq-answer",
          ".bwa-faq-question"
        );

        button.addEventListener("click", () => {
          const willOpen = !item.classList.contains("bwa-open");
          setExpandedPanel(
            item,
            willOpen,
            ".bwa-faq-answer",
            ".bwa-faq-question"
          );
        });
      });

      const videoButton = document.querySelector("[data-video-demo]");
      const modal = document.querySelector("[data-video-modal]");
      const closeModal = document.querySelector("[data-close-modal]");
      const videoEl = document.querySelector("[data-video-element]");

      const setModal = (open) => {
        if (!modal) return;
        modal.classList.toggle("bwa-open", open);
        body.style.overflow = open ? "hidden" : "";
        if (open && closeModal) closeModal.focus();
        if (!open && videoButton) videoButton.focus();
        if (videoEl) {
          if (open) {
            const p = videoEl.play();
            if (p && typeof p.catch === "function") p.catch(() => {});
          } else {
            try { videoEl.pause(); videoEl.currentTime = 0; } catch (e) {}
          }
        }
      };

      if (videoButton) videoButton.addEventListener("click", () => setModal(true));
      if (closeModal) closeModal.addEventListener("click", () => setModal(false));
      if (modal) {
        modal.addEventListener("click", (event) => {
          if (event.target === modal) setModal(false);
        });
      }


      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          if (body.classList.contains("bwa-menu-open")) {
            body.classList.remove("bwa-menu-open");
            menuButton?.setAttribute("aria-expanded", "false");
          }
          if (modal?.classList.contains("bwa-open")) setModal(false);
        }
      });

      const revealElements = [...document.querySelectorAll(
        ".bwa-title, .bwa-lead, .bwa-project-card, .bwa-proof-card, .bwa-objective"
      )];

      revealElements.forEach((element) => element.classList.add("bwa-reveal"));

      if (!reducedMotion && "IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("bwa-visible");
              observer.unobserve(entry.target);
            });
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
        );

        revealElements.forEach((element) => revealObserver.observe(element));
      } else {
        revealElements.forEach((element) => element.classList.add("bwa-visible"));
      }

      window.addEventListener("resize", () => {
        document.querySelectorAll(".bwa-certainty-item.bwa-open").forEach((item) => {
          const detail = item.querySelector(".bwa-certainty-detail");
          if (detail) detail.style.maxHeight = detail.scrollHeight + "px";
        });
        document.querySelectorAll(".bwa-scope-item.bwa-open").forEach((item) => {
          const detail = item.querySelector(".bwa-scope-detail");
          if (detail) detail.style.maxHeight = detail.scrollHeight + "px";
        });
        document.querySelectorAll(".bwa-faq-item.bwa-open").forEach((item) => {
          const detail = item.querySelector(".bwa-faq-answer");
          if (detail) detail.style.maxHeight = detail.scrollHeight + "px";
        });
      });

      // Listener de wheel do trilho de projetos removido (Parte 4): rolagem vertical nativa em toda a seção.


  // Selo Reclame Aqui no rodapé (idempotente).
  const raEl = document.getElementById("ra-verified-seal");
  if (raEl && !document.getElementById("ra-embed-verified-seal")) {
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.id = "ra-embed-verified-seal";
    s.src = "https://s3.amazonaws.com/raichu-beta/ra-verified/bundle.js";
    s.setAttribute("data-id", "SEpqak1Mcm9aM09nMm0wbDpid2lsZC1yZWZvcm1hcw==");
    s.setAttribute("data-target", "ra-verified-seal");
    s.setAttribute("data-model", "horizontal_1");
    raEl.appendChild(s);
  }
}



/* =========================================================================
 * Exports para páginas internas com o mesmo chrome .bwa (nav + FAQ opcional).
 * Guardas idempotentes por atributo no elemento (StrictMode-safe).
 * Nenhuma alteração de comportamento em relação ao initHomeBwa da home.
 * ========================================================================= */

export function initBwaNav(root = document) {
  const nav = root.querySelector("[data-nav]");
  if (!nav || nav.dataset.bwaNavInited === "1") return;
  nav.dataset.bwaNavInited = "1";

  const body = document.body;
  const menuButton = root.querySelector("[data-menu-button]");
  const mobileMenu = root.querySelector("[data-mobile-menu]");

  const updateNav = () => {
    nav.classList.toggle("bwa-scrolled", window.scrollY > 28);
  };
  updateNav();
  window.addEventListener("scroll", updateNav, { passive: true });

  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", () => {
      const open = !body.classList.contains("bwa-menu-open");
      body.classList.toggle("bwa-menu-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        body.classList.remove("bwa-menu-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Abrir menu");
      });
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("bwa-menu-open")) {
      body.classList.remove("bwa-menu-open");
      menuButton?.setAttribute("aria-expanded", "false");
    }
  });
}

export function initBwaFaqAccordions(container = document) {
  const items = container.querySelectorAll(".bwa-faq-item");
  items.forEach((item) => {
    if (item.dataset.bwaFaqInited === "1") return;
    item.dataset.bwaFaqInited = "1";
    const button = item.querySelector(".bwa-faq-question");
    const detail = item.querySelector(".bwa-faq-answer");
    if (!button || !detail) return;

    const setOpen = (open) => {
      item.classList.toggle("bwa-open", open);
      button.setAttribute("aria-expanded", String(open));
      detail.style.maxHeight = open ? detail.scrollHeight + "px" : "0px";
    };

    setOpen(item.classList.contains("bwa-open"));
    button.addEventListener("click", () => setOpen(!item.classList.contains("bwa-open")));
  });

  if (!container.dataset || container.dataset.bwaFaqResizeInited !== "1") {
    if (container.dataset) container.dataset.bwaFaqResizeInited = "1";
    window.addEventListener("resize", () => {
      container.querySelectorAll(".bwa-faq-item.bwa-open").forEach((item) => {
        const d = item.querySelector(".bwa-faq-answer");
        if (d) d.style.maxHeight = d.scrollHeight + "px";
      });
    });
  }
}


