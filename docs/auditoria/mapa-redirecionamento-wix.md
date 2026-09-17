# Mapa de redirecionamento — `www.bwild.com.br` (Wix) → `bewild.com.br`

**Status: EXECUTADO em 17/09/2026** (aprovação do marketing). Pela API de Redirecionamentos do Wix foram criados **179 redirecionamentos 301** para `bewild.com.br`: 36 posts, 11 páginas, 19 redirecionamentos internos recriados apontando direto, 110 projetos do portfólio e 3 categorias do blog — 0 falhas. O site Wix tem agora 184 redirecionamentos (os 5 restantes são variantes acentuadas antigas que o Wix manteve como cadeia de 2 saltos, ver seção 5). **Provisório:** como os 5 rascunhos ainda não estavam publicados, os 22 posts marcados **R** apontam por enquanto para `/conteudos`; quando publicarem, os 22 são apagados e recriados com o destino final (a API não tem "update"). **Pendente:** home (seção 7, passo 3) e *Alteração de endereço* no GSC.
**Fonte dos slugs:** API do Wix (Blog › List Posts), site "BWILD" (`78cef3a6-…`), 36 posts publicados entre fev/2025 e nov/2025. Páginas e portfólio obtidos pela API (Portfolio › Query Projects, SEO › List Redirects) em 17/09; o índice `sitemap.xml` do Wix tem 4 sitemaps: posts, categorias do blog, projetos do portfólio e páginas.

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

## 3. Páginas do Wix (fonte: redirecionamentos internos existentes no Wix + títulos vistos na busca)

| Origem (Wix) | Destino em `bewild.com.br` | Observação |
|---|---|---|
| `/` | `https://bewild.com.br/` | home — **a API do Wix não aceita a raiz como origem** ("Can't be the site root"); ver seção 7, passo 3 |
| `/orcamento` | `https://bewild.com.br/diagnostico` | página de orçamento → formulário |
| `/servicos-reforma-studio-apartamento` | `https://bewild.com.br/` | serviços → home (seções "O contrato"/"O que fazemos") |
| `/arquitetura-studio-apartamento-bwild` | `https://bewild.com.br/` | |
| `/projetos-modelo-studio` | `https://bewild.com.br/portfolio` | |
| `/portfolio-projetos-studios` | `https://bewild.com.br/portfolio` | |
| `/portfolio-collections/portfolio-bwild` | `https://bewild.com.br/portfolio` | página da coleção do portfólio |
| `/portfolio-collections/portfolio-bwild/escritorio-bwild` | `https://bewild.com.br/portfolio` | |
| `/blog-reformas-studios` | `https://bewild.com.br/conteudos` | índice do blog |
| `/politica-de-privacidade` | `https://bewild.com.br/privacidade` | |
| `/politicas-de-acessibilidade` | `https://bewild.com.br/privacidade` | o novo site não tem página equivalente |
| `/search` | `https://bewild.com.br/` | página de busca do Wix (título "Reformas completas de studios e apartamentos") |
| páginas ainda não listadas | — | confirmar com `https://www.bwild.com.br/pages-sitemap.xml` |

## 4. Projetos do portfólio do Wix (110 visíveis; 30 ocultos não têm URL pública)

Os projetos do Wix são identificados por iniciais de clientes ("Projeto CN", "Studio LR – Butantã") e não têm correspondência 1:1 confiável com os 161 projetos do novo site. Destino: o índice `/portfolio` (página equivalente mais próxima). Se marketing quiser mapear alguns 1:1 (ex.: `studio-lr-butanta-sao-paulo-sp` → `lf-modern-estacao-butanta`), basta trocar o destino na linha.

| Origem (Wix) | Destino |
|---|---|
| `/portfolio-collections/portfolio-bwild/projeto` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-aa` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-aa-–-studio-reformado-em-ibirapuera` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-al` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-am` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-am-157fd3` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-apf-2007` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-apf-2208` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-bb` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-bba` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-bf` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-ccl` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-cco` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-cf` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-cn-3d0d46` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-cnkc` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-dm` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-e` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-eb` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-er` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-er-1d2d07` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-erm` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-f` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-fb` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-fb-13203f` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-fb-alto-da-boa-vista-sao-paulo-sp` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-fb²` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-ff` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-ff-1c5f8b` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-fg` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-fg-58cf54` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-fg-88e369` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-fn` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-fp` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-ja` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-jr` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-kd` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-kd²` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-lb` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-lc` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-lce` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-le` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-le²` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-ll` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-lr` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-ls` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-lv` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-m` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-mc` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-mc-436f06` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-me` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-me-607392` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-med` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-me²` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-ml` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-mmo` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-mv` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-pr` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-pr-9f09b0` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-r` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-ra` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-rb` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-rb-5b2659` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-rbs` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-rc` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-rc-a4dc12` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-rf` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-rg` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-rj` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-rkj` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-rl` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-rm` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-rs` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-rs-df8231` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-s` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-sb` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-sf` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-sp` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-st` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-studio-at` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-studio-em` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-ta` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-ta-274de7` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-tha` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-thv` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-ts` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-tt` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-vg` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-vh` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-vhlv` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-vn` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/projeto-yl` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-al—-campo-belo-são-paulo-sp` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-fb` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-fp-perdizes-são-paulo-sp` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-g-sacoma-sao-paulo-sp` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-garden-sf` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-lc-—-saúde-são-paulo-sp` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-lr-butanta-sao-paulo-sp` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-m-—-vila-mariana-são-paulo-sp` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-ml-—-vila-madalena-são-paulo-sp` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-mm` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-next-one` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-next-realty` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-rbkj-—-pinheiros-são-paulo-sp` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-s-—-vila-mariana-são-paulo-sp` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-sx` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-t-—-perdizes-são-paulo-sp` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/studio-v-—-pinheiros-são-paulo-sp` | `https://bewild.com.br/portfolio` |
| `/portfolio-collections/portfolio-bwild/trisul` | `https://bewild.com.br/portfolio` |

## 5. Redirecionamentos internos que já existem no Wix (19)

O Wix já tem 19 redirecionamentos internos (ex.: `/blog` → `/blog-reformas-studios`, `/portfolio` → `/portfolio-projetos-studios`, `/orçamento-reforma` → `/orcamento`, `/privacy-policy` → `/politica-de-privacidade`, `/projects` → `/portfolio`, slugs antigos de projetos com acento → sem acento). Recriados em 17/09 com `options.forceReplace` apontando direto para o destino final. Exceção: 5 origens com acento (`studio-s-pinheiros-são-paulo-sp`, `studio-g-sacomã-são-paulo-sp`, `escritório-bwild`, `projeto-fb-alto-da-boa-vista-são-paulo-sp`, `studio-lr-butantã-são-paulo-sp`) — o Wix guarda a versão antiga em outra codificação e manteve as duas; na prática viram cadeia de 2 saltos (acento → sem acento → `bewild.com.br/portfolio`), aceitável. Não apagar as antigas sem testar a URL acentuada depois.

## 6. Categorias do blog (3, obtidas pela API — executado)

| Origem (Wix) | Destino |
|---|---|
| `/blog-reformas-studios/categories/design-de-studios` | `https://bewild.com.br/conteudos` |
| `/blog-reformas-studios/categories/mercado-e-economia-de-studios` | `https://bewild.com.br/conteudos` |
| `/blog-reformas-studios/categories/reforma-em-sp` | `https://bewild.com.br/conteudos` |

Redirecionamento exato por categoria (não de grupo, que carregaria o sufixo para `/conteudos/<x>`, inexistente no novo site).

## 7. Execução (API de Redirecionamentos do Wix — 301, efeito imediato, sem republicar o site)

1. **Pré-requisito de conteúdo:** publicar os 5 rascunhos que recebem 22 posts (seção 2). Enquanto não publicados, os posts correspondentes podem ir provisoriamente para `/conteudos` e ser trocados depois (a API não tem "update": é apagar e recriar).
2. **Criar em lotes de até 100** (`POST /seo-redirects-service/v1/bulk/redirects/create`): lote A = posts (36) + páginas (12) + categorias; lote B = projetos do portfólio (110, em 2 chamadas). Cada item `{ "from": "/caminho-no-wix", "to": "https://bewild.com.br/..." }`.
3. **Home (`/`):** a API/gerenciador do Wix **não aceita a raiz** como origem (schema: "Can't be the site root"). Plano em duas fases: (a) junto com os 301 por URL, na página inicial do Wix definir canonical `https://bewild.com.br/` (Wix › SEO da página) e um redirecionamento Velo no `onReady` (`wixLocation.to("https://bewild.com.br/")`) com um link visível — o Google segue redirecionamentos JavaScript, embora com menos peso que um 301; (b) depois que o Search Console mostrar os 301 por URL processados (2–4 semanas), acionar o **redirecionamento de domínio** no painel de Domínios do Wix, que responde 301 na raiz e é o que a ferramenta *Alteração de endereço* exige da home — ciente de que ele passa a mandar **todas** as URLs para o destino único, por isso só depois de os 301 por URL terem transferido os sinais.
4. **Verificação (a fazer pelo time — este ambiente não alcança o site):** `curl -sI https://www.bwild.com.br/post/5-motivos-para-investir-em-short-stay-em-2025` → `301` + `Location: https://bewild.com.br/conteudos/short-stay-ou-long-stay-studio-compacto`; `curl -sI https://www.bwild.com.br/orcamento` → `Location: https://bewild.com.br/diagnostico`; `curl -sI https://www.bwild.com.br/portfolio-collections/portfolio-bwild/projeto-kd` → `Location: https://bewild.com.br/portfolio`.
5. **Search Console:** na propriedade do Wix, *Configurações › Alteração de endereço* → `https://bewild.com.br/`. Manter as duas propriedades por 12 meses.
6. **Perfis externos apontando para o domínio novo** (autoridade e consistência da entidade): Perfil da Empresa no Google, Instagram (bio), LinkedIn, Reclame Aqui (perfil `bwild-reformas` → campo site), assinaturas de e-mail, materiais impressos/QR.
7. **Não cancelar o plano Premium do Wix** enquanto os 301 precisarem existir (≥ 12 meses).
