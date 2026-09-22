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
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => new Promise(() => {}) }) }),
    }),
  },
}));

import { getCachedSiteSettings } from "@/lib/useSiteSettings";
import { organizationJsonLd, professionalServiceJsonLd } from "@/lib/useSeo";

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
    expect(serialized).toContain(CAU_OFICIAL);
  });

  it("professionalServiceJsonLd publica o CNPJ oficial", () => {
    const ld = professionalServiceJsonLd(getCachedSiteSettings()) as Record<string, unknown>;
    expect(ld.taxID).toBe(CNPJ_OFICIAL);
    expect(JSON.stringify(ld)).not.toContain(CNPJ_ANTIGO);
  });

  it("whatsappUrl cai no número oficial quando as settings não trazem o campo", async () => {
    const { whatsappUrl } = await import("@/lib/useSiteSettings");
    expect(whatsappUrl(null)).toBe(`https://wa.me/${WHATSAPP_OFICIAL}`);
    expect(whatsappUrl(null)).not.toContain(WHATSAPP_ANTIGO);
  });
});
