import { describe, expect, it } from "vitest";
import {
  aggregateSources,
  cannibalization,
  classifyReferrer,
  compareRows,
  ctrGaps,
  deltaDir,
  expectedCtr,
  isBrandQuery,
  pathOf,
  pctChange,
  postPerformance,
  previousDays,
  strikingDistance,
  sumMetrics,
} from "../seoPanel";

const row = (key: string, impressions: number, clicks: number, position: number) => ({
  key,
  impressions,
  clicks,
  position,
  ctr: impressions ? clicks / impressions : 0,
});

describe("básicos", () => {
  it("pathOf tira domínio e barra final", () => {
    expect(pathOf("https://bewild.com.br/conteudos/x/")).toBe("/conteudos/x");
    expect(pathOf("https://bewild.com.br/")).toBe("/");
  });
  it("isBrandQuery reconhece variações da marca", () => {
    expect(isBrandQuery("Bewild reforma")).toBe(true);
    expect(isBrandQuery("bwild studio")).toBe(true);
    expect(isBrandQuery("be wild sp")).toBe(true);
    expect(isBrandQuery("quanto custa reformar studio")).toBe(false);
    expect(isBrandQuery("wild")).toBe(false);
  });
  it("pctChange e deltaDir", () => {
    expect(pctChange(15, 10)).toBeCloseTo(0.5);
    expect(pctChange(5, 0)).toBeNull();
    expect(deltaDir(12, 10)).toBe("up");
    expect(deltaDir(8, 10, true)).toBe("up");
    expect(deltaDir(12, 10, true)).toBe("down");
    expect(deltaDir(10, 10)).toBe("flat");
  });
  it("previousDays devolve janela de mesmo tamanho", () => {
    expect(previousDays("2026-09-08", "2026-10-05")).toEqual({ start: "2026-08-11", end: "2026-09-07" });
  });
  it("sumMetrics pondera a posição pelas impressões", () => {
    const m = sumMetrics([row("a", 100, 10, 2), row("b", 300, 3, 10)]);
    expect(m.impressions).toBe(400);
    expect(m.position).toBeCloseTo(8);
    expect(m.ctr).toBeCloseTo(13 / 400);
  });
});

describe("compareRows", () => {
  it("marca novas, mantidas e perdidas", () => {
    const out = compareRows([row("a", 10, 1, 5), row("b", 5, 0, 9)], [row("a", 8, 0, 7), row("c", 4, 0, 12)]);
    const by = Object.fromEntries(out.map((r) => [r.key, r]));
    expect(by.a.status).toBe("mantida");
    expect(by.a.prev?.impressions).toBe(8);
    expect(by.b.status).toBe("nova");
    expect(by.c.status).toBe("perdida");
    expect(by.c.impressions).toBe(0);
  });
});

describe("oportunidades", () => {
  it("expectedCtr cai com a posição", () => {
    expect(expectedCtr(1)).toBeGreaterThan(expectedCtr(3));
    expect(expectedCtr(15)).toBe(0.01);
    expect(expectedCtr(0)).toBe(0);
  });
  it("strikingDistance pega posições 4 a 20 com volume", () => {
    const out = strikingDistance([row("a", 100, 1, 8), row("b", 100, 20, 2), row("c", 5, 0, 9), row("d", 50, 0, 25)]);
    expect(out.map((r) => r.key)).toEqual(["a"]);
    expect(out[0].potentialClicks).toBe(9);
  });
  it("ctrGaps aponta CTR muito abaixo da curva no top 10", () => {
    const out = ctrGaps([row("a", 200, 2, 3), row("b", 200, 25, 3), row("c", 10, 0, 2)]);
    expect(out.map((r) => r.key)).toEqual(["a"]);
    expect(out[0].potentialClicks).toBe(18);
  });
  it("cannibalization exige 2+ páginas com fatia relevante", () => {
    const qp = [
      { query: "reforma studio", page: "/a", impressions: 60, clicks: 1, ctr: 0, position: 8 },
      { query: "reforma studio", page: "/b", impressions: 40, clicks: 0, ctr: 0, position: 12 },
      { query: "studio", page: "/a", impressions: 95, clicks: 2, ctr: 0, position: 5 },
      { query: "studio", page: "/c", impressions: 5, clicks: 0, ctr: 0, position: 30 },
    ];
    const out = cannibalization(qp);
    expect(out).toHaveLength(1);
    expect(out[0].query).toBe("reforma studio");
    expect(out[0].pages.map((p) => p.page)).toEqual(["/a", "/b"]);
    expect(out[0].pages[0].share).toBeCloseTo(0.6);
  });
});

describe("postPerformance", () => {
  it("inclui artigos sem impressão e a busca principal", () => {
    const posts = [
      { slug: "x", title: "X", published_at: "2026-09-01" },
      { slug: "y", title: "Y", published_at: "2026-09-02" },
    ];
    const out = postPerformance(
      posts,
      [row("https://bewild.com.br/conteudos/x", 50, 2, 9)],
      [row("https://bewild.com.br/conteudos/x", 20, 0, 14)],
      [
        { query: "q1", page: "https://bewild.com.br/conteudos/x", impressions: 30, clicks: 1, ctr: 0, position: 8 },
        { query: "q2", page: "https://bewild.com.br/conteudos/x", impressions: 20, clicks: 1, ctr: 0, position: 10 },
      ],
    );
    expect(out[0].slug).toBe("x");
    expect(out[0].cur.impressions).toBe(50);
    expect(out[0].prev?.impressions).toBe(20);
    expect(out[0].topQuery).toBe("q1");
    expect(out[1].slug).toBe("y");
    expect(out[1].cur.impressions).toBe(0);
    expect(out[1].prev).toBeNull();
  });
});

describe("tráfego de IA", () => {
  it("classifyReferrer separa IA de buscador", () => {
    expect(classifyReferrer("chatgpt.com")).toEqual({ kind: "ia", name: "ChatGPT" });
    expect(classifyReferrer("www.perplexity.ai")).toEqual({ kind: "ia", name: "Perplexity" });
    expect(classifyReferrer("gemini.google.com")).toEqual({ kind: "ia", name: "Gemini" });
    expect(classifyReferrer("www.google.com.br")).toEqual({ kind: "busca", name: "Google" });
    expect(classifyReferrer("bing.com").kind).toBe("busca");
    expect(classifyReferrer("instagram.com").kind).toBe("outro");
    expect(classifyReferrer(null).kind).toBe("outro");
  });
  it("aggregateSources soma por nome e não duplica utm do mesmo assistente", () => {
    const out = aggregateSources(
      [
        { dim: "chatgpt.com", sessions: 3, conversions: 1 },
        { dim: "www.google.com", sessions: 40, conversions: 2 },
        { dim: "google.com.br", sessions: 10, conversions: 0 },
        { dim: "instagram.com", sessions: 9, conversions: 0 },
      ],
      [
        { dim: "chatgpt.com", sessions: 3, conversions: 1 },
        { dim: "perplexity", sessions: 2, conversions: 0 },
        { dim: "perplexity.ai", sessions: 1, conversions: 0 },
      ],
    );
    expect(out.ia).toEqual([
      { name: "ChatGPT", sessions: 3, conversions: 1 },
      { name: "Perplexity", sessions: 1, conversions: 0 },
    ]);
    expect(out.busca[0]).toEqual({ name: "Google", sessions: 50, conversions: 2 });
    expect(out.iaTotal).toBe(4);
    expect(out.buscaTotal).toBe(50);
  });
});
