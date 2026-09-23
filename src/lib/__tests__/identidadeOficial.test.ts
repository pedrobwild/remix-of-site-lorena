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
import { organizationJsonLd } from "@/lib/useSeo";

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

  it("organizationJsonLd usa o mesmo @id (#org) e o logo do nó estático do index.html", () => {
    const ld = organizationJsonLd(getCachedSiteSettings()) as Record<string, unknown>;
    expect(ld["@id"]).toBe("https://bewild.com.br/#org");
    expect((ld.logo as { url: string }).url).toBe("https://bewild.com.br/brand/bewild-logo.png");
    // Sem referência a nó que nenhuma página publica.
    expect(ld).not.toHaveProperty("subOrganization");
    expect(JSON.stringify(ld)).not.toMatch(/#organization|#business/);
  });

  it("DEFAULTS não trazem o WhatsApp do site anterior", () => {
    const s = getCachedSiteSettings();
    expect(s.whatsapp_number).not.toBe(WHATSAPP_ANTIGO);
  });
});
