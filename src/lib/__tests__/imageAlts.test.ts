import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
import { fetchAlts } from "../useImageAlts";

describe("descrições por URL das imagens", () => {
  beforeEach(() => { rpc.mockReset(); });

  it("lê a descrição pública pela URL original e a reutiliza sem nova consulta", async () => {
    const url = "https://bewild.com.br/images/teste-render.png";
    rpc.mockResolvedValue({ data: [{ url, alt: "Cozinha com bancada e mesa" }], error: null });
    expect(await fetchAlts([url])).toEqual({ [url]: "Cozinha com bancada e mesa" });
    expect(rpc).toHaveBeenCalledWith("get_image_alts", { p_urls: [url] });
    await fetchAlts([url]);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("divide consultas longas em lotes sem perder resultados", async () => {
    const urls = Array.from({ length: 151 }, (_, n) => `https://bewild.com.br/images/lote-${n}.png`);
    rpc.mockImplementation(async (_name, { p_urls }: { p_urls: string[] }) => ({
      data: p_urls.map((url) => ({ url, alt: `Descrição ${url}` })), error: null,
    }));
    const result = await fetchAlts(urls);
    expect(Object.keys(result)).toHaveLength(151);
    expect(rpc.mock.calls.map((call) => call[1].p_urls.length)).toEqual([150, 1]);
    expect(result[urls[150]]).toBe(`Descrição ${urls[150]}`);
  });

  it("propaga falha de leitura para preservar o restante da página", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("indisponível") });
    await expect(fetchAlts(["https://bewild.com.br/images/falha.png"])).rejects.toThrow("indisponível");
  });
});