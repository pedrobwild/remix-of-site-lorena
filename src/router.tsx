import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // O QueryClient do TanStack Query mora no AdminChunk (só o painel usa
  // useQuery): fora do contexto do roteador, o react-query sai do pacote
  // inicial das páginas públicas (velocidade, 09/11/2026).
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // A navegação legada (navigate() em useHashRoute.ts, chamada pelo
  // interceptador de <a> e por componentes) usa esta referência para
  // navegar pelo TanStack Router sem import circular.
  if (typeof window !== "undefined") {
    (window as unknown as { __bwRouter?: unknown }).__bwRouter = router;
  }

  return router;
};
