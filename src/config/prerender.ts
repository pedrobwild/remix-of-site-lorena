/**
 * Páginas públicas de conteúdo fixo, pré-renderizadas no build (HTML pronto
 * em `<rota>/index.html`, servido como arquivo estático). Lido pelo
 * vite.config.ts (quem gera) e pelo src/server.ts (quem serve o arquivo
 * quando a hospedagem entrega a requisição ao worker em vez de servir o
 * estático direto).
 *
 * Fica de fora o que muda sem uma publicação do site: /orcamento (o H1 varia
 * por utm_content no servidor), artigos, portfólio, bairros, /faq e
 * /mapa-do-site (lidos do banco a cada visita) e o /admin. Nessas o cache de
 * borda do worker (src/lib/edgeHtmlCache.ts) faz o papel.
 *
 * Efeito colateral aceito: título/descrição editados em /admin/seo só entram
 * no HTML destas páginas na próxima publicação (o `useSeo` do cliente aplica
 * na hora, como sempre).
 */
export const PRERENDERED_PAGES = [
  "/",
  "/reforma-de-studio-sao-paulo",
  "/reforma-de-apartamento-sao-paulo",
  "/reforma-de-cobertura-sao-paulo",
  "/servicos",
  "/como-funciona",
  "/marcenaria",
  "/onde-atuamos",
  "/autorizacao-condominio",
  "/contato",
  "/escopo",
  "/parceiros",
  "/parceiros/incorporadoras",
  "/indique-um-amigo",
  "/marcas-e-parcerias",
  "/videos",
  "/autores",
  "/indice-de-custo-de-reforma",
  "/acessibilidade",
  "/privacidade",
  "/politica-de-cookies",
] as const;

export const PRERENDERED_SET: ReadonlySet<string> = new Set(PRERENDERED_PAGES);
