import { describe, expect, it } from "vitest";
import { privacyVisitState } from "@/lib/privacyMeasurement";
describe("visita à privacidade antes do pedido", () => {
  it("mede apenas com consentimento", () => {
    expect(privacyVisitState(false, "sessao", "sessao")).toBeNull();
  });
  it("não transfere a visita para outra sessão", () => {
    expect(privacyVisitState(true, "nova", "antiga")).toBe(false);
  });
  it("confirma uma visita na mesma sessão", () => {
    expect(privacyVisitState(true, "sessao", "sessao")).toBe(true);
  });
  it("sem sessão permanece não medido", () => {
    expect(privacyVisitState(true, null, null)).toBeNull();
  });
});