# Metadados SEO e Open Graph do site Bewild

## Objetivo
Atualizar os metadados da home para refletir a nova seção Bastidores e garantir que cada página pública tenha título, descrição, URL canônica e Open Graph próprios.

## Implementação
- Atualizar a descrição da home no HTML principal e na configuração da própria página, citando os bastidores reais da equipe em obra sem perder o foco em arquitetura, reforma e São Paulo.
- Revisar todas as rotas públicas e completar somente as páginas que não tenham metadados próprios.
- Manter os artigos e projetos com seus dados dinâmicos, capas próprias quando disponíveis e a imagem social padrão como fallback.
- Preservar páginas internas e administrativas como `noindex`.
- Manter `https://bewild.com.br` como domínio canônico e não alterar o conteúdo visual das páginas.

## Validação
- Confirmar no navegador os metadados renderizados da home e das rotas públicas representativas.
- Rodar os testes de SEO, a suíte completa e o build.
- Não publicar sem uma solicitação explícita.

## Observação técnica
A seção Bastidores faz parte da home, portanto ela não recebe uma URL ou Open Graph separado. A indexação acontece pela home; o texto visível da seção e a nova descrição da página serão lidos pelos mecanismos de busca após a próxima publicação e novo rastreamento.
