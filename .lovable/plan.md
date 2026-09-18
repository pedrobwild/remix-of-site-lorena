# Otimização SEO de páginas e projetos

## Objetivo
Fortalecer a presença orgânica da Bewild para buscas relacionadas a reformas de apartamentos e apartamentos prontos, mantendo os textos naturais, únicos e coerentes com cada página.

## Implementação
- Revisar título e descrição da home, portfólio, conteúdos, orçamento, FAQ, contato e privacidade.
- Atualizar o gerador de títulos e descrições de projetos para combinar o nome e os dados reais de cada imóvel com “reforma de apartamento” e “apartamento pronto”.
- Preservar títulos e descrições personalizados quando já tiverem contexto relevante; complementar apenas os que estiverem genéricos.
- Ajustar metadados de artigos sem texto personalizado com um fallback editorial alinhado às novas palavras-chave.
- Atualizar dados estruturados dos projetos para refletir reforma completa e entrega do apartamento pronto.
- Manter canonical, Open Graph e Twitter sincronizados pelo mecanismo SEO existente, sem alterar design, conteúdo visível ou rotas.
- Atualizar os testes do gerador de SEO e validar as principais rotas no navegador.

## Validação
- Conferir títulos, descrições, canonical, Open Graph e JSON-LD na home, páginas internas e em projetos com diferentes níveis de dados.
- Rodar testes de SEO, verificação de tipos e lint dos arquivos alterados.
- A publicação será necessária para que os novos metadados cheguem ao domínio oficial.

## Observação técnica
O site atual atualiza metadados por rota no navegador. O Google executa esse conteúdo; redes sociais que não executam JavaScript continuam usando a prévia geral definida no site.
