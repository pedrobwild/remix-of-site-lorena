/**
 * Query string do roteador sem perda de precisão (incidente de 08/11/2026):
 * o parser padrão (JSON.parse) arredondava ids do Meta acima de 2^53 na
 * primeira navegação SPA e a URL era reescrita com o id errado.
 */
import { describe, expect, it } from "vitest";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  defaultParseSearch,
} from "@tanstack/react-router";
import { parseSearch, parseSearchValue, stringifySearch } from "../routerSearch";

const ID_META = "120252065401790152";

describe("parseSearchValue", () => {
  it("número que não volta idêntico ao texto lança (o roteador mantém o texto)", () => {
    expect(() => parseSearchValue(ID_META)).toThrow();
    expect(() => parseSearchValue("1e3")).toThrow();
    expect(() => parseSearchValue("5.0")).toThrow();
    expect(() => parseSearchValue("-0")).toThrow();
    expect(() => parseSearchValue("1e400")).toThrow();
    expect(() => parseSearchValue(`[${ID_META}]`)).toThrow();
  });

  it("o resto continua igual ao JSON.parse", () => {
    expect(parseSearchValue("5")).toBe(5);
    expect(parseSearchValue("-12.5")).toBe(-12.5);
    expect(parseSearchValue("true")).toBe(true);
    expect(parseSearchValue("null")).toBeNull();
    expect(parseSearchValue('"5"')).toBe("5");
    expect(parseSearchValue("[1,2]")).toEqual([1, 2]);
    expect(parseSearchValue('{"a":1}')).toEqual({ a: 1 });
    expect(() => parseSearchValue("google")).toThrow();
  });
});

describe("parseSearch / stringifySearch", () => {
  const busca = `?utm_campaign=${ID_META}&n=5&b=true&utm_source=facebook`;

  it("o padrão do TanStack arredonda (o defeito que este módulo corrige)", () => {
    expect(defaultParseSearch(busca).utm_campaign).toBe(120252065401790140);
  });

  it("mantém o id exato como texto; números pequenos e booleanos seguem tipados", () => {
    expect(parseSearch(busca)).toEqual({ utm_campaign: ID_META, n: 5, b: true, utm_source: "facebook" });
  });

  it("ida e volta preserva a URL", () => {
    expect(stringifySearch(parseSearch(busca))).toBe(busca);
    // String que parece número continua string (vai entre aspas, como no padrão).
    expect(parseSearch(stringifySearch({ n: "5" }))).toEqual({ n: "5" });
    expect(stringifySearch({ id: ID_META })).toBe(`?id=${ID_META}`);
  });

  it("navegação SPA (search: true) não reescreve o id", async () => {
    const rootRoute = createRootRoute();
    const routeTree = rootRoute.addChildren([
      createRoute({ getParentRoute: () => rootRoute, path: "/" }),
      createRoute({ getParentRoute: () => rootRoute, path: "/orcamento" }),
    ]);
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [`/${busca}`] }),
      parseSearch,
      stringifySearch,
    });
    await router.load();
    expect(router.state.location.search).toMatchObject({ utm_campaign: ID_META });

    await router.navigate({ to: "/orcamento", search: true });
    expect(router.state.location.pathname).toBe("/orcamento");
    expect(router.state.location.searchStr).toContain(`utm_campaign=${ID_META}`);
    expect(router.history.location.search).toContain(`utm_campaign=${ID_META}`);
    expect((router.state.location.search as Record<string, unknown>).utm_campaign).toBe(ID_META);
    expect((router.state.location.search as Record<string, unknown>).n).toBe(5);
  });
});
