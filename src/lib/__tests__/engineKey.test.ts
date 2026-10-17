import { expect, it } from "vitest";
import { resolveEngineKey } from "@/lib/externalApi.server";
it("prioriza a chave compartilhada do ambiente sem ler outra credencial", async () => {
  expect(await resolveEngineKey("credencial-ficticia", null)).toBe("credencial-ficticia");
});