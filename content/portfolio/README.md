# Conteúdo editorial do portfólio Bewild

162 narrativas arquitetônicas revisadas para as páginas existentes, com marcenaria, paleta, layout, conceito e função descritos a partir das imagens disponíveis. A locação enfatiza experiência do hóspede e apresentação do imóvel; a moradia enfatiza conforto, convivência e rotina. Não há promessa de retorno financeiro ou de posição nas buscas.

- `portfolio-bewild-162-revisado.json`: os nove campos editoriais por slug, nome público do empreendimento, finalidade e palavras-chave. Contém somente conteúdo destinado ao site; notas internas e dados privados ficam fora deste arquivo.
- `palavras-chave-portfolio-162.csv`: sugestões editoriais para validação no Google Ads; não são resultados de pesquisa de volume nem campanhas ativadas.
- `aplicacao-editorial-141-REVISAR.sql`: aplicação transacional preparada para revisão, **não executada**. Altera somente os nove campos editoriais de 141 registros com custo confirmado. Guardas de integridade impedem sobrescrever cadastro, imagens ou textos alterados desde a preparação.
- `../blog/artigo-turnkey-rascunho-cms.json`: versão corrigida do artigo com base na planilha XLSX. O artigo existente já foi publicado por Matheus; esta cópia mantém `published=false` para revisão e não deve criar outro artigo nem alterar o estado de publicação. As correções de números ainda não foram aplicadas ao CMS publicado.

## Conferências necessárias para publicação

Fonte financeira: planilha `valores_contratos_clientes_completo.xlsx` enviada por Pedro em 01/10/2026, aba Contratos. Os textos incluem apenas custo de reforma por m² autorizado, sem orçamento total, dados de clientes ou composição comercial. 141 custos estão validados e 148 áreas estão informadas: 142 áreas de contratos associados, duas com área coincidente nos contratos candidatos e quatro ainda provenientes do cadastro; 21 custos e 14 áreas aguardam identificação/conferência. Nessas lacunas, os textos omitem os dados. Finalidade segue a regra definida por Pedro: até 32 m², locação; acima de 32 m², moradia. Uma finalidade explícita futura na planilha prevalece.

135 registros possuem área ausente ou diferente no cadastro atual (80 ausentes e 55 diferentes): reconciliar o cadastro com a planilha antes de publicar, para que cartões, filtros, dados estruturados e narrativa concordem. O SQL não realiza essa conciliação. Depois de alterar o cadastro, regenerar as guardas com um snapshot atual e repetir a validação, pois as guardas anteriores devem bloquear a aplicação.

Apenas nove campos editoriais são atualizados pelo SQL: summary, intro, challenge, solution, result_text, scope, seo_title, seo_description e cover_alt. A aplicação pode preencher páginas existentes; não cria uma camada de rascunhos no CMS de projetos. Matheus deve coordenar a aplicação com a publicação após a revisão. Nenhuma alteração de banco de projetos, artigo publicado, estado de publicação, deploy ou ativação de campanha foi realizada nesta revisão.

## Validação

162 slugs únicos e correspondentes ao portfólio; todos os nove campos preenchidos; nenhum parágrafo integral repetido, título de SEO idêntico ou escopo integral duplicado. Corpos de 288–397 palavras. Títulos de SEO até 65 caracteres; descrições de 120–158; alternativas das capas de 80–140. Custos e áreas conferidos contra os dados editoriais confirmados, fases de obra respeitadas e campos financeiros não autorizados ausentes. Os alertas remanescentes são conferências de cadastro, dados pendentes e referências de extensão por seção, sem erros bloqueantes.

A publicação e os resultados de SEO dependem da aplicação no site e da indexação posterior pelos buscadores.

## Correções com a base XLSX

A validação dos 205 contratos não encontrou divergências de centavos no custo por m² calculado por valor ÷ área. Os 141 custos já incluídos no portfólio permanecem corretos. A área do slug `rm` passou de 28 para 28,21 m² porque os dois contratos candidatos (10 e 20) possuem essa área; o custo segue omitido. A base não possui finalidade de uso.

O artigo foi recalculado: faixa central R$ 2.491–3.260/m²; mediana R$ 2.762/m²; cenários arredondados de R$ 2.500–3.300/m². As tabelas, os recortes por área, as estatísticas regionais e o FAQ acompanham os novos valores. A análise regional reproduz os 93 registros do texto aprovado: as medianas da base anterior foram reproduzidas em todas as regiões antes do recálculo. A classificação continua inferida, sem comprovar endereço nem causalidade. O exemplo de proposta e o prazo provenientes de documento separado foram preservados.
