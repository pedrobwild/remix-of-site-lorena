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
  if (d.imagem_url.trim() && !/^https:\/\//.test(d.imagem_url.trim())) return "A foto precisa ser um endereço https.";
  if (d.projeto_slug.trim() && !SLUG_OK.test(d.projeto_slug.trim())) {
    return "O projeto é o final do endereço em /portfolio/ (só letras minúsculas, números e hífen).";
  }
  return null;
}
