/**
 * Provas numéricas da Bewild — fonte ÚNICA de todo número de prova social do
 * site (home, FAQ, LPs, páginas de serviço, rodapés de CTA, guia do investidor).
 *
 * Regra: só entra aqui número com origem declarada. Para atualizar, mude o
 * valor E a origem nesta linha; nenhuma página escreve o número à mão
 * (guardado por src/__tests__/provasUnicas.test.ts).
 *
 * Atenção à diferença entre os dois números de volume:
 *  - REFORMAS_ENTREGUES conta obras ENTREGUES (prova oficial, base
 *    docs/internal/gpt-knowledge/01_fonte_de_verdade.md, 24/08/2026).
 *  - CONTRATOS_ANALISADOS conta CONTRATOS da base de custo (estudo "quanto
 *    custa reformar até 50 m²"). Inclui obras em andamento: nunca escreva
 *    "188 reformas entregues".
 */

/** Reformas entregues (prova oficial de 24/08/2026). */
export const REFORMAS_ENTREGUES = 160;

/** Projetos feitos (prova oficial de 24/08/2026). */
export const PROJETOS = 200;

/** Contratos da base de custo da Bewild (só para falar de preço/custo). */
export const CONTRATOS_ANALISADOS = 188;

/** Bairros de São Paulo com obra entregue. */
export const BAIRROS_ATENDIDOS = 27;

/** "+160 reformas entregues" */
export const PROVA_REFORMAS = `+${REFORMAS_ENTREGUES} reformas entregues`;

/** "+160 reformas entregues · +200 projetos" — selo curto dos CTAs. */
export const PROVA_CURTA = `${PROVA_REFORMAS} · +${PROJETOS} projetos`;

/** "mais de 160 reformas entregues" — para usar no meio de frases. */
export const PROVA_FRASE = `mais de ${REFORMAS_ENTREGUES} reformas entregues`;
