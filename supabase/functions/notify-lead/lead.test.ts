// Testes da lógica pura do notify-lead (sem rede).
//   deno test --no-config supabase/functions/notify-lead/lead.test.ts

import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  buildCrmPayload,
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
