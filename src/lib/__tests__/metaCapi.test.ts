/**
 * Testa o módulo compartilhado das edge functions
 * (supabase/functions/_shared/meta-capi.ts). Ele é TS puro — sem `Deno.env`
 * nem imports `npm:` — justamente para rodar aqui no Vitest.
 */
import { describe, expect, it, vi } from "vitest";
import {
  AD_LEAD_FORMS,
  buildEventPayload,
  buildUserData,
  capiLogEntry,
  hasMatchKeys,
  isValidPixelId,
  META_GRAPH_VERSION,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  redactSecrets,
  resolveMetaCapiConfig,
  sanitizeTestEventCode,
  sendMetaEvents,
  sha256Hex,
  splitLocation,
  statusEventId,
  validIp,
} from "../../../supabase/functions/_shared/meta-capi";

describe("normalização (regras da Meta)", () => {
  it("e-mail: minúsculo, sem espaços; inválido vira null", () => {
    expect(normalizeEmail("  Ana.Silva@Gmail.com ")).toBe("ana.silva@gmail.com");
    expect(normalizeEmail("nao-e-email")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });

  it("telefone: só dígitos com DDI 55", () => {
    expect(normalizePhone("(11) 91234-5678")).toBe("5511912345678");
    expect(normalizePhone("11912345678")).toBe("5511912345678");
    expect(normalizePhone("+55 11 91234-5678")).toBe("5511912345678");
    expect(normalizePhone("55 011 91234-5678")).toBe("5511912345678");
    expect(normalizePhone("3512-3456")).toBeNull();
    expect(normalizePhone("+351 912 345 678")).toBe("351912345678");
  });

  it("nome: sem acento, minúsculo, sem pontuação", () => {
    expect(normalizeName("  João D'Ávila-Neto ")).toBe("joao davilaneto");
    expect(normalizeName("123")).toBeNull();
  });

  it("localização: cidade e UF quando dá", () => {
    expect(splitLocation("Vila Olímpia, São Paulo - SP")).toEqual({ city: "saopaulo", state: "sp" });
    expect(splitLocation("Belo Horizonte")).toEqual({ city: "belohorizonte", state: null });
    expect(splitLocation(null)).toEqual({ city: null, state: null });
  });

  it("sha256 bate com vetores conhecidos (hex minúsculo)", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(await sha256Hex("test@example.com")).toBe(
      "973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b",
    );
    expect(await sha256Hex("5511912345678")).toBe("eeff2a7b3fdffa242c44700da8293d40c64a070956a3cdac36a4553dd4786704");
  });

  it("IP, Pixel e código de teste só no formato esperado", () => {
    expect(validIp("189.10.20.30")).toBe("189.10.20.30");
    expect(validIp("2804:14c:1::1")).toBe("2804:14c:1::1");
    expect(validIp("unknown")).toBeNull();
    expect(validIp("999.1.1.1")).toBeNull();
    expect(isValidPixelId("123456789012345")).toBe(true);
    expect(isValidPixelId("12a")).toBe(false);
    expect(sanitizeTestEventCode(" TEST12345 ")).toBe("TEST12345");
    expect(sanitizeTestEventCode("TEST 1; drop")).toBeNull();
    expect(redactSecrets("token EAABsbCS1iHgBAKZC123456789 x?access_token=EAAB1&y=1")).toBe(
      "token EAA… x?access_token=…&y=1",
    );
  });

  it("formulários de cliente: parceiros e indicação ficam de fora", () => {
    expect(AD_LEAD_FORMS).toEqual(["/diagnostico", "/orcamento", "/contato", "/o", "/p"]);
    expect(META_GRAPH_VERSION).toBe("v25.0");
  });
});

describe("buildUserData", () => {
  it("hasheia PII, divide o nome em fn/ln e passa fbp/fbc/ip/ua em claro", async () => {
    const data = await buildUserData({
      email: "Ana@Ex.com",
      phone: "11 91234-5678",
      fullName: "Ana Maria Souza",
      externalId: "lead-1",
      fbp: "fb.1.1700000000000.42",
      fbc: "fb.1.1700000000000.IwAR0abc",
      clientIp: "200.1.2.3",
      clientUserAgent: "UA",
      city: "Campinas - SP",
    });
    expect(data.em).toEqual([await sha256Hex("ana@ex.com")]);
    expect(data.ph).toEqual([await sha256Hex("5511912345678")]);
    expect(data.fn).toEqual([await sha256Hex("ana")]);
    expect(data.ln).toEqual([await sha256Hex("souza")]);
    expect(data.ct).toEqual([await sha256Hex("campinas")]);
    expect(data.st).toEqual([await sha256Hex("sp")]);
    expect(data.country).toEqual([await sha256Hex("br")]);
    expect(data.external_id).toEqual([await sha256Hex("lead-1")]);
    expect(data.fbp).toBe("fb.1.1700000000000.42");
    expect(data.fbc).toBe("fb.1.1700000000000.IwAR0abc");
    expect(data.client_ip_address).toBe("200.1.2.3");
    expect(data.client_user_agent).toBe("UA");
    // Nada em claro além dos identificadores do Pixel.
    expect(JSON.stringify(data)).not.toMatch(/ana|souza|campinas|91234/i);
    expect(hasMatchKeys(data)).toBe(true);
  });

  it("bairro sem UF não vira cidade", async () => {
    const data = await buildUserData({ email: "a@b.co", city: "Pinheiros" });
    expect(data.ct).toBeUndefined();
    expect(data.st).toBeUndefined();
  });

  it("descarta fbp/fbc fora do formato e IP 'unknown'", async () => {
    const data = await buildUserData({ fbp: "x", fbc: "y", clientIp: "unknown" });
    expect(data.fbp).toBeUndefined();
    expect(data.fbc).toBeUndefined();
    expect(data.client_ip_address).toBeUndefined();
    expect(hasMatchKeys(data)).toBe(false);
  });
});

describe("sendMetaEvents", () => {
  const user = { email: "a@b.co", phone: "11912345678", fullName: "A B" };

  it("sem configuração → skipped e nenhuma chamada", async () => {
    const fetchImpl = vi.fn();
    const r = await sendMetaEvents(null, [{ eventName: "Lead", eventId: "e", actionSource: "website", user }]);
    expect(r).toEqual({ status: "skipped", reason: "no_config" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sem nenhum identificador → skipped (no_user_data)", async () => {
    const fetchImpl = vi.fn();
    const r = await sendMetaEvents({ pixelId: "1", accessToken: "t", fetchImpl }, [
      { eventName: "Lead", eventId: "e", actionSource: "website", user: { fullName: "Só Nome" } },
    ]);
    expect(r).toEqual({ status: "skipped", reason: "no_user_data" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("POST no endpoint do pixel (v25.0) com Bearer, event_id e test_event_code", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ events_received: 1, fbtrace_id: "tr1" }), { status: 200 }),
    );
    const r = await sendMetaEvents({ pixelId: "123456", accessToken: "tok", testEventCode: "TEST1", fetchImpl }, [
      {
        eventName: "Lead",
        eventId: "evt-1",
        eventTime: 1_700_000_000,
        actionSource: "website",
        eventSourceUrl: "https://bewild.com.br/orcamento",
        user,
        customData: { content_name: "/orcamento", content_category: null, utm_source: "" },
      },
    ]);
    expect(r).toEqual({ status: "sent", eventsReceived: 1, traceId: "tr1", httpStatus: 200 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://graph.facebook.com/v25.0/123456/events");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    const body = JSON.parse(String(init.body)) as {
      test_event_code: string;
      data: Array<Record<string, unknown>>;
    };
    expect(body.test_event_code).toBe("TEST1");
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      event_name: "Lead",
      event_id: "evt-1",
      event_time: 1_700_000_000,
      action_source: "website",
      event_source_url: "https://bewild.com.br/orcamento",
      custom_data: { content_name: "/orcamento" },
    });
    expect(String(init.body)).not.toContain("tok");
  });

  it("erro da Graph API vira status error com código e sem o token, sem lançar", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          error: { message: "Invalid OAuth access token EAABsbCS1iHgBAKZC123456789", type: "OAuthException", code: 190, fbtrace_id: "T2" },
        }),
        { status: 400 },
      ),
    );
    const r = await sendMetaEvents({ pixelId: "1", accessToken: "t", fetchImpl }, [
      { eventName: "QualifiedLead", eventId: "l:qualifiedlead", actionSource: "system_generated", user },
    ]);
    expect(r).toEqual({
      status: "error",
      reason: "Invalid OAuth access token EAA… (code 190)",
      httpStatus: 400,
      detail: {
        error_code: 190,
        error_type: "OAuthException",
        error_message: "Invalid OAuth access token EAA…",
        fbtrace_id: "T2",
      },
    });
  });

  it("200 com events_received = 0 não é sucesso", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ events_received: 0 }), { status: 200 }));
    const r = await sendMetaEvents({ pixelId: "1", accessToken: "t", fetchImpl }, [
      { eventName: "Lead", eventId: "e", actionSource: "website", user },
    ]);
    expect(r.status).toBe("error");
  });

  it("falha de rede vira status error", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const r = await sendMetaEvents({ pixelId: "1", accessToken: "t", fetchImpl }, [
      { eventName: "Lead", eventId: "e", actionSource: "website", user },
    ]);
    expect(r).toEqual({ status: "error", reason: "TypeError", httpStatus: null, detail: { reason: "network" } });
  });
});

describe("configuração e registro", () => {
  const env = (values: Record<string, string>) => (name: string) => values[name];

  it("token do CAPI (ou do Ads), Pixel do segredo ou do site, código de teste do admin", () => {
    expect(resolveMetaCapiConfig(env({}), { meta_pixel_id: "123456789012345" })).toEqual({
      config: null,
      reason: "no_token",
    });
    expect(resolveMetaCapiConfig(env({ META_CAPI_ACCESS_TOKEN: "t" }), { meta_pixel_id: "x" })).toEqual({
      config: null,
      reason: "no_pixel",
    });
    expect(
      resolveMetaCapiConfig(env({ META_ADS_ACCESS_TOKEN: "ads" }), {
        meta_pixel_id: " 123456789012345 ",
        meta_capi_test_event_code: "TEST99",
      }),
    ).toEqual({ config: { pixelId: "123456789012345", accessToken: "ads", testEventCode: "TEST99" }, reason: null });
    expect(
      resolveMetaCapiConfig(
        env({ META_CAPI_ACCESS_TOKEN: "capi", META_ADS_ACCESS_TOKEN: "ads", META_PIXEL_ID: "99999", META_CAPI_TEST_EVENT_CODE: "TEST1" }),
        null,
      ),
    ).toEqual({ config: { pixelId: "99999", accessToken: "capi", testEventCode: "TEST1" }, reason: null });
  });

  it("linha do integration_log sem dados pessoais", () => {
    expect(capiLogEntry({ status: "sent", eventsReceived: 1, traceId: "tr", httpStatus: 200 }, { test: true })).toEqual({
      status: "sent",
      http_status: 200,
      detail: { events_received: 1, fbtrace_id: "tr", test: true },
    });
    expect(capiLogEntry({ status: "skipped", reason: "no_user_data" })).toEqual({
      status: "skipped",
      http_status: null,
      detail: { reason: "no_user_data" },
    });
    expect(
      capiLogEntry({ status: "error", reason: "x", httpStatus: 400, detail: { error_code: 190 } }),
    ).toEqual({ status: "error", http_status: 400, detail: { error_code: 190 } });
  });
});

describe("helpers", () => {
  it("statusEventId é determinístico por lead e evento", () => {
    expect(statusEventId("abc", "QualifiedLead")).toBe("abc:qualifiedlead");
  });

  it("buildEventPayload omite custom_data vazio", async () => {
    const p = await buildEventPayload({ eventName: "Lead", eventId: "e", actionSource: "website", user: { email: "a@b.co" }, customData: { x: null } });
    expect(p.custom_data).toBeUndefined();
    expect(typeof p.event_time).toBe("number");
  });
});
