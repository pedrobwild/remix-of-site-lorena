import { createContext, useContext } from "react";

import { BAIRRO_DATA, type BairroItem } from "../data/guide-data";

/**
 * Versão estática do provedor de dados de bairro.
 *
 * O app original lia a tabela `bairro_airbnb_sp` do banco dele. Aqui a
 * página é editorial e usa a base já compilada em `guide-data.ts`.
 */

type BairroContextValue = {
  bairros: BairroItem[];
  lastUpdated: string | null;
  isLoading: boolean;
};

const STATIC_VALUE: BairroContextValue = {
  bairros: BAIRRO_DATA as unknown as BairroItem[],
  lastUpdated: null,
  isLoading: false,
};

const BairroContext = createContext<BairroContextValue>(STATIC_VALUE);

export function useBairroData() {
  return useContext(BairroContext);
}

export function BairroProvider({ children }: { children: React.ReactNode }) {
  return <BairroContext.Provider value={STATIC_VALUE}>{children}</BairroContext.Provider>;
}
