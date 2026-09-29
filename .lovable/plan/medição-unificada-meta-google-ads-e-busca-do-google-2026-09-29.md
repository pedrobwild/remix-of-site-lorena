# Medição unificada: Meta, Google Ads e busca do Google

O Pixel da Meta, o Google Ads e o Search Console não se ligam entre si — cada um mede seu canal. O que dá para fazer é juntar os três no painel e garantir que cada lead saiba de onde veio. Boa parte já existe; o plano completa o que falta.

## O que já existe
- Aba "Mídia paga" com investimento, cliques e leads da Meta.
- Aba "Públicos do Google Ads" e leitura do Search Console na página Rastreamento.
- Leads do site já guardam UTM, clique da Meta (fbclid) e clique do Google (gclid).

## 1. Painel único (/admin/analytics)
- Nova aba **"Google Ads"**: investimento, impressões, cliques, conversões e custo por lead por campanha e por dia, com comparação de período (mesmo seletor corrigido). Dados lidos da conta AW-16893787587 e guardados a cada poucas horas, como já acontece com a Meta.
- Nova aba **"Busca do Google"**: cliques, impressões, CTR e posição média, com as principais buscas e páginas (dados do Search Console, que chegam com ~2 dias de atraso).
- Visão Geral ganha um quadro **"Leads por origem"**: Meta, Google Ads, busca orgânica, indicação/direto, com custo por lead onde houver investimento.

## 2. Conferir se tudo mede
- Teste no site publicado (celular e desktop): enviar formulário e clicar no WhatsApp com cookies aceitos, conferindo os envios ao Pixel da Meta, ao GA4 e à conversão "Lead - Formulário site (2)".
- Conferir na conta do Google Ads que essa conversão continua a única que recebe leads e que a tag do site está instalada uma vez só.
- Relatório curto do que passou e do que falhou; correções só no que falhar.

## 3. Origem de cada lead
- Regra de classificação única: gclid ou utm google/cpc → Google Ads; fbclid ou utm facebook/instagram → Meta; vindo do Google sem anúncio → busca orgânica; demais → direto/indicação.
- Mostrar a origem como etiqueta na lista de leads do painel, com filtro por origem.
- Leads antigos são classificados pelos dados já guardados (sem apagar nada).

## Detalhes técnicos
- Duas funções agendadas novas (`google-ads-sync`, `search-console-sync`) gravando em `google_ads_daily` e `search_console_daily`, com RLS só admin e GRANTs na mesma migração; o painel lê as tabelas, nunca chama as APIs ao abrir.
- Search Console: listar propriedades verificadas e usar a de bewild.com.br já validada.
- Classificação de origem em `src/lib/leadSource.ts` (função pura com testes) + coluna calculada/visão para o painel; nenhuma alteração no envio dos formulários.
- Custo por lead do Google usa só o gasto por campanha (a API não dá gasto por conversão).
- Nada é publicado sem pedido.
