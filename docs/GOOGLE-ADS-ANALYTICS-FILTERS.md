# Google Ads Analytics: filtros de período e destino

## Situação atual

Em 11/10/2026, a função `google-ads-audiences` foi publicada pelo Lovable Cloud com os dois arquivos autorizados. O código sincronizado em `main` (`f452417`) foi comparado com o código testado: `index.ts` e `report.ts` são idênticos. A validação autenticada no painel publicado confirmou o contrato v2 e as consultas filtradas. O frontend aguarda a conclusão do processo de integração/publicação do PR #69. O teste desatualizado de agradecimento foi ajustado com autorização; a suíte local completa passou.

O backend `aamlnkmqvjcowixdgqii` é **Lovable Cloud**, administrado em More → Cloud do projeto Remix of Site Lorena. Não é um projeto da conta Supabase conectada. Não existe uma simples reconexão para torná-lo um Supabase próprio: seria necessário planejar uma migração separada, conforme a [distinção oficial entre Cloud e Supabase](https://docs.lovable.dev/integrations/supabase). Não foram criados projetos, migrados dados ou alteradas credenciais.

## Contrato e semântica

O frontend envia `from` e `to` em datas locais `YYYY-MM-DD`, `segments` e o período anterior quando a comparação está ligada. A função consulta os limites inclusivos no fuso da conta, confirma o pedido em `request` e retorna `version: 2`; respostas antigas ou de outro recorte não são exibidas como dados filtrados.

- `landing_path`: compara o caminho exato das URLs históricas de `expanded_landing_page_view`, ignorando querystrings e barra final, nos hosts `bewild.com.br` e `www.bewild.com.br`. Não filtra pelos destinos atuais dos anúncios, que podem ter mudado depois do clique.
- Não é uma coorte de todas as sessões do tracker ou do GA4. A tela identifica explicitamente o recorte como destino dos anúncios e conserva a atribuição do Google Ads.
- Públicos: catálogo atual da conta, separado dos KPIs; tamanho e elegibilidade não podem ser recortados historicamente por página.
- Conversões: junção por ID da ação, não por nome. “Todas” inclui secundárias, sem representar pessoas únicas; o indicador é custo por conversão, não CPL validado no CRM.
- Outros segmentos do tracker: bloqueados com mensagem explícita, não ignorados silenciosamente.
- Período anterior: usa a regra de calendário já existente no painel. Quando o atual está em curso, a tela avisa que o anterior pode conter dias completos; não promete equivalência intradiária.
- Falhas de consulta/paginação: não retornam silenciosamente totais truncados ou uma conta inteira no lugar de uma página sem registros.

A compatibilidade dos campos e a agregação por destino estão documentadas pelo [Google Ads API v25](https://developers.google.com/google-ads/api/fields/v25/expanded_landing_page_view). A diferença entre `conversions` e `all_conversions` segue a [documentação de conversões](https://developers.google.com/google-ads/api/docs/conversions/reporting).

## Publicação segura

O backend deste repositório é o projeto `aamlnkmqvjcowixdgqii`, configurado em `supabase/config.toml`. O conector Supabase não permite administrar esse projeto Cloud; a função foi publicada pelo ambiente autorizado do Lovable. A sequência abaixo documenta a ordem segura de implantação; as etapas do backend já foram executadas, conforme o registro final desta nota.

1. Publicar pelo ambiente autorizado do projeto Lovable **Remix of Site Lorena** a função `google-ads-audiences`, incluindo **index.ts e report.ts**, antes de publicar o frontend.
2. Manter os segredos já existentes. Não substituir credenciais, não expor chaves ao navegador e não mudar políticas RLS.
3. Preservar `requireAdmin` e a configuração existente de JWT: a função verifica o usuário e `is_admin` internamente; não criar acesso público ao relatório.
4. Validar com uma sessão administrativa o request `{"from":"2026-09-11","to":"2026-10-10","segments":[{"dim":"landing_path","value":"/guia-do-investidor"}],"previous":{"from":"2026-08-12","to":"2026-09-10"}}`.
5. Confirmar `version: 2`, eco exato dos filtros, datas, escopo e ausência de erros GAQL. Conferir os totais com o relatório de páginas de destino do Ads, inclusive um caminho sem dados. Não presumir que haja anúncios para o guia.
6. Integrar a branch e publicar o frontend pelo fluxo habitual. Validar a URL compartilhada, troca de datas, remoção do segmento, comparação, atualização e modo sem dados.

O backend continua atendendo chamadas antigas sem parâmetros com os últimos 30 dias completos. Se o frontend novo encontrar uma função antiga, exibe aviso de implantação pendente em vez de mostrar números incorretos.

## Testes

- `npx vitest run src/lib/__tests__/googleAdsReport.test.ts src/components/admin/analytics/__tests__/GoogleAdsAudiencesTab.test.tsx`
- `npx vitest run`
- `npx tsc --noEmit`
- `npm run build`
- `npx deno check --node-modules-dir=none --no-lock --no-config supabase/functions/google-ads-audiences/index.ts`

A validação local usa respostas simuladas para a interface e para as agregações. Não substitui a checagem autenticada da função publicada; nenhum dado de campanha ou orçamento é alterado por esta correção.

### Registro de validação em 10/10/2026

- 31 novos testes de regressão passaram: 22 de validação/consulta/agregação e nove de interface.
- Suíte completa: 1.253 testes passaram e nove testes existentes foram ignorados; nenhum teste falhou.
- TypeScript e Deno: verificações concluídas sem erro.
- Build de produção e paridade de rotas: concluídos. Permanecem os avisos de tamanho de bundles e depreciações já existentes; o sitemap foi preservado por ausência das variáveis de geração no ambiente local.
- ESLint dos arquivos frontend alterados: sem erro. As funções Supabase são ignoradas pela configuração de ESLint do repositório e foram verificadas com Deno.
- QA da prévia com o componente real: alteração de início/fim, troca e limpeza de página, comparação ligada/desligada, atualização, ausência de anúncios, filtro não suportado, erro com recuperação e proteção contra backend antigo.
- Capturas revisadas em 1365×900 e 375×812, com conferência adicional de tema escuro; nenhum erro JavaScript ou overflow horizontal global observado.
- Produção: não publicada. Falta a implantação autorizada da função e a conferência autenticada de GAQL antes de liberar o frontend.

### Atualização em 11/10/2026

- Publicação autorizada pelo responsável: a branch foi atualizada sobre `main` (`0ccbcae`) e o [PR #69](https://github.com/pedrobwild/remix-of-site-lorena/pull/69) foi aberto em rascunho, sem integração na `main`.
- A repetição da suíte na base atual teve 1.255 testes aprovados, nove ignorados e uma falha em `src/lib/__tests__/leadFormPages.test.tsx:326`. Os 31 testes específicos da correção continuam aprovados.
- A mesma falha foi reproduzida em uma cópia independente de `origin/main`, sem esta correção: o teste espera o título “Obrigado, Davi.” após o envio do formulário. Não foi alterado código de orçamento para resolver um problema fora do escopo.
- TypeScript e build de produção passaram novamente na base atual.
- O conector Supabase foi consultado novamente: o projeto `aamlnkmqvjcowixdgqii` não aparece entre os projetos disponíveis e a leitura da função retornou falta de permissão. Nenhuma implantação foi tentada em projetos diferentes.
- O pedido inicial de implantação no Lovable foi interrompido pelo próprio serviço porque a branch não estava disponível no ambiente sincronizado. Nenhum arquivo foi implantado; a alternativa de enviar os dois arquivos foi cancelada antes do envio, após a orientação para usar conectores.
- Backend e frontend continuam sem publicação desta correção. Para retomar por conectores, é necessário acesso administrativo ao projeto correto; o PR deve continuar em rascunho até a validação autenticada do backend e a resolução ou avaliação do teste preexistente.

### Publicação do backend e validação autenticada em 11/10/2026

- Após nova autorização, os dois arquivos foram fornecidos no chat do projeto Lovable e a função foi publicada. A comparação com o código sincronizado no GitHub confirmou apenas os dois arquivos do backend alterados nesta publicação.
- O Lovable não tinha uma sessão administrativa para concluir os testes. A validação foi realizada em seguida pelo cliente já autenticado do painel da Bewild no navegador, sem extrair credenciais e sem utilizar service role.
- Período 11/09–10/10/2026: respostas `connected: true`, `version: 2`, eco exato das datas/segmentos e escopo correto para a conta sem segmento, `/guia-do-investidor` e `/orcamento`.
- Comparação de 12/08–10/09/2026: intervalo anterior correto retornado tanto no relatório geral quanto no recorte do guia.
- Caminho de teste sem destino cadastrado: lista de campanhas vazia e totais zerados; não houve substituição pelos totais gerais.
- Proteções: filtro `device` não suportado recusado com HTTP 400; chamada sem autenticação recusada com HTTP 401. `requireAdmin`, JWT, segredos e RLS foram preservados.
- Os 31 testes específicos passaram novamente, assim como Deno check. Valores financeiros e de desempenho obtidos na validação não foram incluídos nesta documentação pública.
- Frontend ainda não integrado nem publicado. O CI do PR continua bloqueado por um teste preexistente de `/orcamento`: espera “Obrigado, Davi.”, enquanto a interface atual exibe “Obrigado, Davi. Guardamos o seu contato.”. O diagnóstico não demonstra, por si só, falha funcional no formulário; o ajuste do teste está fora desta etapa de backend.

### Ajuste autorizado do teste em 11/10/2026

- Foi alterada somente a expectativa do título no teste `leadFormPages.test.tsx`, de “Obrigado, Davi.” para “Obrigado, Davi. Guardamos o seu contato.”. O código do formulário não foi alterado e nenhum pedido real foi enviado.
- Nova execução local: 1.256 testes aprovados, nove ignorados, nenhuma falha; TypeScript e build de produção também concluídos.
- A tela de publicação do Lovable ainda sinalizou um achado crítico antigo para `scope-plan`. A função publicada foi consultada sem autenticação e respondeu HTTP 410 com `error: gone`; o código no repositório é um stub sem chamada de IA. Nenhum achado foi ignorado, removido ou marcado como resolvido.
- O Lovable publica o estado atual do projeto, que contém outras alterações anteriores desta equipe. A liberação do frontend deve respeitar o escopo autorizado para essa versão completa, sem reverter ou descartar alterações de outras tarefas.
