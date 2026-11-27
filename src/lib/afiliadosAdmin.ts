/** Validação do formulário de /admin/afiliados (pura, para o teste e para a tela). */
import { isAffiliateUrl, type PerfilAfiliado } from "@/lib/afiliados";

export type ProdutoDraft = {
  nome: string;
  slug: string;
  motivo: string;
  categoria: string;
  perfil: PerfilAfiliado;
  link_afiliado: string;
  imagem_url: string;
  imagem_alt: string;
  projeto_slug: string;
  /** Texto digitado no painel ("1.399,00"); vazio = cartão sem preço. */
  preco: string;
  ativo: boolean;
};

const SLUG_OK = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const LINK_AFILIADO_INVALIDO = "Use o link gerado na Central de Afiliados (meli.la ou mercadolivre.com.br).";

/** Mensagem do primeiro problema do formulário, ou `null` quando está tudo certo. */
export function validarProduto(d: ProdutoDraft): string | null {
  if (!d.nome.trim()) return "Informe o nome do produto.";
  if (!SLUG_OK.test(d.slug)) return "O identificador aceita só letras minúsculas, números e hífen.";
  if (!d.categoria.trim()) return "Informe a categoria.";
  if (!isAffiliateUrl(d.link_afiliado.trim())) return LINK_AFILIADO_INVALIDO;
  const foto = d.imagem_url.trim();
  if (foto && !/^https:\/\//.test(foto)) return "A foto precisa ser um endereço https.";
  if (d.preco.trim() && parsePrecoBR(d.preco) === null) return "Preço inválido. Escreva como no anúncio, por exemplo 1.399,00.";
  if (d.projeto_slug.trim() && !SLUG_OK.test(d.projeto_slug.trim())) {
    return "O projeto é o final do endereço em /portfolio/ (só letras minúsculas, números e hífen).";
  }
  return null;
}

/**
 * Preço digitado no painel → número. Aceita "1.399,00", "R$ 88,90", "3859" e
 * "1399.00" (ponto seguido de 1 ou 2 dígitos no fim é decimal; senão é milhar).
 */
export function parsePrecoBR(texto: string): number | null {
  const t = texto.replace(/R\$/i, "").replace(/\s/g, "");
  if (!/^\d[\d.,]*$/.test(t) || (t.match(/,/g)?.length ?? 0) > 1) return null;
  const normal = t.includes(",")
    ? t.replace(/\./g, "").replace(",", ".")
    : /\.\d{1,2}$/.test(t) && (t.match(/\./g)?.length ?? 0) === 1
      ? t
      : t.replace(/\./g, "");
  const n = Number(normal);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

/** Texto para o erro que o banco devolveu ao salvar (código do Postgres). */
export function mensagemDeErroAoSalvar(code: string | undefined): string {
  if (code === "23505") return "Já existe um produto com esse identificador. Escolha outro.";
  if (code === "23514") return "O banco recusou um dos campos. Confira o link de afiliado (meli.la ou mercadolivre.com.br) e o identificador.";
  return "Não foi possível salvar. Confira se você está logado como administrador.";
}
