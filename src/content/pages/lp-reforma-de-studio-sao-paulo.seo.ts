/**
 * Título, descrição e caminho da LP dos anúncios, usados pelo `head()` da
 * rota. Separados do conteúdo (`lp-reforma-de-studio-sao-paulo.ts`) porque o
 * `head()` entra no pacote inicial de toda página e o conteúdo da LP arrasta
 * o da página de studio, as fotos da home e as provas.
 */
import { CONTRATOS_ANALISADOS } from "@/content/provas";
import { CUSTO_M2_MEDIANO } from "@/content/baseCusto";

export const LP_PATH = "/lp/reforma-de-studio-sao-paulo";

/** Mesmo título da página orgânica (handoff, seção 7). */
export const LP_TITLE = "Reforma de studio em São Paulo | Bewild";
export const LP_DESCRIPTION =
  `Reforma completa de studio em São Paulo entregue pronta para alugar ou anunciar no Airbnb: projeto, obra, marcenaria, mobília e eletros num contrato de preço fechado. Mediana de ${CUSTO_M2_MEDIANO}/m² em ${CONTRATOS_ANALISADOS} contratos.`;
