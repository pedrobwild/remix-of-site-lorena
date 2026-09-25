import { describe, it, expect } from "vitest";
import {
  AREA_M2_MAX,
  LEAD_OBJETIVOS,
  buildLeadMessage,
  deliveryParam,
  fieldErrorId,
  fieldErrorProps,
  firstInvalidField,
  isValidAreaM2,
  isValidEmail,
  leadOutcomeOf,
  parseAreaM2,
  resolveQrLeadAttribution,
  sanitizeAreaInput,
  touchAll,
} from "../leadForm";

describe("metragem — decimal de verdade (PUB-08)", () => {
  it("'32,5' vira 32.5, não 325", () => {
    expect(parseAreaM2("32,5")).toBe(32.5);
    expect(parseAreaM2("32.5")).toBe(32.5);
    expect(parseAreaM2(" 45 ")).toBe(45);
  });

  it("ponto seguido de três dígitos é milhar; vírgula é sempre decimal", () => {
    expect(parseAreaM2("1.200")).toBe(1200);
    expect(parseAreaM2("1,200")).toBe(1.2);
    expect(parseAreaM2("32.50")).toBe(32.5);
  });

  it("sem número → null", () => {
    expect(parseAreaM2("")).toBeNull();
    expect(parseAreaM2(",")).toBeNull();
    expect(parseAreaM2("m²")).toBeNull();
  });

  it("a máscara mantém só dígitos e UM separador", () => {
    expect(sanitizeAreaInput("32,5")).toBe("32,5");
    expect(sanitizeAreaInput("32,5,1")).toBe("32,51");
    expect(sanitizeAreaInput("32.5,")).toBe("32.5");
    expect(sanitizeAreaInput("aprox. 32 m²")).toBe("32");
    expect(sanitizeAreaInput(",5")).toBe("5");
    expect(sanitizeAreaInput("12345678")).toBe("1234567");
  });

  it("faixa plausível: maior que zero e até o teto", () => {
    expect(isValidAreaM2(32.5)).toBe(true);
    expect(isValidAreaM2(AREA_M2_MAX)).toBe(true);
    expect(isValidAreaM2(AREA_M2_MAX + 1)).toBe(false);
    expect(isValidAreaM2(0)).toBe(false);
    expect(isValidAreaM2(null)).toBe(false);
  });
});

describe("isValidEmail — mesma regra do servidor", () => {
  it("aceita e-mail comum (com espaços em volta)", () => {
    expect(isValidEmail("ana@exemplo.com")).toBe(true);
    expect(isValidEmail("  ana@exemplo.com.br ")).toBe(true);
  });

  it("recusa o que a função recusaria", () => {
    expect(isValidEmail("joao@gmail.c")).toBe(false);
    expect(isValidEmail("joao@gmail")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("buildLeadMessage", () => {
  it("lista só os campos preenchidos, aparados, e o rodapé", () => {
    expect(
      buildLeadMessage(
        "Olá!",
        [
          ["Nome", "  Ana "],
          ["E-mail", ""],
          ["Bairro", null],
          ["Metragem (m²)", "32,5"],
        ],
        "(origem: panfleto)",
      ),
    ).toBe("Olá!\nNome: Ana\nMetragem (m²): 32,5\n(origem: panfleto)");
  });
});

describe("resultado do envio", () => {
  it("entregue, falha e timeout são estados distintos", () => {
    expect(leadOutcomeOf({ delivered: true, timedOut: false })).toBe("delivered");
    expect(leadOutcomeOf({ delivered: false, timedOut: false })).toBe("failed");
    expect(leadOutcomeOf({ delivered: false, timedOut: true })).toBe("timedOut");
  });

  it("parâmetro GA4 `delivery`", () => {
    expect(deliveryParam("delivered")).toBe("confirmed");
    expect(deliveryParam("failed")).toBe("failed");
    expect(deliveryParam("timedOut")).toBe("timeout");
  });
});

describe("resolveQrLeadAttribution — /o e /p", () => {
  const defaults = { utm_source: "qr", utm_medium: "placa", utm_campaign: "obra-placa" };
  const base = { referrer: "", referrerHost: null, landingPath: null, currentPath: "/o" };

  it("sem UTM na URL usa o padrão da peça impressa", () => {
    expect(resolveQrLeadAttribution({ ...base, search: "?bairro=Pinheiros" }, defaults)).toEqual({
      utm_source: "qr",
      utm_medium: "placa",
      utm_campaign: "obra-placa",
      utm_term: null,
      utm_content: null,
      first_utm_source: null,
      first_utm_medium: null,
      first_utm_campaign: null,
      gclid: null,
      fbclid: null,
      referrer: null,
      landing_path: "/o",
    });
  });

  it("clique de anúncio só da URL do QR (nada guardado de outra visita)", () => {
    const a = resolveQrLeadAttribution({ ...base, search: "?gclid=Cj0abc&utm_content=verso" }, defaults);
    expect(a.gclid).toBe("Cj0abc");
    expect(a.fbclid).toBeNull();
    expect(a.utm_content).toBe("verso");
    expect(a.first_utm_source).toBeNull();
  });

  it("a campanha do QR sobrescreve campo a campo", () => {
    const a = resolveQrLeadAttribution({ ...base, search: "?utm_campaign=obra-pinheiros" }, defaults);
    expect(a.utm_source).toBe("qr");
    expect(a.utm_medium).toBe("placa");
    expect(a.utm_campaign).toBe("obra-pinheiros");
  });

  it("mantém a página de entrada da sessão e o referrer", () => {
    const a = resolveQrLeadAttribution(
      { ...base, search: "", landingPath: "/o?bairro=Itaim", referrerHost: "l.instagram.com" },
      defaults,
    );
    expect(a.landing_path).toBe("/o?bairro=Itaim");
    expect(a.referrer).toBe("l.instagram.com");
  });
});

describe("validação acessível", () => {
  it("firstInvalidField segue a ordem visual", () => {
    expect(firstInvalidField(["nome", "whats", "email"], { email: "x", whats: "y" })).toBe("whats");
    expect(firstInvalidField(["nome", "whats"], {})).toBeNull();
  });

  it("fieldErrorProps associa o erro ao campo", () => {
    expect(fieldErrorProps("ct-nome", "Informe seu nome.")).toEqual({
      "aria-invalid": true,
      "aria-describedby": fieldErrorId("ct-nome"),
    });
    expect(fieldErrorProps("ct-nome", undefined)).toEqual({});
  });

  it("touchAll marca todos os campos", () => {
    expect(touchAll(["a", "b"])).toEqual({ a: true, b: true });
  });
});

describe("valores canônicos do CRM", () => {
  it("objetivos iguais aos de /diagnostico", () => {
    expect(LEAD_OBJETIVOS).toEqual([
      "Short stay",
      "Locação tradicional",
      "Uso misto",
      "Moradia",
      "Ainda avaliando",
    ]);
  });
});
