import { describe, expect, it } from "vitest";
import { discardReasonLabel } from "../discardReason";

describe("motivo de descarte", () => {
  it("mostra só o texto registrado pelo CRM", () => {
    expect(discardReasonLabel("Fora da área atendida")).toBe("Fora da área atendida");
  });
  it("sem registro mantém o aviso de envio pendente", () => {
    expect(discardReasonLabel(null)).toBe("Aguardando envio");
    expect(discardReasonLabel("  ")).toBe("Aguardando envio");
  });
});
