// Testes da API de Conversões do Meta (lógica pura, sem rede).
//   deno test --no-config supabase/functions/notify-lead/metaCapi.test.ts

import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  AD_LEAD_FORMS,
  buildCapiBody,
  buildLeadEvent,
  isValidPixelId,
  normalizeEmail,
  normalizePhone,
  redactSecrets,
  sanitizeTestEventCode,
  sha256Hex,
  splitName,
  summarizeCapiResponse,
  validIp,
} from "./metaCapi.ts";

// SHA-256 conferidos fora daqui (Python hashlib).
const H = {
  email: "973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b", // test@example.com
  phone: "eeff2a7b3fdffa242c44700da8293d40c64a070956a3cdac36a4553dd4786704", // 5511912345678
  ana: "24d4b96f58da6d4a8512313bbd02a28ebf0ca95dec6e4c86ef78ce7f01e788ac",
  souza: "8c26ceccea7016553a9644db9550ae571edaafebdfce4d5332934d942f4837ab",
  joao: "d147147c3dcbe0ac2756b42297dd7f013f8b2fa6178e209c3f74dc7d752243ef", // joão (UTF-8)
  br: "885036a0da3dff3c3e05bc79bf49382b12bc5098514ed57ce0875aba1aa2c40d",
  dbId: "6e2bfaebe75af0d244b6946afc8de784321476e6802d9aa50aa985b42884642a", // db-id
};

Deno.test("sha256Hex: hex minúsculo, igual ao hashlib", async () => {
  assertEquals(await sha256Hex("test@example.com"), H.email);
  assertEquals(await sha256Hex("joão"), H.joao);
});

Deno.test("normalização: e-mail minúsculo, telefone com DDI 55, nome só letras", () => {
  assertEquals(normalizeEmail("  Test@Example.COM "), "test@example.com");
  assertEquals(normalizeEmail("sem-arroba"), null);
  assertEquals(normalizePhone("11912345678"), "5511912345678");
  assertEquals(normalizePhone("(11) 3456-7890"), "551134567890");
  assertEquals(normalizePhone("123"), null);
  assertEquals(splitName("  Ana Maria de Souza "), { fn: "ana", ln: "souza" });
  assertEquals(splitName("João"), { fn: "joão", ln: null });
  assertEquals(splitName("D'Ávila-Neto"), { fn: "dávilaneto", ln: null });
  assertEquals(splitName(""), { fn: null, ln: null });
});

Deno.test("validIp aceita v4/v6 e descarta o resto", () => {
  assertEquals(validIp("189.10.20.30"), "189.10.20.30");
  assertEquals(validIp("2804:14c:1::1"), "2804:14c:1::1");
  assertEquals(validIp("unknown"), null);
  assertEquals(validIp("999.1.1.1"), null);
  assertEquals(validIp(null), null);
});

Deno.test("evento Lead: hash onde o Meta pede, sem hash em IP/UA/fbp/fbc", async () => {
  const ev = await buildLeadEvent({
    eventId: "8f0c2b1e-1111-4222-8333-944455556666",
    eventTimeS: 1_790_000_000,
    formPath: "/orcamento",
    formLabel: "Orçamento",
    email: "Test@Example.com",
    phoneDigits: "11912345678",
    name: "Ana Souza",
    externalId: "db-id",
    clientIp: "189.10.20.30",
    userAgent: "Mozilla/5.0 (iPhone)",
    fbp: "fb.1.1790000000000.123456789",
    fbc: "fb.1.1790000000000.IwAR3abc_def-1",
  });
  assertEquals(ev.event_name, "Lead");
  assertEquals(ev.event_id, "8f0c2b1e-1111-4222-8333-944455556666");
  assertEquals(ev.action_source, "website");
  assertEquals(ev.event_source_url, "https://bewild.com.br/orcamento");
  assertEquals(ev.event_time, 1_790_000_000);
  assertEquals(ev.user_data, {
    em: [H.email],
    ph: [H.phone],
    fn: [H.ana],
    ln: [H.souza],
    country: [H.br],
    external_id: [H.dbId],
    client_ip_address: "189.10.20.30",
    client_user_agent: "Mozilla/5.0 (iPhone)",
    fbp: "fb.1.1790000000000.123456789",
    fbc: "fb.1.1790000000000.IwAR3abc_def-1",
  });
  assertEquals(ev.custom_data, { content_name: "Orçamento", content_category: "/orcamento" });
  // Nada de dado pessoal em claro no corpo.
  const body = JSON.stringify(buildCapiBody(ev, null));
  assert(!body.includes("test@example.com"));
  assert(!body.includes("11912345678"));
  assert(!body.toLowerCase().includes("souza"));
  assert(!body.includes("test_event_code"));
});

Deno.test("evento sem e-mail, nome ou IP válido: só o que existe", async () => {
  const ev = await buildLeadEvent({
    eventId: "abcdefgh12",
    eventTimeS: 1,
    formPath: "/o",
    formLabel: "LP Obra (QR)",
    email: null,
    phoneDigits: "11912345678",
    name: null,
    externalId: null,
    clientIp: "unknown",
    userAgent: "UA",
    fbp: null,
    fbc: null,
  });
  assertEquals(Object.keys(ev.user_data).sort(), ["client_user_agent", "country", "ph"]);
});

Deno.test("código de teste só no formato do Meta; Pixel só numérico", () => {
  assertEquals(buildCapiBody({} as never, "TEST12345"), { data: [{}], test_event_code: "TEST12345" });
  assertEquals(sanitizeTestEventCode(" TEST12345 "), "TEST12345");
  assertEquals(sanitizeTestEventCode("x"), null);
  assertEquals(sanitizeTestEventCode("TEST 1; drop"), null);
  assert(isValidPixelId("123456789012345"));
  assert(!isValidPixelId("12a"));
  assert(!isValidPixelId(null));
});

Deno.test("resposta do Meta vira resumo sem dados pessoais e sem token", () => {
  assertEquals(summarizeCapiResponse(200, { events_received: 1, messages: [], fbtrace_id: "AbC" }), {
    status: "sent",
    detail: { events_received: 1, fbtrace_id: "AbC" },
  });
  const err = summarizeCapiResponse(400, {
    error: {
      message: "Invalid OAuth access token - Cannot parse access token EAABsbCS1iHgBAKZC123456789",
      type: "OAuthException",
      code: 190,
      fbtrace_id: "XyZ",
    },
  });
  assertEquals(err.status, "error");
  assertEquals(err.detail.error_code, 190);
  assertEquals(err.detail.error_type, "OAuthException");
  assertEquals(err.detail.fbtrace_id, "XyZ");
  assert(!String(err.detail.error_message).includes("EAABsbCS1iHgBAKZC123456789"));
  // 200 sem events_received não é sucesso.
  assertEquals(summarizeCapiResponse(200, {}).status, "error");
  assertEquals(summarizeCapiResponse(502, null).status, "error");
  assertEquals(redactSecrets("x?access_token=EAAB123&y=1"), "x?access_token=…&y=1");
});

Deno.test("formulários de cliente: parceiros e indicação ficam de fora", () => {
  assert(AD_LEAD_FORMS.includes("/orcamento"));
  assert(AD_LEAD_FORMS.includes("/contato"));
  assert(!AD_LEAD_FORMS.includes("/parceiros"));
  assert(!AD_LEAD_FORMS.includes("/parceiros/incorporadoras"));
  assert(!AD_LEAD_FORMS.includes("/indique-um-amigo"));
});
