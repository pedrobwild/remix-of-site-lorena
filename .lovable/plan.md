# Painel de geração automática do sitemap

## Objetivo
Transformar a aba “Sitemap & Robots” do painel em uma ferramenta operacional que gera o XML diretamente dos projetos e conteúdos publicados, apresenta o resultado e permite conferência imediata.

## Implementação
- Reutilizar o gerador dinâmico já existente, que consulta os projetos visíveis e conteúdos publicados sempre que é chamado.
- Adicionar ao painel um botão “Gerar sitemap agora”, com estados de carregamento, sucesso e erro.
- Após gerar, validar o XML e mostrar: total de URLs, quantidade de projetos, quantidade de conteúdos e horário da geração.
- Exibir uma prévia das URLs incluídas e oferecer ações para abrir ou baixar o arquivo XML atualizado.
- Garantir que apenas projetos visíveis/publicados e conteúdos publicados entrem no arquivo.
- Alinhar o gerador dinâmico às mesmas rotas, datas reais e domínio oficial usados pelo gerador de publicação.
- Manter o sitemap público estático sendo regenerado automaticamente em cada publicação; o painel deixa claro quando uma nova publicação é necessária para substituir esse arquivo no domínio.

## Validação
- Testar os estados de carregamento, sucesso e falha.
- Conferir se o XML é válido, sem duplicidades e sem rotas administrativas ou privadas.
- Validar o painel em desktop e celular e executar testes, tipos e lint dos arquivos alterados.
