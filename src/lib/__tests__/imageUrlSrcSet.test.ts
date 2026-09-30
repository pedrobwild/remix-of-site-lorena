import { describe, it, expect } from "vitest";
import { optimizedSrcSet } from "@/lib/imageUrl";

const base = "https://x.supabase.co/storage/v1/object/public/project-images/a/b.jpg";

describe("optimizedSrcSet", () => {
  it("gera 4 larguras com o endpoint de render", () => {
    const s = optimizedSrcSet(base)!;
    const parts = s.split(", ");
    expect(parts).toHaveLength(4);
    expect(parts[0]).toContain("/render/image/public/project-images/a/b.jpg?width=480&quality=70&resize=contain 480w");
    expect(parts[3]).toMatch(/width=1280&quality=70&resize=contain 1280w$/);
  });
  it("devolve undefined para URL externa ou vazia", () => {
    expect(optimizedSrcSet("https://example.com/a.jpg")).toBeUndefined();
    expect(optimizedSrcSet("")).toBeUndefined();
  });
});
