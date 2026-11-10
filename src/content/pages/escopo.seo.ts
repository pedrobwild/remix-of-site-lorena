/**
 * Título, descrição e caminho de /escopo, usados pelo `head()` da rota e pelo
 * `useSeo` da página (mesmo texto no servidor e no cliente). Separados do
 * conteúdo (`escopo.ts`) porque o `head()` entra no pacote inicial de toda
 * página; o conteúdo e o FAQPage chegam pelo loader (import dinâmico).
 *
 * Papel da página (D4 do Pedro, auditoria de SEO rodada 4, 09/11/2026):
 * entender e montar o escopo. Preço por m² da base inteira é do Índice
 * (/indice-de-custo-de-reforma); o valor do imóvel é do pedido de orçamento.
 */
import { CONTRATOS_ANALISADOS } from "@/content/provas";

export const ESCOPO_PATH = "/escopo";

export const ESCOPO_TITLE = "Escopo de reforma: o que entra na reforma completa | Bewild";

export const ESCOPO_DESCRIPTION = `O que entra e o que não entra na reforma completa da Bewild, faixas por metragem de ${CONTRATOS_ANALISADOS} contratos e 4 perguntas para montar o escopo do seu imóvel.`;
