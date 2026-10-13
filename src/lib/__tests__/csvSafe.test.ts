import { describe, expect, it } from "vitest";
import { csvCell } from "@/lib/csvSafe";
import { contentRowsToCsv } from "@/lib/contentViews";

describe("csvCell", () => {
  it("neutraliza fórmulas no início", () => {
    expect(csvCell("=cmd|'/c calc'!A1")).toBe("'=cmd|'/c calc'!A1");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });
  it("mantém números e textos comuns", () => {
    expect(csvCell(-5)).toBe("-5");
    expect(csvCell("/faq")).toBe("/faq");
    expect(csvCell('a;"b"')).toBe('"a;""b"""');
  });
  it("relatório de conteúdo não exporta fórmula", () => {
    const csv = contentRowsToCsv([
      { title: "=HYPERLINK(1)", slug: "x", href: "/x", pageviews: 1, sessions: 1, orphan: true } as never,
    ]);
    expect(csv).toContain("'=HYPERLINK(1)");
  });
});
