# Search Console no painel Bewild

## Resultado
Ampliar **Analytics → SEO**, aproveitando a conexão já autorizada, sem criar outro painel nem solicitar um novo login no Google.

- Destacar a busca exata **“reforma de studios”**: impressões, cliques, CTR e posição média, com as páginas que apareceram para ela em uma lista separada.
- Mostrar rastreio de home, serviço e artigo de etapas: situação no índice, última leitura do Google e última conferência. Reutilizar os registros existentes de indexação.
- Preservar o relatório de sitemap, mostrando envio, última leitura, URLs enviadas e erros/avisos. Falha de consulta não significa sitemap ausente; a contagem antiga de URLs indexadas não será usada.
- Mostrar período dos dados e horário da atualização. O Google tem atraso de processamento; “atualizado” não significa visitas ou posições instantâneas.
- Preservar filtros e demais relatórios já existentes, com estados de carregamento, ausência de dados e erro.

## Atualização e privacidade
Guardar os relatórios em uma cópia privada atualizada diariamente. Abrir o painel e reler essa cópia não consultará o Google repetidamente. O rastreador de indexação já possui uma tarefa ativa a cada duas horas; sua rotina será preservada, sem criar uma segunda varredura de todas as URLs.

O acesso continua restrito a administradores. Não alterar campanhas, enviar conversões, reenviar sitemap sem mudança ou solicitar indexação automaticamente.

## Detalhes técnicos
- Substituir a chamada direta da aba aos relatórios por funções TanStack autenticadas, reutilizando `attachCrmAuth`, `requireSupabaseAuth` e `is_admin`.
- Ler propriedades verificadas no servidor e resolver a propriedade correspondente ao domínio em cada atualização; se houver várias, oferecer seleção sem padrão e revalidá-la. Não fixar a propriedade obtida nesta conversa no código.
- Criar armazenamento com grants e RLS administrativos para snapshots e configuração da seleção. Manter falhas visíveis e a última cópia bem-sucedida identificada como antiga.
- Paginar relatórios que possam ultrapassar o limite da API. Consultar “reforma de studios” por filtro exato, sem depender de ela estar entre as principais consultas. Não somar linhas por página como se fossem totais da propriedade.
- Atualização diária por chamada protegida com segredo exclusivo do servidor; nunca usar a chave pública como autorização para gravar relatórios privados. Preparar a agenda sem ativá-la contra uma página ainda não publicada.
- Reutilizar `seo_index_status` para rastreio e os componentes existentes da aba para exibição.

## Conferência e entrega
Testar acesso negado para não administrador, resolução de propriedades, filtro exato, separação de totais/páginas, falhas e atualização da cópia. Conferir com dados reais na prévia autenticada e em tela estreita. Registrar as decisões em AGENTS e o resultado no roadmap.

Não publicar nesta etapa. A rotina diária de produção só será ativada depois da publicação solicitada; a prévia será conferida com uma atualização inicial autorizada.