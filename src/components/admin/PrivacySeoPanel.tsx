import { useMemo, useState } from "react";
import LeadsBySourceCard from "@/components/admin/analytics/LeadsBySourceCard";

export default function PrivacySeoPanel() {
  const [days, setDays] = useState(30);
  const range = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - days);
    return { from, to };
  }, [days]);
  return (
    <section aria-label="Privacidade e termos">
      <h2>Privacidade e termos</h2>
      <p><a href="/admin/privacidade-termos">Editar textos de privacidade e termos</a></p>
      <p>Somente novos pedidos de /orcamento com visita anterior a /privacidade na mesma sessão e consentimento para cookies. Pedidos antigos ou sem consentimento não entram no gráfico.</p>
      <label>Período <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
        <option value={7}>Últimos 7 dias</option>
        <option value={30}>Últimos 30 dias</option>
        <option value={90}>Últimos 90 dias</option>
      </select></label>
      <LeadsBySourceCard range={range} privacyOnly />
    </section>
  );
}