import { describe, expect, it } from "vitest";
import { discardReasonLabel } from "../discardReason";

describe("motivo de descarte", () => {
  it("mostra só o texto registrado pelo CRM", () => {
    expect(discardReasonLabel("Fora da área atendida")).toBe("Fora da área atendida");
  });
  it("sem registro mostra 'Não enviado pelo CRM'", () => {
    expect(discardReasonLabel(null)).toBe("Não enviado pelo CRM");
    expect(discardReasonLabel("  ")).toBe("Não enviado pelo CRM");
  });
});
