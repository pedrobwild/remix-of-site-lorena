/**
 * Módulos puros do `meta-sync` (supabase/functions/_shared/meta-leads.ts e
 * meta-graph.ts): configuração, janelas, conversão das linhas da Graph API,
 * avisos de lead novo e o cliente HTTP da Graph API. Sem `Deno.*` nem
 * imports `npm:` — por isso rodam aqui no Vitest.
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_META_LEADS_URL,
  adsDailyRowFromApi,
  adsWindow,
  buildMetaLeadCrmPayload,
  buildMetaLeadEmail,
  buildMetaLeadSlackMessage,
  CRM_WEBHOOK_URL,
  DEFAULT_AD_ACCOUNT_ID,
  displayPhone,
  formInfoFromApi,
  leadRowFromApi,
  leadsFromActions,
  leadsWindow,
  localDay,
  normalizeLeadPhone,
  notifyDecision,
  prettifyKey,
  resolveMetaSyncConfig,
  shiftDay,
  whatsappLink,
  type MetaLeadRow,
} from "../../../supabase/functions/_shared/meta-leads";
import {
  appSecretProof,
  classifyGraphError,
  createGraphClient,
  GRAPH_BASE,
  GraphApiError,
  graphErrorHint,
} from "../../../supabase/functions/_shared/meta-graph";

const env = (vars: Record<string, string>) => (name: string) => vars[name];

describe("configuração", () => {
  it("sem nenhum token: no_token", () => {
    expect(resolveMetaSyncConfig(env({}))).toEqual({ config: null, reason: "no_token" });
    expect(resolveMetaSyncConfig(env({ META_ADS_ACCESS_TOKEN: "   " })).reason).toBe("no_token");
  });

  it("um token serve para as duas leituras; conta padrão da Bwild", () => {
    const { config } = resolveMetaSyncConfig(env({ META_ADS_ACCESS_TOKEN: " EAAads " }));
    expect(config).toEqual({
      adsToken: "EAAads",
      leadsToken: "EAAads",
      accountId: DEFAULT_AD_ACCOUNT_ID,
      pageIds: [],
      appSecret: null,
    });
  });

  it("token próprio para os formulários, conta com act_, páginas e app secret", () => {
    const { config } = resolveMetaSyncConfig(
      env({
        META_ADS_ACCESS_TOKEN: "EAAads",
        META_LEADS_ACCESS_TOKEN: "EAAleads",
        META_ADS_ACCOUNT_ID: "act_998877665544",
        META_PAGE_ID: "123456789, 987654321;123456789 abc",
        META_APP_SECRET: "s3cr3t",
      }),
    );
    expect(config).toMatchObject({
      adsToken: "EAAads",
      leadsToken: "EAAleads",
      accountId: "998877665544",
      pageIds: ["123456789", "987654321"],
      appSecret: "s3cr3t",
    });
  });

  it("só o token de formulários: métricas ficam sem token (e a conta inválida cai no padrão)", () => {
    const { config } = resolveMetaSyncConfig(env({ META_LEADS_ACCESS_TOKEN: "EAAleads", META_ADS_ACCOUNT_ID: "xyz" }));
    expect(config?.adsToken).toBeNull();
    expect(config?.leadsToken).toBe("EAAleads");
    expect(config?.accountId).toBe(DEFAULT_AD_ACCOUNT_ID);
  });
});

describe("janelas", () => {
  it("dia local em São Paulo e aritmética de calendário", () => {
    // 02:30 UTC = 23:30 do dia anterior em São Paulo.
    expect(localDay(new Date("2026-09-25T02:30:00Z"))).toBe("2026-09-24");
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("métricas: primeira carga de 90 dias; depois, os últimos 8", () => {
    const now = new Date("2026-09-25T15:00:00Z");
    expect(adsWindow(now, false)).toEqual({ since: "2026-06-28", until: "2026-09-25", backfill: true });
    expect(adsWindow(now, true)).toEqual({ since: "2026-09-18", until: "2026-09-25", backfill: false });
  });

  it("leads: sem cursor é a primeira carga (89 dias, sem aviso); com cursor, 6h de sobreposição", () => {
    const now = Date.UTC(2026, 8, 25, 12, 0, 0);
    const nowS = now / 1000;
    expect(leadsWindow(now, undefined)).toEqual({ since: nowS - 89 * 86_400, backfill: true });
    expect(leadsWindow(now, "123")).toEqual({ since: nowS - 89 * 86_400, backfill: true });
    expect(leadsWindow(now, nowS - 1800)).toEqual({ since: nowS - 1800 - 6 * 3600, backfill: false });
    // Cursor muito antigo não passa do que a Meta ainda guarda.
    expect(leadsWindow(now, nowS - 200 * 86_400)).toEqual({ since: nowS - 89 * 86_400, backfill: false });
  });

  it("aviso: nem na primeira carga, nem para lead com mais de 72h", () => {
    const now = Date.UTC(2026, 8, 25, 12);
    expect(notifyDecision("2026-09-25T11:00:00Z", now, false)).toBe("notify");
    expect(notifyDecision("2026-09-25T11:00:00Z", now, true)).toBe("backfill");
    expect(notifyDecision("2026-09-22T11:00:00Z", now, false)).toBe("old");
  });
});

describe("métricas diárias", () => {
  it("`lead` é o total — não soma com formulário e site", () => {
    const actions = [
      { action_type: "lead", value: "7" },
      { action_type: "onsite_conversion.lead_grouped", value: "5" },
      { action_type: "offsite_conversion.fb_pixel_lead", value: "2" },
      { action_type: "onsite_conversion.messaging_conversation_started_7d", value: "3" },
      { action_type: "link_click", value: "40" },
    ];
    expect(leadsFromActions(actions)).toEqual({ leads: 7, form_leads: 5, site_leads: 2, conversations: 3 });
    // Sem a ação agregada, soma as partes.
    expect(leadsFromActions(actions.slice(1)).leads).toBe(7);
    expect(leadsFromActions(null)).toEqual({ leads: 0, form_leads: 0, site_leads: 0, conversations: 0 });
  });

  it("linha da API → linha da tabela; data ou campanha inválida é descartada", () => {
    const row = adsDailyRowFromApi(
      {
        date_start: "2026-09-24",
        campaign_id: "120210000000001",
        campaign_name: "Studios · Leads",
        objective: "OUTCOME_LEADS",
        account_currency: "BRL",
        spend: "123.456",
        impressions: "10000",
        clicks: "250",
        inline_link_clicks: "180",
        actions: [{ action_type: "lead", value: "4" }],
      },
      "1274618770498233",
      "2026-09-25T10:00:00.000Z",
    );
    expect(row).toEqual({
      account_id: "1274618770498233",
      date: "2026-09-24",
      campaign_id: "120210000000001",
      campaign_name: "Studios · Leads",
      objective: "OUTCOME_LEADS",
      currency: "BRL",
      spend: 123.46,
      impressions: 10000,
      clicks: 250,
      link_clicks: 180,
      leads: 4,
      form_leads: 0,
      site_leads: 0,
      conversations: 0,
      synced_at: "2026-09-25T10:00:00.000Z",
    });
    expect(adsDailyRowFromApi({ date_start: "24/09/2026", campaign_id: "1" }, "1", "x")).toBeNull();
    expect(adsDailyRowFromApi({ date_start: "2026-09-24", campaign_id: "abc" }, "1", "x")).toBeNull();
  });
});

const FORM = formInfoFromApi(
  {
    id: "5550001",
    name: "Orçamento reforma — setembro",
    questions: [
      { key: "full_name", label: "Nome completo" },
      { key: "qual_o_objetivo?", label: "Qual o objetivo do imóvel?", options: [{ key: "short_stay", value: "Aluguel por temporada" }] },
      { key: "metragem", label: "Metragem aproximada" },
    ],
  },
  "4440001",
)!;

const API_LEAD = {
  id: "9990001",
  created_time: "2026-09-25T11:52:10+0000",
  ad_id: "111",
  ad_name: "Vídeo studio antes/depois",
  adset_id: "222",
  adset_name: "SP 25-45",
  campaign_id: "333",
  campaign_name: "Studios · Leads",
  form_id: "5550001",
  is_organic: false,
  platform: "IG",
  field_data: [
    { name: "full_name", values: ["Ana <b>Souza</b>"] },
    { name: "email", values: ["Ana.Souza@Exemplo.com "] },
    { name: "phone_number", values: ["+5511912345678"] },
    { name: "city", values: ["São Paulo"] },
    { name: "qual_o_objetivo?", values: ["short_stay"] },
    { name: "metragem", values: ["32 m²"] },
    { name: "quando_pretende_comecar", values: ["em_ate_3_meses"] },
    { name: "state", values: ["SP"] },
  ],
};

describe("leads dos formulários", () => {
  it("formulário: rótulos e opções por chave", () => {
    expect(FORM.labels["qual_o_objetivo?"]).toBe("Qual o objetivo do imóvel?");
    expect(FORM.options["qual_o_objetivo?"]).toEqual({ short_stay: "Aluguel por temporada" });
    expect(FORM.pageId).toBe("4440001");
    expect(formInfoFromApi({ name: "sem id" }, null)).toBeNull();
  });

  it("lead da API → linha: contato em colunas, o resto nas respostas com o texto da pergunta", () => {
    const row = leadRowFromApi(API_LEAD, FORM)!;
    expect(row).toMatchObject({
      meta_lead_id: "9990001",
      created_time: "2026-09-25T11:52:10.000Z",
      page_id: "4440001",
      form_id: "5550001",
      form_name: "Orçamento reforma — setembro",
      campaign_name: "Studios · Leads",
      adset_name: "SP 25-45",
      ad_name: "Vídeo studio antes/depois",
      platform: "ig",
      is_organic: false,
      is_test: false,
      name: "Ana <b>Souza</b>",
      email: "ana.souza@exemplo.com",
      phone: "+5511912345678",
      city: "São Paulo",
    });
    expect(row.answers).toEqual([
      { key: "qual_o_objetivo?", label: "Qual o objetivo do imóvel?", value: "Aluguel por temporada" },
      { key: "metragem", label: "Metragem aproximada", value: "32 m²" },
      { key: "quando_pretende_comecar", label: "Quando pretende comecar", value: "em_ate_3_meses" },
      { key: "state", label: "Estado", value: "SP" },
    ]);
  });

  it("nome em duas partes, e-mail inválido, telefone sem jeito e lead de teste", () => {
    const row = leadRowFromApi(
      {
        id: "9990002",
        created_time: "2026-09-25T12:00:00+0000",
        field_data: [
          { name: "first_name", values: ["<test lead: dummy data for first_name>"] },
          { name: "last_name", values: ["Lima"] },
          { name: "email", values: ["nao-e-email"] },
          { name: "phone_number", values: ["12345"] },
        ],
      },
      null,
    )!;
    expect(row.name).toBe("<test lead: dummy data for first_name> Lima");
    expect(row.is_test).toBe(true);
    expect(row.email).toBeNull();
    expect(row.phone).toBeNull();
    expect(row.answers).toEqual([{ key: "phone_number", label: "Telefone (como digitado)", value: "12345" }]);
    expect(row.form_name).toBeNull();
  });

  it("sem id numérico ou sem data não vira linha", () => {
    expect(leadRowFromApi({ id: "abc", created_time: "2026-09-25T12:00:00+0000" }, null)).toBeNull();
    expect(leadRowFromApi({ id: "123", created_time: "ontem" }, null)).toBeNull();
    expect(leadRowFromApi({ id: "123" }, null)).toBeNull();
  });

  it("telefone: Brasil em E.164, estrangeiro com + fica, resto é descartado", () => {
    expect(normalizeLeadPhone("+55 (11) 91234-5678")).toBe("+5511912345678");
    expect(normalizeLeadPhone("11 91234-5678")).toBe("+5511912345678");
    expect(normalizeLeadPhone("011 3251-1000")).toBe("+551132511000");
    expect(normalizeLeadPhone("5511912345678")).toBe("+5511912345678");
    expect(normalizeLeadPhone("+351 912 345 678")).toBe("+351912345678");
    expect(normalizeLeadPhone("123")).toBeNull();
    expect(normalizeLeadPhone(null)).toBeNull();
    expect(displayPhone("+5511912345678")).toBe("(11) 91234-5678");
    expect(displayPhone("+551132511000")).toBe("(11) 3251-1000");
    expect(displayPhone("+351912345678")).toBe("+351912345678");
    expect(whatsappLink("+5511912345678")).toBe("https://wa.me/5511912345678");
    expect(whatsappLink(null)).toBeNull();
  });

  it("chave vira texto legível", () => {
    expect(prettifyKey("qual_é_a_metragem?")).toBe("Qual é a metragem?");
    expect(prettifyKey("__x__")).toBe("X");
  });
});

describe("avisos (mesmos canais dos leads do site)", () => {
  const row = leadRowFromApi(API_LEAD, FORM) as MetaLeadRow;

  it("Slack: texto do lead escapado, WhatsApp, respostas, origem e link do painel", () => {
    const msg = buildMetaLeadSlackMessage(row, "db-uuid-1");
    const all = JSON.stringify(msg);
    expect(msg.text).toBe("Novo lead · Formulário Meta · Ana &lt;b&gt;Souza&lt;/b&gt;");
    expect(all).not.toContain("<b>");
    expect(all).toContain("<https://wa.me/5511912345678|(11) 91234-5678>");
    expect(all).toContain("Qual o objetivo do imóvel?: Aluguel por temporada");
    expect(all).toContain("campanha: Studios · Leads");
    expect(all).toContain("anúncio: Vídeo studio antes/depois");
    expect(all).toContain(ADMIN_META_LEADS_URL);
    expect(all).toContain("lead Meta 9990001");
    expect(all).toContain("id: db-uuid-1");
    expect(ADMIN_META_LEADS_URL).toBe("https://bewild.com.br/admin/leads?aba=meta");
  });

  it("Slack: lead de teste ganha outro título", () => {
    expect(buildMetaLeadSlackMessage({ ...row, is_test: true }, null).text).toContain("Lead de teste · Formulário Meta");
  });

  it("e-mail: mesmo modelo do site, canal meta, uma vez por lead", () => {
    const email = buildMetaLeadEmail(row);
    expect(email.idempotencyKey).toBe("meta-lead-email-9990001");
    expect(email.templateData).toMatchObject({
      channel: "meta",
      formLabel: "Novo lead · Formulário Meta — Orçamento reforma — setembro",
      name: "Ana <b>Souza</b>",
      whatsapp: "(11) 91234-5678",
      email: "ana.souza@exemplo.com",
      location: "São Paulo",
      waLink: "https://wa.me/5511912345678",
    });
    expect(email.templateData.message).toContain("Metragem aproximada: 32 m²");
    expect(email.templateData.origin).toContain("plataforma: Instagram");
  });

  it("CRM: source meta_ads + id da Meta (dedup com o webhook de Lead Ads do próprio CRM)", () => {
    const crm = buildMetaLeadCrmPayload(row, "db-uuid-1");
    expect(crm).toMatchObject({
      source: "meta_ads",
      external_id: "9990001",
      name: "Ana <b>Souza</b>",
      phone: "+5511912345678",
      campaign_id: "333",
      campaign_name: "Studios · Leads",
      adset_name: "SP 25-45",
      ad_name: "Vídeo studio antes/depois",
      form_id: "5550001",
      form_name: "Orçamento reforma — setembro",
      utm_source: "meta",
      utm_medium: "paid_social",
      utm_campaign: "Studios · Leads",
      city: "São Paulo",
    });
    expect(crm.extra).toMatchObject({ lead_type: "cliente", platform: "ig", site_meta_lead_id: "db-uuid-1" });
    expect(buildMetaLeadCrmPayload({ ...row, is_organic: true }, null).utm_medium).toBe("organic_social");
  });

  it("o endpoint do CRM é o mesmo do notify-lead", () => {
    const leadTs = readFileSync(resolve(__dirname, "../../../supabase/functions/notify-lead/lead.ts"), "utf8");
    expect(leadTs).toContain(`"${CRM_WEBHOOK_URL}"`);
  });
});

describe("cliente da Graph API", () => {
  function fakeFetch(responses: { status: number; body: unknown }[]) {
    const calls: { url: string; auth: string | null }[] = [];
    const impl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), auth: new Headers(init?.headers).get("authorization") });
      const r = responses.shift() ?? { status: 200, body: { data: [] } };
      return new Response(JSON.stringify(r.body), { status: r.status });
    });
    return { impl: impl as unknown as typeof fetch, calls };
  }

  it("token no cabeçalho, nunca na URL — nem quando a Meta devolve um `next` com ele", async () => {
    const { impl, calls } = fakeFetch([
      {
        status: 200,
        body: { data: [{ id: "1" }], paging: { next: `${GRAPH_BASE}/act_1/insights?after=abc&access_token=EAAsecretTOKEN123456` } },
      },
      { status: 200, body: { data: [{ id: "2" }] } },
    ]);
    const graph = createGraphClient({ token: "EAAsecretTOKEN123456", fetchImpl: impl });
    const res = await graph.getAll<{ id: string }>("act_1/insights", { level: "campaign", limit: 500 });
    expect(res).toEqual({ data: [{ id: "1" }, { id: "2" }], truncated: false });
    expect(calls[0].url).toBe(`${GRAPH_BASE}/act_1/insights?level=campaign&limit=500`);
    expect(calls[1].url).toBe(`${GRAPH_BASE}/act_1/insights?after=abc`);
    for (const c of calls) {
      expect(c.url).not.toContain("EAA");
      expect(c.auth).toBe("Bearer EAAsecretTOKEN123456");
    }
    expect(GRAPH_BASE).toBe("https://graph.facebook.com/v25.0");
  });

  it("corta em maxPages e avisa", async () => {
    const page = { status: 200, body: { data: [{ id: "x" }], paging: { next: `${GRAPH_BASE}/p?after=1` } } };
    const { impl } = fakeFetch([page, page, page]);
    const graph = createGraphClient({ token: "t", fetchImpl: impl });
    const res = await graph.getAll("p", {}, { maxPages: 2 });
    expect(res.data).toHaveLength(2);
    expect(res.truncated).toBe(true);
  });

  it("appsecret_proof = HMAC-SHA256(token, segredo)", async () => {
    const expected = createHmac("sha256", "s3cr3t").update("EAAtoken").digest("hex");
    expect(await appSecretProof("EAAtoken", "s3cr3t")).toBe(expected);
    const { impl, calls } = fakeFetch([{ status: 200, body: { id: "1" } }]);
    await createGraphClient({ token: "EAAtoken", appSecret: "s3cr3t", fetchImpl: impl }).get("me", { fields: "id" });
    expect(new URL(calls[0].url).searchParams.get("appsecret_proof")).toBe(expected);
  });

  it("erro da Meta vira GraphApiError com categoria e sem o token na mensagem", async () => {
    const { impl } = fakeFetch([
      {
        status: 400,
        body: {
          error: {
            message: "Error validating access token: EAAsecretTOKEN123456 expired",
            type: "OAuthException",
            code: 190,
            error_subcode: 463,
            fbtrace_id: "Tr4ce",
          },
        },
      },
    ]);
    const err = await createGraphClient({ token: "EAAsecretTOKEN123456", fetchImpl: impl })
      .get("me")
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GraphApiError);
    const g = err as GraphApiError;
    expect(g.reason).toBe("token_invalid");
    expect(g.code).toBe(190);
    expect(g.fbtraceId).toBe("Tr4ce");
    expect(g.message).not.toContain("EAAsecret");
    expect(g.summary()).toMatch(/^token_invalid: .*\(code 190\/463\)$/);
  });

  it("falha de rede e tempo esgotado", async () => {
    const net = createGraphClient({ token: "t", fetchImpl: (async () => Promise.reject(new TypeError("fail"))) as typeof fetch });
    expect(((await net.get("me").catch((e) => e)) as GraphApiError).reason).toBe("network");
    const timeoutErr = Object.assign(new Error("t"), { name: "TimeoutError" });
    const slow = createGraphClient({ token: "t", fetchImpl: (async () => Promise.reject(timeoutErr)) as typeof fetch });
    expect(((await slow.get("me").catch((e) => e)) as GraphApiError).reason).toBe("timeout");
  });

  it("categorias dos códigos de erro e texto para o painel", () => {
    expect(classifyGraphError(400, 190, null)).toBe("token_invalid");
    expect(classifyGraphError(400, 200, null)).toBe("permission");
    expect(classifyGraphError(400, 10, null)).toBe("permission");
    expect(classifyGraphError(400, 17, null)).toBe("rate_limit");
    expect(classifyGraphError(400, 80000, null)).toBe("rate_limit");
    expect(classifyGraphError(400, 100, 33)).toBe("not_found");
    expect(classifyGraphError(400, 100, null)).toBe("bad_request");
    expect(classifyGraphError(503, null, null)).toBe("server");
    expect(graphErrorHint("token_invalid")).toContain("expirou");
    expect(graphErrorHint("no_token")).toContain("META_ADS_ACCESS_TOKEN");
  });
});
