/**
 * /admin/dashboard — "Visão geral" do painel Bewild (Fase 1: placeholder).
 * Conteúdo real virá na Fase 5 (dashboard de marketing).
 */
import BewildAdminShell from "@/components/admin/BewildAdminShell";

export default function BewildOverviewPage() {
  return (
    <BewildAdminShell
      active="overview"
      eyebrow="Painel"
      title="Visão geral"
      description="Resumo de leads, tráfego e mídia paga. Os números reais serão ligados na Fase 5."
    >
      <div className="bw-admin__placeholder">
        <strong>Em breve</strong>
        Cartões de KPI, tráfego ao longo do tempo, origem, páginas e Meta Ads.
      </div>
    </BewildAdminShell>
  );
}
