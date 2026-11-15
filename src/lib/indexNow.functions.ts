import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { attachCrmAuth } from "@/lib/crmAuth";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { IndexNowResult } from "@/lib/indexNow.server";

/**
 * Avisa o IndexNow de um post ou projeto que o painel acabou de salvar.
 * Só administrador; o estado de publicação vem do banco (não do navegador),
 * e só página publicada é enviada. Nunca lança por causa do IndexNow: o erro
 * fica no console do servidor (ver `indexNow.server.ts`).
 */
export const notifyIndexNow = createServerFn({ method: "POST" })
  .middleware([attachCrmAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ kind: z.enum(["post", "project"]), slug: z.string().trim().min(1).max(200) })
      .parse(input)
  )
  .handler(async ({ data, context }): Promise<IndexNowResult> => {
    const role = await context.supabase.rpc("is_admin");
    if (role.error || role.data !== true) throw new Error("Acesso restrito a administradores.");

    const lido =
      data.kind === "post"
        ? await context.supabase
            .from("bewild_posts")
            .select("published")
            .eq("slug", data.slug)
            .maybeSingle()
        : await context.supabase
            .from("projects")
            .select("published")
            .eq("slug", data.slug)
            .maybeSingle();
    const { avisarIndexNowDaPagina, indexNowPageUrl } = await import("@/lib/indexNow.server");
    if (lido.error) {
      console.error(
        `[indexnow] não foi possível ler ${data.kind} ${data.slug}: ${lido.error.message}`
      );
      return {
        status: "falhou",
        motivo: "leitura do banco",
        url: indexNowPageUrl(data.kind, data.slug) ?? data.slug,
      };
    }
    return avisarIndexNowDaPagina({
      kind: data.kind,
      slug: data.slug,
      published: lido.data?.published === true,
    });
  });
