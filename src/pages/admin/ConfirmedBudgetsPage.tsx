import { Link } from "@tanstack/react-router";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import BudgetRequestsPanel from "@/components/admin/BudgetRequestsPanel";

export default function ConfirmedBudgetsPage() {
  return <BewildAdminShell active="diagnostico" eyebrow="Painel" title="Orçamentos confirmados">
    <nav className="flex flex-wrap gap-3 mb-6" aria-label="Orçamentos">
      <Link to="/admin/orcamentos" aria-current="page" className="bw-admin__btn">Contratos confirmados</Link>
      <Link to="/admin/diagnostico" className="bw-admin__btn">Todos os pedidos</Link>
    </nav>
    <BudgetRequestsPanel confirmedOnly />
  </BewildAdminShell>;
}