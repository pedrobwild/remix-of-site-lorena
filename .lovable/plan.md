# Troca de Bastidores por slider de vídeos

## Implementação
- Substituir somente o bloco `bwa-bastidores` da home pelo HTML fornecido, preservando as demais seções.
- Remover integralmente os estilos antigos de cards/lightbox e inserir exatamente o CSS do novo slider.
- Substituir o instalador por vídeo próprio com carregamento sob demanda, autoplay silencioso, som exclusivo, navegação, progresso e limpeza.
- Atualizar apenas o comentário da integração existente em `HomePage.tsx`.
- Criar o README dos 12 arquivos esperados em `public/videos/bastidores/` e remover o README anterior de capas, se confirmado como pertencente à mudança anterior.
- Reescrever o teste da seção com os quatro cenários solicitados e stubs de mídia.

## Validação
- Confirmar por busca que não restaram regras `.bwa-bst-lb` nem `.bwa-bastidores-tile`.
- Rodar a suíte de testes e o build, registrando separadamente apenas eventuais falhas antigas conhecidas.
- Não publicar.

## Observação
Os vídeos e capas não serão criados, baixados ou convertidos; o slider exibirá o fallback previsto até os 12 arquivos serem enviados.
