import { useState, useEffect } from "react";

export function useScrollspy(ids: string[]) {
  const [activeId, setActiveId] = useState(ids[0]);

  useEffect(() => {
    if (!ids.length) return;

    // Fallback: pick the section whose top is closest to (but above) the activation line.
    const computeActive = () => {
      const activationY = window.innerHeight * 0.15;
      let bestId = ids[0];
      let bestTop = -Infinity;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        // Section has crossed the activation line (top <= activationY) and is the lowest such.
        if (top <= activationY && top > bestTop) {
          bestTop = top;
          bestId = id;
        }
      }
      // If nothing crossed yet (page top), keep first section.
      // If scrolled to bottom, ensure last visible section wins.
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (nearBottom) bestId = ids[ids.length - 1];
      setActiveId(bestId);
    };

    const observer = new IntersectionObserver(
      () => computeActive(),
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 0.1, 0.5, 1] }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // Initial sync (handles load + hash navigation) and keep in sync on resize.
    computeActive();
    const onResize = () => computeActive();
    const onScroll = () => computeActive();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [ids.join("|")]);

  return activeId;
}
