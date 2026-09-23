import { readFileSync } from "node:fs";
import path from "node:path";
import type * as GeoJSON from "geojson";
import { describe, expect, it } from "vitest";
import { BAIRROS, POLIGONO_PARA_BAIRRO, diariaMediaDe, type Bairro } from "@/guia/data/bairros";
import { DEMAND_FILTERS, NEIGHBORHOODS } from "@/guia/data/mapaBairrosData";
import {
  TAGS_DO_FILTRO,
  dentroDosLimites,
  eventosFuturos,
  filtrarBairros,
  juntarPoligonos,
  limitesDoMapa,
  normalizar,
  validarBaseDoMapa,
  type FiltroDemanda,
} from "@/guia/lib/mapa";

const nomes = (lista: { name: string }[]) => lista.map((n) => n.name).sort();

describe("filtros de perfil de demanda", () => {
  it.each(DEMAND_FILTERS.map((f) => [f.key, f.label] as const))(
    "filtro %s (%s) encontra pelo menos um bairro",
    (key) => {
      expect(filtrarBairros(NEIGHBORHOODS, { filtros: [key] }).length).toBeGreaterThan(0);
    },
  );

  it("cada filtro aceita só tags que existem na base", () => {
    const tags = new Set(NEIGHBORHOODS.flatMap((n) => n.tags));
    for (const aceitas of Object.values(TAGS_DO_FILTRO)) {
      for (const t of aceitas) expect(tags, `tag "${t}" não existe em nenhum bairro`).toContain(t);
    }
  });

  it("mapeia cada chave para os chips em português", () => {
    expect(nomes(filtrarBairros(NEIGHBORHOODS, { filtros: ["medical"] }))).toEqual(["Vila Mariana"]);
    expect(nomes(filtrarBairros(NEIGHBORHOODS, { filtros: ["business"] }))).toEqual(
      ["Brooklin", "Campo Belo", "Itaim Bibi"],
    );
    // "Turismo Premium" também é turismo.
    expect(nomes(filtrarBairros(NEIGHBORHOODS, { filtros: ["tourism"] }))).toContain("Jardim Paulista");
    const metro = nomes(filtrarBairros(NEIGHBORHOODS, { filtros: ["metro"] }));
    expect(metro).not.toContain("Campo Belo");
    expect(metro).not.toContain("Brooklin");
  });

  it("vários filtros = OU; somados à busca = E", () => {
    const eventos = filtrarBairros(NEIGHBORHOODS, { filtros: ["events"] });
    const medico = filtrarBairros(NEIGHBORHOODS, { filtros: ["medical"] });
    const ambos = filtrarBairros(NEIGHBORHOODS, { filtros: ["events", "medical"] });
    expect(nomes(ambos)).toEqual(nomes([...eventos, ...medico]));
    expect(nomes(filtrarBairros(NEIGHBORHOODS, { filtros: ["events", "medical"], busca: "vila" }))).toEqual(["Vila Mariana"]);
  });

  it("busca ignora acento e caixa", () => {
    expect(nomes(filtrarBairros(NEIGHBORHOODS, { busca: "consolacao" }))).toEqual(["Consolação"]);
    expect(nomes(filtrarBairros(NEIGHBORHOODS, { busca: "  REPÚBLICA " }))).toEqual(["República"]);
    expect(normalizar("Olímpia")).toBe("olimpia");
  });

  it("nada casa → lista vazia (a tela mostra o estado vazio)", () => {
    expect(filtrarBairros(NEIGHBORHOODS, { busca: "Copacabana" })).toEqual([]);
    expect(filtrarBairros(NEIGHBORHOODS, { filtros: ["inexistente" as FiltroDemanda] })).toEqual([]);
  });
});

describe("eventosFuturos", () => {
  const eventos = [
    { id: 1, startDate: "2026-12-03", endDate: "2026-12-06" },
    { id: 2, startDate: "2026-03-27", endDate: "2026-03-29" },
    { id: 3, startDate: "2026-09-20", endDate: "2026-09-23" },
    { id: 4, startDate: "2026-11-06", endDate: "2026-11-08" },
  ];

  it("descarta os que já terminaram e ordena pela data de início", () => {
    expect(eventosFuturos(eventos, "2026-09-23").map((e) => e.id)).toEqual([3, 4, 1]);
    expect(eventosFuturos(eventos, "2026-09-24").map((e) => e.id)).toEqual([4, 1]);
  });

  it("tudo passado → lista vazia", () => {
    expect(eventosFuturos(eventos, "2027-01-01")).toEqual([]);
  });
});

describe("limites do mapa", () => {
  it("contêm todos os pinos, inclusive Itaquera (antes ficava fora do maxBounds)", () => {
    const limites = limitesDoMapa(BAIRROS.map((b) => b.centro), 0.08);
    for (const b of BAIRROS) expect(dentroDosLimites(b.centro, limites), b.nome).toBe(true);
  });

  it("recusa lista vazia", () => {
    expect(() => limitesDoMapa([])).toThrow();
  });
});

describe("base única ↔ mapa", () => {
  it("validarBaseDoMapa não acusa problema", () => {
    expect(validarBaseDoMapa()).toEqual([]);
  });

  it("validarBaseDoMapa acusa centro ausente, centro fora de SP e alias quebrado", () => {
    const pinheiros = BAIRROS.find((b) => b.id === "pinheiros") as Bairro;
    const semCentro = { ...pinheiros, id: "x", centro: undefined } as unknown as Bairro;
    const longe = { ...pinheiros, id: "y", centro: { lat: -22.9, lng: -43.2 } };
    const problemas = validarBaseDoMapa([pinheiros, semCentro, longe], { a: "nao-existe" });
    expect(problemas.join("\n")).toMatch(/sem centro/);
    expect(problemas.join("\n")).toMatch(/fora do município/);
    expect(problemas.join("\n")).toMatch(/bairro inexistente: nao-existe/);
  });

  it("pinos, cards e ranking mostram a mesma diária/ocupação da tabela e receita derivada delas", () => {
    for (const n of NEIGHBORHOODS) {
      const b = BAIRROS.find((x) => x.id === n.id) as Bairro;
      expect(n.metrics.nightlyRate).toBe(diariaMediaDe(b.mercado));
      expect(n.metrics.occupancy).toBe(b.mercado.ocupacao);
      expect(n.metrics.nightlyRateRange).toEqual([b.mercado.diariaMin, b.mercado.diariaMax]);
      expect(n.metrics.avgRevenueMo).toBe(Math.round(n.metrics.nightlyRate * 30 * (n.metrics.occupancy / 100)));
    }
  });

  it("todo bairro com perfil vira pino; bairro sem perfil não", () => {
    expect(NEIGHBORHOODS.map((n) => n.id).sort()).toEqual(BAIRROS.filter((b) => b.perfil).map((b) => b.id).sort());
  });
});

describe("polígonos (public/geo/neighborhoods.geojson)", () => {
  const geojson = JSON.parse(
    readFileSync(path.resolve(__dirname, "../../../../public/geo/neighborhoods.geojson"), "utf8"),
  ) as GeoJSON.FeatureCollection;
  const unidos = juntarPoligonos(geojson);

  it("todo polígono tem bairro correspondente (antes 5 de 11 não casavam e o clique não fazia nada)", () => {
    const ids = geojson.features.map((f) => String(f.properties?.id));
    for (const id of ids) expect(POLIGONO_PARA_BAIRRO, `polígono ${id} sem bairro`).toHaveProperty(id);
    expect(unidos.features).toHaveLength(geojson.features.length);
  });

  it("descarta as métricas do arquivo e usa o score da base única", () => {
    for (const f of unidos.features) {
      expect(Object.keys(f.properties).sort()).toEqual(["bairroId", "bairroNome", "poligonoId", "poligonoNome", "score"]);
      const b = BAIRROS.find((x) => x.id === f.properties.bairroId) as Bairro;
      expect(f.properties.score).toBe(b.perfil?.score ?? -1);
    }
  });

  it("recortes populares apontam para o distrito certo", () => {
    const por = Object.fromEntries(unidos.features.map((f) => [f.properties.poligonoId, f.properties.bairroNome]));
    expect(por["vila-madalena"]).toBe("Pinheiros");
    expect(por.jardins).toBe("Jardim Paulista");
    expect(por.paulista).toBe("Consolação");
    expect(por["vila-clementino"]).toBe("Vila Mariana");
    expect(por["vila-olimpia"]).toBe("Vila Olímpia");
  });

  it("o pino de cada bairro com polígono próprio cai dentro do polígono (Brooklin não vai mais para o centro)", () => {
    for (const f of unidos.features) {
      if (f.properties.poligonoId !== POLIGONO_PARA_BAIRRO[f.properties.poligonoId]) continue;
      const anel = (f.geometry as GeoJSON.Polygon).coordinates[0];
      const lngs = anel.map((p) => p[0]);
      const lats = anel.map((p) => p[1]);
      const b = BAIRROS.find((x) => x.id === f.properties.bairroId) as Bairro;
      const caixa: [number, number, number, number] = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
      expect(dentroDosLimites(b.centro, caixa), `${b.nome} fora do próprio polígono`).toBe(true);
    }
  });
});
