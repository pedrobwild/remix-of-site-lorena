# Réplica fiel do portal Bwild Workflow na home

## Objetivo
Substituir somente a interface ilustrativa dentro de `.bwa-portal-wrap#workflow-portal` por uma réplica React do portal do cliente, usando dados simulados e preservando integralmente a jornada das 12 etapas e o restante da home. Não publicar.

## Implementação
1. Criar `src/components/workflow-replica/workflowReplicaData.ts` com:
   - identificação fictícia do imóvel e cliente;
   - marcos, progresso e 12 atividades com datas/status simulados;
   - pontos da Curva S entre 04/08/2026 e 10/10/2026;
   - histórico e detalhe dos relatórios;
   - referências às três imagens já existentes no projeto.
2. Criar `WorkflowPortalReplica.tsx` e CSS isolado sob `.wf-replica`, com tokens exatos do Workflow, moldura de navegador e fontes Montserrat/Inter carregadas apenas para a réplica.
3. Implementar no componente:
   - identificação, etapa atual, marcos e progresso;
   - abas acessíveis com teclado e sete áreas, exibindo três no celular;
   - Cronograma responsivo em tabela no desktop e cartões no celular;
   - Evolução de Obra com Curva S em Recharts, referências, legenda, tooltip e alternância de janela;
   - Relatórios com lista, navegação de detalhe e galeria;
   - estados vazios das demais áreas.
4. Em `HOME_BWA_HTML`, manter `.bwa-portal-wrap#workflow-portal`, substituir somente o portal antigo por `<div id="workflow-portal-root"></div>` e preservar a legenda existente.
5. Em `HomePage.tsx`, renderizar a réplica nesse nó com `createPortal`, remover a instalação das abas antigas e manter as demais integrações da home intactas.
6. Atualizar `dl.bwa-wf2-tabs` apenas nos três títulos/textos solicitados: Cronograma, Evolução de Obra e Relatórios.
7. Remover ou neutralizar somente os estilos antigos do portal que não forem mais usados, sem tocar nos estilos da jornada.

## Verificação
- Build, lint e suíte de testes.
- Interações das abas, teclado, expansão dos detalhes e alternância da Curva S.
- Conferência visual em 1280, 390 e 320 px, sem rolagem horizontal e com altura interna controlada no desktop.
- Capturas das abas Cronograma, Evolução de Obra e Relatórios em 1280 e 390 px, em `docs/auditoria/evidencias/2026-09-23/`, com prefixo `wf-replica-`.
- Nenhuma publicação.

## Arquivos previstos
- `src/components/workflow-replica/workflowReplicaData.ts`
- `src/components/workflow-replica/WorkflowPortalReplica.tsx`
- `src/components/workflow-replica/workflow-portal-replica.css`
- `src/pages/home-bwa-body.ts`
- `src/pages/HomePage.tsx`
- `src/pages/home-bwa.css` apenas para remover conflitos antigos estritamente necessários
- testes diretamente relacionados
- capturas solicitadas
