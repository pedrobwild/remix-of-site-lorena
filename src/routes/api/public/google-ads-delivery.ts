import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const input = z.object({ id: z.string().uuid(), token: z.string().uuid() }).strict();
export const Route = createFileRoute("/api/public/google-ads-delivery")({ server: { handlers: { POST: async ({ request }) => {
  if (Number(request.headers.get("content-length") ?? 0) > 512) return Response.json({ error: "pedido_invalido" }, { status: 413 });
  let body: z.infer<typeof input>;
  try { body = input.parse(await request.json()); } catch { return Response.json({ error: "pedido_invalido" }, { status: 400 }); }
  // Capacidade aleatória por evento: claim verifica token, estado e ativação antes de ler o lead.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { processGoogleAdsDelivery } = await import("@/lib/googleAdsDelivery.server");
  const result = await processGoogleAdsDelivery(supabaseAdmin, body.id, body.token, key => process.env[key]);
  return Response.json({ outcome: result.outcome }, { status: result.status, headers: { "Cache-Control": "no-store" } });
} } } });