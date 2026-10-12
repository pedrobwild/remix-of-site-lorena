import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: () => new Promise(() => {}), from: () => ({ select: () => new Promise(() => {}) }) },
}));

import { seoHead } from "../routeHead";
import { guiaJsonLd } from "@/guia/data/guiaMeta";
import { faqJsonLd } from "../useSeo";
import { INCORP_FAQ } from "@/content/incorporadoras";
import { bastidoresJsonLd } from "../bastidoresJsonLd";

const types = (s: Array<{ children: string }>) => s.map((x) => JSON.parse(x.children)["@type"]);

describe("JSON-LD no HTML do servidor", () => {
  it("guia: WebPage com trilha aninhada + Article + FAQPage, sem BreadcrumbList solta", () => {
    const { scripts } = seoHead({ title: "G", description: "D", path: "/guia-do-investidor", jsonLd: guiaJsonLd({ breadcrumb: false }) });
    expect(types(scripts)).toEqual(["WebPage", "Article", "FAQPage"]);
    const trail = JSON.parse(scripts[0].children).breadcrumb.itemListElement.map((i: { name: string }) => i.name);
    expect(trail).toEqual(["Início", "Guia do investidor"]);
  });
  it("incorporadoras: um FAQPage com as perguntas visíveis", () => {
    const { scripts } = seoHead({ title: "I", description: "D", path: "/parceiros/incorporadoras", jsonLd: [faqJsonLd(INCORP_FAQ.items.map((i) => ({ q: i.q, a: i.a })))] });
    expect(types(scripts).filter((t) => t === "FAQPage")).toHaveLength(1);
    expect(JSON.parse(scripts[1].children).mainEntity).toHaveLength(INCORP_FAQ.items.length);
  });
  it("bastidores aplica o título editado no painel", () => {
    const ld = bastidoresJsonLd(undefined, { DY27SVWvqoM: { title: "Editado" } }) as { itemListElement: Array<{ item: { name: string } }> };
    expect(ld.itemListElement[0].item.name).toBe("Editado");
  });
});
