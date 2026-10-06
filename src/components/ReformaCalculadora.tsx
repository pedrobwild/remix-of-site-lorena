/**
 * Calculadora do artigo "Reformar apartamento para vender ou alugar em SP".
 * Estima custo da obra, meses de aluguel para cobrir a reforma e imposto de
 * ganho de capital com e sem reforma comprovada. Só usa números dos gráficos
 * do artigo (ver src/lib/reformaCalc.ts). É uma simulação, não um orçamento.
 */
import { useId, useMemo, useState } from "react";
import { z } from "zod";
import {
  ALIQUOTA_CORRETAGEM,
  BAIRROS,
  CUSTO_M2,
  LIMITES,
  calcular,
  parseNumeroBR,
  type BairroId,
} from "@/lib/reformaCalc";
import "@/styles/calculadora.css";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

const schema = z.object({
  areaM2: z.number().min(LIMITES.areaMin, `Informe de ${LIMITES.areaMin} a ${LIMITES.areaMax} m².`).max(LIMITES.areaMax, `Informe de ${LIMITES.areaMin} a ${LIMITES.areaMax} m².`),
  precoCompra: z.number().positive("Informe quanto você pagou pelo imóvel.").max(LIMITES.valorMax, "Valor acima do limite da simulação."),
  precoVenda: z.number().positive("Informe o preço de venda previsto.").max(LIMITES.valorMax, "Valor acima do limite da simulação."),
  reformaComprovada: z.number().positive().max(LIMITES.valorMax, "Valor acima do limite da simulação.").nullable(),
});

type Errors = Partial<Record<"areaM2" | "precoCompra" | "precoVenda" | "reformaComprovada", string>>;

export default function ReformaCalculadora() {
  const uid = useId();
  const [bairro, setBairro] = useState<BairroId>("media-sp");
  const [area, setArea] = useState("");
  const [compra, setCompra] = useState("");
  const [venda, setVenda] = useState("");
  const [reforma, setReforma] = useState("");

  const { result, errors } = useMemo(() => {
    const raw = {
      areaM2: parseNumeroBR(area),
      precoCompra: parseNumeroBR(compra),
      precoVenda: parseNumeroBR(venda),
      reformaComprovada: reforma.trim() ? parseNumeroBR(reforma) : null,
    };
    const touched = { areaM2: area, precoCompra: compra, precoVenda: venda, reformaComprovada: reforma };
    const errs: Errors = {};
    if (reforma.trim() && raw.reformaComprovada === null) errs.reformaComprovada = "Use só números, por exemplo 90.000.";
    const parsed = schema.safeParse(raw.areaM2 === null || raw.precoCompra === null || raw.precoVenda === null
      ? { areaM2: raw.areaM2 ?? NaN, precoCompra: raw.precoCompra ?? NaN, precoVenda: raw.precoVenda ?? NaN, reformaComprovada: raw.reformaComprovada }
      : raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (!errs[key] && touched[key].trim()) errs[key] = issue.message.includes("Expected number") || issue.message.includes("NaN") ? "Use só números, por exemplo 45." : issue.message;
      }
      return { result: null, errors: errs };
    }
    if (errs.reformaComprovada) return { result: null, errors: errs };
    return {
      result: calcular({ bairro, ...parsed.data }),
      errors: errs,
    };
  }, [bairro, area, compra, venda, reforma]);

  const bairroNome = BAIRROS.find((b) => b.id === bairro)?.nome ?? "";
  const fieldProps = (id: string, err?: string) => ({
    id: `${uid}-${id}`,
    "aria-invalid": err ? true : undefined,
    "aria-describedby": err ? `${uid}-${id}-err` : undefined,
  });

  return (
    <section className="rc" aria-labelledby={`${uid}-titulo`}>
      <div className="rc-wrap">
        <h2 id={`${uid}-titulo`} className="rc-title">Calculadora: obra, aluguel e imposto</h2>
        <p className="rc-lead">
          Simule o custo da reforma, quantos meses de aluguel bruto ela leva para se pagar e o imposto de ganho de capital
          na venda. Usa a mediana dos 204 contratos da base Bewild e os bairros do artigo.
        </p>

        <form className="rc-form" onSubmit={(e) => e.preventDefault()} noValidate>
          <div className="rc-field">
            <label htmlFor={`${uid}-bairro`}>Bairro</label>
            <select id={`${uid}-bairro`} value={bairro} onChange={(e) => setBairro(e.target.value as BairroId)}>
              {BAIRROS.map((b) => (
                <option key={b.id} value={b.id}>{b.nome}</option>
              ))}
            </select>
          </div>
          <div className="rc-field">
            <label htmlFor={`${uid}-area`}>Metragem (m²)</label>
            <input {...fieldProps("area", errors.areaM2)} inputMode="decimal" autoComplete="off" placeholder="Ex.: 45" value={area} onChange={(e) => setArea(e.target.value)} />
            {errors.areaM2 ? <p className="rc-err" id={`${uid}-area-err`}>{errors.areaM2}</p> : null}
          </div>
          <div className="rc-field">
            <label htmlFor={`${uid}-compra`}>Quanto você pagou pelo imóvel (R$)</label>
            <input {...fieldProps("compra", errors.precoCompra)} inputMode="decimal" autoComplete="off" placeholder="Ex.: 500.000" value={compra} onChange={(e) => setCompra(e.target.value)} />
            {errors.precoCompra ? <p className="rc-err" id={`${uid}-compra-err`}>{errors.precoCompra}</p> : null}
          </div>
          <div className="rc-field">
            <label htmlFor={`${uid}-venda`}>Preço de venda previsto (R$)</label>
            <input {...fieldProps("venda", errors.precoVenda)} inputMode="decimal" autoComplete="off" placeholder="Ex.: 605.000" value={venda} onChange={(e) => setVenda(e.target.value)} />
            {errors.precoVenda ? <p className="rc-err" id={`${uid}-venda-err`}>{errors.precoVenda}</p> : null}
          </div>
          <div className="rc-field rc-field--wide">
            <label htmlFor={`${uid}-reforma`}>Reforma comprovada com nota fiscal (R$) — opcional</label>
            <input {...fieldProps("reforma", errors.reformaComprovada)} inputMode="decimal" autoComplete="off" placeholder="Se vazio, usamos a estimativa da obra" value={reforma} onChange={(e) => setReforma(e.target.value)} />
            {errors.reformaComprovada ? <p className="rc-err" id={`${uid}-reforma-err`}>{errors.reformaComprovada}</p> : null}
          </div>
        </form>

        <div className="rc-out" role="status" aria-live="polite">
          {result ? (
            <>
              <div className="rc-card">
                <h3>Custo da obra</h3>
                <p className="rc-big">{brl.format(result.custo.mediano)}</p>
                <p>Faixa de {brl.format(result.custo.baixo)} a {brl.format(result.custo.alto)} ({brl.format(CUSTO_M2.baixo)} a {brl.format(CUSTO_M2.alto)} por m², metade central dos contratos).</p>
              </div>
              <div className="rc-card">
                <h3>Meses de aluguel</h3>
                <p className="rc-big">{num1.format(result.meses.mediano)} meses</p>
                <p>
                  Com aluguel bruto de {brl.format(result.aluguelMensal)} por mês em {bairroNome}, de {num1.format(result.meses.baixo)} a {num1.format(result.meses.alto)} meses
                  conforme o custo da obra. Antes de vacância, administração, IR, condomínio e IPTU.
                </p>
              </div>
              <div className="rc-card">
                <h3>Imposto de ganho de capital</h3>
                <dl className="rc-dl">
                  <div><dt>Sem reforma comprovada</dt><dd>{brl.format(result.ir.semReforma)}</dd></div>
                  <div><dt>Com reforma de {brl.format(result.ir.reformaUsada)}</dt><dd>{brl.format(result.ir.comReforma)}</dd></div>
                  <div><dt>Diferença</dt><dd>{brl.format(result.ir.economia)}</dd></div>
                </dl>
                <p>
                  Corretagem de {Math.round(ALIQUOTA_CORRETAGEM * 100)}% ({brl.format(result.ir.corretagem)}) descontada do preço de venda.
                  O abatimento só vale com a reforma comprovada por nota fiscal.
                </p>
              </div>
            </>
          ) : (
            <p className="rc-empty">Preencha metragem, preço pago e preço de venda para ver o resultado.</p>
          )}
        </div>

        <p className="rc-note">
          Simulação simplificada, não é orçamento nem orientação tributária: usa a mediana da base Bewild (204 contratos, lida em 06/10/2026),
          o aluguel anunciado por m² do Índice FipeZap (ago/2026) e as alíquotas da Lei 13.259/2016 (15% a 22,5% por faixa de ganho),
          sem fatores de redução nem isenções (Instrução Normativa SRF 84/2001). Confirme com um contador antes de decidir.
        </p>
      </div>
    </section>
  );
}
