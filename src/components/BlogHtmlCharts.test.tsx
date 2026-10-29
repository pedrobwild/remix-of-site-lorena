import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BlogArticleBody, BlogHtmlChart, chartPercent } from "./BlogHtmlCharts";
import { CHAVES_ASSET_PATH, CHAVES_SLUG, chavesCharts, chavesChartKeyFromUrl } from "@/content/chavesCharts";

describe("gráficos HTML do artigo das chaves", () => {
  it("preserva as contagens dos 84 pedidos e os percentuais fornecidos", () => {
    expect(chavesCharts.pedidos.rows.map((row) => row.count)).toEqual([40, 29, 15]);
    expect(chavesCharts.pedidos.rows.reduce((total, row) => total + row.count, 0)).toBe(84);
    expect(chavesCharts.objetivos.rows[0].percentages).toEqual([75, 12, 8, 5, 0]);
    expect(chartPercent(40, 84)).toBe(48);
    expect(chavesCharts.pedidos.missing).toBe(31);
  });
  it("identifica as duas versões dos seis gráficos sem substituir outras imagens", () => {
    for (const [key, chart] of Object.entries(chavesCharts)) {
      expect(chavesChartKeyFromUrl(`${CHAVES_ASSET_PATH}${chart.id}.svg`)).toBe(key);
      expect(chavesChartKeyFromUrl(`${CHAVES_ASSET_PATH}${chart.id}-m.svg`)).toBe(key);
    }
    expect(chavesChartKeyFromUrl("/images/outra.svg")).toBeUndefined();
  });
  it("renderiza os seis gráficos no servidor", () => {
    for (const key of Object.keys(chavesCharts) as (keyof typeof chavesCharts)[]) {
      const html = renderToStaticMarkup(<BlogHtmlChart chartKey={key} />);
      expect(html).toContain(`data-chart="${chavesCharts[key].id}"`);
      expect(html).not.toContain("<svg");
    }
  });
  it("substitui um picture por um único gráfico, preservando o texto e outras imagens", () => {
    const html = `<h2 id="teste">Texto</h2><p>Antes</p><picture><source srcset="${CHAVES_ASSET_PATH}01-momento-do-pedido-m.svg"/><img src="${CHAVES_ASSET_PATH}01-momento-do-pedido.svg"/></picture><p>Depois</p><img src="/outra.jpg"/>`;
    const rendered = renderToStaticMarkup(<BlogArticleBody html={html} slug={CHAVES_SLUG} />);
    expect(rendered.match(/data-chart=/g)).toHaveLength(1);
    expect(rendered).toContain("<p>Antes</p>");
    expect(rendered).toContain("<p>Depois</p>");
    expect(rendered).toContain('/outra.jpg');
    expect(renderToStaticMarkup(<BlogArticleBody html={html} slug="outro" />)).toContain("<picture>");
  });
});