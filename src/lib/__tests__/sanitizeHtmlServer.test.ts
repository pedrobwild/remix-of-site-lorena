import { describe, it, expect } from "vitest";
import { sanitizeBlogHtmlServer } from "@/lib/sanitizeHtml";

const VECTORS = [
  "<img src=x onerror=alert(1)>",
  "<a href=javascript:alert(1)>x</a>",
  '<a href="&#106;avascript:alert(1)">x</a>',
  "<svg onload=alert(1)>",
  '<meta http-equiv=refresh content="0;url=//x">',
  "<form><input></form>",
  "<base href=//x>",
  "<script>alert(1)</script>",
  '<p style="x">ok</p>',
];

describe("sanitizeBlogHtmlServer", () => {
  it.each(VECTORS)("neutraliza %s", (v) => {
    const out = sanitizeBlogHtmlServer(v).toLowerCase();
    expect(out).not.toMatch(/onerror|onload|javascript:|<svg|<meta|<form|<input|<base|<script|style=|alert\(1\)<\/script/);
    expect(out).not.toContain("//x");
  });

  it("mantém conteúdo seguro e força noopener", () => {
    expect(sanitizeBlogHtmlServer('<p style="x">ok</p>')).toBe("<p>ok</p>");
    const a = sanitizeBlogHtmlServer('<a href="https://x.com" target="_blank" rel="opener">y</a>');
    expect(a).toContain('rel="noopener noreferrer"');
    expect(a).toContain('href="https://x.com"');
    expect(sanitizeBlogHtmlServer('<a href="/orcamento">o</a>')).toContain('href="/orcamento"');
  });
});
