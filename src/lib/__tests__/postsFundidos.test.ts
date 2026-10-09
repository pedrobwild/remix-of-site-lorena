/**
 * Artigos fundidos (09/10/2026): o slug antigo faz 301 para o artigo que
 * absorveu o conteúdo, sai do sitemap estático e não recebe link interno.
 * A edge function `faq-answer` foi desligada no mesmo dia (stub 410).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeLegacyPath } from "@/lib/useHashRoute";
import { POSTS_FUNDIDOS, destinoDoPostFundido } from "@/lib/postsFundidos";

const root = path.resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

function arquivos(dir: string): string[] {
  return readdirSync(path.join(root, dir)).flatMap((nome) => {
    const rel = path.join(dir, nome);
    if (statSync(path.join(root, rel)).isDirectory()) return arquivos(rel);
    return /\.(tsx?|txt|xml|mjs)$/.test(nome) ? [rel] : [];
  });
}

describe("posts fundidos", () => {
  it("cronograma de 60 dias úteis aponta para quanto tempo demora", () => {
    expect(destinoDoPostFundido("cronograma-reforma-studio-60-dias-uteis")).toBe(
      "quanto-tempo-demora-reforma-apartamento",
    );
    expect(destinoDoPostFundido("quanto-tempo-demora-reforma-apartamento")).toBeNull();
    expect(destinoDoPostFundido("constructor")).toBeNull();
  });

  it("SPA normaliza o slug antigo para o novo", () => {
    expect(normalizeLegacyPath("/conteudos/cronograma-reforma-studio-60-dias-uteis")).toBe(
      "/conteudos/quanto-tempo-demora-reforma-apartamento",
    );
    expect(normalizeLegacyPath("/conteudos/o-que-e-short-stay")).toBe("/conteudos/o-que-e-short-stay");
  });

  it("rota do servidor responde 301 antes de carregar o post", () => {
    const route = read("src/routes/conteudos.$slug.tsx");
    expect(route).toMatch(/beforeLoad[\s\S]*destinoDoPostFundido[\s\S]*statusCode:\s*301/);
  });

  it("destino não é outro post fundido (sem cadeia de redirecionamento)", () => {
    for (const destino of Object.values(POSTS_FUNDIDOS)) expect(POSTS_FUNDIDOS[destino]).toBeUndefined();
  });

  it("nenhum link interno nem o sitemap apontam para o slug antigo", () => {
    const fontes = [...arquivos("src"), ...arquivos("scripts"), "public/sitemap.xml", "public/llms.txt"].filter(
      (f) => !f.endsWith("postsFundidos.ts") && !f.includes("__tests__"),
    );
    for (const antigo of Object.keys(POSTS_FUNDIDOS)) {
      for (const f of fontes) expect(read(f), f).not.toContain(antigo);
    }
  });
});

describe("faq-answer desligada", () => {
  it("edge function não chama a IA nem lê o segredo", () => {
    const fn = read("supabase/functions/faq-answer/index.ts");
    expect(fn).not.toMatch(/ai\.gateway\.lovable\.dev/);
    expect(fn).not.toMatch(/LOVABLE_API_KEY/);
    expect(fn).toMatch(/status:\s*410/);
  });

  it("/faq não chama mais a função", () => {
    expect(read("src/pages/FaqPage.tsx")).not.toMatch(/invoke\(\s*["']faq-answer/);
  });
});
