/**
 * /admin/projetos — Painel Bewild (Fase 1: placeholder).
 * CRUD do portfólio chega na Fase 2 (tabela `projects` ou equivalente Bewild).
 */
import BewildAdminShell from "@/components/admin/BewildAdminShell";

export default function BewildProjetosAdminPage() {
  return (
    <BewildAdminShell
      active="projetos"
      eyebrow="Painel"
      title="Projetos"
      description="Gerenciar os projetos exibidos em /portfolio. Lista e editor virão na Fase 2."
    >
      <div className="bw-admin__placeholder">
        <strong>Em breve</strong>
        Lista com capa, título, bairro, tipo e status de publicação, e editor com upload de imagens.
      </div>
    </BewildAdminShell>
  );
}
