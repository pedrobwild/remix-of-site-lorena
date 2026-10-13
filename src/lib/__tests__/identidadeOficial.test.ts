/**
 * SEO-11 — trava os dados oficiais da Bewild publicados como identidade.
 *
 * Contexto: `organizationJsonLd` é usada em /diagnostico (rota pública) e lê
 * `cnpj`/`cau` das settings. Como a coluna `cnpj` não existe em produção
 * (DB-02), o valor efetivo é sempre o de `DEFAULTS` em useSiteSettings.ts —
 * que carregava CNPJ e WhatsApp do site anterior. Este teste falha se algum
 * desses números voltar a divergir da decisão de 17/09/2026.
 */
import { describe, expect, it, vi } from "vitest";

// Sem backend: o que interessa aqui são os DEFAULTS, que é exatamente o que
// o site publica enquanto a coluna `cnpj` não existir em produção.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: () => new Promise(() => {}),
  },
}));

import { getCachedSiteSettings } from "@/lib/useSiteSettings";
import { localBusinessRef, organizationJsonLd } from "@/lib/useSeo";
import {
  GOOGLE_BUSINESS_PROFILE_URL,
  LOCAL_NODE,
  ORG_ALTERNATE_NAMES,
  ORG_JSONLD,
  ORG_NODE,
  ORG_SAME_AS,
  SERVICE_NODE,
  THIAGO_NODE,
  WEBSITE_NODE,
} from "@/lib/orgJsonLd";

const CNPJ_OFICIAL = "47.350.338/0001-37";
const CAU_OFICIAL = "A162437-7";
const WHATSAPP_OFICIAL = "5511911906183";

/** Números do site anterior — não podem reaparecer em lugar nenhum. */
const CNPJ_ANTIGO = "05.119.224/0001-30";
const WHATSAPP_ANTIGO = "5534996668215";

describe("identidade oficial da Bewild nos defaults de site_settings", () => {
  it("DEFAULTS trazem CNPJ, CAU e WhatsApp oficiais", () => {
    const s = getCachedSiteSettings();
    expect(s.cnpj).toBe(CNPJ_OFICIAL);
    expect(s.cau).toBe(CAU_OFICIAL);
    expect(s.whatsapp_number).toBe(WHATSAPP_OFICIAL);
  });

  it("organizationJsonLd publica o CNPJ oficial (rota /diagnostico)", () => {
    const ld = organizationJsonLd(getCachedSiteSettings()) as Record<string, unknown>;
    expect(ld.taxID).toBe(CNPJ_OFICIAL);
    expect(ld.vatID).toBe(CNPJ_OFICIAL);
    expect(ld.iso6523Code).toBe("0007:47350338000137");

    const serialized = JSON.stringify(ld);
    expect(serialized).not.toContain(CNPJ_ANTIGO);
    // CAU é registro pessoal do Thiago: fica só no Person dele, nunca na Organization.
    expect(serialized.replace(JSON.stringify(THIAGO_NODE), "")).not.toContain(CAU_OFICIAL);
    expect(ld.identifier).toEqual([{ "@type": "PropertyValue", propertyID: "CNPJ", value: CNPJ_OFICIAL }]);
  });

  it("organizationJsonLd usa o mesmo @id (#org) e o logo do nó estático do index.html", () => {
    const ld = organizationJsonLd(getCachedSiteSettings()) as Record<string, unknown>;
    expect(ld["@id"]).toBe("https://bewild.com.br/#org");
    expect((ld.logo as { url: string }).url).toBe("https://bewild.com.br/brand/bewild-logo-512.png");
    // Sem referência a nó que nenhuma página publica.
    expect(ld).not.toHaveProperty("subOrganization");
    expect(JSON.stringify(ld)).not.toMatch(/#organization|#business/);
  });

  it("DEFAULTS não trazem o WhatsApp do site anterior", () => {
    const s = getCachedSiteSettings();
    expect(s.whatsapp_number).not.toBe(WHATSAPP_ANTIGO);
  });
});

describe("Organization com fonte única (orgJsonLd.ts)", () => {
  const graph = JSON.parse(ORG_JSONLD)["@graph"] as Array<Record<string, unknown>>;
  it("ORG_JSONLD é derivado dos nós exportados", () => {
    expect(graph.map((n) => n["@type"])).toEqual(["Organization", "ProfessionalService", "WebSite", "Service"]);
    expect(graph[0]).toEqual(ORG_NODE);
  });
  it("organizationJsonLd e localBusinessRef não divergem do root", () => {
    const ld = organizationJsonLd(getCachedSiteSettings()) as Record<string, unknown>;
    for (const k of ["legalName", "sameAs", "taxID", "founder", "employee"]) expect(ld[k]).toEqual((ORG_NODE as Record<string, unknown>)[k]);
    expect(ld.email).toBe(LOCAL_NODE.email);
    expect(ld.telephone).toBe(LOCAL_NODE.telephone);
    expect(ld.address).toEqual(LOCAL_NODE.address);
    expect(localBusinessRef("https://bewild.com.br")).toEqual(LOCAL_NODE);
  });
  it("decisões do dono: cargos, fundadores, CAU só no Thiago, foto real no #local, @id do serviço", () => {
    const people = ORG_NODE.employee as Array<Record<string, string>>;
    expect(people.find((p) => p.name === "Pedro Henrique Alves")?.jobTitle).toBe("Fundador e CEO");
    expect(THIAGO_NODE.jobTitle).toBe("Cofundador, VP e arquiteto responsável técnico");
    expect(THIAGO_NODE.identifier).toBe(`CAU ${CAU_OFICIAL}`);
    expect(ORG_NODE.founder).toEqual([{ "@id": "https://bewild.com.br/#pedro-henrique-alves" }, { "@id": "https://bewild.com.br/#thiago-dantas" }]);
    expect(LOCAL_NODE.image[0]).toBe("https://bewild.com.br/images/hero-slides/rodrigo-1-lg.jpg");
    expect(LOCAL_NODE.geo).toEqual({ "@type": "GeoCoordinates", latitude: -23.6147497, longitude: -46.6886285 });
    expect(SERVICE_NODE["@id"]).toBe("https://bewild.com.br/#servico-reforma");
  });
});

describe("nomes alternativos e canais oficiais no JSON-LD de entidade", () => {
  it("ORG_ALTERNATE_NAMES é exatamente a lista decidida e vale para Organization e LocalBusiness", () => {
    const lista = ["Bwild", "Be Wild", "Bewild Reformas", "Bewild Reformas e Arquitetura", "Bwild Reformas"];
    expect(ORG_ALTERNATE_NAMES).toEqual(lista);
    expect(ORG_NODE.alternateName).toEqual(lista);
    expect(LOCAL_NODE.alternateName).toEqual(lista);
  });
  it("WebSite traz o nome alternativo que o Google usa para o nome do site", () => {
    expect(WEBSITE_NODE.alternateName).toEqual(["Bwild", "Be Wild", "Bewild Reformas"]);
  });
  it("sameAs inclui o canal do YouTube sem perder Instagram, LinkedIn e Perfil da Empresa", () => {
    expect(ORG_SAME_AS).toEqual([
      "https://instagram.com/bewild.oficial",
      "https://www.linkedin.com/company/bwil-d/",
      GOOGLE_BUSINESS_PROFILE_URL,
      "https://www.youtube.com/@bewild.oficial",
    ]);
  });
});
