# Perfil Bewild de Quem Reforma Studio — edição de novembro de 2026

Página: `/perfil-de-quem-reforma-studio`. Números em
`src/content/perfilReforma.dados.json`, textos e JSON-LD em
`src/content/perfilReforma.ts`, planilhas em `public/dados/`. Consulta somente
de leitura ao banco do Bwild Engine em 24/11/2026.

## Decisões de publicação (24/11/2026)

- Nome "Perfil Bewild de Quem Reforma Studio"; licença CC BY 4.0, a mesma do
  Índice Bewild de Custo de Reforma.
- O estudo **não publica volumes por canal de captação** (anúncios, indicação,
  site). O peso dos anúncios aparece em texto e em percentuais, nunca em
  contagem. O teste `perfilReforma.test.tsx` barra canal nos CSV e na página.
- Idade e sexo saem só em percentual, sem a contagem de cadastros.
- Profissão e estado civil entram como dado agregado de contratos assinados
  (menor grupo publicado: 16 pessoas).
- Não se publica grupo com base menor que 25 nem estado com menos de 10
  pessoas.
- A alta de quem vai morar ao longo do período **não é tratada como
  tendência**: ela acompanha a mudança de onde os pedidos chegam, e dentro de
  um mesmo canal a parcela fica estável (28% a 36% por terço, sem tendência,
  Cochran-Armitage p = 0,81).

## Regra da amostra

1. Um registro por imóvel orçado: `budgets` com `deleted_at is null`,
   `is_addendum = false` e `is_current_version`.
2. Data do pedido: menor `created_at` do `version_group_id`, no fuso de São
   Paulo. A data de criação da primeira versão não muda quando o orçamento é
   revisado.
3. Período: 01/03/2026 a 23/11/2026. Antes de março há contratos antigos
   lançados no sistema de uma vez, que não são pedidos daquele mês.
4. Pessoa: telefone normalizado; sem telefone, o cadastro do cliente; sem
   cadastro, o próprio pedido.

| Etapa | Negócios |
|---|---|
| Registrados em 24/11/2026 | 2.585 |
| Criados depois de 23/11/2026 | 8 |
| Criados antes de 01/03/2026 | 111 |
| Teste | 45 |
| Pedido de parceria de corretor | 3 |
| Casa ou imóvel comercial | 3 |
| Imóvel fora da Grande São Paulo | 20 |
| **Amostra** | **2.395 pedidos de 2.232 pessoas** |

## Definições

- **Finalidade.** O cadastro do pedido (`budgets.finalidade`) prevalece. "Uso
  misto" vem do formulário de entrada. "Ainda decide" só vale para quem não
  tem finalidade no cadastro. Formulário e cadastro concordam em 98,6% dos
  casos em que os dois existem.
- **Origem.** DDD do telefone: 11 é capital e Grande São Paulo; 12 a 19,
  interior e litoral paulista; os demais, outros estados; código de país
  diferente de 55, exterior. Em 52 contratos com endereço e telefone, o DDD
  aponta o mesmo estado do endereço em 43 (83%).
- **Bairro e região.** Texto livre padronizado por expressão regular e
  agrupado nas regiões do Índice. Jardins inclui Jardim Paulista e Cerqueira
  César; Moema, Indianópolis; Brooklin, Berrini e Monções.
- **Perfis.** Regra de duas respostas (finalidade × origem do telefone), seis
  grupos. Substitui as classes latentes da versão de 19/11/2026, que não eram
  reproduzíveis por quem lê.
- **Temas de conversa.** Dicionário de expressões em
  `public/dados/perfil-quem-reforma-studio-bewild-2026-11-dicionario-de-temas.csv`,
  aplicado só às mensagens escritas pelo cliente antes de qualquer contrato,
  sem as mensagens automáticas de entrada. Base: pessoas com 3 ou mais
  mensagens.
- **Mais de uma unidade.** Unidades registradas como diferentes ou citadas na
  conversa; é estimativa mínima.

## Testes estatísticos

Fisher (duas proporções), qui-quadrado (tabelas), Mann-Whitney (metragem),
Cochran-Armitage (tendência por terço do período) e Benjamini-Hochberg para
as comparações múltiplas dos temas. Diferença sem significância é escrita
como "não nesta base", nunca como igualdade.

## Fontes que ficaram fora

Radar Bewild, Search Console e GA4 não entram nesta edição: medem audiência e
busca, não quem pede orçamento.

## Como refazer

Refaça a consulta com a mesma regra, atualize o JSON, os dois CSV e
`PERFIL_ATUALIZADO_EM` juntos e rode `bunx vitest run
src/content/__tests__/perfilReforma.test.tsx`: o teste confere funil, somas,
regra de publicação, limites de título e descrição e a igualdade entre CSV e
página. Uma edição nova ganha arquivo novo em `public/dados/` e mantém o
anterior no ar.
