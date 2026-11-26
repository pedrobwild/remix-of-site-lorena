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
  if (foto && fotoDeAnuncio(foto)) return "Essa é a foto do anúncio do Mercado Livre. Use uma foto da Bewild em que o item aparece.";
  if (d.projeto_slug.trim() && !SLUG_OK.test(d.projeto_slug.trim())) {
    return "O projeto é o final do endereço em /portfolio/ (só letras minúsculas, números e hífen).";
  }
  return null;
}

/** Foto hospedada pelo Mercado Livre (mlstatic.com é o servidor de imagens dos anúncios). */
function fotoDeAnuncio(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return /(^|\.)(mlstatic\.com|mercadolivre\.com(\.br)?|mercadolibre\.com|meli\.la)$/.test(host);
  } catch {
    return false;
  }
}

/** Texto para o erro que o banco devolveu ao salvar (código do Postgres). */
export function mensagemDeErroAoSalvar(code: string | undefined): string {
  if (code === "23505") return "Já existe um produto com esse identificador. Escolha outro.";
  if (code === "23514") return "O banco recusou um dos campos. Confira o link de afiliado (meli.la ou mercadolivre.com.br) e o identificador.";
  return "Não foi possível salvar. Confira se você está logado como administrador.";
}
