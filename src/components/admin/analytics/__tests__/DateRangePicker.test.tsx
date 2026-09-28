import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import DateRangePicker from "../DateRangePicker";

describe("DateRangePicker", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 28, 15, 0));
  });
  afterEach(() => vi.useRealTimers());

  const value = { from: new Date(2026, 8, 22), to: new Date(2026, 8, 28, 23, 59, 59, 999) };

  function open(onChange = vi.fn()) {
    render(<DateRangePicker value={value} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Selecionar período" }));
    return onChange;
  }
  function day(n: number) {
    // mês da direita = setembro (o período termina em setembro)
    const grids = screen.getAllByRole("grid");
    return within(grids[grids.length - 1]).getByRole("gridcell", { name: String(n) });
  }

  it("calendário em pt-BR, semana começando na segunda", () => {
    open();
    expect(screen.getByText(/setembro 2026/i)).toBeInTheDocument();
    const heads = within(screen.getAllByRole("grid")[0]).getAllByRole("columnheader");
    expect(heads[0].getAttribute("aria-label")).toMatch(/segunda/i);
  });

  it("com período escolhido, o 1º clique começa outro e o 2º fecha (em qualquer ordem)", () => {
    const onChange = open();
    fireEvent.click(day(10));
    expect(screen.getByText(/clique na data final/)).toBeInTheDocument();
    fireEvent.click(day(3));
    fireEvent.click(screen.getByRole("button", { name: "aplicar" }));
    const r = onChange.mock.calls[0][0];
    expect(r.from).toEqual(new Date(2026, 8, 3));
    expect(r.to).toEqual(new Date(2026, 8, 10, 23, 59, 59, 999));
  });

  it("não deixa escolher datas futuras", () => {
    open();
    expect(day(29)).toBeDisabled();
    expect(day(28)).not.toBeDisabled();
  });

  it("preset 'Mês passado' fecha agosto inteiro", () => {
    const onChange = open();
    fireEvent.click(screen.getByRole("button", { name: "Mês passado" }));
    const r = onChange.mock.calls[0][0];
    expect(r.from).toEqual(new Date(2026, 7, 1));
    expect(r.to).toEqual(new Date(2026, 7, 31, 23, 59, 59, 999));
  });
});
