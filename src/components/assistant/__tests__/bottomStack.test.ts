import { describe, expect, it } from "vitest";
import { bottomStackTop, STACK_GAP } from "../bottomStack";

/**
 * Pilha do rodapé (bottomStack.ts): o botão "Dúvidas" para acima de tudo que
 * está empilhado a partir da borda de baixo — inclusive a barra "Solicitar
 * orçamento" quando ela sobe acima do banner de cookies.
 */
const H = 844; // iPhone 14, em px CSS
const rect = (top: number, bottom: number) => ({ top, bottom, height: bottom - top });

describe("bottomStackTop", () => {
  it("sem nada no rodapé: a própria borda", () => {
    expect(bottomStackTop([], H)).toBe(H);
  });

  it("só a barra do celular, colada na borda (12 px)", () => {
    expect(bottomStackTop([rect(780, 832)], H)).toBe(780);
  });

  it("banner aberto e a barra acima dele: o topo é o da barra", () => {
    const banner = rect(687, 844);
    const cta = rect(623, 675); // 12 px acima do banner
    expect(bottomStackTop([banner, cta], H)).toBe(623);
    // A ordem em que os elementos chegam não importa.
    expect(bottomStackTop([cta, banner], H)).toBe(623);
  });

  it("barra ainda por baixo do banner (no meio da transição): conta o banner", () => {
    expect(bottomStackTop([rect(687, 844), rect(780, 832)], H)).toBe(687);
  });

  it("não sobe até elementos longe da pilha (ex.: cabeçalho fixo)", () => {
    const banner = rect(687, 844);
    const header = rect(0, 64);
    expect(bottomStackTop([banner, header], H)).toBe(687);
    // Um elemento que termina a mais de STACK_GAP px do topo da pilha não entra.
    expect(bottomStackTop([banner, rect(400, 687 - STACK_GAP - 1)], H)).toBe(687);
  });

  it("nada ancorado perto da borda: nada conta", () => {
    expect(bottomStackTop([rect(500, H - STACK_GAP - 1)], H)).toBe(H);
  });

  it("ignora elementos altos demais para serem barra de rodapé (> 60% da tela)", () => {
    expect(bottomStackTop([rect(100, H)], H)).toBe(H);
  });
});
