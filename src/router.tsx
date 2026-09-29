import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
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
