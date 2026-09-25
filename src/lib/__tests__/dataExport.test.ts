/**
 * Exportação para planilha e BI: regras da edge function `data-export`
 * (supabase/functions/_shared/data-export.ts) e o que o painel monta
 * (src/lib/dataExport.ts) — o endereço que o painel entrega tem de ser o que a
 * função aceita, e nenhum conjunto pode levar dado pessoal.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", async () => {
  const fake = await import("./helpers/supabaseFake");
  return { supabase: { ...fake.fakeSupabase, rpc: (...args: unknown[]) => rpc(...args) } };
});

import {
  csvText,
  DATASETS,
  EXPORT_DATASETS,
  exportFilename,
  KEY_PATTERN,
  parseExportRequest,
  readExportKey,
  sha256Hex,
  spDateTime,
  spDay,
  spDayStart,
  toCsv,
  toExportRecord,
  toJson,
} from "../../../supabase/functions/_shared/data-export";
import { buildExportUrl, createExportKey, datasetLabel, exportBase, importDataFormula, revokeExportKey } from "@/lib/dataExport";

const BASE = "https://proj.supabase.co/functions/v1/data-export";
const NOW = new Date("2026-09-25T15:00:00Z"); // 12h em São Paulo
const TOKEN = `bwx_${"ab".repeat(32)}`;

const parse = (qs: string, now = NOW) => parseExportRequest(new URL(`${BASE}?${qs}`), now);
const errorOf = (qs: string) => {
  const r = parse(qs);
  return r.ok ? null : r.error;
};

describe("pedido: conjunto, formato e período (dias de São Paulo)", () => {
  it("padrão: CSV com vírgula, decimal com vírgula e os últimos 90 dias", () => {
    expect(parse("dataset=leads")).toEqual({
      ok: true,
      value: {
        dataset: "leads",
        format: "csv",
        sep: ",",
        dec: ",",
        from: "2026-06-28",
        to: "2026-09-25",
        since: "2026-06-28T03:00:00.000Z",
        until: "2026-09-26T03:00:00.000Z",
      },
    });
  });

  it("days, from/to, formato, separador e decimal", () => {
    expect(parse("dataset=meta_ads_daily&days=1")).toMatchObject({ ok: true, value: { from: "2026-09-25", to: "2026-09-25" } });
    expect(parse("dataset=meta_ads_daily&from=2026-01-01&to=2026-01-31")).toMatchObject({
      ok: true,
      value: { from: "2026-01-01", to: "2026-01-31", since: "2026-01-01T03:00:00.000Z", until: "2026-02-01T03:00:00.000Z" },
    });
    expect(parse("dataset=leads&from=2026-09-01")).toMatchObject({ ok: true, value: { from: "2026-09-01", to: "2026-09-25" } });
    expect(parse("dataset=tracking_daily&format=json&sep=semicolon&dec=dot")).toMatchObject({
      ok: true,
      value: { format: "json", sep: ";", dec: "." },
    });
    // 23h30 em São Paulo ainda é o dia 25 (em UTC já é 26).
    expect(parse("dataset=leads&days=1", new Date("2026-09-26T02:30:00Z"))).toMatchObject({ ok: true, value: { from: "2026-09-25" } });
  });

  it("erros claros", () => {
    expect(errorOf("")).toContain("dataset=");
    expect(errorOf("dataset=usuarios")).toContain("Conjunto desconhecido");
    expect(errorOf("dataset=leads&format=xlsx")).toContain("Formato inválido");
    expect(errorOf("dataset=leads&sep=tab")).toContain("Separador inválido");
    expect(errorOf("dataset=leads&dec=x")).toContain("Decimal inválido");
    for (const d of ["0", "732", "abc", "-5"]) expect(errorOf(`dataset=leads&days=${d}`)).toContain("Período inválido");
    expect(errorOf("dataset=leads&from=2026-02-30")).toContain("Data inicial inválida");
    expect(errorOf("dataset=leads&from=2026-01-01&to=2026-13-01")).toContain("Data final inválida");
    expect(errorOf("dataset=leads&to=2026-01-01")).toContain("Informe from");
    expect(errorOf("dataset=leads&from=2026-02-01&to=2026-01-01")).toContain("depois da final");
    expect(errorOf("dataset=leads&from=2024-01-01&to=2026-01-02")).toContain("no máximo 731 dias");
  });

  it("dia e hora de São Paulo", () => {
    expect(spDay(new Date("2026-09-25T02:59:59Z"))).toBe("2026-09-24");
    expect(spDay(new Date("2026-09-25T03:00:00Z"))).toBe("2026-09-25");
    expect(spDayStart("2026-03-01").toISOString()).toBe("2026-03-01T03:00:00.000Z");
    expect(spDateTime("2026-09-25T15:04:05.123456+00:00")).toBe("2026-09-25 12:04:05");
    expect(spDateTime(null)).toBeNull();
    expect(spDateTime("não é data")).toBeNull();
  });
});

describe("chave", () => {
  const r = (url: string, headers: Record<string, string> = {}) => readExportKey(new Request(url, { headers }));

  it("vem do cabeçalho, do Bearer ou do parâmetro key — vale a primeira com o formato certo", () => {
    expect(r(`${BASE}?key=${TOKEN}`)).toEqual({ key: TOKEN, provided: true });
    expect(r(BASE, { "x-export-key": TOKEN })).toEqual({ key: TOKEN, provided: true });
    expect(r(BASE, { authorization: `Bearer ${TOKEN}` })).toEqual({ key: TOKEN, provided: true });
    // Um JWT do Supabase no Authorization não atrapalha a chave no endereço.
    expect(r(`${BASE}?key=${TOKEN}`, { authorization: "Bearer eyJhbGciOi.xxx.yyy" })).toEqual({ key: TOKEN, provided: true });
    expect(r(`${BASE}?key=bwx_curta`)).toEqual({ key: null, provided: true });
    expect(r(`${BASE}?key=${TOKEN.toUpperCase()}`).key).toBeNull();
    expect(r(BASE)).toEqual({ key: null, provided: false });
    expect(KEY_PATTERN.test(TOKEN)).toBe(true);
  });

  it("hash SHA-256 em hexadecimal (o mesmo do banco)", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("sem dados pessoais", () => {
  const PII_COLUMNS = ["name", "email", "whatsapp", "phone", "message", "answers", "user_agent", "fbp", "fbc", "gclid", "fbclid", "event_id", "referrer", "notify"];

  it("nenhum conjunto tem coluna de dado pessoal", () => {
    for (const d of EXPORT_DATASETS) {
      const names = DATASETS[d].columns.map((c) => c.name);
      expect(names.filter((n) => PII_COLUMNS.includes(n))).toEqual([]);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("lead: contato, mensagem, navegador e ids de clique ficam de fora; sobram sim/não e o host de origem", () => {
    const row = {
      id: "0b6f…",
      created_at: "2026-09-25T15:00:00+00:00",
      name: "Ana Souza",
      whatsapp: "+5511999990000",
      email: "ana@exemplo.com",
      message: "Meu apê na Rua X, 123",
      user_agent: "Mozilla/5.0 Ana-PC",
      fbp: "fb.1.123.456",
      fbc: "fb.1.123.IwAR",
      gclid: "Cj0KCQ-gclid",
      fbclid: null,
      event_id: "evt-1",
      referrer: "https://www.google.com/search?q=ana+souza",
      status: "novo",
      location: "Pinheiros",
      lives_in_sp: true,
      area_m2: 72,
      utm_source: "google",
      meta_lead_sent_at: "2026-09-25T15:00:01+00:00",
      meta_qualified_sent_at: null,
    };
    const rec = toExportRecord("leads", row);
    expect(Object.keys(rec)).toEqual(DATASETS.leads.columns.map((c) => c.name));
    expect(rec).toMatchObject({
      has_gclid: true,
      has_fbclid: false,
      referrer_host: "www.google.com",
      meta_lead_sent: true,
      meta_qualified_sent: false,
      location: "Pinheiros",
    });
    const out = JSON.stringify(rec) + toCsv("leads", [rec], { sep: ",", dec: "," });
    for (const secret of ["Ana", "99999", "exemplo.com", "Rua X", "fb.1", "Cj0KCQ", "evt-1", "q=ana"]) expect(out).not.toContain(secret);
  });

  it("formulário da Meta: sem nome, e-mail, telefone nem respostas", () => {
    const rec = toExportRecord("meta_leads", {
      id: "u1",
      created_time: "2026-09-25T15:00:00+00:00",
      name: "Bruno",
      email: "bruno@exemplo.com",
      phone: "+5511988887777",
      answers: [{ key: "bairro", label: "Bairro", value: "Moema" }],
      campaign_name: "Leads SP",
      is_test: false,
    });
    expect(JSON.stringify(rec)).not.toMatch(/Bruno|exemplo|98888|Moema/);
    expect(rec.campaign_name).toBe("Leads SP");
  });
});

describe("CSV e JSON", () => {
  const ads = [
    {
      date: "2026-09-24",
      account_id: "1274618770498233",
      campaign_id: "120212345678901234",
      campaign_name: "Reforma, \"premium\"\nSP",
      objective: "OUTCOME_LEADS",
      currency: "BRL",
      spend: 1234.5,
      impressions: 10000,
      clicks: 250,
      link_clicks: 180,
      leads: 7,
      form_leads: 5,
      site_leads: 2,
      conversations: 0,
    },
  ];

  it("padrão: vírgula, decimal com vírgula entre aspas, textos com aspas/quebra entre aspas", () => {
    const csv = toCsv("meta_ads_daily", ads, { sep: ",", dec: "," });
    const [head, line, end] = csv.split("\r\n");
    expect(head).toBe(DATASETS.meta_ads_daily.columns.map((c) => c.name).join(","));
    expect(line).toBe('2026-09-24,1274618770498233,120212345678901234,"Reforma, ""premium""\nSP",OUTCOME_LEADS,BRL,"1234,5",10000,250,180,7,5,2,0');
    expect(end).toBe("");
    expect(csv.charCodeAt(0)).not.toBe(0xfeff);
  });

  it("dec=dot e Excel em português (ponto e vírgula + marca UTF-8)", () => {
    expect(toCsv("meta_ads_daily", ads, { sep: ",", dec: "." })).toContain(",BRL,1234.5,10000,");
    const excel = toCsv("meta_ads_daily", ads, { sep: ";", dec: "," });
    expect(excel.charCodeAt(0)).toBe(0xfeff);
    expect(excel).toContain(";BRL;1234,5;10000;");
  });

  it("células: sim/não viram 1/0, vazio fica vazio, hora em São Paulo e texto não vira fórmula", () => {
    expect(csvText("bool", true, ",")).toBe("1");
    expect(csvText("bool", false, ",")).toBe("0");
    expect(csvText("bool", null, ",")).toBe("");
    expect(csvText("int", null, ",")).toBe("");
    expect(csvText("datetime", "2026-09-25T15:00:00+00:00", ",")).toBe("2026-09-25 12:00:00");
    expect(csvText("text", '=HYPERLINK("https://x.y")', ",")).toBe(`'=HYPERLINK("https://x.y")`);
    expect(csvText("text", "+55 11", ",")).toBe("'+55 11");
    expect(csvText("text", "-10% off", ",")).toBe("'-10% off");
    expect(csvText("text", "@menção", ",")).toBe("'@menção");
    expect(csvText("int", -3, ",")).toBe("-3");
  });

  it("JSON: tipos nativos, horas em São Paulo e cabeçalho do período", () => {
    const rec = toExportRecord("meta_leads", { id: "u1", created_time: "2026-09-25T15:00:00+00:00", is_test: true, is_organic: false });
    const doc = JSON.parse(
      toJson({ dataset: "meta_leads", from: "2026-09-01", to: "2026-09-25" }, [rec], { generatedAt: NOW, truncated: false }),
    );
    expect(doc).toMatchObject({
      dataset: "meta_leads",
      from: "2026-09-01",
      to: "2026-09-25",
      timezone: "America/Sao_Paulo",
      generated_at: "2026-09-25 12:00:00",
      row_count: 1,
      truncated: false,
    });
    expect(doc.columns).toEqual(DATASETS.meta_leads.columns.map((c) => c.name));
    expect(doc.rows[0]).toMatchObject({ id: "u1", created_time: "2026-09-25 12:00:00", is_test: true, is_organic: false, city: null });
  });

  it("nome do arquivo", () => {
    expect(exportFilename({ dataset: "leads", from: "2026-06-28", to: "2026-09-25", format: "csv" })).toBe("bewild-leads-2026-06-28_2026-09-25.csv");
  });
});

describe("painel — chaves e endereços", () => {
  beforeEach(() => rpc.mockReset());

  it("endereços que a função aceita (CSV, Excel, JSON) e a fórmula do Google Sheets", () => {
    expect(exportBase("https://proj.supabase.co/")).toBe(BASE);
    const csv = buildExportUrl("meta_ads_daily", TOKEN, "csv", BASE);
    expect(csv).toBe(`${BASE}?dataset=meta_ads_daily&key=${TOKEN}`);
    expect(parse(new URL(csv).search.slice(1))).toMatchObject({ ok: true, value: { dataset: "meta_ads_daily", format: "csv", sep: "," } });
    expect(readExportKey(new Request(csv)).key).toBe(TOKEN);
    expect(parse(new URL(buildExportUrl("leads", TOKEN, "excel", BASE)).search.slice(1))).toMatchObject({ ok: true, value: { sep: ";" } });
    expect(parse(new URL(buildExportUrl("leads", TOKEN, "json", BASE)).search.slice(1))).toMatchObject({ ok: true, value: { format: "json" } });
    expect(importDataFormula(csv)).toBe(`=IMPORTDATA("${csv}")`);
    expect(datasetLabel("analytics_daily")).toBe("Visitas ao site por dia");
    expect(datasetLabel("outro")).toBe("outro");
  });

  it("criar: valida antes, manda os conjuntos em ordem e devolve a chave uma vez", async () => {
    expect(await createExportKey("  ", ["leads"])).toEqual({ key: null, error: expect.stringContaining("nome") });
    expect(await createExportKey("Planilha", [])).toEqual({ key: null, error: expect.stringContaining("conjunto") });
    expect(rpc).not.toHaveBeenCalled();

    rpc.mockResolvedValueOnce({ data: [{ id: "k1", token: TOKEN, prefix: TOKEN.slice(0, 12) }], error: null });
    const ok = await createExportKey(" Planilha de marketing ", ["meta_ads_daily", "leads"]);
    expect(rpc).toHaveBeenCalledWith("create_export_key", { p_name: "Planilha de marketing", p_datasets: ["leads", "meta_ads_daily"] });
    expect(ok).toEqual({
      key: { id: "k1", token: TOKEN, prefix: "bwx_abababab", name: "Planilha de marketing", datasets: ["leads", "meta_ads_daily"] },
      error: null,
    });

    rpc.mockResolvedValueOnce({ data: null, error: { message: "somente administradores" } });
    expect(await createExportKey("x", ["leads"])).toEqual({ key: null, error: "somente administradores" });
  });

  it("revogar", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null });
    expect(await revokeExportKey("k1")).toEqual({ error: null });
    expect(rpc).toHaveBeenCalledWith("revoke_export_key", { p_id: "k1" });
  });
});
