/**
 * Mapa de bairros sem WebGL: o MapLibre é trocado por stubs e o teste cobre
 * o que o usuário vê fora do canvas — filtros, busca, estado vazio, aviso de
 * ROI e eventos futuros.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { NEIGHBORHOODS } from "@/guia/data/mapaBairrosData";

vi.mock("react-map-gl/maplibre", () => {
  const Passa = ({ children }: { children?: ReactNode }) => <>{children}</>;
  const Nada = () => null;
  return { default: Passa, Marker: Passa, Popup: Nada, NavigationControl: Nada, Source: Nada, Layer: Nada };
});
vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}));

/** Nomes dos pinos do mapa (botões "Nome, score N. Selecionar bairro"), em ordem alfabética. */
const pinos = () =>
  screen
    .queryAllByRole("button", { name: /, score \d+\. Selecionar bairro$/ })
    .map((el) => (el.getAttribute("aria-label") ?? "").split(",")[0])
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

/** Cards de "Bairros analisados" (o ranking tem rótulo próprio, "1º Pinheiros: ROI…"). */
const cards = () =>
  screen.queryAllByRole("button").filter((el) => /^[^:]+: score \d+, diária média R\$/.test(el.getAttribute("aria-label") ?? ""));

describe("MapaBairrosEmbed", () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 23, 12, 0));
    // Os geojson são opcionais: sem rede, o mapa segue com os pinos.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  });
  afterAll(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("filtros de perfil de demanda encontram bairros (antes todo filtro zerava a lista)", async () => {
    const { default: MapaBairrosEmbed } = await import("@/guia/components/mapa/MapaBairrosEmbed");
    render(<MapaBairrosEmbed />);
    expect(cards()).toHaveLength(NEIGHBORHOODS.length);

    const turismo = screen.getByRole("button", { name: "Turismo" });
    fireEvent.click(turismo);
    expect(turismo).toHaveAttribute("aria-pressed", "true");
    // Os pinos saem na hora (os cards esperam a animação de saída), então a
    // conferência usa os pinos e o contador — sem depender do tempo da animação.
    expect(pinos()).toEqual(["Bela Vista", "Consolação", "Jardim Paulista", "Pinheiros", "República"]);
    expect(screen.getAllByText("5 bairros").length).toBeGreaterThan(0);
  });

  it("busca sem resultado mostra estado vazio e 'Limpar filtros' restaura a lista", async () => {
    const { default: MapaBairrosEmbed } = await import("@/guia/components/mapa/MapaBairrosEmbed");
    render(<MapaBairrosEmbed />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar bairro" }), { target: { value: "Copacabana" } });
    expect(screen.getAllByText("Nenhum bairro com esse perfil ou nome.").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Limpar filtros" })[0]);
    expect(cards()).toHaveLength(NEIGHBORHOODS.length);
  });

  it("ROI aparece sempre com o aviso de estimativa e sem o rótulo de fonte provisória", async () => {
    const { default: MapaBairrosEmbed } = await import("@/guia/components/mapa/MapaBairrosEmbed");
    const { container } = render(<MapaBairrosEmbed />);
    expect(container.textContent).toMatch(/estimativa ilustrativa/);
    expect(container.textContent).not.toMatch(/Seed|substituir por dados reais|Fonte:/);
    // pt-BR: 19,2% (Pinheiros)
    expect(container.textContent).toContain("19,2%");
  });

  it("só lista eventos que ainda não terminaram, com data em pt-BR", async () => {
    const { default: MapaBairrosEmbed } = await import("@/guia/components/mapa/MapaBairrosEmbed");
    render(<MapaBairrosEmbed />);
    const secao = screen.getByRole("heading", { name: "Eventos que aumentam a demanda" }).parentElement!.parentElement!;
    expect(within(secao).getByText("GP Brasil de F1")).toBeInTheDocument();
    expect(within(secao).getByText("06–08/11/2026")).toBeInTheDocument();
    expect(within(secao).queryByText("Lollapalooza Brasil")).toBeNull();
    expect(within(secao).queryByText("Fecomercio SP")).toBeNull();
  });

  it("pinos do mapa são botões focáveis com nome acessível", async () => {
    const { default: MapaBairrosEmbed } = await import("@/guia/components/mapa/MapaBairrosEmbed");
    render(<MapaBairrosEmbed />);
    const pino = screen.getByRole("button", { name: "Brooklin, score 80. Selecionar bairro" });
    expect(pino.tagName).toBe("BUTTON");
  });
});
