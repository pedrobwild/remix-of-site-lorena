import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: () => Promise.resolve({ data: [], error: null }) },
}));
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));

import BewildProjectPage from "@/pages/BewildProjectPage";
import type { BewildProjectFull } from "@/lib/useBewildProject";

const image = "https://example.supabase.co/storage/v1/object/public/project-images/studio.jpg";
const project: BewildProjectFull = {
  id: "pilot",
  slug: "studio",
  title: "AB - STUDIO",
  project_type: null,
  status: "em_projeto",
  neighborhood: null,
  location: null,
  area_m2: null,
  duration: null,
  summary: "Abertura com características próprias.",
  intro: "Cozinha linear com portas verdes.\n\nCabeceira em acabamento amadeirado.",
  challenge: null,
  solution: null,
  result_text: null,
  scope: ["Cozinha linear", "Cabeceira amadeirada"],
  testimonial: null,
  testimonial_author: null,
  cover_url: image,
  cover_alt: "Render 3D da cozinha verde integrada ao dormitório.",
  before_image_url: null,
  after_image_url: null,
  gallery_urls: [image],
  ready_gallery_urls: [],
  og_image_url: null,
  seo_title: "Studio com cozinha verde | Bewild",
  seo_description: "Projeto 3D com marcenaria verde.",
};

describe("página de projeto no HTML sem JavaScript", () => {
  it("entrega intro, um H1 sem código e escopo semântico", () => {
    const root = document.createElement("div");
    root.innerHTML = renderToStaticMarkup(
      <BewildProjectPage slug="studio" initial={{ project }} initialPeers={[]} />
    );
    expect(root.querySelectorAll("h1")).toHaveLength(1);
    expect(root.querySelector("h1")?.textContent).toBe("Studio");
    expect(root.querySelectorAll(".pd-description p")).toHaveLength(2);
    expect(root.textContent).toContain("Cozinha linear com portas verdes.");
    expect(root.querySelectorAll("ul.pd-scope li")).toHaveLength(2);
    const cover = root.querySelector(".pd-cover img")!;
    expect(cover.getAttribute("fetchPriority")).toBe("high");
    expect(cover.getAttribute("loading")).toBe("eager");
    expect(cover.getAttribute("srcset")).toContain("480w");
    expect(root.querySelector(".pd-gallery img")?.getAttribute("loading")).toBe("lazy");
  });

  it("mostra a descrição mesmo sem summary ou case", () => {
    const html = renderToStaticMarkup(
      <BewildProjectPage
        slug="studio"
        initial={{ project: { ...project, summary: null } }}
        initialPeers={[]}
      />
    );
    expect(html).toContain("Cozinha linear com portas verdes.");
  });
});
