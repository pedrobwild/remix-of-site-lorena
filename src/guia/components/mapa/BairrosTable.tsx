import { Card, CardContent } from "@/guia/components/ui/card";
import { FAIXAS_METRAGEM } from "@/guia/data/bairros";
import { useBairroData } from "@/guia/hooks/useBairroData";
import { fmtBRL, fmtPct } from "@/guia/lib/format";

/**
 * Tabela de diária e ocupação por bairro — mesma base do mapa, do simulador
 * e do HTML pré-renderizado (src/guia/data/bairros.ts).
 */
export default function BairrosTable() {
  const { bairros } = useBairroData();
  const temSemRecorte = bairros.some((b) => !b.mercado.diariaPorMetragem);

  return (
    <Card className="border-border overflow-hidden mt-8">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <caption className="px-4 py-3 text-left text-xs text-muted-foreground caption-bottom">
              Faixas observadas de diária (R$/noite) e ocupação média de studios por bairro.
              {temSemRecorte && " “—” = a base não traz o recorte por metragem para o bairro."}
            </caption>
            <thead className="bg-secondary">
              <tr>
                {["Bairro", "Diária mín.", "Diária máx.", "Ocupação média", ...FAIXAS_METRAGEM].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bairros.map((b) => (
                <tr key={b.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-foreground whitespace-nowrap">{b.nome}</th>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtBRL(b.mercado.diariaMin)}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtBRL(b.mercado.diariaMax)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtPct(b.mercado.ocupacao)}</td>
                  {FAIXAS_METRAGEM.map((f, i) => {
                    const v = b.mercado.diariaPorMetragem?.[f];
                    const destaque = i === FAIXAS_METRAGEM.length - 1;
                    return (
                      <td key={f} className={`px-4 py-3 whitespace-nowrap ${destaque ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {v === undefined ? <span aria-label="sem dado">—</span> : fmtBRL(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
