/**
 * /guia-do-investidor faz 301 para o Radar: link interno para ele prende o
 * visitante no "Voltar". Todo link vai direto para RADAR_URL em nova aba.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { HOME_BWA_HTML } from "@/pages/home-bwa-body";
import { RADAR_LINK_ATTRS, RADAR_URL } from "@/config/site";

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
});
