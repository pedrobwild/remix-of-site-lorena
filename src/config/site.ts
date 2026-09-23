// Flag global de manutenção do site público.
// true = site em manutenção (esconde toda rota pública, exceto /admin/* e as LPs /o e /p)
// false = site normal (pro lançamento)
export const MAINTENANCE_MODE = false;

// Assistente de dúvidas do site (src/components/assistant/SiteAssistant.tsx).
// false = desligado para o público; aparece só com ?assistente=1 na URL (teste interno).
// true = ligado para todos os visitantes.
export const ASSISTANT_ENABLED = true;

// Página /parceiros/incorporadoras (case Leal Moreira).
// false = fora do ar para o público: a rota responde como página não encontrada, fica fora do menu e do sitemap.
//         Prévia interna com ?incorporadoras=1 na URL (vale para a sessão; ?incorporadoras=0 desliga).
// true = publicada para todos.
export const INCORPORADORAS_PAGE_ENABLED = false;
