# Página Marcas e Parcerias

## Objetivo
Criar uma página pública `/marcas-e-parcerias` com o mesmo cabeçalho e rodapé do restante do site, reunindo provas institucionais reais da Bewild.

## Implementação
- Criar a página com uma abertura editorial e duas áreas:
  - **Na mídia:** Record News e All Around Worlds, com imagens já existentes e links para as matérias originais em nova aba.
  - **Parcerias:** parceria vigente Bewild × Leal Moreira e acesso ao programa completo de parceiros em `/parceiros`.
- Manter os nomes, fatos e links já documentados no projeto; não incluir marcas sem confirmação.
- Conectar o título/chamada da seção “Bewild na mídia” da home à nova página, mantendo os cards individuais apontando para as publicações originais.
- Registrar a rota pública e incluir a nova URL no sitemap.
- Validar navegação, visual em computador e celular, links externos e ausência de rolagem horizontal.

## Detalhes técnicos
- Reutilizar `BwaNav`, `BwaFooter`, tokens e estilos públicos existentes.
- Configurar título, descrição, endereço canônico e dados estruturados institucionais da nova página.
- Atualizar o gerador do sitemap e os contratos de paridade de rotas.
