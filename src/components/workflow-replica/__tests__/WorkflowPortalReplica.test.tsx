import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import WorkflowPortalReplica from "../WorkflowPortalReplica";

/**
 * Réplica do portal na home: no celular o cronograma abre só com a etapa
 * atual e as vizinhas (2 antes, 2 depois); o botão mostra as 12.
 */

// O gráfico da aba "Evolução de Obra" fica montado (escondido) e, sem layout
// no jsdom, o recharts avisa que mediu 0 × 0: ruído, não erro.
const warn = console.warn;
let warnSpy: ReturnType<typeof vi.spyOn> | undefined;

beforeAll(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes("of chart should be greater than 0")) return;
    warn(...args);
  });
  // O gráfico usa ResizeObserver, que o jsdom não tem.
  const g = globalThis as unknown as { ResizeObserver?: unknown };
  if (!g.ResizeObserver) {
    g.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

afterEach(() => cleanup());
afterAll(() => warnSpy?.mockRestore());

const numbers = () =>
  Array.from(document.querySelectorAll(".wf-mobile-activity .wf-activity-number")).map(
    (el) => el.textContent
  );

describe("WorkflowPortalReplica — cronograma no celular", () => {
  it("abre com a atividade atual e as vizinhas; o botão alterna com as 12", () => {
    render(<WorkflowPortalReplica />);
    expect(numbers()).toEqual(["06", "07", "08", "09", "10"]);
    expect(
      document.querySelector(".wf-mobile-activity.current .wf-activity-number")?.textContent
    ).toBe("08");

    const more = screen.getByRole("button", { name: "Ver as 12 atividades" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    expect(more).toHaveAttribute("aria-controls", "wf-mobile-activities");

    fireEvent.click(more);
    expect(numbers()).toHaveLength(12);
    expect(more).toHaveAttribute("aria-expanded", "true");
    expect(more).toHaveTextContent("Mostrar menos");

    fireEvent.click(more);
    expect(numbers()).toEqual(["06", "07", "08", "09", "10"]);
  });

  it("a tabela do desktop continua com as 12 atividades", () => {
    render(<WorkflowPortalReplica />);
    expect(document.querySelectorAll(".wf-table tbody tr")).toHaveLength(12);
    expect(
      document.querySelector(".wf-table tbody tr.wf-current-row .wf-activity-number")?.textContent
    ).toBe("08");
  });
});
