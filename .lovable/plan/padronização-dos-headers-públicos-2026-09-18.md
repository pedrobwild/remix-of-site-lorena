# Padronização dos headers públicos

## Objetivo
Usar em todas as páginas públicas o mesmo cabeçalho da home, com a logo horizontal atual, fundo branco-gelo, navegação e comportamento mobile consistentes.

## Implementação
- Extrair a referência da logo atual para um único componente reutilizável, preservando proporção e texto alternativo.
- Atualizar os cabeçalhos compartilhados das páginas internas para usar essa logo em vez do nome em texto.
- Alinhar os links desktop e mobile, incluindo Contato e o CTA “Solicitar Orçamento”.
- Manter as páginas especiais de QR sem navegação global, mas corrigir nelas a aplicação da mesma marca visual onde hoje exibem uma logo antiga.
- Preservar o painel administrativo e a tela de manutenção, que possuem cabeçalhos próprios por função.

## Verificação
- Conferir home, portfólio, conteúdo, projeto, diagnóstico, FAQ, contato, privacidade e 404 em desktop e mobile.
- Confirmar fundo branco-gelo, proporção da logo, menu mobile, ausência de sobreposição e de rolagem horizontal.
- Executar lint, verificação de tipos e testes.
