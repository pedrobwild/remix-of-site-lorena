// Edge function: faq-answer — DESATIVADA em 09/10/2026.
//
// Respondia a pergunta livre da página /faq ("Pergunte à Bewild") via Lovable
// AI Gateway. Mesmo com o formulário visível só para quem estava logado, o
// endpoint era público (verify_jwt = false) e qualquer um podia chamar e
// gastar créditos de IA, o mesmo achado de segurança da scope-plan. A decisão
// foi desligar: a /faq agora leva direto para orçamento e WhatsApp.
//
// Este stub fica no lugar do código antigo para que a cópia publicada no
// Lovable Cloud deixe de chamar a IA mesmo que a função não seja apagada do
// projeto: responde 410 (Gone) e não lê corpo, segredo nem banco.

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return new Response(JSON.stringify({ error: "gone", message: "Este recurso foi desativado." }), {
    status: 410,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
