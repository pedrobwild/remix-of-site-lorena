/**
 * Link para o Radar no menu e no rodapé se chama "Radar Bewild" (decisão do
 * Pedro, 18/11/2026), o mesmo nome do WebSite no JSON-LD da home e do
 * llms.txt. O HTML da home (home-bwa-body.ts) repete o texto à mão; este
 * teste trava a home, o menu das páginas internas e o rodapé.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => new Promise(() => {}),
    from: () => ({ select: () => new Promise(() => {}) }),
    auth: { getSession: () => new Promise(() => {}), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
    functions: { invoke: () => new Promise(() => {}) },
  },
}));

import { RADAR_NAV_LABEL } from "@/config/site";
import { HOME_BWA_HTML } from "@/pages/home-bwa-body";
import BwaNav from "@/components/BwaNav";
import BwaFooter from "@/components/BwaFooter";

const RADAR_LINK = /<a [^>]*href="https:\/\/radarbewild\.com\.br\/"[^>]*>([\s\S]*?)<\/a>/g;

function rotulos(html: string) {
  return [...html.matchAll(RADAR_LINK)].map((m) => ({
    texto: m[1].replace(/<span[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, "").trim(),
    aria: /aria-label="([^"]*)"/.exec(m[0])?.[1] ?? null,
  }));
}

describe("rótulo do link para o Radar", () => {
  it("é Radar Bewild", () => {
    expect(RADAR_NAV_LABEL).toBe("Radar Bewild");
  });

  it("home: menu do desktop e do celular", () => {
    const links = rotulos(HOME_BWA_HTML);
    expect(links).toHaveLength(2);
    for (const l of links) {
      expect(l.texto).toBe("Radar Bewild");
      expect(l.aria).toBe("Radar Bewild (abre em nova aba)");
    }
    expect(HOME_BWA_HTML).not.toMatch(/Guia do Investidor/i);
  });

  it("menu das páginas internas e rodapé", () => {
    const html = renderToStaticMarkup(
      <>
        <BwaNav />
        <BwaFooter />
      </>,
    );
    const links = rotulos(html);
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const l of links) {
      expect(l.texto).toBe("Radar Bewild");
      expect(l.aria).toBe("Radar Bewild (abre em nova aba)");
    }
    expect(html).not.toMatch(/Guia do Investidor/i);
  });
});
