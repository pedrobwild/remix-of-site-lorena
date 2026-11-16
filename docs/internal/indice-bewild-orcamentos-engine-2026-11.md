# Índice Bewild — edição de novembro de 2026 (orçamentos do Bwild Engine)

Decisões do Pedro em 16/11/2026: a base oficial do Índice passa a ser a dos
orçamentos do Bwild Engine (amostra maior); o nome da base é "orçamentos";
a diferença por bairro é publicada; o perfil de público do estudo de contratos
(79% short stay, 59% fora da capital) vale para o todo; imóveis acima de 45 m²
ficam fora; conta-se um registro por negócio. O estudo de 188 contratos fica
guardado em `src/content/estudoContratos2026.ts`.

## Regra da amostra (banco do Bwild Engine, consulta em 16/11/2026)

1. Um registro por negócio (`coalesce(version_group_id, id)`) com versão
   publicada (`is_published_version`, `deleted_at is null`), ficando com a de
   maior `version_number`.
2. Valor: `resolved_total` de `get_budget_computed_totals`.
3. Metragem: `budgets.metragem`; se vazia, `client_properties.metragem`
   (texto livre, lido pelo primeiro número).
4. Fora: valor abaixo de R$ 50.000; área acima de 45 m²; nome de cliente ou
   projeto com "teste"; valor por m² fora de R$ 1.000 a R$ 10.000 (dois
   registros, de 2 m² e 212 m²); cidade João Pessoa, Juiz de Fora ou Rio de
   Janeiro, ou bairro "MG"/"à beira-mar". 165 registros sem cidade entraram
   como São Paulo.

| Etapa | Negócios |
|---|---|
| Com orçamento publicado | 846 |
| Sem metragem | 193 |
| Abaixo de R$ 50 mil | 37 |
| Acima de 45 m² | 21 |
| Fora de São Paulo | 5 |
| Sem valor | 2 |
| Metragem implausível | 2 |
| Teste | 1 |
| **Amostra** | **585** (478 clientes; criados de 18/03 a 15/11/2026) |

## Estatísticas

- Mediana por m² R$ 2.831 (P25 2.499, P75 3.283); orçamento mediano
  R$ 74.132, médio R$ 81.585; área mediana 26 m²; menor valor R$ 50.300,
  maior R$ 257.189.
- Regra de bolso (Theil-Sen, 446 orçamentos de 21 a 35 m²): R$ 32.950 +
  R$ 1.514/m²; erro mediano 12,0%, percentil 75 do erro 19,7%.
- Três terços por data de criação: R$ 2.688, R$ 3.002 e R$ 2.851 por m².
- Regiões (Kruskal-Wallis, H = 12,86, 2 g.l., p ≈ 0,002): Centro 107
  orçamentos, R$ 3.038/m²; Zona Oeste 131, R$ 2.856; Zona Sul 242, R$ 2.770.
  Outros bairros (55) e 50 registros sem bairro ficaram fora. Revisão de
  16/11: seis orçamentos da amostra tiveram o bairro identificado depois do
  primeiro cálculo (antes: Oeste 128, R$ 2.857; Sul 239, R$ 2.762).
  Agrupamento: Oeste = Pinheiros, Alto de Pinheiros, Vila Madalena, Perdizes,
  Barra Funda, Butantã, Pompeia, Vila Romana, Lapa, Água Branca; Centro =
  Consolação, Bela Vista, República, Santa Cecília, Higienópolis, Campos
  Elíseos, Vila Buarque, Bela Cintra, Centro Histórico; Sul = Itaim Bibi,
  Moema, Vila Mariana, Vila Nova Conceição, Brooklin, Vila Olímpia, Vila
  Clementino, Campo Belo, Santo Amaro, Paraíso, Saúde, Conceição, Vila
  Guarani, Jabaquara, Chácara Santo Antônio, Cidade Monções, Alto da Boa
  Vista, Vila Andrade, Ibirapuera, Chácara Klabin, Ipiranga, Jardim Paulista,
  Jardins, Cerqueira César.
- Por situação do negócio: fechado 56 (R$ 2.581/m², R$ 69.000); perdido ou
  arquivado 170 (R$ 2.732, R$ 70.967); em aberto 359 (R$ 2.909, R$ 76.471).
- Tabelas por metragem, por valor e por bairro: `src/content/indiceCusto.ts`.

## O que ainda descreve o estudo de contratos

O artigo `/conteudos/quanto-custa-reformar-apartamento-studio-ate-50-m2`
(banco do site) e os gráficos em
`public/images/blog/quanto-custa-reformar-apartamento-studio-ate-50-m2/`.

## Retrato da amostra (16/11/2026)

O banco do Engine mudou depois do cálculo: em 16/11, das 02h19 às 02h28, um
preenchimento por IA (`budget_events.event_type = 'ai_data_enrichment'`, lote
`backfill-2026-11-16`) gravou metragem em 254 registros e bairro em 444. Pela
mesma regra, a amostra passaria de 585 para 619 orçamentos (mediana de
R$ 2.828/m²). A edição de novembro fica nos 585: para refazer qualquer recorte,
use o valor anterior de cada campo (`metadata.previous` do evento) e descarte
três negócios que não estavam no retrato (33 m² e R$ 103.454; 36 m² e
R$ 214.250; 42 m² e R$ 82.675). Os recortes por região e faixa de metragem
usados nos artigos saem desse retrato: na mesma faixa de metragem, a diferença
entre regiões não é significativa (24 a 28 m²: 3,5%, p = 0,59), exceto abaixo
de 24 m² (25%, p = 0,001), onde o Centro concentra studios de até 20 m².
