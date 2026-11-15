import "@testing-library/jest-dom";

// Testes de código de servidor podem pedir `// @vitest-environment node`: lá não há
// `window`, e os remendos de navegador abaixo não se aplicam.
const temJanela = typeof window !== "undefined";

// jsdom não implementa matchMedia — alguns hooks do app o usam.
if (temJanela) Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom não implementa IntersectionObserver — usado por SmartImage/animações.
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [] as IntersectionObserverEntry[];
  }
  root = null;
  rootMargin = "";
  thresholds = [];
}
if (temJanela) (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = MockIntersectionObserver;
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = MockIntersectionObserver;
