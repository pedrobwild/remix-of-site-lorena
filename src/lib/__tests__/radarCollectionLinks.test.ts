import { expect, it } from "vitest";
import { linkRadarCollectionsInHtml } from "@/lib/radarCollectionLinks";

it.each(["short-stay-brooklin-ocupacao-diaria-airbnb", "melhor-bairro-investir-studio-sao-paulo", "studio-airbnb-pinheiros-quanto-rende"])("vincula a fonte de ADR no artigo conferido %s sem alterar valores", (slug) => {
  const block = '<p>Radar Bewild: diária média de R$ 359 no bairro.</p>';
  const result = linkRadarCollectionsInHtml(block + '<h2>Próxima seção</h2>', slug);
  expect(result.startsWith(block)).toBe(true);
  expect(result.indexOf('/coletas-por-bairro')).toBeLessThan(result.indexOf('<h2>'));
  expect(linkRadarCollectionsInHtml(result, slug)).toBe(result);
});
it("não vincula posts de custo nem menções ao Radar sem número de ADR", () => {
  const cost = '<p>Radar Bewild: diária média de R$ 359.</p>';
  expect(linkRadarCollectionsInHtml(cost, "quanto-custa-reformar-studio-20-m2-sao-paulo")).toBe(cost);
  const mention = '<p>Veja o Radar Bewild para conhecer bairros.</p>';
  expect(linkRadarCollectionsInHtml(mention, "studio-airbnb-pinheiros-quanto-rende")).toBe(mention);
});