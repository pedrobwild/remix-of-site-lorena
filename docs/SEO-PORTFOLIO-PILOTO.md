# SEO do portfólio: piloto editorial e imagens

As páginas já usam SSR, mas os textos de desafio, solução e resultado repetem o mesmo molde. A galeria da página de detalhe ainda solicitava os arquivos originais, incluindo renders de mais de 10 MB. Além disso, `intro` existe no banco e não era consultado nem exibido.

Esta alteração adiciona `intro` à consulta compartilhada entre servidor e cliente e o mostra após o resumo. Título e descrição editoriais sem código interno passam a ser preservados pelos helpers de SEO. A descrição do `CreativeWork` usa resumo e introdução. O H1 usa o nome público, e o escopo tem marcação de lista, mantendo a apresentação existente.

As imagens de capa, galeria, antes/depois e visualização ampliada passam a usar derivadas responsivas do Storage. `resize=contain` preserva a proporção antes do enquadramento feito pelo CSS; sem esse parâmetro, a transformação observada cortava a largura e conservava a altura original. A capa usa carregamento imediato e prioridade alta; as galerias carregam sob demanda. Se a transformação falhar, o componente tenta o arquivo original.

## Conteúdo do piloto

O piloto preparado em 30/09/2026 contém 12 projetos: as dez galerias com fotos de obra pronta e duas propostas em fase de projeto, `apsa2-urban-flex` e `lc-lm-urban-flex`. Foram analisadas a capa, as primeiras 12 imagens 3D e até 15 fotos prontas de cada projeto, totalizando 280 imagens na amostra. Os arquivos editoriais de revisão, JSON, SQL e palavras-chave são entregues separadamente para Pedro aprovar antes dos 150 projetos restantes.

Cada texto tem 324–349 palavras de corpo, escopo próprio, título, descrição e alt de capa. O maior compartilhamento de sequências normalizadas de cinco palavras entre dois textos é 0,62%, relativo ao menor texto. Nenhum campo ultrapassa os limites editoriais de extensão. Metragens e bairros ausentes foram omitidos; acabamentos sem especificação são descritos pela aparência. As duas propostas em 3D estão identificadas como projetos, sem afirmar entrega.

Nenhum texto foi aplicado ao banco. A migration gerada deve permanecer fora de `supabase/migrations` até a aprovação editorial, pois entra no fluxo de publicação quando instalada ali. Matheus coordena a aplicação e a publicação. Ela altera somente `summary`, `intro`, `challenge`, `solution`, `result_text`, `scope`, `seo_title`, `seo_description` e `cover_alt`. O SQL verifica os valores anteriores, o status, o cadastro e as imagens usadas como evidência. Se um registro divergir, aborta a transação inteira para nova revisão. `notas_revisao` e `palavras_chave` não são gravados em campos públicos.

## Gerar novamente os arquivos

O script funciona localmente e não se conecta ao banco. `--source` deve apontar para uma leitura atual dos projetos selecionados, contendo os campos editoriais anteriores, `id`, `slug`, `title`, `status`, `neighborhood`, `location`, `area_m2`, `project_type`, `cover_url`, `gallery_urls` e `ready_gallery_urls`. Não inclua dados financeiros ou pessoais no snapshot.

```bash
node scripts/prepare-portfolio-content.mjs \
  --input /caminho/portfolio-bewild-piloto-12.json \
  --source /caminho/cadastro-piloto.json \
  --sql /caminho/20260930143000_projetos_textos_unicos_lote_1.sql \
  --review /caminho/revisao-portfolio-bewild-piloto.md \
  --report /caminho/validacao-piloto-bewild.json \
  --keywords /caminho/palavras-chave-portfolio-bewild.csv
```

As notas de revisão são obrigatórias. O script rejeita parágrafos repetidos, títulos ou descrições iguais, escopos idênticos e sobreposição de cinco palavras acima de 30%. Também valida extensão, metragem, códigos internos e termos que indiquem conclusão indevida. Essa validação complementa a análise humana das imagens; ela não confirma sozinha a arquitetura descrita.

## Peso das imagens medido

Medições em 30/09/2026 com `quality=70`, `resize=contain` e negociação WebP. Capas a 1440 px e itens comuns da galeria a 640 px; o navegador pode escolher outras larguras pelo `srcset`. Quando o original é menor, o Storage conserva sua resolução.

| Projeto e imagem | Original, bytes | Derivada, bytes | Redução |
|---|---:|---:|---:|
| Cyrela by You Perdizes, capa | 6.922.434 | 118.010 | 98,30% |
| Cyrela by You Perdizes, render | 10.132.848 | 14.432 | 99,86% |
| Latitude Campo Belo, capa | 3.194.982 | 99.170 | 96,90% |
| Latitude Campo Belo, render | 2.369.404 | 11.800 | 99,50% |
| Now Butantã, capa | 1.931.586 | 77.886 | 95,97% |
| Now Butantã, render | 2.654.911 | 16.990 | 99,36% |

Esses valores medem o tamanho transferido, não o LCP. Os primeiros pedidos às derivadas tiveram cache `MISS`; é necessário medir a página publicada em celular e com cache frio e quente para avaliar a velocidade final. Os originais permanecem no Storage. Referência: [transformações de imagem do Supabase](https://supabase.com/docs/guides/storage/serving/image-transformations).

## Publicação e acompanhamento

1. Pedro revisa os 12 textos e confirma tom e precisão das observações.
2. Matheus revisa a PR, instala a migration de dados aprovada com timestamp posterior às migrations existentes e coordena a publicação do código e do conteúdo.
3. Conferir cinco páginas com `curl`, verificando introdução no HTML, um H1, title, description, canonical e `CreativeWork` correspondentes. Conferir as mesmas páginas no celular, as imagens ampliadas e a ausência de scroll horizontal.
4. Conferir os slugs no sitemap e a data de conteúdo após a aplicação. A coluna `content_updated_at` e seu trigger já existem na versão atual de `main`; esta PR não modifica esse mecanismo.
5. Reenviar o sitemap e inspecionar as URLs piloto no Search Console. Acompanhar indexação, impressões e cliques por página antes de ampliar para os demais lotes.

Conteúdo próprio e HTML acessível tratam os problemas identificados, mas a inclusão no índice depende do Google. Referência: [requisitos técnicos da Pesquisa](https://developers.google.com/search/docs/essentials/technical).
