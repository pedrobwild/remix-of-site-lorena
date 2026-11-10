import { devWarn } from "@/lib/devLog";
import { notifyIndexNow } from "@/lib/indexNow.functions";

/**
 * Chamado pelos editores do painel depois de o banco confirmar o salvamento:
 * avisa o IndexNow da página publicada em segundo plano. Não espera a
 * resposta, nunca lança e não muda o fluxo do salvamento (rascunho ou
 * despublicado não chama nada). O servidor confere de novo no banco.
 */
export function avisarIndexNow(kind: "post" | "project", slug: string, published: boolean): void {
  if (!published || !slug.trim()) return;
  try {
    void Promise.resolve(notifyIndexNow({ data: { kind, slug: slug.trim() } })).catch(
      (err: unknown) => devWarn("[indexnow] aviso não enviado:", err)
    );
  } catch (err) {
    devWarn("[indexnow] aviso não enviado:", err);
  }
}
