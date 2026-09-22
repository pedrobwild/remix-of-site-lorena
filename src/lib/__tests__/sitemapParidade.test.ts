/**
 * SEO-08 — as duas fontes de sitemap precisam concordar.
 *
 * `scripts/generate-sitemap.mjs` gera o `public/sitemap.xml` que vai ao ar no
 * prebuild. `supabase/functions/sitemap/index.ts` alimenta o botão "gerar
 * sitemap agora" do admin. São implementações separadas da mesma regra —
 * quando divergem, o preview do painel mente sobre o arquivo publicado.
 *
 * Este teste lê os dois fontes como TEXTO (a edge function é Deno e não pode
 * ser importada aqui) e compara rota a rota: presença, prioridade e
 * changefreq. Também confere contra `useHashRoute.ts` e contra o
 * `public/sitemap.xml` commitado.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

/** Rotas estáticas indexáveis. `/o` e `/p` são LPs de anúncio: fora do sitemap. */
const ROTAS_INDEXAVEIS = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/portfolio", priority: "0.9", changefreq: "weekly" },
  { path: "/diagnostico", priority: "0.9", changefreq: "monthly" },
  { path: "/conteudos", priority: "0.8", changefreq: "weekly" },
  { path: "/orcamento", priority: "0.9", changefreq: "monthly" },
  { path: "/faq", priority: "0.7", changefreq: "monthly" },
  { path: "/autorizacao-condominio", priority: "0.7", changefreq: "monthly" },
  { path: "/contato", priority: "0.7", changefreq: "monthly" },
  { path: "/escopo", priority: "0.7", changefreq: "monthly" },
  { path: "/como-funciona", priority: "0.7", changefreq: "monthly" },
  { path: "/onde-atuamos", priority: "0.7", changefreq: "monthly" },
  { path: "/privacidade", priority: "0.3", changefreq: "yearly" },
];

const script = read("scripts/generate-sitemap.mjs");
const edge = read("supabase/functions/sitemap/index.ts");

describe("paridade entre as duas fontes de sitemap", () => {
  it.each(ROTAS_INDEXAVEIS)(
    "$path aparece nas duas fontes com a mesma priority e changefreq",
    ({ path: rota, priority, changefreq }) => {
      const sufixo = rota === "/" ? "/`" : `${rota}\``;
      expect(script, `rota ${rota} ausente no script de build`).toContain(
        `\${BASE_URL}${rota === "/" ? "/" : rota}\``,
      );
      expect(edge, `rota ${rota} ausente na edge function`).toContain(`\${base}${sufixo}`);

      // A priority/changefreq aparece na mesma linha da rota em cada fonte.
      for (const [nome, fonte, marcador] of [
        ["script", script, `\${BASE_URL}${rota === "/" ? "/" : rota}\``],
        ["edge", edge, `\${base}${sufixo}`],
      ] as const) {
        const bloco = fonte.slice(fonte.indexOf(marcador), fonte.indexOf(marcador) + 260);
        expect(bloco, `priority de ${rota} divergente em ${nome}`).toContain(`"${priority}"`);
        expect(bloco, `changefreq de ${rota} divergente em ${nome}`).toContain(`"${changefreq}"`);
      }
    },
  );

  it("as duas fontes usam o mesmo filtro de projetos e de conteúdos", () => {
    expect(script).toContain("projects?published=eq.true&visible=eq.true");
    expect(script).toContain("bewild_posts?published=eq.true");

    expect(edge).toMatch(/from\("projects"\)[\s\S]{0,200}?published["\s,:]+true/);
    expect(edge).toMatch(/from\("projects"\)[\s\S]{0,200}?visible["\s,:]+true/);
    expect(edge).toMatch(/from\("bewild_posts"\)[\s\S]{0,200}?published["\s,:]+true/);
  });

  it("projetos entram com 0.7 e conteúdos com 0.6 nas duas fontes", () => {
    for (const fonte of [script, edge]) {
      expect(fonte).toContain('"0.7"');
      expect(fonte).toContain('"0.6"');
    }
  });
});

describe("public/sitemap.xml commitado", () => {
  const xml = read("public/sitemap.xml");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  it("é XML bem formado e sem URL repetida", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml.trimEnd().endsWith("</urlset>")).toBe(true);
    expect(locs.length).toBeGreaterThan(100);
    expect(new Set(locs).size).toBe(locs.length);
  });

  it("traz as 7 rotas estáticas indexáveis, no domínio oficial", () => {
    for (const { path: rota } of ROTAS_INDEXAVEIS) {
      expect(locs).toContain(`https://bewild.com.br${rota === "/" ? "/" : rota}`);
    }
    expect(locs.every((l) => l.startsWith("https://bewild.com.br/"))).toBe(true);
  });

  it("não expõe admin, LPs de anúncio, 404 nem mockups", () => {
    for (const proibido of ["/admin", "/404", "/o", "/p", "/mockups", "/bakeoff", "/gpt-knowledge"]) {
      const vazando = locs.filter(
        (l) => l === `https://bewild.com.br${proibido}` || l.startsWith(`https://bewild.com.br${proibido}/`),
      );
      expect(vazando, `sitemap expõe ${proibido}`).toEqual([]);
    }
  });

  it("as rotas estáticas do sitemap existem no roteador da SPA", () => {
    const router = read("src/lib/useHashRoute.ts");
    for (const { path: rota } of ROTAS_INDEXAVEIS) {
      if (rota === "/") continue;
      expect(router, `rota ${rota} está no sitemap mas não no roteador`).toContain(
        `path === "${rota}"`,
      );
    }
  });
});
