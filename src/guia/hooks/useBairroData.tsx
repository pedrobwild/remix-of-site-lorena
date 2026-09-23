import { createContext, useContext } from "react";

import { BAIRROS_ORDENADOS, type Bairro } from "@/guia/data/bairros";

/**
 * Provedor dos dados de bairro do guia.
 *
 * O app original lia a tabela `bairro_airbnb_sp` do banco dele. Aqui a
 * página é editorial e usa a base única compilada em
 * `src/guia/data/bairros.ts` — a mesma do mapa e do HTML pré-renderizado.
 */

type BairroContextValue = {
  bairros: readonly Bairro[];
  /** Data ISO da última atualização da base (null = base estática sem data). */
  lastUpdated: string | null;
};

const STATIC_VALUE: BairroContextValue = {
  bairros: BAIRROS_ORDENADOS,
  lastUpdated: null,
};

const BairroContext = createContext<BairroContextValue>(STATIC_VALUE);

export function useBairroData() {
  return useContext(BairroContext);
}

export function BairroProvider({ children }: { children: React.ReactNode }) {
  return <BairroContext.Provider value={STATIC_VALUE}>{children}</BairroContext.Provider>;
}
