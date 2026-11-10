import { beforeEach, describe, expect, it, vi } from "vitest";

// homeSeo.ts importa o cliente do Supabase no topo do módulo. Sem mock, o
// `createClient` real roda na importação e quebra a suíte inteira no CI, onde
// não existe VITE_SUPABASE_URL ("supabaseUrl is required"). Mesmo padrão dos
// demais testes que tocam em "@/integrations/supabase/client".
const rpc = vi.fn();
vi.mock("@/integrations/supabase/publicRest", () => ({
  publicRpc: (...a: unknown[]) => rpc(...a),
  publicSelect: () => new Promise(() => {}),
}));
// A rota "/" (último bloco) traz a página inteira, que importa o cliente do Supabase.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: () => new Promise(() => {}), from: () => ({ select: () => new Promise(() => {}) }) },
}));

import { HOME_DEFAULT_DESCRIPTION, HOME_DEFAULT_TITLE, HOME_KEYWORDS, loadHomeSeo, resolveHomeSeo } from "@/lib/homeSeo";
import { CONTRATOS_ANALISADOS } from "@/content/provas";

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
  it("prefere pages_seo['/'] (título, descrição e Open Graph) e cai no padrão quando tudo está vazio", () => {
    const s = resolveHomeSeo({
      pages_seo: { "/": { title: "T", description: "D", og_title: "OT", og_description: "OD", og_image: "/i.jpg" } },
      home_seo_title: "H",
      home_seo_description: "HD",
    });
    expect(s).toMatchObject({ title: "T", description: "D", ogTitle: "OT", ogDescription: "OD", ogImage: "/i.jpg" });
    expect(resolveHomeSeo({ pages_seo: { "/": {} }, home_seo_title: "", home_seo_description: " " })).toMatchObject({
      title: HOME_DEFAULT_TITLE,
      description: HOME_DEFAULT_DESCRIPTION,
    });
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

/**
 * Uma intenção por página (decisão D1 do Pedro, 10/11/2026; auditoria de SEO,
 * rodada 4, ação 1). Search Console, 28 dias até 06/11/2026: "reforma de
 * studios" caía na home na posição 37, enquanto /reforma-de-studio-sao-paulo
 * está em 3,5 para "reforma studio". A home deixa a busca de studio para a
 * página de serviço e fica com a marca e a reforma turnkey; as "6 fases" ficam
 * só em /como-funciona. O título salvo em /admin/seo para a home está vazio
 * (conferido em 10/11/2026), então este padrão é o que sai em produção.
 */
describe("home: título e descrição padrão (D1, 10/11/2026)", () => {
  it("título de marca + reforma turnkey, dentro dos 60 caracteres", () => {
    expect(HOME_DEFAULT_TITLE).toBe("Bewild | Reforma turnkey de studios e apartamentos em SP");
    expect(HOME_DEFAULT_TITLE.length).toBeLessThanOrEqual(60);
  });

  it("descrição com preço, prazo, garantia e a base de contratos, em até 155 caracteres", () => {
    expect(HOME_DEFAULT_DESCRIPTION).toBe(
      `Reforma completa de studios e apartamentos compactos em SP: preço e prazo em contrato, 5 anos de garantia e base de ${CONTRATOS_ANALISADOS} contratos. Peça seu orçamento.`,
    );
    expect(HOME_DEFAULT_DESCRIPTION.length).toBeLessThanOrEqual(155);
  });

  it("nem título nem descrição disputam a busca da página de studio nem falam das 6 fases", () => {
    for (const texto of [HOME_DEFAULT_TITLE, HOME_DEFAULT_DESCRIPTION]) {
      expect(texto).not.toMatch(/reforma de studios?\b/i);
      expect(texto).not.toMatch(/6 fases|seis fases/i);
    }
  });

  it("palavras-chave da home sem 'reforma de studio(s)', que é da página de serviço", () => {
    expect(HOME_KEYWORDS).not.toMatch(/reforma de studios?\b/i);
    expect(HOME_KEYWORDS).toContain("Bewild");
  });
});

describe("home: o que sai no HTML do servidor", () => {
  type Meta = { title?: string; name?: string; property?: string; content?: string };
  const metaDe = async (settings: unknown) => {
    rpc.mockResolvedValue({ data: settings, error: null });
    const { Route } = await import("@/routes/index");
    const loader = Route.options.loader as unknown as () => Promise<unknown>;
    const head = Route.options.head as unknown as (ctx: { loaderData: unknown }) => { meta: Meta[] };
    return head({ loaderData: await loader() }).meta;
  };
  const valor = (meta: Meta[], chave: string) =>
    chave === "title"
      ? meta.find((m) => m.title)?.title
      : meta.find((m) => m.name === chave || m.property === chave)?.content;

  beforeEach(() => {
    rpc.mockReset();
  });

  it("título vazio no painel: título, descrição, Open Graph e Twitter saem do padrão novo", { timeout: 60_000 }, async () => {
    const meta = await metaDe({ home_seo_title: "", home_seo_description: "", pages_seo: {} });
    expect(valor(meta, "title")).toBe(HOME_DEFAULT_TITLE);
    expect(valor(meta, "description")).toBe(HOME_DEFAULT_DESCRIPTION);
    expect(valor(meta, "og:title")).toBe(HOME_DEFAULT_TITLE);
    expect(valor(meta, "og:description")).toBe(HOME_DEFAULT_DESCRIPTION);
    expect(valor(meta, "twitter:title")).toBe(HOME_DEFAULT_TITLE);
    expect(valor(meta, "twitter:description")).toBe(HOME_DEFAULT_DESCRIPTION);
    expect(valor(meta, "keywords")).toBe(HOME_KEYWORDS);
    for (const m of meta) expect(JSON.stringify(m)).not.toMatch(/6 fases/);
  });
});
