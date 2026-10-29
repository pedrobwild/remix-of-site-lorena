import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlogHtmlChart } from "./BlogHtmlCharts";

describe("interações dos gráficos", () => {
  it("alterna a série sem mudar o percentual original", () => {
    const { container } = render(<BlogHtmlChart chartKey="objetivos" />);
    const toggle = screen.getByRole("button", { name: "Morar" });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelector("[data-muted]")?.getAttribute("data-muted")).toBe("0");
    expect(screen.getByLabelText("Ainda não recebi, Morar: 75%")).toHaveTextContent("75%");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });
  it("mostra detalhes com foco e toque nos dados", () => {
    render(<BlogHtmlChart chartKey="pedidos" />);
    const point = screen.getByLabelText("Ainda não recebi: 40 pedidos");
    fireEvent.focus(point);
    expect(screen.getByRole("status")).toHaveTextContent("40 de 84 pedidos (48%)");
    fireEvent.click(screen.getByLabelText("Já recebi: 29 pedidos"));
    expect(screen.getByRole("status")).toHaveTextContent("29 de 84 pedidos (35%)");
  });
});