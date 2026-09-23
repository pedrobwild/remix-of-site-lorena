import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import SimuladorSection from "@/guia/components/guide/SimuladorSection";
import { MAX_SCENARIOS, SCENARIOS_KEY, type SavedScenario } from "@/guia/data/guide-data";

const cenario = (i: number): SavedScenario => ({
  id: `c${i}`,
  name: `Cenário ${i}`,
  bairro: "Pinheiros",
  metragem: 30,
  ocupacao: 75,
  diariaAtual: "",
  objetivo: "maximizar",
  rateBoost: 0,
  reformaBudget: "",
  boostedDaily: 380,
  receitaMensal: 9120,
  receitaAnual: 109440,
  paybackMonths: null,
});

describe("SimuladorSection", () => {
  beforeAll(() => {
    // jsdom não implementa ResizeObserver (o Slider do Radix mede o thumb com ele).
    if (!("ResizeObserver" in globalThis)) {
      (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
  });
  beforeEach(() => sessionStorage.clear());

  it("mostra a ocupação considerada quando o objetivo a ajusta (nada de +5 p.p. escondido)", () => {
    render(<SimuladorSection />);
    expect(screen.getByText(/Ocupação considerada na conta:/)).toHaveTextContent("80%");
    expect(screen.getByText(/Ocupação considerada na conta:/)).toHaveTextContent("+5 p.p.");
  });

  it("campos têm rótulo associado", () => {
    render(<SimuladorSection />);
    for (const nome of ["Metragem (m²)", "Diária atual (opcional, R$)", "Orçamento de reforma (opcional, R$)"]) {
      expect(screen.getByLabelText(nome)).toBeInTheDocument();
    }
    expect(screen.getByRole("slider")).toHaveAccessibleName(/Ocupação estimada/);
  });

  it(`com ${MAX_SCENARIOS} cenários salvos, o botão fica desabilitado e explica o motivo`, () => {
    sessionStorage.setItem(SCENARIOS_KEY, JSON.stringify(Array.from({ length: MAX_SCENARIOS }, (_, i) => cenario(i + 1))));
    render(<SimuladorSection />);
    const botao = screen.getByRole("button", { name: new RegExp(`Limite de ${MAX_SCENARIOS} cenários`) });
    expect(botao).toBeDisabled();
    expect(screen.getByText(/Remova um cenário/)).toBeInTheDocument();
  });

  it("ignora cenários corrompidos no armazenamento", () => {
    sessionStorage.setItem(SCENARIOS_KEY, JSON.stringify([{ lixo: true }, cenario(1)]));
    render(<SimuladorSection />);
    expect(screen.getByRole("button", { name: "Carregar Cenário 1 no simulador" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar cenário" })).toBeEnabled();
  });
});
