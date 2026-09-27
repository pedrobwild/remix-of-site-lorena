# Correção de regressão e acessibilidade da home

## Objetivo
Restaurar o fundo e o contraste dos blocos Bastidores, Atmosferas Bewild e Tour 3D, corrigir os avisos de acessibilidade indicados e manter todo o restante da home inalterado.

## Alterações
- Em `HOME_BWA_HTML`, remover apenas o fechamento órfão após o Tour 3D.
- Mover o botão fixo “Solicitar orçamento” para dentro do conteúdo principal, sem mudar seu visual.
- Trocar somente os 12 cartões com `role="listitem"` de `article` para `div`, preservando classes, atributos e comportamento.
- Corrigir exclusivamente os três erros de digitação informados no bloco “Para quem”.
- Dar fundo escuro próprio a Bastidores, galeria e Tour 3D; restaurar o respiro inferior do Tour 3D no desktop.
- Melhorar o contraste do rótulo “Galeria de projetos” e adicionar margem de rolagem às seções com âncora.

## Verificação
- Rodar a checagem de tipos e os testes solicitados da home e das páginas.
- Conferir a home em 1280 px e 390 px, incluindo fundos, contraste, seção Serviços, âncoras, landmarks e ausência de rolagem horizontal.
- Confirmar que somente os dois arquivos autorizados foram alterados.

## Limites
Nenhuma outra copy, seção, arquivo ou dado será alterado. O site não será publicado.
