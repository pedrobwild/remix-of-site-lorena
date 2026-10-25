# Conteúdo editorial do portfólio Bewild

162 narrativas arquitetônicas revisadas para as páginas existentes, com marcenaria, paleta, layout, conceito e função descritos a partir das imagens disponíveis. A locação enfatiza experiência do hóspede e apresentação do imóvel; a moradia enfatiza conforto, convivência e rotina. Não há promessa de retorno financeiro ou de posição nas buscas.

- `portfolio-bewild-162-revisado.json`: os nove campos editoriais por slug, nome público do empreendimento, finalidade e palavras-chave. Contém somente conteúdo destinado ao site; notas internas e dados privados ficam fora deste arquivo.
- `palavras-chave-portfolio-162.csv`: sugestões editoriais para validação no Google Ads; não são resultados de pesquisa de volume nem campanhas ativadas.
- `aplicacao-editorial-141-REVISAR.sql`: **arquivo histórico obsoleto, não executar**. Não foi executado: a aplicação definitiva utilizou um snapshot novo, novas guardas e reconciliação de áreas. As guardas deste arquivo antecedem as alterações já realizadas.
- `../blog/artigo-turnkey-rascunho-cms.json`: cópia editorial do artigo corrigido com base na planilha XLSX. O corpo e o FAQ foram aplicados ao artigo existente em 02/10/2026, preservando sua publicação. Esta cópia mantém `published=false` como marca de revisão; não criar outro artigo nem alterar o estado de publicação a partir dela.

## Aplicação concluída em 02/10/2026

Fonte financeira: planilha `valores_contratos_clientes_completo.xlsx` enviada por Pedro em 01/10/2026, aba Contratos. Os textos incluem apenas custo de reforma por m² autorizado, sem orçamento total, dados de clientes ou composição comercial. 141 custos estão validados e 148 áreas estão informadas: 142 áreas de contratos associados, duas com área coincidente nos contratos candidatos e quatro ainda provenientes do cadastro; 21 custos e 14 áreas aguardam identificação/conferência. Nessas lacunas, os textos omitem os dados. Finalidade segue a regra definida por Pedro: até 32 m², locação; acima de 32 m², moradia. Uma finalidade explícita futura na planilha prevalece.

135 metragens foram reconciliadas com a planilha (80 antes ausentes e 55 diferentes). O cadastro aceita duas casas decimais e a exibição usa o formato pt-BR. As 144 áreas corroboradas pela base conferem após a aplicação; quatro áreas do cadastro foram preservadas e 14 continuam ausentes.

Pedro autorizou a aplicação diretamente. A transação definitiva atualizou apenas diferenças nos nove campos editoriais (summary, intro, challenge, solution, result_text, scope, seo_title, seo_description e cover_alt) e nas metragens corroboradas: 140 registros precisaram de atualização, com complementação editorial em 66 e correção de área em 135. Após a aplicação, os 1.458 campos editoriais dos 162 projetos conferem com o conteúdo aprovado. Imagens, títulos públicos e flags de publicação e visibilidade foram preservados. Nenhuma campanha foi ativada.

O artigo existente recebeu os números e o FAQ corrigidos. O ajuste técnico que exibe a introdução arquitetônica e mantém as casas decimais foi publicado pelo Lovable; o HTML público de uma ficha foi conferido com os novos parágrafos, a área de 27,75 m² e o custo de R$ 2.882,88/m². Commit técnico: `4f23ebdf64f754986b690802331bd2aee7c68725`. Validações: 969 testes aprovados, cinco previamente ignorados, typecheck e lint sem erros.

## Validação

162 slugs únicos e correspondentes ao portfólio; todos os nove campos preenchidos; nenhum parágrafo integral repetido, título de SEO idêntico ou escopo integral duplicado. Corpos de 288–397 palavras. Títulos de SEO até 65 caracteres; descrições de 120–158; alternativas das capas de 80–140. Custos e áreas conferidos contra os dados editoriais confirmados, fases de obra respeitadas e campos financeiros não autorizados ausentes. Os alertas remanescentes são conferências de cadastro, dados pendentes e referências de extensão por seção, sem erros bloqueantes.

Os resultados de SEO dependem da indexação posterior pelos buscadores; a aplicação não garante posição nas buscas.

## Correções com a base XLSX

A validação dos 205 contratos não encontrou divergências de centavos no custo por m² calculado por valor ÷ área. Os 141 custos já incluídos no portfólio permanecem corretos. A área do slug `rm` passou de 28 para 28,21 m² porque os dois contratos candidatos (10 e 20) possuem essa área; o custo segue omitido. A base não possui finalidade de uso.

O artigo foi recalculado: faixa central R$ 2.491–3.260/m²; mediana R$ 2.762/m²; cenários arredondados de R$ 2.500–3.300/m². As tabelas, os recortes por área, as estatísticas regionais e o FAQ acompanham os novos valores. A análise regional reproduz os 93 registros do texto aprovado: as medianas da base anterior foram reproduzidas em todas as regiões antes do recálculo. A classificação continua inferida, sem comprovar endereço nem causalidade. O exemplo de proposta e o prazo provenientes de documento separado foram preservados.
