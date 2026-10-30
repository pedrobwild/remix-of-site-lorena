/**
 * Core Web Vitals no celular (PageSpeed de 30/10/2026: LCP 2,6 s no
 * laboratório, 4,4 s no campo). Guardas das correções:
 *  - a foto do hero (LCP) é pré-carregada no TOPO do <head>, antes das
 *    folhas e dos `modulepreload`;
 *  - a folha da página 404 (post.css) não entra no CSS do root, que toda
 *    página baixa antes de pintar;
 *  - o CSS adiado da home ganha `media` no HomePage se o `onload` não rodar;
 *  - o botão "Dúvidas" sobe por `transform`, não animando `bottom` (CLS).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { preload } from "react-dom";
import { renderToString } from "react-dom/server";
import { HERO_MOBILE_MEDIA, preloadHomeHero } from "@/content/homeHero";

const ROOT = path.resolve(__dirname, "../..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

describe("preload da foto do hero (LCP)", () => {
  it("pede as duas versões com prioridade alta, cada uma na sua faixa de largura", () => {
    const calls: [string, Record<string, unknown>][] = [];
    preloadHomeHero((href, options) => calls.push([href, options]));
    expect(calls).toHaveLength(2);
    const [mobile, desktop] = calls;
    expect(mobile[1]).toMatchObject({ as: "image", type: "image/webp", media: HERO_MOBILE_MEDIA, fetchPriority: "high" });
    expect(desktop[1]).toMatchObject({ as: "image", fetchPriority: "high", media: `not all and ${HERO_MOBILE_MEDIA}` });
    expect(String(desktop[1].imageSrcSet)).toMatch(/960w.*1440w.*1920w/);
  });

  it("no HTML do servidor, o React escreve o preload antes das folhas de estilo e dos scripts", () => {
    function Page() {
      // Nos testes o import das imagens vem como texto vazio: URLs de exemplo.
      preloadHomeHero((_href, options) =>
        preload(options.imageSrcSet ? "/assets/hero-desktop.webp" : "/assets/hero-828.webp", options),
      );
      return (
        <html lang="pt-BR">
          <head>
            <link rel="stylesheet" href="/assets/styles.css" precedence="default" />
            <link rel="modulepreload" href="/assets/index.js" />
          </head>
          <body>
            <p>Home</p>
          </body>
        </html>
      );
    }
    const html = renderToString(<Page />);
    const hero = html.indexOf('rel="preload"');
    expect(hero).toBeGreaterThan(-1);
    expect(html.slice(hero, html.indexOf(">", hero))).toContain('fetchPriority="high"');
    expect(hero).toBeLessThan(html.indexOf('rel="stylesheet"'));
    expect(hero).toBeLessThan(html.indexOf('rel="modulepreload"'));
  });

  it("o HomePage chama o preload no render (não num efeito) e a rota '/' não repete o preload no head", () => {
    const page = read("src/pages/HomePage.tsx");
    const body = page.slice(page.indexOf("export default function HomePage"));
    expect(body.indexOf("preloadHomeHero(preload)")).toBeGreaterThan(-1);
    expect(body.indexOf("preloadHomeHero(preload)")).toBeLessThan(body.indexOf("useEffect("));
    expect(read("src/routes/index.tsx")).not.toMatch(/as: "image"/);
  });
});

describe("CSS do root (baixado por toda página antes de pintar)", () => {
  it("a página 404 carrega post.css por preinit a partir de ?url, não por import de CSS", () => {
    const notFound = read("src/pages/NotFoundPage.tsx");
    expect(notFound).not.toMatch(/^import\s+["'][^"']+\.css["'];?/m);
    expect(notFound).toMatch(/from "@\/styles\/post\.css\?url"/);
    // `preinit`, não `<link precedence>`: no navegador o <link> suspende a troca
    // esqueleto → 404 de /reforma/:slug e /portfolio/:slug (página em branco).
    expect(notFound).toMatch(/preinit\(postCssUrl, \{ as: "style", precedence:/);
    expect(notFound).not.toMatch(/<link[^>]*href=\{postCssUrl\}/);
    // O root importa a 404 de forma estática; ele próprio só referencia CSS por ?url.
    expect(read("src/routes/__root.tsx")).not.toMatch(/^import\s+["'][^"']+\.css["'];?/m);
  });
});

describe("botão Dúvidas (site-assistant.css)", () => {
  it("sobe acima do banner por transform; `bottom` não é animado (cada passo contava como CLS)", () => {
    const css = read("src/components/assistant/site-assistant.css");
    expect(css).not.toMatch(/transition:[^;]*\bbottom\b/);
    const launcherRules = css.match(/\.bwas-launcher\s*\{[^}]*\}/g) ?? [];
    const withOffset = launcherRules.filter((r) => r.includes("--bwas-offset"));
    expect(withOffset.length).toBeGreaterThanOrEqual(2); // desktop e celular
    for (const rule of withOffset) {
      expect(rule).toMatch(/transform:\s*translateY\(/);
      expect(rule).not.toMatch(/bottom:[^;]*--bwas-offset/);
    }
  });
});

describe("CSS adiado da home: rede de segurança sem o onload", () => {
  it("o HomePage troca media=print pela faixa do celular ao montar", () => {
    const page = read("src/pages/HomePage.tsx");
    expect(page).toMatch(/link\[data-bwa-deferred\]\[media="print"\]/);
    expect(page).toMatch(/link\.media = HOME_DEFERRED_ASYNC_MEDIA/);
  });
});
