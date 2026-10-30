/**
 * /reforma-de-studio-sao-paulo (análise de palavras-chave de 11/10/2026).
 *
 *  - Serviço no singular; plural "reforma de studios" fica com a home
 *    (divisão de 11/10 preservada na correção de 26/10/2026).
 *  - Gestão de Airbnb: a página dizia, no mesmo texto, que a Bewild "não faz a
 *    gestão do anúncio" e, no FAQ, que faz. A Bewild faz; a frase certa é a do
 *    FAQ, do /faq e dos artigos.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

// O módulo de conteúdo importa useSeo, que instancia o cliente do Supabase ao
// carregar; sem VITE_SUPABASE_URL (CI e sandbox não têm .env) o import quebra.
// Mesmo mock dos demais testes de SEO: aqui só rodam dados puros, nunca o backend.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => new Promise(() => {}),
    from: () => ({ select: () => new Promise(() => {}) }),
  },
}));

import { FAQ, HERO_STUDIO, SEO_DESCRIPTION, SEO_TITLE, STUDIO_SP_JSONLD, heroStudioDaVariante } from "@/content/pages/reforma-de-studio-sao-paulo";

const SRC = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(SRC, p), "utf8");

describe("reforma de studio: metadados aprovados e H1 preservado", () => {
  it("título e descrição", () => {
    expect(SEO_TITLE).toBe("Reforma de studio em São Paulo: preço e prazo em contrato");
    expect(SEO_TITLE.length).toBeLessThanOrEqual(60);
    expect(SEO_DESCRIPTION).toBe("Reforma completa de studio e apartamento pequeno em SP: projeto, obra, marcenaria e mobília num contrato. Mediana de R$ 2.744/m² em 188 contratos.");
    expect(`${SEO_TITLE} ${SEO_DESCRIPTION}`).not.toMatch(/reforma de studios/i);
  });

  it("rota (servidor) e página (navegador) usam o mesmo título e a mesma descrição", () => {
    const rota = read("routes/reforma-de-studio-sao-paulo.tsx");
    const pagina = read("pages/ReformaStudioSpPage.tsx");
    for (const fonte of [rota, pagina]) {
      expect(fonte).toMatch(/title: SEO_TITLE/);
      expect(fonte).toMatch(/description: SEO_DESCRIPTION/);
    }
  });

  it("H1 e dados estruturados", () => {
    // H1 do visitante orgânico (sem utm_*): o padrão do módulo de conteúdo.
    const pagina = read("pages/ReformaStudioSpPage.tsx");
    expect(pagina).toMatch(/\{hero\.h1\}\{" "\}/);
    expect(HERO_STUDIO.padrao.h1).toBe("Reforma de studio em São Paulo,");
    expect(HERO_STUDIO.padrao.destaque).toBe("entregue pronto para alugar, anunciar no Airbnb ou morar.");
    expect(heroStudioDaVariante("arquitetura")).toBe(HERO_STUDIO.padrao);
    for (const hero of Object.values(HERO_STUDIO)) expect(`${hero.h1} ${hero.destaque}`).not.toMatch(/reforma de studios/i);
    expect(STUDIO_SP_JSONLD[0]).toMatchObject({ "@type": "Service" });
    // name = H1 da página (palavra-chave no singular no começo).
    expect(String(STUDIO_SP_JSONLD[0].name)).toMatch(/^Reforma de studio em São Paulo,/);
  });
});

describe("gestão de Airbnb: a Bewild faz", () => {
  it("o texto e o FAQ da página de studio dizem a mesma coisa", () => {
    const pagina = read("pages/ReformaStudioSpPage.tsx").replace(/\s+/g, " ");
    expect(pagina).toContain("também faz a gestão do Airbnb");
    expect(pagina).toContain('href="/conteudos/gestao-propria-vs-gestora"');
    const item = FAQ.find((f) => f.q === "Vocês fazem a gestão do Airbnb?");
    expect(item?.a.startsWith("Sim.")).toBe(true);
    expect(item?.a).toContain("a Bewild faz a gestão do Airbnb");
  });

  it("nenhuma página diz que a Bewild não faz a gestão", () => {
    const arquivos = (dir: string): string[] =>
      readdirSync(dir).flatMap((nome) => {
        const caminho = path.join(dir, nome);
        if (statSync(caminho).isDirectory()) return nome === "__tests__" ? [] : arquivos(caminho);
        return /\.(ts|tsx)$/.test(nome) ? [caminho] : [];
      });
    const negacao = /n[ãa]o\s+(faz|fazemos|oferece|oferecemos)\s+(a\s+)?gest[ãa]o/i;
    const achados = arquivos(SRC)
      .filter((f) => negacao.test(readFileSync(f, "utf8").replace(/\s+/g, " ")))
      .map((f) => path.relative(SRC, f));
    expect(achados).toEqual([]);
  });
});
