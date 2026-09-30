/**
 * Fontes (src/lib/fonts.ts + src/fonts.css): duas famílias, hospedadas no
 * site, com preload — e nenhuma chamada ao Google Fonts no código.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FONT_PRELOADS } from "@/lib/fonts";

const ROOT = resolve(__dirname, "../../..");
const SRC = join(ROOT, "src");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "__tests__" || name === "node_modules") continue;
      walk(full, out);
    } else if (/\.(css|tsx?|html)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

describe("preload das fontes", () => {
  it("pede os dois arquivos latin como font/woff2 com crossorigin", () => {
    expect(FONT_PRELOADS).toHaveLength(2);
    for (const link of FONT_PRELOADS) {
      expect(link.rel).toBe("preload");
      expect(link.as).toBe("font");
      expect(link.type).toBe("font/woff2");
      expect(link.crossOrigin).toBe("anonymous");
      expect(link.href).toMatch(/woff2/);
    }
  });
});

describe("fonts.css", () => {
  const css = readFileSync(join(SRC, "fonts.css"), "utf8");
  const families = new Set(
    [...css.matchAll(/font-family:\s*"([^"]+)"/g)].map((m) => m[1]),
  );

  it("declara só Manrope e JetBrains Mono", () => {
    expect([...families].sort()).toEqual(["JetBrains Mono", "Manrope"]);
  });

  it("usa font-display: swap em todo @font-face e aponta para arquivos locais", () => {
    const faces = css.match(/@font-face\s*{[^}]*}/g) ?? [];
    expect(faces.length).toBe(4);
    for (const face of faces) {
      expect(face).toContain("font-display: swap");
      expect(face).toMatch(/url\("\.\/assets\/fonts\/[a-z-]+\.woff2"\)/);
    }
  });

  it("entra no CSS principal", () => {
    expect(readFileSync(join(SRC, "styles.css"), "utf8")).toContain('@import "./fonts.css";');
  });
});

describe("sem Google Fonts", () => {
  it("nenhum arquivo de src/ pede fonts.googleapis.com ou fonts.gstatic.com", () => {
    const offenders = walk(SRC).filter((f) =>
      /fonts\.(googleapis|gstatic)\.com/.test(readFileSync(f, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("nenhum CSS usa as famílias retiradas", () => {
    const retired = /font-family:[^;}]*("|')(Playfair Display|Poppins|Inter|Montserrat|DM Sans|Sora)\1/;
    const offenders = walk(SRC)
      .filter((f) => f.endsWith(".css"))
      .filter((f) => retired.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
