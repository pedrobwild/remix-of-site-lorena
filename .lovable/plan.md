# Redesenho da jornada e do portal Bwild Workflow

## Objetivo
Atualizar somente a seção `#workflow` da home, preservando os textos existentes exigidos e sem publicar.

## Implementação
1. Reorganizar as 12 etapas em três fases conectadas, com linha do tempo responsiva:
   - três colunas no desktop;
   - fases empilhadas com duas colunas de etapas no tablet;
   - linha única com divisores de fase no celular;
   - links “no Bwild Workflow” nas etapas 09 e 11 apontando para o portal.
2. Transformar a réplica do portal em três abas acessíveis: Curva S, Relatórios e Cronograma.
3. Preservar integralmente a tela Curva S e acrescentar:
   - relatório semanal com três imagens e os textos fornecidos;
   - cronograma de dez semanas e doze atividades, com versão compacta no celular.
4. Implementar navegação das abas por clique e setas esquerda/direita em `HomePage.tsx`, mantendo Curva S visível sem JavaScript.
5. Aplicar apenas estilos da seção, seguindo Manrope, JetBrains Mono, hairlines e cantos vivos, sem gradientes ou efeitos de vidro.
6. Ajustar ou adicionar testes específicos da interação e estrutura da seção.

## Verificação
- Build, lint e suíte de testes.
- Conferência visual da jornada e das três abas em 1280 px e 390 px, além de checagem de 320 px sem rolagem horizontal.
- Capturas em `docs/auditoria/evidencias/2026-09-23/`.
- Nenhuma publicação.

## Arquivos previstos
- `src/pages/home-bwa-body.ts`
- `src/pages/home-bwa.css`
- `src/pages/HomePage.tsx`
- testes diretamente relacionados, se necessário
- capturas solicitadas em `docs/auditoria/evidencias/2026-09-23/`
