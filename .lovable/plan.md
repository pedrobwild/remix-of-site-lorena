# Novo bloco “Para quem” na home

## Resultado
- Inserir o novo bloco `Para quem · 01` imediatamente após o hero e antes de `#certeza`, com os dois cartões e a nota de venda exatamente como aprovados.
- Remover integralmente o bloco antigo `#objetivos` e apenas a chamada subsequente “Morar, alugar ou vender: o próximo passo é o mesmo.”
- Manter intactos o hero, a outra chamada intermediária e toda copy fora das alterações expressamente listadas.

## Implementação
1. **Estrutura e navegação**
   - Editar a fonte HTML da home para inserir `#para-quem`, remover os dois blocos substituídos e atualizar o item mobile “Morar, alugar ou vender”.
   - Trocar todas as âncoras `#objetivos` do site por `#para-quem`, incluindo os headers compartilhados.
   - Usar as imagens locais existentes; validar a imagem principal do cartão “Para morar” e aplicar o fallback local indicado caso ela não carregue no mesmo domínio.

2. **Apresentação**
   - Adicionar somente os estilos `.bwa-audience*` solicitados, reutilizando tokens, tipografia e botão atuais.
   - Integrar o novo bloco às regras existentes de espaçamento, cabeçalhos, entrada animada e redução de movimento.
   - Garantir cartões equivalentes, imagens 4:3, botões alinhados e coluna única abaixo de 900 px.

3. **Sequência editorial**
   - Renumerar exclusivamente os números dos rótulos mono posteriores para a sequência `02` a `10`, sem alterar seus textos.
   - Confirmar ausência de `#objetivos`, duplicidade de `· 07` e lacunas na sequência pedida.

4. **Diagnóstico e campanhas**
   - Ler `objetivo` da URL na montagem do formulário e pré-selecionar apenas os cinco valores reconhecidos, marcando o campo como tocado.
   - Preservar nomes, IDs, validações, payload e eventos atuais.
   - Acrescentar teste garantindo que parâmetros de campanha sejam mesclados sem apagar `objetivo` já presente no destino.

5. **Analytics**
   - Registrar cliques em links `a[data-cta]` da home como `cta_click`, usando o valor de `data-cta`, sem interferir na navegação.
   - Incluir os novos cartões na animação de entrada já existente.

## Validação
- Rodar lint, testes e build do projeto.
- Conferir a home em 360, 390, 768 e 1440 px, sem rolagem horizontal, com os cartões de mesmo peso visual.
- Conferir imagens, links, foco visível e hierarquia `h2 → h3`.
- Abrir `/diagnostico?objetivo=short-stay` e confirmar visualmente o chip “Short stay” marcado.
- Entregar a lista de arquivos alterados, confirmação de copy preservada e evidências desktop/mobile.
- Manter tudo somente no preview; não publicar.
