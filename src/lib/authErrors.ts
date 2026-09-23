/**
 * Mensagens de erro de login do Supabase Auth em português.
 * Usa o `code` (supabase-js ≥ 2.40) e, na falta dele, o texto em inglês.
 */
type AuthErrorLike = { message?: string; code?: string; status?: number; name?: string } | null | undefined;

const BY_CODE: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Este e-mail ainda não foi confirmado. Abra o link de confirmação enviado para a sua caixa de entrada.",
  user_not_found: "E-mail ou senha incorretos.",
  user_banned: "Esta conta está bloqueada. Fale com o responsável pelo painel.",
  over_request_rate_limit: "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.",
  over_email_send_rate_limit: "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.",
  validation_failed: "Confira o e-mail e a senha digitados.",
  email_address_invalid: "O e-mail digitado não é válido.",
};

const BY_TEXT: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/email not confirmed/i, BY_CODE.email_not_confirmed],
  [/user (is )?banned/i, BY_CODE.user_banned],
  [/rate limit|too many requests/i, BY_CODE.over_request_rate_limit],
  [/failed to fetch|network ?error|load failed|fetch failed/i, "Sem conexão com o servidor. Verifique sua internet e tente de novo."],
  [/unable to validate email address|invalid email/i, BY_CODE.email_address_invalid],
  [/password should be at least/i, "A senha precisa ter pelo menos 6 caracteres."],
];

export function translateAuthError(error: AuthErrorLike): string {
  if (!error) return "Não foi possível entrar. Tente de novo.";
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];
  const msg = error.message ?? "";
  for (const [re, text] of BY_TEXT) if (re.test(msg)) return text;
  if (error.status === 429) return BY_CODE.over_request_rate_limit;
  if (error.status && error.status >= 500) {
    return "O serviço de login está instável agora. Tente de novo em instantes.";
  }
  return msg ? `Não foi possível entrar: ${msg}` : "Não foi possível entrar. Tente de novo.";
}
