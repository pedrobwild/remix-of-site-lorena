import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { CHART_SETS, chartsPagePath } from "@/content/chartSets";
import { Route } from "@/routes/graficos.$slug";
import { robotsContent } from "@/lib/useSeo";

describe("indexação dos gráficos auxiliares", () => {
  it.each(CHART_SETS)("$slug é noindex, follow no servidor", (set) => {
    const head = Route.options.head?.({ params: { slug: set.slug } } as never);
    expect(head?.meta).toContainEqual({ name: "robots", content: "noindex, follow" });
    expect(head?.scripts).toEqual([]);
  });

  it("o navegador preserva follow sem relaxar outras páginas noindex", () => {
    expect(robotsContent(true, "index, follow", true)).toBe("noindex, follow");
    expect(robotsContent(true)).toBe("noindex, nofollow");
  });

  it.each(CHART_SETS)("$slug não entra em sitemap nem llms", (set) => {
    for (const file of ["public/sitemap.xml", "public/llms.txt", "public/.well-known/llms.txt"]) {
      expect(readFileSync(resolve(file), "utf8"), file).not.toContain(chartsPagePath(set.slug));
    }
    for (const file of ["scripts/generate-sitemap.mjs", "supabase/functions/sitemap/index.ts"]) {
      expect(readFileSync(resolve(file), "utf8"), file).not.toContain("/graficos/");
    }
  });
});