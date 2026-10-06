import { describe, it, expect } from "vitest";
import {
  projectFriendlyName,
  projectMetaDescription,
  projectSeoTitle,
  projectSeoTitleUnique,
} from "../projectSeo";

const FALLBACK = "texto genérico";

describe("projectMetaDescription", () => {
  it("preserva textos personalizados e acrescenta o contexto local quando necessário", () => {
    expect(projectMetaDescription({ seo_description: "  Desc própria " }, FALLBACK)).toBe(
      "Desc própria Reforma de apartamento em São Paulo pela Bewild, com entrega do apartamento pronto para morar ou rentabilizar.",
    );
    expect(projectMetaDescription({ summary: "Reforma de apartamento em São Paulo com entrega completa." }, FALLBACK)).toBe(
      "Reforma de apartamento em São Paulo com entrega completa.",
    );
  });

  it("monta a frase com tipo, metragem e bairro reais", () => {
    expect(
      projectMetaDescription({ project_type: "short_stay", area_m2: 22, neighborhood: "Pinheiros" }, FALLBACK),
    ).toBe(
      "Apartamento pronto para short stay de 22 m² em Pinheiros, São Paulo-SP. Projeto, obra e marcenaria integrados pela Bewild.",
    );
  });

  it("omite o que não está preenchido (só bairro, só metragem)", () => {
    expect(projectMetaDescription({ neighborhood: "Moema" }, FALLBACK)).toBe(
      "Apartamento pronto após reforma completa em Moema, São Paulo-SP. Projeto, obra e marcenaria integrados pela Bewild.",
    );
    expect(projectMetaDescription({ area_m2: 30.4 }, FALLBACK)).toBe(
      "Apartamento pronto após reforma completa de 30,4 m². Projeto, obra e marcenaria integrados pela Bewild.",
    );
  });

  it("volta ao fallback quando não há dado nenhum (não inventa)", () => {
    expect(projectMetaDescription({ neighborhood: "  ", area_m2: null }, FALLBACK)).toBe(
      `${FALLBACK} Reforma de apartamento em São Paulo pela Bewild, com entrega do apartamento pronto para morar ou rentabilizar.`,
    );
    expect(projectMetaDescription(null, FALLBACK)).toBe(FALLBACK);
  });

  it("gera descrições diferentes para projetos diferentes", () => {
    const a = projectMetaDescription({ neighborhood: "Brooklin", area_m2: 25 }, FALLBACK);
    const b = projectMetaDescription({ neighborhood: "Perdizes", area_m2: 25 }, FALLBACK);
    expect(a).not.toBe(b);
  });
});

describe("projectSeoTitle", () => {
  it("põe o nome do prédio na frente, depois o bairro e a metragem", () => {
    expect(projectSeoTitle({ title: "AB - PENÍNSULA VILA MADALENA", neighborhood: "Vila Madalena", area_m2: 23 })).toBe(
      "Península em Vila Madalena: reforma de 23 m² | Bewild",
    );
    expect(projectSeoTitle({ title: "AB - THE COLLECTION MOEMA", neighborhood: "Moema", area_m2: 28.21 })).toBe(
      "The Collection em Moema: reforma de 28,21 m² | Bewild",
    );
  });

  it("não abre com 'Reforma de apartamento': essa busca é da página do bairro", () => {
    const title = projectSeoTitle({ title: "CS - LATITUDE CAMPO BELO", neighborhood: "Campo Belo", area_m2: 26.42 });
    expect(title.startsWith("Reforma de apartamento")).toBe(false);
    expect(title.startsWith("Latitude")).toBe(true);
  });

  it("remove o código interno do negócio do nome", () => {
    const title = projectSeoTitle({ title: "SX - GO BALKON" });
    expect(title).toBe("Go Balkon em São Paulo: reforma de apartamento | Bewild");
    expect(title).not.toContain("SX -");
  });

  it("ignora o seo_title gerado com o código e respeita o escrito à mão", () => {
    expect(projectSeoTitle({ seo_title: "Reforma de apartamento em São Paulo | Bewild" })).toBe(
      "Reforma de apartamento em São Paulo | Bewild",
    );
    expect(
      projectSeoTitle({ seo_title: "SX - GO BALKON | Reforma, São Paulo | Bewild", title: "SX - GO BALKON" }),
    ).toBe("Go Balkon em São Paulo: reforma de apartamento | Bewild");
  });

  it("limita o tamanho cortando o nome, sem perder o bairro", () => {
    const title = projectSeoTitle({
      title: "Apartamento completo no empreendimento mais desejado da Vila Olímpia",
      neighborhood: "Vila Olímpia",
    });
    expect(title.length).toBeLessThanOrEqual(78);
    expect(title).toBe("Apartamento completo em Vila Olímpia: reforma de apartamento | Bewild");
  });

  it("não repete o bairro que já está no nome, com ou sem acento", () => {
    expect(projectSeoTitle({ title: "AL - NURBAN SANTA CECILIA", neighborhood: "Santa Cecília", area_m2: 26.12 })).toBe(
      "Nurban Santa Cecilia: reforma de 26,12 m² | Bewild",
    );
  });

  it("mantém nome próprio que termina no bairro ('Alto do Ipiranga')", () => {
    expect(projectSeoTitle({ title: "KC - VIVAZ PRIME ALTO DO IPIRANGA", neighborhood: "Ipiranga" })).toBe(
      "Vivaz Prime Alto do Ipiranga: reforma de apartamento | Bewild",
    );
  });

  it("só tira o bairro do nome como palavra inteira e fora de nome próprio", () => {
    expect(projectSeoTitle({ title: "EDIFÍCIO SOLAPA", neighborhood: "Lapa" })).toBe(
      "Edifício Solapa em Lapa: reforma de apartamento | Bewild",
    );
    expect(projectSeoTitle({ title: "METROCASA JARDIM PAULISTA", neighborhood: "Paulista" })).toBe(
      "Metrocasa Jardim Paulista: reforma de apartamento | Bewild",
    );
  });

  it("nunca passa de 78 caracteres nem corta palavra no meio", () => {
    const title = projectSeoTitle({
      title: "LC - HIGHLIGHTS PINHEIROS",
      neighborhood: "Avenida Salgado Filho",
      status: "em_projeto",
      area_m2: 23.61,
    });
    expect(title).toBe("Highlights Pinheiros em Avenida Salgado Filho: projeto de interiores | Bewild");
    expect(title.length).toBeLessThanOrEqual(78);
  });

  it("sem bairro, o nome longo fica inteiro e 'em São Paulo' sai", () => {
    expect(
      projectSeoTitle({ title: "LM - LM URBAN FLEX FLATS BELA CINTRA", status: "em_projeto", area_m2: 21.3 }),
    ).toBe("Urban Flex Flats Bela Cintra: projeto de interiores de 21,3 m² | Bewild");
  });

  it("ignora bairro sem letras (erro de cadastro) no título e na descrição", () => {
    const p = { title: "JC - EXALT IBIRAPUERA BY EZ", neighborhood: "31", area_m2: 31.58 };
    expect(projectSeoTitle(p)).toBe("Exalt Ibirapuera By Ez em São Paulo: reforma de 31,58 m² | Bewild");
    expect(projectMetaDescription(p, FALLBACK)).not.toContain("em 31");
  });

  it("gera títulos diferentes para projetos diferentes no mesmo bairro", () => {
    const a = projectSeoTitle({ title: "AB - MODERN CAMPO BELO", neighborhood: "Campo Belo" });
    const b = projectSeoTitle({ title: "TB - LATITUDE CAMPO BELO", neighborhood: "Campo Belo" });
    expect(a).not.toBe(b);
  });
});

describe("fase do projeto e tamanho da descrição", () => {
  it("projeto em desenvolvimento não vira 'reforma' no título", () => {
    expect(
      projectSeoTitle({ title: "BM - URBAN FLEX", neighborhood: "Consolação", status: "em_projeto" }),
    ).toBe("Urban Flex em Consolação: projeto de interiores | Bewild");
    expect(
      projectSeoTitle({ title: "BM - URBAN FLEX", neighborhood: "Consolação", status: "em_projeto", area_m2: 17.23 }),
    ).toBe("Urban Flex em Consolação: projeto de interiores de 17,23 m² | Bewild");
  });

  it("obra em andamento aparece como tal; entregue segue como reforma", () => {
    expect(projectSeoTitle({ title: "X - ALFA", neighborhood: "Moema", status: "em_obra" })).toBe(
      "Alfa em Moema: reforma de apartamento em obra | Bewild",
    );
    expect(projectSeoTitle({ title: "X - ALFA", neighborhood: "Moema", status: "entregue" })).toBe(
      "Alfa em Moema: reforma de apartamento | Bewild",
    );
  });

  it("descrição longa é cortada em até 160 caracteres, sem palavra pela metade", () => {
    const long = "Apartamento reformado em São Paulo pela Bewild. " + "palavra ".repeat(40);
    const out = projectMetaDescription({ seo_description: long }, FALLBACK);
    expect(out.length).toBeLessThanOrEqual(161);
    expect(out.endsWith("palavr")).toBe(false);
  });
});

describe("projectSeoTitleUnique (data de cadastro só onde ajuda)", () => {
  const mk = (id: string, created_at: string) => ({
    id,
    title: "ZP - ZIP",
    neighborhood: "Brooklin",
    area_m2: 25,
    created_at,
  });

  it("título único não muda", () => {
    const a = mk("a", "2026-08-25T00:51:00Z");
    const b = { ...mk("b", "2026-09-25T21:20:00Z"), title: "XX - OUTRO" };
    expect(projectSeoTitleUnique(a, [a, b])).toBe(projectSeoTitle(a));
  });

  it("repetido com datas diferentes ganha a data (fuso de São Paulo)", () => {
    const a = mk("a", "2026-08-25T00:51:00Z"); // 24/08 21:51 em SP
    const b = mk("b", "2026-09-25T21:20:00Z");
    expect(projectSeoTitleUnique(a, [a, b])).toBe(
      "Zip em Brooklin: reforma de 25 m² (cadastro 24/08/2026) | Bewild",
    );
    expect(projectSeoTitleUnique(b, [a, b])).toContain("(cadastro 25/09/2026)");
  });

  it("irmãs com a mesma data são numeradas em ordem de cadastro", () => {
    const a = mk("a", "2026-09-05T12:00:00Z");
    const b = mk("b", "2026-09-05T15:00:00Z");
    expect(projectSeoTitleUnique(a, [a, b])).toBe("Zip em Brooklin: reforma de 25 m² (projeto 1) | Bewild");
    expect(projectSeoTitleUnique(b, [a, b])).toBe("Zip em Brooklin: reforma de 25 m² (projeto 2) | Bewild");
  });

  it("sem data de cadastro numera em vez de repetir o título", () => {
    const a = { ...mk("a", ""), created_at: null };
    const b = mk("b", "2026-09-25T21:20:00Z");
    expect(projectSeoTitleUnique(a, [a, b])).not.toBe(projectSeoTitleUnique(b, [a, b]));
  });
});

describe("projectFriendlyName", () => {
  it("capitaliza o nome em caixa alta e mantém siglas sem vogal", () => {
    expect(projectFriendlyName({ title: "LB - GALERIA SP" })).toBe("Galeria SP");
    expect(projectFriendlyName({ title: "FF - MERCURE JK" })).toBe("Mercure JK");
    expect(projectFriendlyName({ title: "GF - PJM SINGLE LIVING" })).toBe("PJM Single Living");
    expect(projectFriendlyName({ title: "KC - VIVAZ PRIME ALTO DO IPIRANGA" })).toBe("Vivaz Prime Alto do Ipiranga");
    expect(projectFriendlyName({ title: "AG - YBY" })).toBe("Yby");
  });

  it("tira o código repetido no começo do nome ('LM - LM …')", () => {
    expect(projectFriendlyName({ title: "LM - LM URBAN FLEX FLATS BELA CINTRA" })).toBe("Urban Flex Flats Bela Cintra");
    expect(projectFriendlyName({ title: "AB - ABC TOWER" })).toBe("Abc Tower");
  });
});
