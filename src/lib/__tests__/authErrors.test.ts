import { describe, expect, it } from "vitest";
import { translateAuthError } from "@/lib/authErrors";

describe("translateAuthError", () => {
  it("credenciais inválidas (por código e por texto)", () => {
    expect(translateAuthError({ code: "invalid_credentials", message: "x" })).toBe(
      "E-mail ou senha incorretos.",
    );
    expect(translateAuthError({ message: "Invalid login credentials" })).toBe(
      "E-mail ou senha incorretos.",
    );
  });

  it("e-mail não confirmado, limite de tentativas e rede", () => {
    expect(translateAuthError({ message: "Email not confirmed" })).toMatch(/confirmado/);
    expect(translateAuthError({ message: "Request rate limit reached", status: 429 })).toMatch(
      /Muitas tentativas/,
    );
    expect(translateAuthError({ status: 429 })).toMatch(/Muitas tentativas/);
    expect(translateAuthError({ message: "Failed to fetch" })).toMatch(/Sem conexão/);
  });

  it("erro desconhecido mantém o texto original com prefixo em português", () => {
    expect(translateAuthError({ message: "Something odd" })).toBe(
      "Não foi possível entrar: Something odd",
    );
    expect(translateAuthError(null)).toMatch(/Não foi possível entrar/);
  });
});
