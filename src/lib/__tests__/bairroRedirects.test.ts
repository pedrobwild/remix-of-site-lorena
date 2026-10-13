import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { BAIRRO_REDIRECTS, bairroRedirectTarget } from "@/lib/bairroRedirects";

describe("redirecionamentos de bairro", () => {
  it("Santo Amaro vai para Brooklin", () => {
    expect(bairroRedirectTarget("santo-amaro")).toBe("/reforma/brooklin");
  });
  it("Brooklin Paulista vai para Brooklin", () => {
    expect(bairroRedirectTarget("brooklin-paulista")).toBe("/reforma/brooklin");
  });
  it("bairro redirecionado não fica no sitemap, e o destino fica", () => {
    const xml = readFileSync("public/sitemap.xml", "utf8");
    for (const [from, to] of Object.entries(BAIRRO_REDIRECTS)) {
      expect(xml).not.toContain(`/reforma/${from}</loc>`);
      if (to.startsWith("/reforma/")) expect(xml).toContain(`${to}</loc>`);
    }
  });
});
