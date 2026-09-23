/**
 * content.ts — contato oficial da Bewild, usado em todo o site público.
 *
 * Este arquivo era a "fonte de verdade" da landing antiga (textos, métricas,
 * cases, FAQ). Aqueles componentes foram removidos e os dados que sobraram
 * contradiziam o site no ar (ex.: "10+ anos" de garantia na marcenaria, que
 * o site promete em 5 anos), então só ficou o que as páginas atuais importam.
 */

/** Contato oficial. */
export const CONTACT = {
  whatsappNumber: "5511911906183",
  whatsappText: "Olá, quero um orçamento para o meu studio",
  email: "contato@bewild.com.br",
  instagram: "https://instagram.com/bewild.oficial",
  city: "São Paulo, Brasil",
};

/** Link do WhatsApp oficial com a mensagem já escrita. */
export function whatsappHref(text: string = CONTACT.whatsappText): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
