/**
 * PORT-01 — filtros e ordenação do portfólio.
 *
 * `src/lib/portfolioFilter.ts` entrou no commit 77dfad4 ("Implementou filtros
 * e ordenação", agente do Lovable, 21/09) sem nenhum teste. Foi a última
 * mudança em main e não passou por revisão — esta suíte trava o contrato.
 */
import { describe, expect, it } from "vitest";
import {
  ALL_NEIGHBORHOODS,
  applyNeighborhoodFilter,
  applyPortfolioFilter,
  applyPortfolioSort,
  availablePortfolioFilters,
  neighborhoodOptions,
  placeOf,
  PORTFOLIO_FILTERS,
} from "../portfolioFilter";

type P = Parameters<typeof applyPortfolioFilter>[0][number] & Record<string, unknown>;

const proj = (over: Record<string, unknown>) =>
  ({
    gallery_urls: null,
    ready_gallery_urls: null,
    project_type: null,
    neighborhood: null,
    location: null,
    area_m2: null,
    created_at: null,
    sort_order: null,
    ...over,
  }) as unknown as P;

const shortStay = proj({ project_type: "short_stay", neighborhood: "Pinheiros" });
const turnKey = proj({ project_type: "turn_key", neighborhood: "Moema" });
const comObra = proj({
  project_type: "planta",
  neighborhood: "Butantã",
  ready_gallery_urls: ["https://cdn/obra-1.jpg"],
});

describe("applyPortfolioFilter", () => {
  it('"all" devolve a lista inteira', () => {
    const list = [shortStay, turnKey, comObra];
    expect(applyPortfolioFilter(list, "all")).toEqual(list);
  });

  it("filtra por tipo de projeto", () => {
    expect(applyPortfolioFilter([shortStay, turnKey, comObra], "short_stay")).toEqual([shortStay]);
  });

  it('"obra_pronta" usa as fotos da obra, não um campo de tag', () => {
    expect(applyPortfolioFilter([shortStay, turnKey, comObra], "obra_pronta")).toEqual([comObra]);
  });

  it("ignora ready_gallery_urls vazio ou só com strings em branco", () => {
    const vazio = proj({ ready_gallery_urls: [] });
    const branco = proj({ ready_gallery_urls: ["", "   "] });
    expect(applyPortfolioFilter([vazio, branco], "obra_pronta")).toEqual([]);
  });
});

describe("availablePortfolioFilters", () => {
  it('esconde "Obra pronta" quando nenhum projeto tem foto de obra', () => {
    // Estado real de produção em 22/09/2026: 0 de 161 projetos.
    const values = availablePortfolioFilters([shortStay, turnKey]).map((f) => f.value);
    expect(values).not.toContain("obra_pronta");
    expect(values).toContain("all");
  });

  it('mostra "Obra pronta" assim que existir um projeto com foto de obra', () => {
    const values = availablePortfolioFilters([shortStay, comObra]).map((f) => f.value);
    expect(values).toContain("obra_pronta");
    expect(values).toHaveLength(PORTFOLIO_FILTERS.length);
  });

  it("preserva a ordem original dos chips", () => {
    const values = availablePortfolioFilters([comObra]).map((f) => f.value);
    expect(values).toEqual(PORTFOLIO_FILTERS.map((f) => f.value));
  });
});

describe("bairro", () => {
  it("placeOf cai de bairro para cidade e depois para São Paulo", () => {
    expect(placeOf({ neighborhood: "Pinheiros", location: "São Paulo" })).toBe("Pinheiros");
    expect(placeOf({ neighborhood: null, location: "Santos" })).toBe("Santos");
    expect(placeOf({ neighborhood: null, location: null })).toBe("São Paulo");
  });

  it("neighborhoodOptions não repete e ordena em pt-BR", () => {
    const list = [
      proj({ neighborhood: "Vila Olímpia" }),
      proj({ neighborhood: "Butantã" }),
      proj({ neighborhood: "Butantã" }),
      proj({ neighborhood: "Água Branca" }),
    ];
    expect(neighborhoodOptions(list)).toEqual(["Água Branca", "Butantã", "Vila Olímpia"]);
  });

  it('trata "Brooklin" e "Brooklin " como uma opção', () => {
    const list = [proj({ neighborhood: "Brooklin" }), proj({ neighborhood: "Brooklin " })];
    expect(neighborhoodOptions(list)).toEqual(["Brooklin"]);
  });

  it('prefere "Paraíso" quando há empate com "Paraiso"', () => {
    const list = [proj({ neighborhood: "Paraiso" }), proj({ neighborhood: "Paraíso" })];
    expect(neighborhoodOptions(list)).toEqual(["Paraíso"]);
  });

  it('filtrar por "Paraíso" inclui também a grafia "Paraiso"', () => {
    const semAcento = proj({ neighborhood: "Paraiso" });
    const comAcento = proj({ neighborhood: "Paraíso" });
    expect(applyNeighborhoodFilter([semAcento, comAcento], "Paraíso")).toEqual([
      semAcento,
      comAcento,
    ]);
  });

  it('mantém "Brooklin" e "Brooklin Paulista" separados', () => {
    const list = [
      proj({ neighborhood: "Brooklin" }),
      proj({ neighborhood: "Brooklin Paulista" }),
    ];
    expect(neighborhoodOptions(list)).toEqual(["Brooklin", "Brooklin Paulista"]);
  });

  it("o valor sentinela devolve a lista inteira", () => {
    const list = [shortStay, turnKey];
    expect(applyNeighborhoodFilter(list, ALL_NEIGHBORHOODS)).toEqual(list);
    expect(applyNeighborhoodFilter(list, "")).toEqual(list);
    expect(applyNeighborhoodFilter(list, "Moema")).toEqual([turnKey]);
  });
});

describe("applyPortfolioSort", () => {
  const a = proj({ created_at: "2026-01-10T00:00:00Z", area_m2: 30 });
  const b = proj({ created_at: "2026-06-10T00:00:00Z", area_m2: 55 });
  const semData = proj({ created_at: null, area_m2: null });

  it("não muta a lista recebida", () => {
    const list = [a, b];
    const copia = [...list];
    applyPortfolioSort(list, "recentes");
    expect(list).toEqual(copia);
  });

  it('"curadoria" preserva a ordem do banco (sort_order → created_at desc)', () => {
    const list = [b, a, semData];
    expect(applyPortfolioSort(list, "curadoria")).toEqual(list);
  });

  it("ordena por data nos dois sentidos", () => {
    expect(applyPortfolioSort([a, b], "recentes")).toEqual([b, a]);
    expect(applyPortfolioSort([b, a], "antigos")).toEqual([a, b]);
  });

  it("projeto sem data vai para o fim em 'recentes' e para o começo em 'antigos'", () => {
    expect(applyPortfolioSort([a, semData, b], "recentes")).toEqual([b, a, semData]);
    expect(applyPortfolioSort([a, semData, b], "antigos")).toEqual([semData, a, b]);
  });

  it("ordena por área, com área ausente sempre no fim", () => {
    expect(applyPortfolioSort([a, semData, b], "area_desc")).toEqual([b, a, semData]);
    expect(applyPortfolioSort([b, semData, a], "area_asc")).toEqual([a, b, semData]);
  });
});
