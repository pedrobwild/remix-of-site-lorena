/**
 * /guia-do-investidor faz 301 para o Radar: link interno para ele prende o
 * visitante no "Voltar". Todo link vai direto para RADAR_URL em nova aba.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { HOME_BWA_HTML } from "@/pages/home-bwa-body";
import { RADAR_LINK_ATTRS, RADAR_URL } from "@/config/site";
import { rewriteGuiaLinksInHtml, toRadarHref } from "@/lib/radarLinks";
import { safeKbActions } from "@/lib/assistant/assistantEngine";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === "__tests__" ? [] : files(p);
    return /\.(tsx?|html|md)$/.test(n) ? [p] : [];
  });
}

const PADRAO = /href=\\?["']\/guia-do-investidor/;

describe("links para o guia do investidor", () => {
  it("nenhum arquivo em src/ tem href=\"/guia-do-investidor\"", () => {
    const culpados = files("src").filter((f) => PADRAO.test(readFileSync(f, "utf8")));
    expect(culpados).toEqual([]);
  });

  it("a home não tem href=\"/guia-do-investidor\" e abre o Radar em nova aba", () => {
    expect(HOME_BWA_HTML).not.toMatch(PADRAO);
    expect(HOME_BWA_HTML).toContain(`href="${RADAR_URL}" target="_blank" rel="noopener"`);
  });

  it("o link do Radar não usa noreferrer", () => {
    expect(RADAR_LINK_ATTRS.rel).toBe("noopener");
    expect(RADAR_LINK_ATTRS.target).toBe("_blank");
  });

  it("a constante da rota antiga só é usada pela própria rota, pelo roteador e pelo guia", () => {
    const permitidos = [/^src\/routes\/guia-do-investidor\.tsx$/, /^src\/lib\/useHashRoute\.ts$/, /^src\/guia\//, /^src\/pages\/GuiaInvestidorPage\.tsx$/];
    const usa = /routes\.guiaDoInvestidor|\bGUIA_PATH\b|["'`]\/guia-do-investidor["'`]/;
    const culpados = files("src")
      .map((f) => f.replace(/\\/g, "/"))
      .filter((f) => !permitidos.some((r) => r.test(f)))
      .filter((f) => {
        const txt = readFileSync(f, "utf8");
        if (!usa.test(txt)) return false;
        // Mapas de caminho (SEO, CSS, analytics) podem citar o endereço; link não.
        return /href=\{[^}]*(routes\.guiaDoInvestidor|GUIA_PATH)|to=\{?["'`]?\/guia-do-investidor|navigate\(\s*["'`]\/guia-do-investidor|location\.href\s*=\s*["'`]\/guia-do-investidor/.test(txt);
      });
    expect(culpados).toEqual([]);
  });

  it("links do banco para /guia-do-investidor viram Radar (assistente, FAQ e artigos)", () => {
    expect(toRadarHref("/guia-do-investidor")).toBe(RADAR_URL);
    expect(toRadarHref("https://bewild.com.br/guia-do-investidor#faq")).toBe(RADAR_URL);
    expect(toRadarHref("/faq")).toBe("/faq");
    const acoes = safeKbActions([{ tipo: "link", rotulo: "Ver o guia do investidor", url: "/guia-do-investidor" }]);
    expect(acoes[0]).toMatchObject({ url: RADAR_URL });
    const html = rewriteGuiaLinksInHtml('<p><a href="/guia-do-investidor">guia</a> e <a href="/faq">faq</a></p>');
    expect(html).not.toMatch(PADRAO);
    expect(html).toContain(`href="${RADAR_URL}" target="_blank" rel="noopener"`);
    expect(html).toContain("(abre em nova aba)");
    expect(html).toContain('<a href="/faq">faq</a>');
  });
});
