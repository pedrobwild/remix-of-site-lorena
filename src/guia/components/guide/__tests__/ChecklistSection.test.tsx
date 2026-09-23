import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ChecklistSection from "@/guia/components/guide/ChecklistSection";
import { CHECKLIST_ITEMS } from "@/guia/data/checklist";

const score = () => screen.getByText("Sua pontuação").parentElement?.querySelector(".text-4xl")?.textContent;

describe("ChecklistSection", () => {
  it("clicar no checkbox marca uma vez só (antes o clique alternava duas vezes e nada mudava)", () => {
    render(<ChecklistSection />);
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(CHECKLIST_ITEMS.length);
    fireEvent.click(boxes[0]);
    expect(boxes[0]).toHaveAttribute("aria-checked", "true");
    expect(score()).toBe("1");
    fireEvent.click(boxes[0]);
    expect(boxes[0]).toHaveAttribute("aria-checked", "false");
    expect(score()).toBe("0");
  });

  it("clicar no texto do item também marca, uma vez", () => {
    render(<ChecklistSection />);
    fireEvent.click(screen.getByText(CHECKLIST_ITEMS[1]));
    expect(screen.getAllByRole("checkbox")[1]).toHaveAttribute("aria-checked", "true");
    expect(score()).toBe("1");
  });

  it("cada checkbox tem nome acessível (o texto do item)", () => {
    render(<ChecklistSection />);
    for (const item of CHECKLIST_ITEMS) expect(screen.getByRole("checkbox", { name: item })).toBeInTheDocument();
  });

  it("com todos os itens, mostra a faixa 'Pronto para investir' com a descrição dela", async () => {
    render(<ChecklistSection />);
    for (const box of screen.getAllByRole("checkbox")) fireEvent.click(box);
    // O selo troca com animação de saída/entrada (AnimatePresence mode="wait").
    expect(await screen.findByText("Pronto para investir")).toBeInTheDocument();
    expect(screen.getByText("Seu projeto está maduro. Hora de executar.")).toBeInTheDocument();
  });
});
