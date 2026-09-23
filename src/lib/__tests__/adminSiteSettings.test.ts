import { describe, expect, it, vi } from "vitest";

// Sem .env nos testes: o client real exige VITE_SUPABASE_URL.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import {
  diffSettings,
  missingColumns,
  normalizeSettingValue,
  settingsErrorMessage,
} from "@/lib/adminSiteSettings";

describe("diffSettings", () => {
  const loaded = {
    meta_pixel_id: "1234567890",
    google_tag_manager_id: "GTM-ABC",
    seo_default_title: "Bewild",
    seo_keywords: null,
  };

  it("envia só o que mudou (os outros ~30 campos ficam fora do save)", () => {
    const current = { ...loaded, seo_default_title: "Bewild · Reformas" };
    expect(diffSettings(loaded, current, Object.keys(loaded))).toEqual({
      seo_default_title: "Bewild · Reformas",
    });
  });

  it("vazio e null são iguais; espaços nas pontas não geram gravação", () => {
    const current = { ...loaded, seo_keywords: "", meta_pixel_id: " 1234567890 " };
    expect(diffSettings(loaded, current, Object.keys(loaded))).toEqual({});
  });

  it("apagar um campo grava null", () => {
    const current = { ...loaded, google_tag_manager_id: "   " };
    expect(diffSettings(loaded, current, Object.keys(loaded))).toEqual({
      google_tag_manager_id: null,
    });
  });

  it("ignora campos fora da lista", () => {
    const current = { ...loaded, seo_last_audit_at: "2026-09-23T10:00:00Z" };
    expect(diffSettings(loaded, current, ["meta_pixel_id"])).toEqual({});
  });
});

describe("missingColumns", () => {
  it("detecta colunas que o banco ainda não tem (ex.: cnpj antes da migração)", () => {
    const row = { id: 1, site_title: "Bewild", contact_email: null };
    expect(missingColumns(row, ["site_title", "contact_email", "cnpj", "cau"])).toEqual([
      "cnpj",
      "cau",
    ]);
  });
});

describe("normalizeSettingValue", () => {
  it("normaliza para string aparada ou null", () => {
    expect(normalizeSettingValue(undefined)).toBeNull();
    expect(normalizeSettingValue("  ")).toBeNull();
    expect(normalizeSettingValue(" G-1 ")).toBe("G-1");
    expect(normalizeSettingValue(2020)).toBe("2020");
  });
});

describe("settingsErrorMessage", () => {
  it("coluna inexistente vira mensagem acionável", () => {
    const msg = settingsErrorMessage({
      code: "PGRST204",
      message: "Could not find the 'cnpj' column of 'site_settings' in the schema cache",
    });
    expect(msg).toContain('"cnpj"');
    expect(msg).toContain("migração");
  });

  it("permissão e rede", () => {
    expect(settingsErrorMessage({ code: "42501", message: "permission denied" })).toMatch(
      /permissão/,
    );
    expect(settingsErrorMessage({ message: "TypeError: Failed to fetch" })).toMatch(/conexão/);
  });
});
