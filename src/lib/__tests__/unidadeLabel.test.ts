import { describe, expect, it } from "vitest";
import { unidadeLabel } from "../unidadeLabel";

describe("unidadeLabel", () => {
  it.each([
    ["PI - LM URBANFLEX", "Unidade PI"],
    ["LM - LM URBAN FLEX FLATS BELA CINTRA", "Unidade LM"],
    ["APSA2 - URBAN FLEX", "Unidade APSA 2"],
    ["Studio na Bela Cintra", "Studio na Bela Cintra"],
  ])("%s → %s", (entrada, saida) => {
    expect(unidadeLabel(entrada)).toBe(saida);
  });
});
