/**
 * useSeo precisa aplicar title/canonical/robots da rota IMEDIATAMENTE,
 * sem esperar a resposta de `site_settings` no Supabase.
 *
 * Antes, `applySeo` só rodava depois do `fetchSiteSettings()` resolver.
 * Com o backend lento/indisponível (medido: 5–9 s no ambiente da
 * auditoria), toda rota interna ficava com o title/canonical da home
 * (canonical → "/") e a 404 ficava sem `noindex` — exatamente o que o
 * Googlebot pode capturar no snapshot renderizado.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";

// Backend que NUNCA responde: simula site_settings pendurado.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => new Promise(() => {}),
        }),
      }),
    }),
  },
}));

import { useSeo } from "../useSeo";

function Page() {
  useSeo({ title: "Página X | Bewild", description: "Desc X", canonicalPath: "/x", noindex: true });
  return <div>x</div>;
}

beforeEach(() => {
  cleanup();
  document.head.innerHTML = `
    <title>Bewild | Home</title>
    <meta name="description" content="home">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://bewild.com.br/">
  `;
});

describe("useSeo — aplicação síncrona com defaults", () => {
  it("title, description, canonical e robots da rota aparecem sem esperar o backend", () => {
    render(<Page />);
    expect(document.title).toBe("Página X | Bewild");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("Desc X");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://bewild.com.br/x");
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toMatch(/noindex/i);
  });
});
