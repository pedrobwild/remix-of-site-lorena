import { Link } from "@tanstack/react-router";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import BudgetRequestsPanel from "@/components/admin/BudgetRequestsPanel";

export default function ConfirmedBudgetsPage() {
  return <BewildAdminShell active="diagnostico" eyebrow="Painel" title="Orçamentos confirmados">
    <nav className="bw-admin__period" aria-label="Orçamentos">
      <Link to="/admin/orcamentos" aria-current="page" className="is-active">Contratos confirmados</Link>
      <Link to="/admin/diagnostico">Todos os pedidos</Link>
    </nav>
    <BudgetRequestsPanel confirmedOnly />
  </BewildAdminShell>;
}