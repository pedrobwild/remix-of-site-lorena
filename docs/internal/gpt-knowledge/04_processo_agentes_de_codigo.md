# 04 · PROCESSO COM AGENTES DE CÓDIGO (Lovable e similares) · Jurisprudência da casa

Escopo: como produzir e revisar mudanças no site da Bewild (ou qualquer produto da holding) usando agentes de código sem gerar retrabalho. Estas regras nasceram de incidentes reais e são LEI. Em conflito, o arquivo 01 prevalece.

## A lei do processo (3 papéis)
1. O mentor/estrategista ANALISA o código real (lê os arquivos) e ESCREVE a fonte da verdade: código completo ou HTML de mockup. 2. O Matheus VALIDA com os próprios olhos (preview, aba anônima, desktop e celular). 3. O agente de código COLA literalmente, sem reinterpretar, renomear, "melhorar" ou alterar copy. Agente nunca decide nada. Ao gerar instruções para o Lovable, o GPT deve produzir mensagens no formato "EXECUÇÃO LITERAL" abaixo, nunca briefings abertos.

## Formato da mensagem de execução literal
Cabeçalho: "EXECUÇÃO LITERAL. Colar exatamente, sem reinterpretar, sem renomear, sem alterar copy ou lógica." Partes numeradas: "SUBSTITUIR ARQUIVO INTEIRO: caminho" seguido do conteúdo completo; "EDIT PONTUAL" com a linha exata antes/depois; "LIMPEZAS MECÂNICAS" com operações determinísticas (ex.: substituir string literal X por Y em todo src/ e reportar arquivos); "QA OBRIGATÓRIO" ao final. Proibições explícitas dentro da mensagem valem mais que instruções positivas.

## Jurisprudência (incidentes reais e a lição de cada um)
CASO 1, a réplica do portal: o agente substituiu um bloco trabalhado por uma versão genérica "melhorada". Lição: proibir explicitamente reescrever qualquer bloco já validado; réplicas de produto são sagradas.
CASO 2, o Frankenstein do Diagnóstico: aplicar overlay de tema novo sobre esqueleto de layout antigo (grid de 3 colunas de outra era) quebrou a página inteira. Lição: pele nova em ossos velhos não funciona; página com layout de outra era se REESCREVE preservando lógica linha a linha, nunca se "harmoniza".
CASO 3, a FaqPage apagada: o agente reescreveu do zero uma página trabalhada durante um reskin em lote. Lição: git é a rede de segurança (ler o arquivo no commit anterior e restaurar a copy original); e reskins em lote exigem lista explícita do que NÃO pode ser tocado.
CASO 4, a colisão de CSS: um ".projects { background: navy }" global antigo pintava a home nova. Lição: todo trabalho novo usa prefixo de classe próprio (bwh-, bwd-) para isolamento total do CSS legado.
CASO 5, a alavanca da folha de estilo: três páginas antigas data-driven (conteúdos, artigo, privacidade) trocaram de pele de uma vez reescrevendo APENAS as folhas de estilo antigas mantendo os nomes de classe. Lição: quando a estrutura é boa e o problema é o tema, reescrever o CSS mantendo classes é a mudança de menor risco e maior alavanca; chrome antigo (molduras, carimbos, quadriculados) morre com display:none.

## Estratégia por tipo de página
Página nova ou de layout novo: mockup HTML fonte-da-verdade > validação > porte literal com prefixo novo. Página com lógica crítica (formulários, pagamentos, tracking): reescrever a apresentação preservando 100% da lógica copiada literalmente (estados, validação, submissão, eventos, ids de âncora); depois teste de ponta a ponta obrigatório. Página data-driven de tema antigo: reescrever a folha de estilo mantendo nomes de classe. Página interna/admin: apenas fontes e paleta; densidade e utilidade acima de estética. LPs de anúncio ativas: não tocar sem decisão explícita (campanha viva).

## Bateria de QA padrão (exigir no fim de toda mensagem)
Typecheck (tsc) sem erros; teste Playwright de ponta a ponta do fluxo crítico (ex.: formulário do diagnóstico até o estado de sucesso, sem erros de console); screenshots 1280x800 e 320px de todas as páginas afetadas + home para conferir efeito colateral; grep case-insensitive de "grupo bwild" = zero; sem overflow horizontal; relatório final com arquivos tocados e riscos encontrados. Se o agente entregar sem o QA pedido, o QA decisivo passa a ser o olho humano com checklist dado pelo mentor.

## Etiqueta operacional
Mensagens grandes: enviar e aguardar; execuções longas podem levar 5 a 10 minutos. Se o agente parar para perguntar, responder autorizando fases em sequência com gate de QA entre elas, sem aprovação intermediária, parando apenas em risco real. Custo em créditos é sinal de escopo: pacotes literais custam menos que briefings abertos. Projeto do site: Lovable 6a6657bf-3700-4d35-867e-c076acbf7613; preview: id-preview--6a6657bf-3700-4d35-867e-c076acbf7613.lovable.app.

Naming: Bewild · Bwild Workflow · Bwild Ventures · Bewander. Nunca "Grupo Bwild".
