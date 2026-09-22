// Flag global de manutenção do site público.
// true = site em manutenção (esconde toda rota pública, exceto /admin/* e as LPs /o e /p)
// false = site normal (pro lançamento)
export const MAINTENANCE_MODE = false;

// Assistente de dúvidas do site (src/components/assistant/SiteAssistant.tsx).
// false = desligado para o público; aparece só com ?assistente=1 na URL (teste interno).
// true = ligado para todos os visitantes.
export const ASSISTANT_ENABLED = false;
