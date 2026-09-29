import { Suspense, type ReactNode } from "react";
import { useSeo } from "@/lib/useSeo";

/**
 * Invólucro das rotas /admin (portado do router legado na migração):
 * todo o painel (inclusive o login) fica fora dos buscadores, e as páginas
 * lazy carregam sob Suspense.
 */
export default function AdminChunk({ children }: { children: ReactNode }) {
  useSeo({ title: "Painel · Bewild", noindex: true });
  return <Suspense fallback={null}>{children}</Suspense>;
}
