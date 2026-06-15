/**
 * /admin/conteudos — Painel Bewild (Fase 1: placeholder).
 * CRUD de artigos chega na Fase 3 (tabela `bewild_posts`).
 *
 * Nome do arquivo distinto da página pública `BewildConteudosPage`
 * em /pages/BewildConteudosPage.tsx para evitar confusão.
 */
import BewildAdminShell from "@/components/admin/BewildAdminShell";

export default function BewildConteudosAdminPage() {
  return (
    <BewildAdminShell
      active="conteudos"
      eyebrow="Painel"
      title="Conteúdos"
      description="Gerenciar os artigos exibidos em /conteudos. Lista e editor virão na Fase 3."
    >
      <div className="bw-admin__placeholder">
        <strong>Em breve</strong>
        Lista de artigos, editor com markdown, FAQ, SEO e cálculo automático do tempo de leitura.
      </div>
    </BewildAdminShell>
  );
}
