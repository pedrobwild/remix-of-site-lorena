import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", async () => {
  const fake = await import("./helpers/supabaseFake");
  return { supabase: fake.fakeSupabase };
});

import { calls, resetFake, setResponder, storageRemove } from "./helpers/supabaseFake";
import {
  BEWILD_IMAGE_MAX_BYTES,
  deleteBewildImage,
  deleteBewildImages,
  storagePathFromPublicUrl,
  validateBewildImageFile,
} from "@/lib/bewildAdmin";
import {
  cleanupRemovedProjectImages,
  projectImageUrls,
  unreferencedImageUrls,
} from "@/lib/projectImageCleanup";

const SB = "https://abc.supabase.co";
const pub = (path: string) => `${SB}/storage/v1/object/public/project-images/${path}`;

beforeEach(() => {
  resetFake();
  vi.stubEnv("VITE_SUPABASE_URL", SB);
});

describe("storagePathFromPublicUrl", () => {
  it("extrai o caminho e ignora ?query e #hash", () => {
    expect(storagePathFromPublicUrl(pub("bewild/studio/1-a.jpg"), SB)).toBe("bewild/studio/1-a.jpg");
    expect(storagePathFromPublicUrl(pub("bewild/studio/1-a.jpg") + "?v=2#x", SB)).toBe(
      "bewild/studio/1-a.jpg",
    );
    expect(
      storagePathFromPublicUrl(
        `${SB}/storage/v1/render/image/public/project-images/bewild/s/1-a.jpg?width=800`,
        SB,
      ),
    ).toBe("bewild/s/1-a.jpg");
    expect(storagePathFromPublicUrl(pub("bewild/s/foto%20sala.jpg"), SB)).toBe("bewild/s/foto sala.jpg");
  });

  it("nunca aponta para arquivos que o painel não subiu", () => {
    // outro host com "/project-images/" no caminho
    expect(storagePathFromPublicUrl("https://evil.com/storage/v1/object/public/project-images/bewild/x.jpg", SB)).toBeNull();
    // outro bucket / fora de bewild/
    expect(storagePathFromPublicUrl(`${SB}/storage/v1/object/public/blog-images/bewild/x.jpg`, SB)).toBeNull();
    expect(storagePathFromPublicUrl(pub("legado/x.jpg"), SB)).toBeNull();
    expect(storagePathFromPublicUrl(pub("bewild/../segredo.jpg"), SB)).toBeNull();
    expect(storagePathFromPublicUrl("/assets/local.jpg", SB)).toBeNull();
    expect(storagePathFromPublicUrl(null, SB)).toBeNull();
  });
});

describe("validateBewildImageFile", () => {
  const file = (name: string, type: string, size = 1000) => ({ name, type, size });

  it("aceita fotos raster", () => {
    expect(validateBewildImageFile(file("a.jpg", "image/jpeg"))).toBeNull();
    expect(validateBewildImageFile(file("a.png", "image/png"))).toBeNull();
    expect(validateBewildImageFile(file("a.webp", "image/webp"))).toBeNull();
    expect(validateBewildImageFile(file("a.avif", ""))).toBeNull(); // tipo vazio: vale a extensão
  });

  it("recusa SVG, outros tipos e arquivos grandes demais", () => {
    expect(validateBewildImageFile(file("logo.svg", "image/svg+xml"))).toMatch(/não é uma foto aceita/);
    expect(validateBewildImageFile(file("a.gif", "image/gif"))).toMatch(/JPG, PNG, WebP ou AVIF/);
    expect(validateBewildImageFile(file("a.svg", ""))).toMatch(/não é uma foto aceita/);
    expect(validateBewildImageFile(file("a.jpg", "image/jpeg", BEWILD_IMAGE_MAX_BYTES + 1))).toMatch(
      /limite é 15 MB/,
    );
  });
});

describe("deleteBewildImages", () => {
  it("confere o { error } do storage", async () => {
    storageRemove.mockResolvedValueOnce({ data: null, error: { message: "not allowed" } });
    await expect(deleteBewildImages([pub("bewild/s/1.jpg")])).resolves.toEqual({
      deleted: [],
      error: "not allowed",
    });
    storageRemove.mockResolvedValueOnce({ data: null, error: { message: "not allowed" } });
    await expect(deleteBewildImage(pub("bewild/s/1.jpg"))).rejects.toThrow("not allowed");
  });

  it("remove pelo caminho limpo e ignora URLs de fora", async () => {
    storageRemove.mockResolvedValueOnce({ data: [{ name: "bewild/s/1.jpg" }], error: null });
    await deleteBewildImages([pub("bewild/s/1.jpg") + "?t=1", "https://cdn.exemplo.com/x.jpg"]);
    expect(storageRemove).toHaveBeenCalledWith(["bewild/s/1.jpg"]);
  });
});

describe("fotos que saem do formulário", () => {
  const capa = pub("bewild/s/1-capa.jpg");
  const foto2 = pub("bewild/s/2.jpg");
  const foto3 = pub("bewild/s/3.jpg");

  it("projectImageUrls junta todos os campos", () => {
    expect(
      projectImageUrls({
        cover_url: capa,
        before_image_url: null,
        after_image_url: foto3,
        gallery_urls: [capa, foto2],
        ready_gallery_urls: null,
      }),
    ).toEqual([capa, foto3, capa, foto2]);
  });

  it("foto removida da galeria que continua como capa NÃO é apagada", () => {
    // Importação do Drive: capa = primeira foto da galeria. O admin remove a
    // foto da galeria — a capa continua usando o mesmo arquivo.
    const saved = { cover_url: capa, gallery_urls: [foto2] };
    expect(unreferencedImageUrls([capa, foto2, foto3], saved, SB)).toEqual([foto3]);
  });

  it("compara pelo arquivo, não pela string (query não engana)", () => {
    const saved = { cover_url: `${capa}?v=2`, gallery_urls: [] };
    expect(unreferencedImageUrls([capa], saved, SB)).toEqual([]);
  });

  it("URLs de fora nunca são candidatas", () => {
    expect(unreferencedImageUrls(["https://cdn.exemplo.com/x.jpg"], {}, SB)).toEqual([]);
  });
});

describe("cleanupRemovedProjectImages", () => {
  const a = pub("bewild/s/a.jpg");
  const b = pub("bewild/s/b.jpg");

  it("apaga só o que não é usado por outro projeto", async () => {
    setResponder((call) => {
      const galleryCheck = call.ops.some(([op, args]) => op === "overlaps" && args[0] === "gallery_urls");
      return galleryCheck ? { data: [{ gallery_urls: [b, "x"] }] } : { data: [] };
    });
    storageRemove.mockResolvedValueOnce({ data: [{ name: "bewild/s/a.jpg" }], error: null });
    const res = await cleanupRemovedProjectImages("p-1", [a, b], { gallery_urls: [] });
    expect(res).toEqual({ deleted: 1, skipped: 1, error: null });
    expect(storageRemove).toHaveBeenCalledWith(["bewild/s/a.jpg"]);
    // conferiu os 5 campos em outros projetos (neq id)
    expect(calls).toHaveLength(5);
    for (const c of calls) expect(c.ops).toContainEqual(["neq", ["id", "p-1"]]);
  });

  it("se a conferência falhar, não apaga nada", async () => {
    setResponder(() => ({ error: { message: "timeout" } }));
    const res = await cleanupRemovedProjectImages("p-1", [a], {});
    expect(res).toEqual({ deleted: 0, skipped: 1, error: "timeout" });
    expect(storageRemove).not.toHaveBeenCalled();
  });

  it("nada saiu do formulário: nenhuma consulta", async () => {
    const res = await cleanupRemovedProjectImages("p-1", [a], { cover_url: a });
    expect(res).toEqual({ deleted: 0, skipped: 0, error: null });
    expect(calls).toHaveLength(0);
  });
});
