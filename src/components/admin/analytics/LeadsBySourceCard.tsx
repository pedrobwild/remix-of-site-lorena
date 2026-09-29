/**
 * LeadsBySourceCard — "Leads por origem" no período escolhido.
 * Classifica os leads do site pela regra única de `leadSource.ts`.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LEAD_CANAIS, LEAD_CANAL_LABEL, leadCanal, type LeadCanal } from "@/lib/leadSource";
import type { DateRange } from "./types";

const nf = new Intl.NumberFormat("pt-BR");
const PAGE = 1000;

export default function LeadsBySourceCard({ range }: { range: DateRange }) {
  const [counts, setCounts] = useState<Record<LeadCanal, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setCounts(null);
    setError(null);
    (async () => {
      const acc = Object.fromEntries(LEAD_CANAIS.map((c) => [c, 0])) as Record<LeadCanal, number>;
      for (let from = 0; from < 20_000; from += PAGE) {
        const { data, error: err } = await supabase
          .from("leads")
          .select("*")
          .gte("created_at", range.from.toISOString())
          .lte("created_at", range.to.toISOString())
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .range(from, from + PAGE - 1);
        if (err) {
          if (alive) setError("não foi possível ler os leads");
          return;
        }
        for (const r of (data ?? []) as Record<string, string | null>[]) acc[leadCanal(r)]++;
        if (!data || data.length < PAGE) break;
      }
      if (alive) setCounts(acc);
    })();
    return () => {
      alive = false;
    };
  }, [range.from, range.to]);

  const total = counts ? LEAD_CANAIS.reduce((s, c) => s + counts[c], 0) : 0;

  return (
    <div className="aa-card">
      <div className="aa-card__head">
        <h3 className="aa-card__title">leads por origem</h3>
      </div>
      {error ? (
        <div className="aa-empty"><span className="aa-empty__icon">!</span>{error}</div>
      ) : !counts ? (
        <div className="aa-skel" style={{ height: 160 }} />
      ) : total === 0 ? (
        <div className="aa-empty"><span className="aa-empty__icon">∅</span>nenhum lead no período</div>
      ) : (
        <table className="aa-table">
          <thead><tr><th>canal</th><th>leads</th><th>% do total</th></tr></thead>
          <tbody>
            {LEAD_CANAIS.map((c) => (
              <tr key={c}>
                <td>{LEAD_CANAL_LABEL[c]}</td>
                <td className="num">{nf.format(counts[c])}</td>
                <td className="num">{((counts[c] / total) * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
