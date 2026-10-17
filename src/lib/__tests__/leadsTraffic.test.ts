import { describe, expect, it } from "vitest";
import { buildBairroData, buildOrigemData, leadBairro } from "@/lib/leadsTraffic";

describe("buildOrigemData", () => {
  it("classifica Google Ads (gclid), orgânico e direto, sem fatias zeradas", () => {
    const rows = [
      { gclid: "abc", location: "Pinheiros" },
      { gclid: "def", location: "Pinheiros" },
      { utm_source: "google", utm_medium: "organic", location: "Vila Mariana" },
      { referrer: "https://www.google.com/", location: "Moema" },
      { location: "Itaim Bibi" },
    ];
    const data = buildOrigemData(rows);
    const por = Object.fromEntries(data.map((d) => [d.canal, d.leads]));
    expect(por.google_ads).toBe(2);
    expect(por.organico).toBe(2);
    expect(por.direto).toBe(1);
    expect(data.find((d) => d.canal === "meta")).toBeUndefined();
    expect(data.reduce((acc, d) => acc + d.leads, 0)).toBe(5);
  });

  it("lista vazia devolve lista vazia", () => {
    expect(buildOrigemData([])).toEqual([]);
  });
});

describe("leadBairro", () => {
  it("tira cidade/UF do campo livre", () => {
    expect(leadBairro("Pinheiros — São Paulo")).toBe("Pinheiros");
    expect(leadBairro("Vila Mariana, SP")).toBe("Vila Mariana");
    expect(leadBairro("Moema / SP")).toBe("Moema");
  });

  it("vazio ou nulo vira null", () => {
    expect(leadBairro(null)).toBeNull();
    expect(leadBairro("   ")).toBeNull();
  });
});

describe("buildBairroData", () => {
  it("ordena por leads, agrupa grafia diferente e soma o resto em Outros", () => {
    const rows = [
      { location: "Pinheiros" },
      { location: "pinheiros" },
      { location: "Pinheiros — São Paulo" },
      { location: "Moema" },
      { location: "Moema" },
      { location: "Itaim Bibi" },
      { location: "Perdizes" },
      { location: null },
    ];
    const data = buildBairroData(rows, 3);
    expect(data[0]).toEqual({ bairro: "Pinheiros", leads: 3 });
    expect(data[1]).toEqual({ bairro: "Moema", leads: 2 });
    // corte em 3: Itaim e Perdizes (1 cada) viram "Outros"; sem bairro vai por último
    expect(data).toContainEqual({ bairro: "Outros", leads: 2 });
    expect(data[data.length - 1]).toEqual({ bairro: "Não informado", leads: 1 });
  });

  it("sem corte quando há poucos bairros", () => {
    const data = buildBairroData([{ location: "Moema" }, { location: "Moema" }], 10);
    expect(data).toEqual([{ bairro: "Moema", leads: 2 }]);
  });
});
