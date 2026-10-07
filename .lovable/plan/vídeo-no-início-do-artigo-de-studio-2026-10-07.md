# Vídeo no início do artigo de studio

- Inserir o vídeo solicitado logo após o cabeçalho e antes da capa e do primeiro parágrafo, sem mudar outros artigos.
- Mostrar uma miniatura descritiva em 16:9, na largura da coluna, com cantos discretamente arredondados; carregar o player sem cookies somente ao clicar em reproduzir.
- Preservar o Article e acrescentar VideoObject no HTML servido, com título solicitado, resumo do artigo, miniatura, data de publicação e editora Bewild Arquitetura & Reformas.
- Verificar posição, reprodução, tamanho no celular e dados para o Google; informar os arquivos alterados. Não publicar.

## Detalhes técnicos
- Adicionar campo opcional `youtube_video_id` em `bewild_posts`, preservando permissões e preenchendo apenas o slug solicitado.
- Reutilizar o campo no leitor do artigo e nas funções existentes de JSON-LD, com metadados no cadastro de vídeos existente.
- Adicionar testes de miniatura/player e VideoObject SSR, mantendo os vídeos existentes sem alteração.