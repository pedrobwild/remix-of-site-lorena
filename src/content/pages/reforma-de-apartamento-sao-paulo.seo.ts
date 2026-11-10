/**
 * Título e descrição de /reforma-de-apartamento-sao-paulo, num módulo pequeno
 * para o `head()` da rota (que entra no pacote inicial de toda página) ter o
 * mesmo texto mesmo sem os dados do loader. O conteúdo da página
 * (`reforma-de-apartamento-sao-paulo.tsx`) reexporta estas constantes, usadas
 * também pelo `useSeo` da página: servidor e navegador dizem o mesmo.
 *
 * Rodada 4 da auditoria de SEO (09/11/2026, ação 9): a página tinha 274
 * impressões com CTR de 1,8% na posição 6,0, e "empresa de reforma de
 * apartamento" aparecia na posição 5 a 7. O título passa a abrir com a busca
 * e a levar uma prova que o site já publica (5 anos de garantia, em contrato).
 * Até 60 caracteres no título e 155 na descrição.
 */
export const SEO_TITLE = "Empresa de reforma de apartamento em SP: 5 anos de garantia";
export const SEO_DESCRIPTION =
  "Reforma de apartamento em São Paulo, inclusive apartamento pequeno: projeto 3D, obra, marcenaria e mobília, com preço fechado e prazo em contrato.";
