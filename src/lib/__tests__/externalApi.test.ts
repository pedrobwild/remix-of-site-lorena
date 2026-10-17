import { describe, expect, it } from "vitest";
import { connectionMetadata, externalConnectionSchema } from "@/lib/externalApi";
import { decryptApiKey, encryptApiKey } from "@/lib/externalApiCrypto.server";

describe("chaves externas protegidas", () => {
  it("preserva a chave somente após descriptografar e não grava texto puro", async () => {
    const encrypted = await encryptApiKey("credencial-ficticia", "protecao-ficticia");
    expect(encrypted).not.toContain("credencial-ficticia");
    expect(await decryptApiKey(encrypted, "protecao-ficticia")).toBe("credencial-ficticia");
  });
  it("rejeita descriptografia com outra proteção", async () => {
    const encrypted = await encryptApiKey("credencial-ficticia", "protecao-ficticia");
    await expect(decryptApiKey(encrypted, "outra-protecao")).rejects.toThrow();
  });
  it("retorna somente metadados e nunca a chave externa", () => {
    const row = { id: "1", name: "Bwild Engine", provider: "bwild_engine" as const, website_url: "https://bwildengine.com/", updated_at: "2026-10-17", encrypted_key: "privado", api_key: "privado" };
    expect(Object.keys(connectionMetadata(row)).sort()).toEqual(["id", "name", "provider", "updated_at", "website_url"]);
  });
  it("aceita Bwild Engine e mantém somente os campos autorizados", () => {
    expect(externalConnectionSchema.parse({ name: "Bwild Engine", provider: "bwild_engine", website_url: "https://bwildengine.com/", api_key: "teste", webhook: true })).not.toHaveProperty("webhook");
  });
  it("não aceita credenciais nem parâmetros no endereço", () => {
    for (const website_url of ["http://bwildengine.com/", "https://user:password@bwildengine.com/", "https://bwildengine.com/?key=teste"]) {
      expect(externalConnectionSchema.safeParse({ name: "Sistema", provider: "custom", website_url, api_key: "teste" }).success).toBe(false);
    }
  });
});