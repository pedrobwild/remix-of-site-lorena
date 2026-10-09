// Edge function: scope-plan — DESATIVADA em 09/10/2026.
//
// Gerava a recomendação de escopo da página /escopo ("Escopo com IA") via
// Lovable AI Gateway, sem login. O scan de segurança do Lovable apontou como
// crítico ("Anyone can use your paid scope recommendations"): qualquer um
// podia chamar e gastar créditos de IA. A página quase não tinha uso (1 visita
// em 90 dias, 0 chamadas em 5 dias) e saiu do ar; /escopo faz 301 para
// /orcamento.
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
