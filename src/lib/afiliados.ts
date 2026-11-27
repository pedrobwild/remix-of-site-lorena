/**
 * Catálogo de produtos afiliados do Mercado Livre (26/11/2026, pedido do Pedro).
 *
 * Uma lista única, mantida em /admin/afiliados (tabela `produtos_afiliados`),
 * alimenta o cartão de produto dentro dos artigos (`articleAffiliates.ts`) e a
 * página /produtos-recomendados. Link de afiliado só aparece nesses dois
 * lugares: nunca na home, no /orcamento, nas LPs ou nas páginas de serviço.
 * Desde 27/11/2026 (pedido do Pedro) o cartão tem cara de anúncio: foto do
 * próprio anúncio do Mercado Livre e preço com a data da consulta.
 *
 * Leitura pública sem o SDK do Supabase (`publicSelect`): este módulo é
 * importado pelo loader do artigo, que entra no pacote inicial.
 */
import { publicSelect } from "@/integrations/supabase/publicRest";
import { serverMemo } from "@/lib/serverMemo";

export type PerfilAfiliado = "investidor" | "moradia" | "ambos";

export type ProdutoAfiliado = {
  id: string;
  slug: string;
  nome: string;
  motivo: string;
  categoria: string;
  perfil: PerfilAfiliado;
  link_afiliado: string;
  imagem_url: string | null;
  imagem_alt: string | null;
  projeto_slug: string | null;
  /** Preço consultado no Mercado Livre (reais) e o dia da consulta (`AAAA-MM-DD`). O banco pode devolver o número como texto. */
  preco: number | string | null;
  preco_em: string | null;
  ativo: boolean;
  sort_order: number;
};

/** Texto aprovado pelo Pedro em 26/11/2026; aparece junto de todo link de afiliado. */
export const AVISO_AFILIADO = "Link de afiliado: a Bewild pode receber comissão. O preço para você não muda.";

/**
 * `meli.la` é o encurtador que a Central de Afiliados entrega (conferido em
 * 26/11/2026). MESMA expressão do CHECK de `link_afiliado` em
 * drizzle/migrations/0021: o que o painel aceita, o banco aceita, e vice-versa.
 */
const LINK_AFILIADO = /^https:\/\/(meli\.la|(www\.)?mercadolivre\.com(\.br)?)\//;
const HOSTS_AFILIADO = new Set(["meli.la", "mercadolivre.com.br", "www.mercadolivre.com.br", "mercadolivre.com", "www.mercadolivre.com"]);

/** Só `https:` e só os domínios do Mercado Livre; qualquer outra coisa é recusada. */
export function isAffiliateUrl(url: string): boolean {
  if (!url || !LINK_AFILIADO.test(url)) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !u.username && !u.password && !u.port && HOSTS_AFILIADO.has(u.hostname);
  } catch {
    return false;
  }
}

export const PRODUTO_AFILIADO_COLS =
  "id,slug,nome,motivo,categoria,perfil,link_afiliado,imagem_url,imagem_alt,projeto_slug,preco,preco_em,ativo,sort_order";

/**
 * Produtos ligados, na ordem do painel. `null` = falha de rede (quem chama
 * segue sem cartões). Linha com link fora dos domínios aceitos é descartada
 * aqui também, mesmo que tenha passado pelo banco.
 */
export function fetchProdutosAtivos(): Promise<ProdutoAfiliado[] | null> {
  return serverMemo("afiliados:ativos", fetchProdutosAtivosUncached, { keep: (v) => v !== null });
}

/** Teto da leitura: catálogo lento não pode segurar o HTML do artigo (mesmo teto do loader da Leal Moreira). */
export const CATALOGO_TIMEOUT_MS = 2500;

async function fetchProdutosAtivosUncached(): Promise<ProdutoAfiliado[] | null> {
  const { data, error } = await publicSelect<ProdutoAfiliado>(
    "produtos_afiliados",
    { select: PRODUTO_AFILIADO_COLS, ativo: "eq.true", order: "sort_order.asc,nome.asc" },
    { signal: AbortSignal.timeout(CATALOGO_TIMEOUT_MS) },
  );
  if (error || !data) return null;
  return data.filter((p) => p && typeof p.slug === "string" && isAffiliateUrl(p.link_afiliado));
}

/** "R$ 1.399,00" montado à mão (sem `Intl`): servidor e navegador têm de gerar a mesma string. `null` = sem preço válido. */
export function formatPrecoBRL(preco: number | string | null | undefined): string | null {
  const n = typeof preco === "string" ? Number(preco) : preco;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return null;
  const [inteiro, centavos] = n.toFixed(2).split(".");
  return `R$ ${inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${centavos}`;
}

/** `2026-11-27` → `27/11/2026`; qualquer outra coisa → `null`. */
export function formatDataBR(iso: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}
