import { describe, expect, it } from "vitest";
import { seoHead } from "@/lib/routeHead";

const meta = (h: ReturnType<typeof seoHead>, k: string) =>
  (h.meta as Array<Record<string, string>>).find((m) => m.name === k || m.property === k)?.content;
const title = (h: ReturnType<typeof seoHead>) =>
  (h.meta as Array<Record<string, string>>).find((m) => "title" in m)?.title;

describe("textos da aba Páginas no HTML do servidor", () => {
  const base = { title: "Original", description: "Desc original", keywords: "a, b", path: "/marcenaria" };
  it("título, descrição e palavras-chave do painel vencem os da rota", () => {
    const h = seoHead({ ...base, pagesSeo: { "/marcenaria": { title: "Novo", description: "Nova", keywords: "x, y" } } });
    expect(title(h)).toBe("Novo");
    expect(meta(h, "description")).toBe("Nova");
    expect(meta(h, "keywords")).toBe("x, y");
    expect(meta(h, "og:title")).toBe("Novo");
  });
  it("campo vazio ou outra página mantém o texto da rota", () => {
    const h = seoHead({ ...base, pagesSeo: { "/faq": { title: "Outro" }, "/marcenaria": { title: "  " } } });
    expect(title(h)).toBe("Original");
    expect(meta(h, "keywords")).toBe("a, b");
  });
});
