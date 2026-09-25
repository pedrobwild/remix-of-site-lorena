// Testes da lógica pura do notify-lead (sem rede).
//   deno test --no-config supabase/functions/notify-lead/lead.test.ts

import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  buildCrmPayload,
  buildLeadEmail,
  buildSlackMessage,
  FIELD_LIMITS,
  leadSchema,
  normalizeBrPhoneDigits,
  sanitizeLead,
  slackEscape,
} from "./lead.ts";

const parse = (body: unknown) => {
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) throw new Error("schema recusou um payload válido");
  return sanitizeLead(parsed.data);
};

Deno.test("campos longos são cortados, não derrubam o lead", () => {
  const lead = parse({ name: "n".repeat(500), whatsapp: "11912345678", message: "m".repeat(9000) });
  assertEquals(lead.name.length, FIELD_LIMITS.name);
  assertEquals(lead.message?.length, FIELD_LIMITS.message);
});

Deno.test("chaves desconhecidas são ignoradas (cliente mais novo não quebra a função)", () => {
  const parsed = leadSchema.safeParse({ name: "Ana", whatsapp: "11912345678", campo_novo: 1 });
  assert(parsed.success);
});

Deno.test("e-mail inválido vai para a mensagem em vez de recusar o lead", () => {
  const lead = parse({ name: "Ana", whatsapp: "11912345678", email: "joão@exemplo", message: "Oi" });
  assertEquals(lead.email, null);
  assert(lead.message?.includes("E-mail informado: joão@exemplo"));
});

Deno.test("telefone com DDI/tronco é normalizado antes do corte", () => {
  assertEquals(normalizeBrPhoneDigits("+55 11 91234-5678"), "11912345678");
  assertEquals(normalizeBrPhoneDigits("011 91234-5678"), "11912345678");
  assertEquals(normalizeBrPhoneDigits("(55) 99123-4567"), "55991234567");
});

Deno.test("form_path só aceita formulários conhecidos", () => {
  assertEquals(parse({ whatsapp: "11912345678", form_path: "/contato" }).form_path, "/contato");
  assertEquals(parse({ whatsapp: "11912345678", form_path: "/qualquer" }).form_path, null);
});

Deno.test("metragem decimal (vírgula ou ponto) vira inteiro", () => {
  assertEquals(parse({ whatsapp: "11912345678", area_m2: "32,5" }).area_m2, 33);
  assertEquals(parse({ whatsapp: "11912345678", area_m2: 27.4 }).area_m2, 27);
  assertEquals(parse({ whatsapp: "11912345678", area_m2: -5 }).area_m2, null);
});

Deno.test("Slack: texto do usuário não injeta menções nem links", () => {
  assertEquals(slackEscape("<!channel> & <https://x|y>"), "&lt;!channel&gt; &amp; &lt;https://x|y&gt;");
  const lead = parse({
    name: "<!channel> URGENTE",
    whatsapp: "11999999999|x> <!here",
    message: "<https://phish.example|Ver proposta aprovada>",
  });
  const serialized = JSON.stringify(buildSlackMessage(lead, "id-1"));
  assert(!serialized.includes("<!channel>"));
  assert(!serialized.includes("<!here>"));
  assert(!serialized.includes("<https://phish.example|"));
  // O rótulo do link do WhatsApp só tem dígitos.
  assert(serialized.includes("<https://wa.me/5511999999999|11999999999>"));
});

Deno.test("Slack: mensagem gigante não passa do limite de bloco", () => {
  const lead = parse({ whatsapp: "11912345678", message: "x".repeat(4000) });
  const msg = buildSlackMessage(lead, null) as { blocks: Array<{ text?: { text?: string } }> };
  for (const block of msg.blocks) {
    assert((block.text?.text?.length ?? 0) <= 3000);
  }
});

Deno.test("CRM recebe o lead saneado e só o id gerado pelo banco", () => {
  const lead = parse({ name: " Ana ", whatsapp: "+55 11 91234-5678", form_path: "/parceiros", id: "forjado" });
  const crm = buildCrmPayload(lead, "db-id");
  assertEquals(crm.name, "Ana");
  assertEquals(crm.phone, "+5511912345678");
  assertEquals(crm.extra.lead_id, "db-id");
  assertEquals(crm.extra.lead_type, "parceiro");
  assertEquals(crm.extra.form_path, "/parceiros");
});

Deno.test("indicação (Indique um amigo) é reconhecida e marcada no CRM", () => {
  const lead = parse({ name: "Ana", whatsapp: "11912345678", form_path: "/indique-um-amigo" });
  assertEquals(lead.form_path, "/indique-um-amigo");
  assertEquals(buildCrmPayload(lead, null).extra.lead_type, "indicacao");
});

Deno.test("e-mail: rótulo pelo formulário, idempotência pelo id do banco", () => {
  const lead = parse({ name: "Ana", whatsapp: "+55 11 91234-5678", form_path: "/contato", utm_source: "google" });
  const { idempotencyKey, templateData } = buildLeadEmail(lead, "db-id");
  assertEquals(idempotencyKey, "lead-email-db-id");
  assertEquals(templateData.formLabel, "Novo lead · Contato");
  assertEquals(templateData.whatsapp, "11912345678");
  assertEquals(templateData.waLink, "https://wa.me/5511912345678");
  assert(templateData.origin?.includes("formulário: /contato"));
  assert(templateData.origin?.includes("utm_source: google"));
  // Sem id do banco não há chave: cada tentativa é um envio novo.
  assertEquals(buildLeadEmail(lead, null).idempotencyKey, undefined);
});

Deno.test("atribuição completa: termo, conteúdo, 1º toque e cliques de anúncio", () => {
  const lead = parse({
    whatsapp: "11912345678",
    form_path: "/orcamento",
    utm_source: "meta",
    utm_medium: "cpc",
    utm_campaign: "studios-set",
    utm_term: "reforma studio",
    utm_content: "video-a",
    first_utm_source: "google",
    first_utm_medium: "organic",
    gclid: "Cj0KCQjw_abc-123",
    fbclid: "IwAR3xyz_1-2",
  });
  assertEquals(lead.utm_term, "reforma studio");
  assertEquals(lead.utm_content, "video-a");
  assertEquals(lead.first_utm_source, "google");
  assertEquals(lead.first_utm_campaign, null);
  assertEquals(lead.gclid, "Cj0KCQjw_abc-123");
  assertEquals(lead.fbclid, "IwAR3xyz_1-2");
  const origin = buildLeadEmail(lead, null).templateData.origin ?? "";
  assert(origin.includes("utm_term: reforma studio"));
  assert(origin.includes("1º toque: google / organic / —"));
  assert(origin.includes("clique de anúncio: Google Ads"));
  assert(origin.includes("clique de anúncio: Meta"));
  const crm = buildCrmPayload(lead, null);
  assertEquals(crm.extra.gclid, "Cj0KCQjw_abc-123");
  assertEquals(crm.extra.first_utm_source, "google");
});

Deno.test("1º toque igual ao último não repete a linha de origem", () => {
  const lead = parse({
    whatsapp: "11912345678",
    utm_source: "meta",
    utm_medium: "cpc",
    utm_campaign: "x",
    first_utm_source: "meta",
    first_utm_medium: "cpc",
    first_utm_campaign: "x",
  });
  assert(!(buildLeadEmail(lead, null).templateData.origin ?? "").includes("1º toque"));
});

Deno.test("ids fora do formato são descartados sem derrubar o lead", () => {
  const lead = parse({
    whatsapp: "11912345678",
    gclid: "abc<script>",
    fbclid: "a b",
    event_id: "curto",
    consent_marketing: true,
    fbp: "fb.1.123.abc",
    fbc: "qualquer",
  });
  assertEquals(lead.gclid, null);
  assertEquals(lead.fbclid, null);
  assertEquals(lead.event_id, null);
  assertEquals(lead.fbp, null);
  assertEquals(lead.fbc, null);
});

Deno.test("_fbp/_fbc só com aceite de cookies; event_id válido passa", () => {
  const body = {
    whatsapp: "11912345678",
    fbp: "fb.1.1790000000000.123456789",
    fbc: "fb.1.1790000000000.IwAR3abc",
    event_id: "8f0c2b1e-1111-4222-8333-944455556666",
  };
  const semAceite = parse({ ...body, consent_marketing: false });
  assertEquals(semAceite.consent_marketing, false);
  assertEquals(semAceite.fbp, null);
  assertEquals(semAceite.fbc, null);
  assertEquals(semAceite.event_id, "8f0c2b1e-1111-4222-8333-944455556666");

  const semInfo = parse(body); // cliente antigo: não sabemos do aceite
  assertEquals(semInfo.consent_marketing, null);
  assertEquals(semInfo.fbp, null);

  const comAceite = parse({ ...body, consent_marketing: true });
  assertEquals(comAceite.fbp, "fb.1.1790000000000.123456789");
  assertEquals(comAceite.fbc, "fb.1.1790000000000.IwAR3abc");
});

Deno.test("incorporadoras: formulário reconhecido e marcado como parceiro", () => {
  const lead = parse({ name: "Carla", whatsapp: "11912345678", form_path: "/parceiros/incorporadoras" });
  assertEquals(lead.form_path, "/parceiros/incorporadoras");
  assertEquals(buildCrmPayload(lead, null).extra.lead_type, "parceiro");
  assertEquals(buildLeadEmail(lead, null).templateData.formLabel, "Novo lead · Parceria incorporadora");
});

Deno.test("e-mail: parceria mantém o rótulo próprio", () => {
  const lead = parse({ whatsapp: "11912345678", form_path: "/parceiros", objetivo: "Parceria comercial — Corretor" });
  assertEquals(buildLeadEmail(lead, null).templateData.formLabel, "Nova solicitação de parceria · /parceiros");
});
