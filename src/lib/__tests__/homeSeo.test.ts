import { beforeEach, describe, expect, it, vi } from "vitest";

// homeSeo.ts importa o cliente do Supabase no topo do módulo. Sem mock, o
// `createClient` real roda na importação e quebra a suíte inteira no CI, onde
// não existe VITE_SUPABASE_URL ("supabaseUrl is required"). Mesmo padrão dos
// demais testes que tocam em "@/integrations/supabase/client".
const rpc = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));

import { HOME_DEFAULT_DESCRIPTION, HOME_DEFAULT_TITLE, loadHomeSeo, resolveHomeSeo } from "@/lib/homeSeo";

describe("resolveHomeSeo", () => {
  it("sem configuração usa o texto padrão", () => {
    expect(resolveHomeSeo(null)).toMatchObject({
      title: HOME_DEFAULT_TITLE,
      description: HOME_DEFAULT_DESCRIPTION,
    });
  });
  it("título salvo na aba Home vence o padrão; vazio ou só espaços não", () => {
    expect(resolveHomeSeo({ home_seo_title: "  Título novo  " }).title).toBe("Título novo");
    expect(resolveHomeSeo({ home_seo_title: "   " }).title).toBe(HOME_DEFAULT_TITLE);
  });
  it("aba Páginas vence a aba Home, como no cliente", () => {
    const s = resolveHomeSeo({
      home_seo_title: "Da aba Home",
      pages_seo: { "/": { title: "Da aba Páginas" } },
    });
    expect(s.title).toBe("Da aba Páginas");
  });
  it("repassa Open Graph próprio", () => {
    const s = resolveHomeSeo({ home_og_title: "OG", home_og_description: "OGD", home_og_image: "/a.jpg" });
    expect(s).toMatchObject({ ogTitle: "OG", ogDescription: "OGD", ogImage: "/a.jpg" });
  });
});

describe("loadHomeSeo", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("usa as configurações devolvidas pelo banco", async () => {
    rpc.mockResolvedValue({ data: { home_seo_title: "Do banco" }, error: null });
    const s = await loadHomeSeo();
    expect(rpc).toHaveBeenCalledWith("get_public_site_settings");
    expect(s.title).toBe("Do banco");
  });

  it("erro do banco cai no texto padrão, sem rejeitar", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("boom") });
    await expect(loadHomeSeo()).resolves.toMatchObject({ title: HOME_DEFAULT_TITLE });
  });

  it("exceção síncrona do cliente também cai no texto padrão", async () => {
    rpc.mockImplementation(() => {
      throw new Error("cliente indisponível");
    });
    await expect(loadHomeSeo()).resolves.toMatchObject({ title: HOME_DEFAULT_TITLE });
  });
});
