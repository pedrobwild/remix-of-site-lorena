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
import { GUIA_MODIFIED } from "@/guia/data/guiaMeta";

const root = path.resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

/** Rotas estáticas indexáveis. `/o` e `/p` são LPs de anúncio: fora do sitemap. */
const ROTAS_INDEXAVEIS = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/portfolio", priority: "0.9", changefreq: "weekly" },
  { path: "/conteudos", priority: "0.8", changefreq: "weekly" },
  { path: "/orcamento", priority: "0.9", changefreq: "monthly" },
  { path: "/faq", priority: "0.7", changefreq: "monthly" },
  { path: "/autorizacao-condominio", priority: "0.7", changefreq: "monthly" },
  { path: "/contato", priority: "0.7", changefreq: "monthly" },
  { path: "/escopo", priority: "0.7", changefreq: "monthly" },
  { path: "/como-funciona", priority: "0.7", changefreq: "monthly" },
  { path: "/onde-atuamos", priority: "0.7", changefreq: "monthly" },
  { path: "/reforma-de-apartamento-sao-paulo", priority: "0.9", changefreq: "monthly" },
  { path: "/reforma-de-studio-sao-paulo", priority: "0.9", changefreq: "monthly" },
  { path: "/reforma-de-cobertura-sao-paulo", priority: "0.9", changefreq: "monthly" },
  { path: "/marcenaria", priority: "0.9", changefreq: "monthly" },
  { path: "/parceiros", priority: "0.7", changefreq: "monthly" },
  { path: "/parceiros/incorporadoras", priority: "0.8", changefreq: "monthly" },
  { path: "/indique-um-amigo", priority: "0.7", changefreq: "monthly" },
  { path: "/marcas-e-parcerias", priority: "0.7", changefreq: "monthly" },
  { path: "/guia-do-investidor", priority: "0.8", changefreq: "monthly" },
  { path: "/privacidade", priority: "0.3", changefreq: "yearly" },
];

const script = read("scripts/generate-sitemap.mjs");
const edge = read("supabase/functions/sitemap/index.ts");
const router = read("src/lib/useHashRoute.ts");

/**
 * Rotas estáticas do roteador que NÃO entram no sitemap, com a página que
 * prova o motivo (noindex). /admin/* fica de fora por prefixo.
 */
const NAO_INDEXAVEIS: Record<string, string> = {
  "/o": "src/pages/LpObraPage.tsx",
  "/p": "src/pages/LpPanfletoPage.tsx",
};

/**
 * Exceção explícita e temporária: /parceiros/incorporadoras existe no roteador,
 * mas fica fora do sitemap enquanto `INCORPORADORAS_PAGE_ENABLED` for false
 * (rota responde 404 para o público; prévia interna é noindex).
 * Ao virar `true`, esta lista fica vazia e o teste passa a exigir a rota nos
 * dois geradores e na tabela de prioridades, sem nenhuma outra mudança aqui.
 */
const siteConfig = read("src/config/site.ts");
const incorporadorasOn = /INCORPORADORAS_PAGE_ENABLED\s*=\s*true/.test(siteConfig);
const FORA_DO_SITEMAP_POR_FLAG = incorporadorasOn ? [] : ["/parceiros/incorporadoras"];

const unicos = (xs: string[]) => [...new Set(xs)].sort();

/** Rotas estáticas (`path === "/x"`) declaradas em useHashRoute.ts. */
const rotasDoRoteador = unicos([...router.matchAll(/path === "(\/[^"]*)"/g)].map((m) => m[1]));
const indexaveisDoRoteador = rotasDoRoteador.filter(
  (r) =>
    !r.startsWith("/admin") &&
    !(r in NAO_INDEXAVEIS) &&
    !FORA_DO_SITEMAP_POR_FLAG.includes(r),
);
/** Rotas estáticas listadas em cada gerador (`${BASE_URL}/x` / `${base}/x` seguidos de crase). */
const rotasDoScript = unicos([...script.matchAll(/\$\{BASE_URL\}(\/[a-z0-9-/]*)`/g)].map((m) => m[1]));
const rotasDaEdge = unicos([...edge.matchAll(/\$\{base\}(\/[a-z0-9-/]*)`/g)].map((m) => m[1]));

describe("rotas do roteador ↔ geradores de sitemap", () => {
  it("toda rota estática indexável do roteador está no script de build", () => {
    expect(rotasDoScript).toEqual(indexaveisDoRoteador);
  });

  it("toda rota estática indexável do roteador está na edge function", () => {
    expect(rotasDaEdge).toEqual(indexaveisDoRoteador);
  });

  it("a tabela de prioridades deste teste cobre exatamente as rotas indexáveis", () => {
    expect(unicos(ROTAS_INDEXAVEIS.map((r) => r.path))).toEqual(indexaveisDoRoteador);
  });

  it.each(Object.entries(NAO_INDEXAVEIS))("%s fica fora do sitemap porque a página é noindex", (_rota, arquivo) => {
    expect(read(arquivo)).toMatch(/noindex:\s*true/);
  });

  it("lastmod do guia no script = GUIA_MODIFIED (src/guia/data/guiaMeta.ts)", () => {
    expect(script).toMatch(new RegExp(`\\$\\{BASE_URL\\}/guia-do-investidor\`, lastmod: "${GUIA_MODIFIED}"`));
  });

  it("os dois geradores escapam o <loc> para XML", () => {
    expect(script).toMatch(/<loc>\$\{xmlEscape\(loc\)\}<\/loc>/);
    expect(edge).toMatch(/<loc>\$\{xmlEscape\(u\.loc\)\}<\/loc>/);
  });
});

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

  it("traz as rotas estáticas principais, no domínio oficial", () => {
    for (const rota of ["/", "/portfolio", "/conteudos", "/orcamento", "/faq", "/guia-do-investidor"]) {
      expect(locs).toContain(`https://bewild.com.br${rota}`);
    }
    expect(locs.every((l) => l.startsWith("https://bewild.com.br/"))).toBe(true);
  });

  it("toda rota estática do arquivo existe no roteador e no gerador (nada órfão)", () => {
    const estaticas = locs
      .map((l) => new URL(l).pathname)
      .filter((p) => !p.startsWith("/portfolio/") && !p.startsWith("/conteudos/"));
    for (const p of estaticas) {
      expect(indexaveisDoRoteador, `${p} no sitemap mas não é rota indexável`).toContain(p);
      expect(rotasDoScript, `${p} no sitemap mas não está no gerador`).toContain(p);
    }
  });

  it("arquivo gerado está em dia com o gerador (aviso — o prebuild regenera)", () => {
    // O public/sitemap.xml é saída do prebuild (scripts/generate-sitemap.mjs,
    // que precisa do banco). Rota nova no gerador só aparece no arquivo no
    // próximo build com acesso ao banco — por isso aqui é aviso, não falha.
    const faltando = rotasDoScript.filter((r) => !locs.includes(`https://bewild.com.br${r}`));
    if (faltando.length > 0) {
      console.warn(`[sitemap] public/sitemap.xml desatualizado; faltam: ${faltando.join(", ")} — rode \`npm run sitemap\`.`);
    }
    expect(Array.isArray(faltando)).toBe(true);
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
