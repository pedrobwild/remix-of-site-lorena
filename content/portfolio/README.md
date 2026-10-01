# Conteúdo editorial do portfólio Bewild

162 narrativas arquitetônicas revisadas para as páginas existentes, com marcenaria, paleta, layout, conceito e função descritos a partir das imagens disponíveis. A locação enfatiza experiência do hóspede e apresentação do imóvel; a moradia enfatiza conforto, convivência e rotina. Não há promessa de retorno financeiro ou de posição nas buscas.

- `portfolio-bewild-162-revisado.json`: os nove campos editoriais por slug, nome público do empreendimento, finalidade e palavras-chave. Contém somente conteúdo destinado ao site; notas internas e dados privados ficam fora deste arquivo.
- `palavras-chave-portfolio-162.csv`: sugestões editoriais para validação no Google Ads; não são resultados de pesquisa de volume nem campanhas ativadas.
- `aplicacao-editorial-141-REVISAR.sql`: aplicação transacional preparada para revisão, **não executada**. Altera somente os nove campos editoriais de 141 registros com custo confirmado. Guardas de integridade impedem sobrescrever cadastro, imagens ou textos alterados desde a preparação.
- `../blog/artigo-turnkey-rascunho-cms.json`: cópia do artigo aprovado já salvo como rascunho em `bewild_posts`, com `published=false`.

## Conferências necessárias para publicação

Fonte financeira: aba Contratos do Sheets, conferida em 01/10/2026. Os textos incluem apenas custo de reforma por m² autorizado, sem orçamento total, dados de clientes ou composição comercial. 141 custos e 148 áreas têm respaldo confirmado; 21 custos e 14 áreas aguardam identificação/conferência. Nessas lacunas, os textos omitem os dados. Finalidade segue a regra definida por Pedro: até 32 m², locação; acima de 32 m², moradia. Uma finalidade explícita futura na planilha prevalece.

71 registros possuem área ausente ou diferente no cadastro atual: reconciliar o cadastro com a planilha antes de publicar, para que cartões, filtros, dados estruturados e narrativa concordem. O SQL não realiza essa conciliação. Depois de alterar o cadastro, regenerar as guardas com um snapshot atual e repetir a validação, pois as guardas anteriores devem bloquear a aplicação.

Apenas nove campos editoriais são atualizados pelo SQL: summary, intro, challenge, solution, result_text, scope, seo_title, seo_description e cover_alt. A aplicação pode preencher páginas existentes; não cria uma camada de rascunhos no CMS de projetos. Matheus deve coordenar a aplicação com a publicação após a revisão. Nenhuma alteração de banco de projetos, publicação, deploy ou ativação de campanha foi realizada nesta entrega.

## Validação

162 slugs únicos e correspondentes ao portfólio; todos os nove campos preenchidos; nenhum parágrafo integral repetido, título de SEO idêntico ou escopo integral duplicado. Corpos de 288–397 palavras. Títulos de SEO até 65 caracteres; descrições de 120–158; alternativas das capas de 80–140. Custos e áreas conferidos contra os dados editoriais confirmados, fases de obra respeitadas e campos financeiros não autorizados ausentes. Os alertas remanescentes são conferências de cadastro, dados pendentes e referências de extensão por seção, sem erros bloqueantes.

A publicação e os resultados de SEO dependem da aplicação no site e da indexação posterior pelos buscadores.
