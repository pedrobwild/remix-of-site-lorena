export function initHomeBwa(): (() => void) | void {

    (() => {
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

      const setModal = (open) => {
        if (!modal) return;
        modal.classList.toggle("bwa-open", open);
        body.style.overflow = open ? "hidden" : "";
        if (open && closeModal) closeModal.focus();
        if (!open && videoButton) videoButton.focus();
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
    })();
  
}
