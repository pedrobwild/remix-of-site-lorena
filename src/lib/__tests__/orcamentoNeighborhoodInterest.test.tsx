import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OrcamentoPage from "@/pages/OrcamentoPage";
import { setConsent } from "@/lib/cookieConsent";

const record = vi.hoisted(() => vi.fn());
vi.mock("@/lib/analytics", () => ({ trackNeighborhoodInterest: record }));
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));
vi.mock("@/lib/useSeo", () => ({ useSeo: () => {} }));
vi.mock("@/lib/trackCta", () => ({ useCtaClickTracking: () => {} }));
vi.mock("@/lib/ga4", () => ({ trackEvent: () => {} }));
vi.mock("@/lib/useLeadSubmit", () => ({
  useLeadSubmit: () => ({ sending: false, submit: vi.fn(), isMounted: () => true }),
  focusField: (id: string) => document.getElementById(id)?.focus(),
}));

const bairro = () => screen.getByRole("textbox", { name: "Bairro do apartamento" });
const continuar = () => fireEvent.click(screen.getByRole("button", { name: /Continuar/ }));
function digitar(value: string) {
  for (let i = 1; i <= value.length; i++) {
    fireEvent.change(bairro(), { target: { value: value.slice(0, i) } });
  }
}

beforeEach(() => {
  record.mockClear();
  localStorage.clear();
});

describe("Bairro confirmado no orçamento", () => {
  it("não registra Pi, Pin ou outros prefixos depois de continuar com o campo vazio", () => {
    render(<OrcamentoPage />);
    continuar();
    digitar("Pinheiros");
    expect(record).not.toHaveBeenCalled();
    fireEvent.blur(bairro());
    expect(record.mock.calls).toEqual([["Pinheiros"]]);
  });

  it("confirma Pinheiros ao avançar sem depender de blur", () => {
    render(<OrcamentoPage />);
    digitar("Pinheiros");
    continuar();
    expect(record.mock.calls).toEqual([["Pinheiros"]]);
  });

  it("não registra prefixos ao voltar e editar, nem repete o bairro anterior ao aceitar cookies", () => {
    render(<OrcamentoPage />);
    digitar("Pinheiros");
    continuar();
    fireEvent.click(screen.getByRole("button", { name: /Voltar/ }));
    record.mockClear();
    digitar("Moema");
    act(() => setConsent("accepted"));
    expect(record).not.toHaveBeenCalled();
    continuar();
    expect(record.mock.calls).toEqual([["Moema"]]);
  });

  it("reavalia apenas Pinheiros já confirmado ao aceitar cookies e ignora bairro inválido", () => {
    render(<OrcamentoPage />);
    digitar("P");
    fireEvent.blur(bairro());
    expect(record).not.toHaveBeenCalled();
    digitar("Pinheiros");
    fireEvent.blur(bairro());
    record.mockClear();
    act(() => setConsent("accepted"));
    expect(record.mock.calls).toEqual([["Pinheiros"]]);
  });
});