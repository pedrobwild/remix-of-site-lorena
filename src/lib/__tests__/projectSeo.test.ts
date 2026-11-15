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
      "Península na Vila Madalena: reforma de 23 m² | Bewild",
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
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title).toBe("Apartamento completo na Vila Olímpia: reforma de apartamento");
  });

  it("não repete o bairro que já está no nome, com ou sem acento", () => {
    expect(projectSeoTitle({ title: "AL - NURBAN SANTA CECILIA", neighborhood: "Santa Cecília", area_m2: 26.12 })).toBe(
      "Nurban Santa Cecilia: reforma de 26,12 m² | Bewild",
    );
  });

  it("mantém nome próprio que termina no bairro ('Alto do Ipiranga')", () => {
    expect(projectSeoTitle({ title: "KC - VIVAZ PRIME ALTO DO IPIRANGA", neighborhood: "Ipiranga" })).toBe(
      "Vivaz Prime Alto do Ipiranga: reforma de apartamento",
    );
  });

  it("só tira o bairro do nome como palavra inteira e fora de nome próprio", () => {
    expect(projectSeoTitle({ title: "EDIFÍCIO SOLAPA", neighborhood: "Lapa" })).toBe(
      "Edifício Solapa na Lapa: reforma de apartamento | Bewild",
    );
    expect(projectSeoTitle({ title: "METROCASA JARDIM PAULISTA", neighborhood: "Paulista" })).toBe(
      "Metrocasa Jardim Paulista: reforma de apartamento | Bewild",
    );
  });

  // Teto de 60 desde 10/11/2026 (era 78): auditoria de SEO, rodada 4, ação 16.
  it("nunca passa de 60 caracteres nem corta palavra no meio; bairro e metragem ficam", () => {
    const title = projectSeoTitle({
      title: "LC - HIGHLIGHTS PINHEIROS",
      neighborhood: "Avenida Salgado Filho",
      status: "em_projeto",
      area_m2: 23.61,
    });
    expect(title).toBe("Highlights em Avenida Salgado Filho: projeto de 23,61 m²");
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it("'projeto de interiores de' é o primeiro a encurtar; sem bairro, 'em São Paulo' sai e o nome fica inteiro", () => {
    expect(
      projectSeoTitle({ title: "LM - LM URBAN FLEX FLATS BELA CINTRA", status: "em_projeto", area_m2: 21.3 }),
    ).toBe("Urban Flex Flats Bela Cintra: projeto de 21,3 m² | Bewild");
    // Quando cabe, a forma longa continua.
    expect(projectSeoTitle({ title: "BM - URBAN FLEX", neighborhood: "Consolação", status: "em_projeto", area_m2: 17.23 })).toBe(
      "Urban Flex na Consolação: projeto de interiores de 17,23 m²",
    );
  });

  it("ignora bairro sem letras (erro de cadastro) no título e na descrição", () => {
    const p = { title: "JC - EXALT IBIRAPUERA BY EZ", neighborhood: "31", area_m2: 31.58 };
    expect(projectSeoTitle(p)).toBe("Exalt Ibirapuera By Ez em São Paulo: reforma de 31,58 m²");
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
    ).toBe("Urban Flex na Consolação: projeto de interiores | Bewild");
    expect(
      projectSeoTitle({ title: "BM - URBAN FLEX", neighborhood: "Consolação", status: "em_projeto", area_m2: 17.23 }),
    ).toBe("Urban Flex na Consolação: projeto de interiores de 17,23 m²");
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

describe("projectSeoTitleUnique (irmãs do mesmo prédio, até 60 caracteres)", () => {
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

  it("irmãs sem dado que as separe são numeradas em ordem de cadastro, sem data e sem 'projeto N'", () => {
    const a = mk("a", "2026-08-25T00:51:00Z");
    const b = mk("b", "2026-09-25T21:20:00Z");
    expect(projectSeoTitleUnique(a, [a, b])).toBe("Zip no Brooklin: reforma de 25 m² (1) | Bewild");
    expect(projectSeoTitleUnique(b, [a, b])).toBe("Zip no Brooklin: reforma de 25 m² (2) | Bewild");
    expect(projectSeoTitleUnique(b, [a, b])).not.toContain("cadastro");
    expect(projectSeoTitleUnique(b, [a, b])).not.toContain("projeto 2");
  });

  it("o uso do imóvel no cadastro separa as irmãs antes de qualquer número", () => {
    const a = { ...mk("a", "2026-08-25T00:51:00Z"), project_type: "short_stay" };
    const b = { ...mk("b", "2026-09-25T21:20:00Z"), project_type: "turn_key" };
    expect(projectSeoTitleUnique(a, [a, b])).toBe("Zip no Brooklin: reforma de 25 m² para short stay | Bewild");
    expect(projectSeoTitleUnique(b, [a, b])).toBe("Zip no Brooklin: reforma de 25 m² turn-key | Bewild");
  });

  it("só as irmãs que não têm dado próprio são numeradas", () => {
    const a = { ...mk("a", "2026-08-25T00:51:00Z"), project_type: "short_stay" };
    const b = { ...mk("b", "2026-09-25T21:20:00Z"), project_type: "turn_key" };
    const c = { ...mk("c", "2026-09-26T21:20:00Z"), project_type: "turn_key" };
    const todos = [a, b, c];
    expect(todos.map((p) => projectSeoTitleUnique(p, todos))).toEqual([
      "Zip no Brooklin: reforma de 25 m² para short stay | Bewild",
      "Zip no Brooklin: reforma de 25 m² (1) | Bewild",
      "Zip no Brooklin: reforma de 25 m² (2) | Bewild",
    ]);
  });

  it("metragem diferente já separa: o título não muda", () => {
    const a = mk("a", "2026-08-25T00:51:00Z");
    const b = { ...mk("b", "2026-09-25T21:20:00Z"), area_m2: 28.21 };
    expect(projectSeoTitleUnique(a, [a, b])).toBe("Zip no Brooklin: reforma de 25 m² | Bewild");
    expect(projectSeoTitleUnique(b, [a, b])).toBe("Zip no Brooklin: reforma de 28,21 m² | Bewild");
  });

  it("título longo numerado corta o nome para caber em 60 com o número", () => {
    const long = (id: string, created_at: string) => ({
      id,
      title: "SB - SERGIPE BOUTIQUE APARTMENTS BY YOU",
      neighborhood: "Consolação",
      area_m2: 25,
      created_at,
    });
    const a = long("a", "2026-09-05T12:00:00Z");
    const b = long("b", "2026-09-06T12:00:00Z");
    const t = projectSeoTitleUnique(a, [a, b]);
    expect(t).toBe("Sergipe Boutique na Consolação: reforma de 25 m² (1)");
    expect(t.length).toBeLessThanOrEqual(60);
    expect(projectSeoTitleUnique(b, [a, b])).toBe("Sergipe Boutique na Consolação: reforma de 25 m² (2)");
  });

  it("irmãs com a mesma data são numeradas em ordem de cadastro", () => {
    const a = mk("a", "2026-09-05T12:00:00Z");
    const b = mk("b", "2026-09-05T15:00:00Z");
    expect(projectSeoTitleUnique(a, [a, b])).toBe("Zip no Brooklin: reforma de 25 m² (1) | Bewild");
    expect(projectSeoTitleUnique(b, [a, b])).toBe("Zip no Brooklin: reforma de 25 m² (2) | Bewild");
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

describe("brandTitle (marca só quando cabe em 60)", () => {
  it("curto ganha ' | Bewild', longo fica sem", () => {
    expect(projectSeoTitle({ title: "AB - PENÍNSULA", neighborhood: "Vila Madalena", area_m2: 23 })).toBe(
      "Península na Vila Madalena: reforma de 23 m² | Bewild",
    );
    const t = projectSeoTitle({ title: "PS - EDIFÍCIO FORTUNE RESIDENCE", neighborhood: "Cerqueira César", area_m2: 44.57 });
    expect(t).toBe("Edifício Fortune em Cerqueira César: reforma de 44,57 m²");
    expect(t.length).toBeLessThanOrEqual(60);
  });
});
