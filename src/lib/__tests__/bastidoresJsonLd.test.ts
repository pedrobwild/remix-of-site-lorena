import { describe, expect, it } from "vitest";
import { bastidoresJsonLd, parseBastidoresPosts } from "../bastidoresJsonLd";

describe("JSON-LD dos Bastidores", () => {
  it("lê os 6 posts com título e descrição do HTML da home", () => {
    const posts = parseBastidoresPosts();
    expect(posts.map((p) => p.code)).toEqual([
      "DY27SVWvqoM", "DdKezjDRK8h", "DczVRdmxaoU", "Dcj1_8wRuta", "DchdJiqRhOT", "Ddm4dnNtNPI",
    ]);
    posts.forEach((p) => {
      expect(p.name.length).toBeGreaterThan(5);
      expect(p.description.length).toBeGreaterThan(20);
    });
  });

  it("gera um ItemList com um SocialMediaPosting por post", () => {
    const ld = bastidoresJsonLd() as { itemListElement: Array<{ item: Record<string, string> }> };
    expect(ld.itemListElement).toHaveLength(6);
    expect(ld.itemListElement[0].item.headline).toBe("Medição e estudo do espaço | Bastidores Bewild");
    expect(ld.itemListElement[0].item.url).toBe("https://www.instagram.com/p/DY27SVWvqoM/");
  });
});
