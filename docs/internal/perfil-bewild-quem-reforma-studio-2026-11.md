# Perfil Bewild de Quem Reforma Studio — edição de novembro de 2026

Página: `/perfil-de-quem-reforma-studio`. Números em
`src/content/perfilReforma.dados.json`, textos e JSON-LD em
`src/content/perfilReforma.ts`, planilhas em `public/dados/`. Consulta somente
de leitura ao banco do Bwild Engine em 24/11/2026.

## Decisão do Pedro (24/11/2026): a base são os orçamentos do Índice

A primeira versão da página, publicada na tarde de 24/11/2026, usava todos os
pedidos de orçamento (2.395 pedidos de 2.232 pessoas). No mesmo dia o Pedro
definiu que o perfil usa a mesma base do Índice Bewild de Custo de Reforma: só
quem recebeu um orçamento de reforma completa. Nos pedidos sem orçamento
enviado, a parcela que vai morar é maior, e isso diluía o retrato de quem de
fato reforma.

## Regra da amostra (a do Índice, refeita em 24/11/2026)

1. Um registro por negócio (`coalesce(version_group_id, id)`) com versão
   publicada (`is_published_version`, `deleted_at is null`), ficando com a de
   maior `version_number`; aditivos de contrato não entram.
2. Negócios criados até 15/11/2026, como na edição de novembro do Índice.
3. Valor: `resolved_total` de `get_budget_computed_totals`. Metragem:
   `budgets.metragem`; se vazia, `client_properties.metragem`.
4. Fora: sem metragem; valor abaixo de R$ 50.000; área acima de 45 m²; teste;
   valor por m² fora de R$ 1.000 a R$ 10.000; imóvel fora de São Paulo.

| Etapa | Negócios |
|---|---|
| Com orçamento enviado, criados até 15/11/2026 | 793 |
| Sem metragem | 147 |
| Abaixo de R$ 50 mil | 31 |
| Acima de 45 m² | 24 |
| Fora de São Paulo | 5 |
| Sem valor | 1 |
| Teste | 1 |
| **Amostra** | **584 orçamentos de 507 pessoas** (criados de 18/03 a 13/11/2026) |

A edição de novembro do Índice, consultada em 16/11/2026, fechou em 585. A
regra é a mesma; um negócio deixou de atendê-la entre as duas consultas. A
distribuição por faixa de metragem não é republicada aqui: fica só no Índice.

## Decisões de publicação

- Nome "Perfil Bewild de Quem Reforma Studio"; licença CC BY 4.0.
- O estudo não publica volumes por canal de captação; idade e sexo (dado de
  quem se cadastrou por anúncio) saíram com a troca da base.
- Profissão e estado civil entram como agregado de contratos assinados, com
  base própria (menor grupo publicado: 16 pessoas).
- Percentual só com base de 25 ou mais; bairro só com 15 orçamentos ou mais;
  estado só com 10 pessoas ou mais.
- Diferença sem significância é escrita como "não nesta base".

## Definições

- **Pessoa.** Telefone normalizado; sem telefone, o cadastro do cliente.
- **Finalidade.** O cadastro do negócio prevalece; "uso misto" vem do
  formulário de entrada.
- **Origem.** DDD do telefone: 11 é capital e Grande São Paulo; 12 a 19,
  interior e litoral paulista; os demais, outros estados.
- **Perfis.** Regra de duas respostas (finalidade × origem do telefone).
- **Temas de conversa.** Dicionário em
  `public/dados/perfil-quem-reforma-studio-bewild-2026-11-dicionario-de-temas.csv`,
  aplicado às mensagens do cliente anteriores ao contrato; base de pessoas
  com 3 ou mais mensagens.
- **Reuniões e contratos.** Fontes com base própria, que não se limitam aos
  negócios da amostra.

## Como refazer

Refaça a seleção com a regra acima, atualize o JSON, a planilha e
`PERFIL_ATUALIZADO_EM` juntos e rode
`bunx vitest run src/content/__tests__/perfilReforma.test.tsx`.
