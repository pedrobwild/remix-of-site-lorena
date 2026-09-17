# Mapa de redirecionamento — `www.bwild.com.br` (Wix) → `bewild.com.br`

**Status:** proposta para revisão (17/09/2026). Só entra em produção depois da decisão A-04.
**Fonte dos slugs:** API do Wix (Blog › List Posts), site "BWILD" (`78cef3a6-…`), 36 posts publicados entre fev/2025 e nov/2025. A lista de **páginas** do Wix (fora do blog) não veio pela API (403) — obter em `https://www.bwild.com.br/sitemap.xml` e completar a seção 3.

Regras usadas: destino = página equivalente por intenção de busca; quando o equivalente é um **rascunho** do novo site, ele precisa ser publicado antes (A-13); quando não há equivalente, `/conteudos` (índice) — nunca tudo para a home.

## 1. Como aplicar no Wix

1. Painel do site → **SEO** → **Redirecionamentos de URL** (URL Redirect Manager) → *Adicionar* / *Importar CSV* (colunas `origem,destino`, 301, destino externo permitido).
2. Origem sempre como caminho relativo do Wix (`/post/<slug>`); destino absoluto (`https://bewild.com.br/...`).
3. Depois de ativar: testar 10 URLs com `curl -sI` (esperado `301` + `Location`), esperar 1–2 dias e fazer **Alteração de endereço** no Search Console da propriedade do Wix.
4. Manter os 301 por no mínimo 12 meses. Não apagar o site Wix antes disso.

## 2. Posts do blog (36)

Legenda: **P** = destino já publicado · **R** = rascunho no novo site (publicar antes) · **I** = índice `/conteudos`

| # | Origem (Wix `/post/…`) | Destino em `bewild.com.br` | Tipo |
|---|---|---|---|
| 1 | `/post/reforma-de-studio-para-short-stay-sao-paulo` | `/diagnostico` | P |
| 2 | `/post/quem-faz-reforma-e-decoração-para-aumentar-o-retorno-financeiro-de-imóveis-em-são-paulo` | `/` | P |
| 3 | `/post/blog-projeto-arquitetonico-personalizado-studios` | `/conteudos/reforma-turn-key-ou-tradicional` | P |
| 4 | `/post/decoração-estratégica-o-que-realmente-faz-diferença-na-rentabilidade-do-seu-imóvel-de-short-stay` | `/conteudos/preparar-studio-airbnb-checklist` | R |
| 5 | `/post/reforma-airbnb-sao-paulo-cuidados` | `/conteudos/7-erros-imovel-short-stay` | R |
| 6 | `/post/como-a-gestão-turnkey-facilita-reformas-de-apartamentos-em-são-paulo` | `/conteudos/reforma-turn-key-ou-tradicional` | P |
| 7 | `/post/materiais-para-serviço-completo-de-reforma-e-decoração-para-imóveis-voltados-ao-airbnb` | `/conteudos/reforma-turn-key-ou-tradicional` | P |
| 8 | `/post/diária-média-de-airbnb-em-são-paulo-por-bairro-guia-prático-para-precificar-seu-apê-em-2025` | `/conteudos/quanto-rende-studio-short-stay-sao-paulo` | R |
| 9 | `/post/guia-do-investidor-reformar-para-locação-em-pinheiros-dados-e-padrões-que-funcionam` | `/conteudos/melhores-bairros-short-stay-sao-paulo` | R |
| 10 | `/post/como-aumentar-o-valor-da-diária-do-seu-short-stay-em-até-30-com-reforma-inteligente` | `/conteudos/quanto-rende-studio-short-stay-sao-paulo` | R |
| 11 | `/post/estudo-de-mercado-bwild-studios-airbnb-chácara-klabin-sp` | `/conteudos/melhores-bairros-short-stay-sao-paulo` | R |
| 12 | `/post/estudo-de-mercado-bwild-studios-airbnb-moema-sp` | `/conteudos/melhores-bairros-short-stay-sao-paulo` | R |
| 13 | `/post/qual-é-o-valor-de-obra-por-metro-quadrado-studios-para-airbnb` | `/conteudos/quanto-custa-reformar-studio-short-stay-sao-paulo` | R |
| 14 | `/post/como-fazer-o-orçamento-de-uma-reforma-de-studio-ou-apartamento` | `/conteudos/quanto-custa-reformar-studio-short-stay-sao-paulo` | R |
| 15 | `/post/estudo-de-mercado-studios-no-butantã-são-paulo` | `/conteudos/melhores-bairros-short-stay-sao-paulo` | R |
| 16 | `/post/estudo-de-mercado-studios-para-short-stay-na-vila-madalena` | `/conteudos/melhores-bairros-short-stay-sao-paulo` | R |
| 17 | `/post/como-economizar-de-forma-inteligente-na-reforma-do-seu-studio-sem-perder-valor-de-mercado` | `/conteudos/quanto-custa-reformar-studio-short-stay-sao-paulo` | R |
| 18 | `/post/estudo-de-mercado-studios-para-short-stay-no-paraíso-são-paulo` | `/conteudos/melhores-bairros-short-stay-sao-paulo` | R |
| 19 | `/post/estudo-de-mercado-studios-na-vila-olímpia-são-paulo` | `/conteudos/melhores-bairros-short-stay-sao-paulo` | R |
| 20 | `/post/estudo-de-mercado-studios-para-short-stay-em-pinheiros-são-paulo` | `/conteudos/melhores-bairros-short-stay-sao-paulo` | R |
| 21 | `/post/5-estratégias-essenciais-para-reformar-seu-studio-e-maximizar-seu-investimento` | `/conteudos/preparar-studio-airbnb-checklist` | R |
| 22 | `/post/quanto-custa-a-reforma-de-um-studio-para-locação-no-airbnb-analisamos-100-orçamentos-da-bwild` | `/conteudos/quanto-custa-reformar-studio-short-stay-sao-paulo` | R |
| 23 | `/post/studios-para-locação-short-stay-o-crescimento-exponencial-deste-mercado-no-brasil` | `/conteudos/short-stay-ou-long-stay-studio-compacto` | P |
| 24 | `/post/entenda-o-que-é-o-short-stay-oportunidade-de-investimento-e-tendência-no-mercado-imobiliário` | `/conteudos/short-stay-ou-long-stay-studio-compacto` | P |
| 25 | `/post/financiar-ou-comprar-à-vista-qual-a-melhor-opção-para-adquirir-um-imóvel` | `/conteudos` | I |
| 26 | `/post/quais-são-os-documentos-necessários-para-a-compra-de-um-imóvel` | `/conteudos` | I |
| 27 | `/post/as-preferências-dos-hóspedes-que-buscam-por-locações-de-curta-temporada-short-stay` | `/conteudos/preparar-studio-airbnb-checklist` | R |
| 28 | `/post/o-que-considerar-na-reforma-do-seu-studio-para-reduzir-os-custos-de-manutenção-para-locação-no-airbn` | `/conteudos/7-erros-imovel-short-stay` | R |
| 29 | `/post/quais-cuidados-tomar-antes-de-comprar-um-studio-ou-apartamento-para-locação-no-airbnb` | `/conteudos/studios-airbnb-sao-paulo-o-que-a-lei-permite` | P |
| 30 | `/post/quanto-custa-reformar-um-studio-ou-apartamento-para-locação-short-stay` | `/conteudos/quanto-custa-reformar-studio-short-stay-sao-paulo` | R |
| 31 | `/post/reformas-rápidas-como-minimizar-o-tempo-fora-do-mercado-de-locação` | `/conteudos/reforma-turn-key-ou-tradicional` | P |
| 32 | `/post/5-motivos-para-investir-em-short-stay-em-2025` | `/conteudos/short-stay-ou-long-stay-studio-compacto` | P |
| 33 | `/post/como-a-valorização-imobiliária-em-são-paulo-impacta-seu-retorno-de-investimento` | `/conteudos` | I |
| 34 | `/post/tendências-de-design-para-studios-em-2025-o-que-atrai-mais-hóspedes` | `/conteudos/preparar-studio-airbnb-checklist` | R |
| 35 | `/post/o-guia-definitivo-para-a-reforma-de-um-apartamento-ou-studio` | `/conteudos/reforma-turn-key-ou-tradicional` | P |
| 36 | `/post/bem-vindo-ao-nosso-blog-inspiração-e-dicas-para-seu-novo-apartamento-studio` | `/conteudos` | I |

Resumo: 11 destinos já publicados, **22 dependem dos rascunhos** `quanto-custa-reformar-studio-short-stay-sao-paulo`, `melhores-bairros-short-stay-sao-paulo`, `quanto-rende-studio-short-stay-sao-paulo`, `preparar-studio-airbnb-checklist` e `7-erros-imovel-short-stay` (publicar estes 5 primeiro), 3 vão para o índice. Os posts sobre estudos de mercado por bairro (11, 12, 15, 16, 18, 19, 20) merecem, se houver fôlego, uma seção por bairro dentro de `melhores-bairros-short-stay-sao-paulo` para não perder o conteúdo específico.

## 3. Páginas do Wix (completar com o sitemap do Wix)

| Origem | Destino | Observação |
|---|---|---|
| `/` | `https://bewild.com.br/` | home |
| `/search` ("Reformas completas de studios e apartamentos") | `https://bewild.com.br/portfolio` | confirmar o que a página mostra |
| `/blog` (índice do Wix Blog) | `https://bewild.com.br/conteudos` | |
| `/post/*` sem mapeamento | `https://bewild.com.br/conteudos` | regra genérica de fallback |
| demais páginas (serviços, contato, sobre…) | a definir | pegar a lista em `https://www.bwild.com.br/sitemap.xml` |
