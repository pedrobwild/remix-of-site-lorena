import { describe, expect, it } from "vitest";
import { isExternalHref, safeHref } from "@/lib/safeUrl";

describe("safeHref — aceita", () => {
  it.each([
    ["/diagnostico", "/diagnostico"],
    ["/conteudos/quanto-custa?x=1#topo", "/conteudos/quanto-custa?x=1#topo"],
    ["  /faq  ", "/faq"],
    ["https://wa.me/5511911906183?text=Ol%C3%A1", "https://wa.me/5511911906183?text=Ol%C3%A1"],
    ["https://catalogobewild.com", "https://catalogobewild.com/"],
    ["HTTPS://Bewild.com.br/portfolio", "https://bewild.com.br/portfolio"],
    ["mailto:contato@bewild.com.br", "mailto:contato@bewild.com.br"],
    ["mailto:contato@bewild.com.br?subject=Or%C3%A7amento", "mailto:contato@bewild.com.br?subject=Or%C3%A7amento"],
    ["tel:+5511911906183", "tel:+5511911906183"],
    ["tel:+55 (11) 91190-6183", "tel:+55 (11) 91190-6183"],
  ])("%j", (input, expected) => {
    expect(safeHref(input)).toBe(expected);
  });
});

describe("safeHref — recusa", () => {
  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "  javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "\u0000javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "http://bewild.com.br",
    "ftp://bewild.com.br/arquivo",
    "blob:https://bewild.com.br/123",
    "//golpe.com",
    "/\\golpe.com",
    "\\\\golpe.com",
    "/\t/golpe.com",
    "https://bewild.com.br@golpe.com",
    "https://user:senha@golpe.com",
    "https://",
    "mailto:",
    "mailto:javascript:alert(1)",
    "tel:",
    "tel:javascript:alert(1)",
    "diagnostico",
    "#faq",
    "?utm_source=x",
    "",
    "   ",
  ])("%j", (input) => {
    expect(safeHref(input)).toBeNull();
  });

  it.each([null, undefined, 42, {}, ["/faq"]])("valor não-string %j", (input) => {
    expect(safeHref(input)).toBeNull();
  });
});

describe("isExternalHref", () => {
  it("só https abre em nova aba", () => {
    expect(isExternalHref("https://wa.me/5511911906183")).toBe(true);
    expect(isExternalHref("/diagnostico")).toBe(false);
    expect(isExternalHref("mailto:contato@bewild.com.br")).toBe(false);
    expect(isExternalHref("tel:+5511911906183")).toBe(false);
  });
});
