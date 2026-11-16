/**
 * Provas numéricas da Bewild — fonte ÚNICA de todo número de prova social do
 * site (home, FAQ, LPs, páginas de serviço, rodapés de CTA, guia do investidor).
 *
 * Regra: só entra aqui número com origem declarada. Para atualizar, mude o
 * valor E a origem nesta linha; nenhuma página escreve o número à mão
 * (guardado por src/__tests__/provasUnicas.test.ts).
 *
 * Atenção à diferença entre os três números de volume:
 *  - REFORMAS_ENTREGUES conta obras ENTREGUES (prova oficial, base
 *    docs/internal/gpt-knowledge/01_fonte_de_verdade.md, 24/08/2026).
 *  - ORCAMENTOS_ANALISADOS conta ORÇAMENTOS da base de custo oficial desde
 *    16/11/2026 (Índice Bewild, edição de novembro de 2026): a última versão
 *    publicada de cada negócio do Bwild Engine, com metragem, a partir de
 *    R$ 50 mil e até 45 m². A maior parte não virou contrato: nunca escreva
 *    "585 contratos" nem "585 reformas".
 *  - CONTRATOS_ANALISADOS conta os CONTRATOS do estudo anterior (planilha de
 *    out/2026), guardado em src/content/estudoContratos2026.ts. Só para falar
 *    daquele estudo; o custo que o site publica vem de ORCAMENTOS_ANALISADOS.
 */

/** Reformas entregues (prova oficial de 24/08/2026). */
export const REFORMAS_ENTREGUES = 160;

/** Projetos feitos (prova oficial de 24/08/2026). */
export const PROJETOS = 200;

/** Orçamentos da base de custo da Bewild (só para falar de preço/custo). Decisão do Pedro em 16/11/2026. */
export const ORCAMENTOS_ANALISADOS = 585;

/** Contratos do estudo anterior (planilha de out/2026), mantido como histórico em estudoContratos2026.ts. */
export const CONTRATOS_ANALISADOS = 188;

/** Bairros de São Paulo com obra entregue. */
export const BAIRROS_ATENDIDOS = 27;

/** Clientes que reformam para short stay — base de clientes da Bewild, publicação aprovada pelo Pedro em 17/10/2026. */
export const CLIENTES_SHORT_STAY_PCT = 79;

/** Clientes que moram fora da capital — estudo de 188 contratos (out/2026); Pedro confirmou 59% em 18/10 e 26/10/2026 (antes o site usava 48%) e, em 16/11/2026, que o perfil vale para o todo dos clientes. */
export const CLIENTES_FORA_DA_CAPITAL_PCT = 59;

/** Clientes que chegam por indicação — base de clientes da Bewild, publicação aprovada pelo Pedro em 17/10/2026 (o número já estava nos anúncios do Google). */
export const CLIENTES_INDICACAO_PCT = 40;

/** "+160 reformas entregues" */
export const PROVA_REFORMAS = `+${REFORMAS_ENTREGUES} reformas entregues`;

/** "+160 reformas entregues · +200 projetos" — selo curto dos CTAs. */
export const PROVA_CURTA = `${PROVA_REFORMAS} · +${PROJETOS} projetos`;

/** "mais de 160 reformas entregues" — para usar no meio de frases. */
export const PROVA_FRASE = `mais de ${REFORMAS_ENTREGUES} reformas entregues`;
