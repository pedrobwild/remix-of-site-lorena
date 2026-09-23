/**
 * Redirecionamento automático quando o slug de um conteúdo PUBLICADO muda.
 *
 * Trocar o slug de um post/projeto já indexado quebrava a URL antiga (o
 * Google e os links externos caíam em 404). O painel agora grava em
 * `seo_404_log` uma linha `status='redirect'` do caminho antigo para o novo;
 * a NotFoundPage resolve esse redirecionamento para o visitante.
 */
import { supabase } from "@/integrations/supabase/client";

export type SlugKind = "post" | "project";

/** Caminho público de um slug — manter igual a `routes` em useHashRoute.ts. */
export function publicPathFor(kind: SlugKind, slug: string): string {
  return kind === "post" ? `/conteudos/${slug}` : `/portfolio/${slug}`;
}

/**
 * Precisa de redirecionamento? Só quando o item JÁ estava publicado (logo,
 * possivelmente indexado) e o slug mudou de verdade.
 */
export function needsSlugRedirect(opts: {
  wasPublished: boolean;
  oldSlug: string | null | undefined;
  newSlug: string | null | undefined;
}): boolean {
  const oldSlug = (opts.oldSlug ?? "").trim();
  const newSlug = (opts.newSlug ?? "").trim();
  return opts.wasPublished && !!oldSlug && !!newSlug && oldSlug !== newSlug;
}

/** Destino de redirecionamento aceito: caminho interno ("/x"), nunca "//host" ou esquema. */
export function isSafeRedirectTarget(target: string | null | undefined): boolean {
  const t = (target ?? "").trim();
  return /^\/(?!\/)[^\s\\]*$/.test(t);
}

/**
 * Grava (ou atualiza) o redirecionamento `oldPath → newPath` e reaponta
 * redirecionamentos antigos que levavam a `oldPath` (evita cadeia A→B→C).
 * Linhas já existentes para `oldPath` mantêm `hits`, `source` e datas.
 */
export async function upsertSlugRedirect(
  oldPath: string,
  newPath: string,
): Promise<{ error: string | null }> {
  if (!isSafeRedirectTarget(oldPath) || !isSafeRedirectTarget(newPath) || oldPath === newPath) {
    return { error: "Caminhos de redirecionamento inválidos." };
  }
  const note = `Slug alterado no painel em ${new Date().toLocaleString("pt-BR")}: ${oldPath} → ${newPath}`;

  const existing = await supabase
    .from("seo_404_log")
    .select("id")
    .eq("path", oldPath)
    .maybeSingle();
  if (existing.error) return { error: existing.error.message };

  if (existing.data) {
    const { error } = await supabase
      .from("seo_404_log")
      .update({ status: "redirect", redirect_to: newPath, notes: note })
      .eq("id", existing.data.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("seo_404_log").insert({
      path: oldPath,
      status: "redirect",
      redirect_to: newPath,
      source: "manual",
      hits: 0,
      notes: note,
    });
    if (error) return { error: error.message };
  }

  // Quem redirecionava para o caminho antigo passa a ir direto ao novo.
  // Exclui o próprio `newPath` para não criar um redirecionamento para si mesmo.
  const { error: chainError } = await supabase
    .from("seo_404_log")
    .update({ redirect_to: newPath })
    .eq("status", "redirect")
    .eq("redirect_to", oldPath)
    .neq("path", newPath);
  if (chainError) return { error: chainError.message };

  return { error: null };
}

/** Texto de confirmação mostrado ao admin antes de trocar o slug de algo publicado. */
export function slugChangeConfirmMessage(kind: SlugKind, oldPath: string, newPath: string): string {
  const what = kind === "post" ? "Este post" : "Este projeto";
  return (
    `${what} está publicado em ${oldPath}.\n\n` +
    `Mudar o endereço para ${newPath} quebra links já indexados pelo Google e compartilhados. ` +
    `Vamos criar um redirecionamento automático do endereço antigo para o novo.\n\nContinuar?`
  );
}
