/**
 * /admin/leads — Painel Bewild (Fase 1: placeholder).
 * CRUD/listagem chega na Fase 4 (lê de `diagnostic_leads`).
 */
import BewildAdminShell from "@/components/admin/BewildAdminShell";

export default function BewildLeadsAdminPage() {
  return (
    <BewildAdminShell
      active="leads"
      eyebrow="Painel"
      title="Leads"
      description="Quem caiu no formulário de diagnóstico. Filtro, busca e detalhe virão na Fase 4."
    >
      <div className="bw-admin__placeholder">
        <strong>Em breve</strong>
        Tabela de leads, resumo, filtro por status e botão para responder no WhatsApp.
      </div>
    </BewildAdminShell>
  );
}
