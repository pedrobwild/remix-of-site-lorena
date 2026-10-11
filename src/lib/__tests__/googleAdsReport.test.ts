import { describe, expect, it, vi } from "vitest";
import {
  accountDay,
  InvalidFilter,
  matchesLandingUrl,
  normalizeLandingPath,
  parseRequest,
  readPeriod,
  reportQueries,
} from "../../../supabase/functions/google-ads-audiences/report";

const period = { from: "2026-09-11", to: "2026-10-10" };
const today = "2026-10-10";

describe("Google Ads reporting filters", () => {
  it("keeps both inclusive calendar endpoints and the requested comparison", () => {
    const body = {
      ...period,
      segments: [{ dim: "landing_path", value: "/guia-do-investidor" }],
      previous: { from: "2026-08-12", to: "2026-09-10" },
    };
    expect(parseRequest(body, today)).toEqual(body);
    expect(reportQueries(period, false).campaigns).toContain(
      "BETWEEN '2026-09-11' AND '2026-10-10'"
    );
    expect(reportQueries(period, false).actions).not.toContain("LAST_30_DAYS");
  });
  it("preserves the old caller's 30 completed days only when no dates are supplied", () => {
    expect(parseRequest({}, today)).toEqual({
      from: "2026-09-10",
      to: "2026-10-09",
      segments: [],
      previous: null,
    });
  });
  it("uses the account calendar, not UTC, around midnight", () => {
    expect(accountDay(new Date("2026-10-10T01:00:00Z"), "America/Sao_Paulo")).toBe("2026-10-09");
  });
  it.each([
    { from: "2026-02-30", to: today },
    { from: today, to: "2026-10-09" },
    { from: "2026-10-01' OR 1=1", to: today },
    { from: "2026-10-01" },
    { ...period, previous: { from: "2026-02-29", to: today } },
    { ...period, previous: [] },
    { ...period, segments: [{ dim: "utm_source", value: "google" }] },
    { ...period, segments: [{ dim: "landing_path", value: "https://other.test/guide" }] },
    { ...period, segments: [{ dim: "landing_path", value: "//other.test/guide" }] },
    { ...period, segments: [{ dim: "landing_path", value: "/guide\\" }] },
    { ...period, segments: [{ dim: "landing_path", value: "/bad%ZZ" }] },
    { ...period, segments: "landing_path:/guide" },
    null,
  ])("rejects invalid filters rather than silently reporting account totals: %j", (input) => {
    expect(() => parseRequest(input, today)).toThrow(InvalidFilter);
  });
  it("accepts leap days and matches only the canonical path, ignoring UTMs and trailing slash", () => {
    expect(parseRequest({ from: "2024-02-29", to: "2024-02-29" }, today).from).toBe("2024-02-29");
    expect(normalizeLandingPath("/guia-do-investidor/?utm_source=google")).toBe(
      "/guia-do-investidor"
    );
    expect(
      matchesLandingUrl(
        "https://www.bewild.com.br/guia-do-investidor/?gclid=123",
        "/guia-do-investidor"
      )
    ).toBe(true);
    expect(
      matchesLandingUrl("https://bewild.com.br/guia-do-investidor/bairros", "/guia-do-investidor")
    ).toBe(false);
    expect(matchesLandingUrl("https://other.test/guia-do-investidor", "/guia-do-investidor")).toBe(
      false
    );
    expect(
      matchesLandingUrl("https://bewild.com.br/guia-do-investidor-2", "/guia-do-investidor")
    ).toBe(false);
    expect(matchesLandingUrl("not a URL", "/guia-do-investidor")).toBe(false);
    expect(matchesLandingUrl("https://bewild.com.br/?utm_source=google", "/")).toBe(true);
    expect(matchesLandingUrl("https://bewild.com.br/reforma%20studio", "/reforma studio")).toBe(
      true
    );
  });
  it("uses historical expanded destinations, never current ad.final_urls", () => {
    const queries = reportQueries(period, true);
    for (const query of Object.values(queries)) {
      expect(query).toContain("expanded_landing_page_view.expanded_final_url");
      expect(query).toContain("FROM expanded_landing_page_view");
      expect(query).not.toContain("ad.final_urls");
    }
    expect(queries.actions).toContain("segments.conversion_action,");
    expect(queries.actions).not.toContain("metrics.cost_micros");
  });
});

describe("Google Ads aggregation", () => {
  const action = (id: string) => ({
    conversionAction: {
      id,
      name: "same name",
      primaryForGoal: id === "1",
      status: "ENABLED",
    },
  });
  const row = (url: string, clicks: number, cost: number) => ({
    expandedLandingPageView: { expandedFinalUrl: url },
    campaign: { id: "10", name: "Studio", status: "PAUSED" },
    metrics: { clicks: String(clicks), costMicros: String(cost * 1_000_000), conversions: "0.5" },
  });
  const campaigns = [
    row("https://bewild.com.br/guia-do-investidor?utm_source=one", 2, 10),
    row("https://www.bewild.com.br/guia-do-investidor/?utm_source=two", 3, 20),
    row("https://bewild.com.br/guia-do-investidor/bairros", 100, 1000),
    row("https://elsewhere.test/guia-do-investidor", 100, 1000),
  ];
  const conversions = [
    {
      expandedLandingPageView: { expandedFinalUrl: "https://bewild.com.br/guia-do-investidor" },
      segments: { conversionAction: "customers/123/conversionActions/1" },
      metrics: { conversions: "1", allConversions: "1", conversionsValue: "50" },
    },
    {
      expandedLandingPageView: {
        expandedFinalUrl: "https://bewild.com.br/guia-do-investidor?gclid=x",
      },
      segments: { conversionAction: "customers/123/conversionActions/2" },
      metrics: { conversions: "0", allConversions: "1" },
    },
  ];
  const search = () =>
    vi.fn(async (query: string) =>
      query.includes("segments.conversion_action,") ? conversions : campaigns
    );

  it("sums matching historical URL rows only and joins same-name conversions by ID", async () => {
    const report = await readPeriod(search(), period, "/guia-do-investidor", [
      action("1"),
      action("2"),
    ]);
    expect(report.totals).toEqual({ clicks: 5, cost: 30, impressions: 0, conversions: 1 });
    expect(report.campaigns).toHaveLength(1);
    expect(report.campaigns[0].status).toBe("PAUSED");
    expect(report.conversions[0]).toMatchObject({ id: "1", conversions: 1, value: 50 });
    expect(report.conversions[1]).toMatchObject({ id: "2", conversions: 0, allConversions: 1 });
  });
  it("returns genuine zero for an unmatched landing page, never account totals", async () => {
    const report = await readPeriod(search(), period, "/no-ads", [action("1")]);
    expect(report.campaigns).toEqual([]);
    expect(report.totals.cost).toBe(0);
    expect(report.conversions[0].conversions).toBe(0);
  });
  it("queries the previous dates independently with the same landing filter", async () => {
    const query = search();
    await readPeriod(query, { from: "2026-08-12", to: "2026-09-10" }, "/guia-do-investidor", []);
    expect(query).toHaveBeenCalledTimes(2);
    for (const [gaql] of query.mock.calls) {
      expect(gaql).toContain("BETWEEN '2026-08-12' AND '2026-09-10'");
      expect(gaql).toContain("FROM expanded_landing_page_view");
    }
  });
  it("propagates provider errors rather than reporting an empty success", async () => {
    await expect(
      readPeriod(
        async () => {
          throw new Error("provider failed");
        },
        period,
        null,
        []
      )
    ).rejects.toThrow("provider failed");
  });
});
