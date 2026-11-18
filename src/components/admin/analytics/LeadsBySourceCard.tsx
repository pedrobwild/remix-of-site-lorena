/**
 * LeadsBySourceCard — "Leads por origem" no período escolhido.
 * Classifica os leads do site pela regra única de `leadSource.ts`.
 *
 * Auditoria 18/11/2026: linha de total, leads de teste fora da conta (com o
 * número dito no rodapé) e aviso de que o cartão lê a tabela de pedidos —
 * conta todo mundo, com ou sem aceite de cookies, e não segue os segmentos.
 */
import { useEffect, useState } from "react";
import { LEAD_CANAIS, LEAD_CANAL_LABEL } from "@/lib/leadSource";
import { fetchLeadCounts, type LeadCounts } from "@/lib/leadsInRange";
import type { DateRange } from "./types";

const nf = new Intl.NumberFormat("pt-BR");

export default function LeadsBySourceCard({ range, privacyOnly = false }: { range: DateRange; privacyOnly?: boolean }) {
  const [result, setResult] = useState<LeadCounts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setResult(null);
    setError(null);
    fetchLeadCounts(range.from, range.to, { untilInclusive: true, privacyOnly })
      .then((r) => {
        if (alive) setResult(r);
      })
      .catch(() => {
        if (alive) setError("não foi possível ler os leads");
      });
    return () => {
      alive = false;
    };
  }, [range.from, range.to, privacyOnly]);

  const counts = result?.byCanal ?? null;
  const total = result?.total ?? 0;

  return (
    <div className="aa-card">
      <div className="aa-card__head">
        <h3 className="aa-card__title">{privacyOnly ? "Origens dos pedidos que visitaram /privacidade" : "leads por origem"}</h3>
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
                <td className="num"><meter min={0} max={total} value={counts[c]} aria-label={`${LEAD_CANAL_LABEL[c]}: ${nf.format(counts[c])} pedidos`} /> {((counts[c] / total) * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">total</th>
              <td className="num"><strong>{nf.format(total)}</strong></td>
              <td className="num">100%</td>
            </tr>
          </tfoot>
        </table>
      )}
      {result && (
        <p className="aa-faint aa-mono" style={{ fontSize: "var(--aa-text-2xs)", margin: "8px 0 0" }}>
          pedidos de formulário de todos os visitantes (com ou sem aceite de cookies) · não segue os segmentos
          {result.tests > 0 && ` · ${nf.format(result.tests)} de teste fora da conta`}
          {" · Meta (anúncios) = clique com UTM paga; fbclid sem UTM conta como rede social"}
        </p>
      )}
    </div>
  );
}
