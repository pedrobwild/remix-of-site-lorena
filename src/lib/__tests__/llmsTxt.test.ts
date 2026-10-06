import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * /.well-known/llms.txt é uma cópia de /llms.txt para robôs de IA que
 * procuram o arquivo ali. O scripts/generate-sitemap.mjs regrava as duas
 * no build; este teste pega edição à mão que deixe uma delas para trás.
 */
describe("llms.txt", () => {
  it("a cópia em .well-known é idêntica ao llms.txt principal", () => {
    const main = readFileSync(resolve("public/llms.txt"), "utf8");
    const copy = readFileSync(resolve("public/.well-known/llms.txt"), "utf8");
    expect(copy).toBe(main);
  });

  it("mantém os marcadores que o build preenche", () => {
    const main = readFileSync(resolve("public/llms.txt"), "utf8");
    for (const marker of ["<!-- posts:start -->", "<!-- posts:end -->", "<!-- bairros:start -->", "<!-- bairros:end -->"]) {
      expect(main).toContain(marker);
    }
  });
});
