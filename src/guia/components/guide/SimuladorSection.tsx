import { useState, useEffect, useRef, useMemo, useId } from "react";
import { Card, CardContent } from "@/guia/components/ui/card";
import { Separator } from "@/guia/components/ui/separator";
import { Input } from "@/guia/components/ui/input";
import { Button } from "@/guia/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/guia/components/ui/select";
import { Slider } from "@/guia/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/guia/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/guia/components/ui/accordion";
import { ArrowUpRight, FileText, Copy, Check, Bookmark, Columns2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "@/guia/hooks/use-toast";
import { trackGlobal } from "@/guia/hooks/useGuideAnalytics";
import { useBairroData } from "@/guia/hooks/useBairroData";
import SectionBlock from "./SectionBlock";
import { MAX_SCENARIOS, type SavedScenario, loadScenarios, persistScenarios } from "@/guia/data/guide-data";
import { BAIRRO_PADRAO_ID, diariaMediaDe } from "@/guia/data/bairros";
import {
  METRAGEM_MAX, METRAGEM_MIN, METRAGEM_PADRAO, NIVEIS_MELHORIA, OBJETIVOS, OBJETIVO_PADRAO,
  descreverOcupacao, descreverOrigemDiaria, isObjetivo, simulate, textoResumoSimulacao,
  type ObjetivoSimulacao,
} from "@/guia/lib/simulate";
import { fmtBRL, fmtInt, fmtPct } from "@/guia/lib/format";
import { copiarTexto, gerarId } from "@/guia/lib/browser";

/** Converte o texto de um campo numérico em número (vazio/inválido → null). */
function numeroDoCampo(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const OCUPACAO_PADRAO = 75;

export default function SimuladorSection() {
  const { bairros } = useBairroData();
  const uid = useId();
  const ids = {
    bairro: `${uid}-bairro`,
    metragem: `${uid}-metragem`,
    ocupacao: `${uid}-ocupacao`,
    diaria: `${uid}-diaria`,
    objetivo: `${uid}-objetivo`,
    melhoria: `${uid}-melhoria`,
    orcamento: `${uid}-orcamento`,
    limite: `${uid}-limite`,
  };

  const [simBairro, setSimBairro] = useState<string>(
    () => (bairros.find((b) => b.id === BAIRRO_PADRAO_ID) ?? bairros[0])?.nome ?? "",
  );
  const [simMetragem, setSimMetragem] = useState(String(METRAGEM_PADRAO));
  const [simOcupacao, setSimOcupacao] = useState([OCUPACAO_PADRAO]);
  const [simDiariaAtual, setSimDiariaAtual] = useState("");
  const [simObjetivo, setSimObjetivo] = useState<ObjetivoSimulacao>(OBJETIVO_PADRAO);
  const [simReformaBudget, setSimReformaBudget] = useState("");
  const [rateBoost, setRateBoost] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [scenarios, setScenarios] = useState<SavedScenario[]>(loadScenarios);
  const [compareOpen, setCompareOpen] = useState(false);

  const selected = bairros.find((b) => b.nome === simBairro) ?? bairros[0];
  const metragemNum = numeroDoCampo(simMetragem) ?? METRAGEM_PADRAO;

  const sim = useMemo(
    () =>
      simulate({
        mercado: selected.mercado,
        metragem: metragemNum,
        ocupacao: simOcupacao[0],
        diariaInformada: numeroDoCampo(simDiariaAtual),
        objetivo: simObjetivo,
        aumentoDiaria: rateBoost,
        orcamentoReforma: numeroDoCampo(simReformaBudget),
      }),
    [selected, metragemNum, simOcupacao, simDiariaAtual, simObjetivo, rateBoost, simReformaBudget],
  );

  const summaryText = useMemo(
    () => textoResumoSimulacao(selected.nome, { objetivo: simObjetivo, aumentoDiaria: rateBoost }, sim),
    [selected.nome, simObjetivo, rateBoost, sim],
  );

  // "Copiado!" expira sozinho; o timer é limpo se o componente sair da tela.
  useEffect(() => {
    if (copyState === "idle") return;
    const t = setTimeout(() => setCopyState("idle"), 2500);
    return () => clearTimeout(t);
  }, [copyState]);

  const handleCopy = async () => {
    const ok = await copiarTexto(summaryText);
    setCopyState(ok ? "copied" : "failed");
    if (ok) {
      trackGlobal("export_simulation", { bairro: selected.nome, metragem: sim.metragem, ocupacao: sim.ocupacaoConsiderada, resultado: sim.receitaMensal });
    }
  };

  const limitReached = scenarios.length >= MAX_SCENARIOS;

  const updateScenarios = (next: SavedScenario[]) => {
    setScenarios(next);
    if (!persistScenarios(next)) {
      toast({
        title: "Cenário mantido só nesta tela",
        description: "O navegador bloqueou o armazenamento local; ao recarregar a página os cenários serão perdidos.",
      });
      return false;
    }
    return true;
  };

  const saveScenario = () => {
    if (limitReached) return;
    const ns: SavedScenario = {
      id: gerarId(),
      name: `Cenário ${scenarios.length + 1} — ${selected.nome} ${fmtInt(sim.metragem)} m²`,
      bairro: selected.nome,
      metragem: sim.metragem,
      ocupacao: sim.ocupacaoEscolhida,
      ocupacaoConsiderada: sim.ocupacaoConsiderada,
      diariaAtual: simDiariaAtual,
      objetivo: simObjetivo,
      rateBoost,
      reformaBudget: simReformaBudget,
      boostedDaily: sim.diariaComMelhoria,
      receitaMensal: sim.receitaMensal,
      receitaAnual: sim.receitaAnual,
      paybackMonths: sim.paybackMeses,
    };
    const updated = [...scenarios, ns];
    if (updateScenarios(updated)) {
      toast({ title: "Cenário salvo!", description: `Você tem ${updated.length} de ${MAX_SCENARIOS} cenários.` });
    }
  };

  const removeScenario = (id: string) => updateScenarios(scenarios.filter((s) => s.id !== id));

  const loadScenarioIntoSim = (s: SavedScenario) => {
    if (bairros.some((b) => b.nome === s.bairro)) setSimBairro(s.bairro);
    setSimMetragem(String(s.metragem));
    setSimOcupacao([s.ocupacao]);
    setSimDiariaAtual(s.diariaAtual ?? "");
    setSimObjetivo(isObjetivo(s.objetivo) ? s.objetivo : OBJETIVO_PADRAO);
    setRateBoost(s.rateBoost ?? 0);
    setSimReformaBudget(s.reformaBudget ?? "");
    setCompareOpen(false);
  };

  // Analytics (stub no-op hoje): registra uma vez que o simulador foi usado de fato.
  const simTracked = useRef(false);
  const interacted = simDiariaAtual !== "" || rateBoost > 0 || simReformaBudget !== "";
  useEffect(() => {
    if (simTracked.current || !interacted) return;
    const t = setTimeout(() => {
      simTracked.current = true;
      trackGlobal("simulator_used", { bairro: selected.nome, metragem: sim.metragem, ocupacao: sim.ocupacaoConsiderada, diaria: sim.diariaComMelhoria, resultado: sim.receitaMensal });
    }, 2000);
    return () => clearTimeout(t);
  }, [interacted, selected.nome, sim]);

  const ocupacaoAjustada = sim.ocupacaoConsiderada !== sim.ocupacaoEscolhida;
  const objetivo = OBJETIVOS[simObjetivo];

  return (
    <SectionBlock id="simulador" title="Simulador de Receita" takeaway="Calcule sua rentabilidade estimada em menos de 1 minuto.">
      {scenarios.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Cenários salvos">
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => loadScenarioIntoSim(s)}
              className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary/10 transition-colors"
              aria-label={`Carregar ${s.name} no simulador`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <Card className="border-border">
        <CardContent className="p-6 space-y-5 font-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={ids.bairro} className="text-sm font-medium text-foreground mb-1.5 block">Bairro</label>
              <Select value={selected.nome} onValueChange={setSimBairro}>
                <SelectTrigger id={ids.bairro} className="min-h-[48px] text-base"><SelectValue /></SelectTrigger>
                <SelectContent>{bairros.map((b) => <SelectItem key={b.id} value={b.nome}>{b.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor={ids.metragem} className="text-sm font-medium text-foreground mb-1.5 block">Metragem (m²)</label>
              <Input
                id={ids.metragem}
                type="number"
                inputMode="numeric"
                min={METRAGEM_MIN}
                max={METRAGEM_MAX}
                value={simMetragem}
                onChange={(e) => setSimMetragem(e.target.value)}
                onBlur={() => setSimMetragem(String(sim.metragem))}
                className="min-h-[48px] text-base"
              />
            </div>
          </div>
          <div>
            <p id={`${ids.ocupacao}-label`} className="text-sm font-medium text-foreground mb-2">
              Ocupação estimada: <span className="font-bold text-primary">{fmtPct(sim.ocupacaoEscolhida)}</span>
            </p>
            <Slider
              value={simOcupacao}
              onValueChange={setSimOcupacao}
              min={50}
              max={90}
              step={1}
              aria-labelledby={`${ids.ocupacao}-label`}
            />
            {ocupacaoAjustada && (
              <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
                Ocupação considerada na conta: <strong className="text-foreground">{fmtPct(sim.ocupacaoConsiderada)}</strong>{" "}
                ({sim.ocupacaoConsiderada > sim.ocupacaoEscolhida ? "+" : "−"}{Math.abs(sim.ocupacaoConsiderada - sim.ocupacaoEscolhida)} p.p. do objetivo "{objetivo.label}").
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={ids.diaria} className="text-sm font-medium text-foreground mb-1.5 block">Diária atual (opcional, R$)</label>
              <Input
                id={ids.diaria}
                type="number"
                inputMode="decimal"
                min={0}
                placeholder={`Média do bairro: ${fmtBRL(diariaMediaDe(selected.mercado))}`}
                value={simDiariaAtual}
                onChange={(e) => setSimDiariaAtual(e.target.value)}
                className="min-h-[48px] text-base"
              />
            </div>
            <div>
              <label htmlFor={ids.objetivo} className="text-sm font-medium text-foreground mb-1.5 block">Objetivo</label>
              <Select value={simObjetivo} onValueChange={(v) => setSimObjetivo(isObjetivo(v) ? v : OBJETIVO_PADRAO)}>
                <SelectTrigger id={ids.objetivo} className="min-h-[48px] text-base"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(OBJETIVOS) as ObjetivoSimulacao[]).map((k) => (
                    <SelectItem key={k} value={k}>{OBJETIVOS[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {objetivo.ocupacaoPp !== 0 && <>Ocupação {objetivo.ocupacaoPp > 0 ? "+" : "−"}{Math.abs(objetivo.ocupacaoPp)} p.p.</>}
                {objetivo.ocupacaoPp !== 0 && objetivo.diariaPct !== 0 && " · "}
                {objetivo.diariaPct !== 0 && <>Diária {objetivo.diariaPct > 0 ? "+" : "−"}{Math.abs(objetivo.diariaPct)}%</>}
              </p>
            </div>
          </div>
          <div>
            <p id={ids.melhoria} className="text-sm font-medium text-foreground mb-2">Impacto de aumento na diária</p>
            <div className="flex gap-2 flex-wrap" role="group" aria-labelledby={ids.melhoria}>
              {NIVEIS_MELHORIA.map((v) => (
                <Button
                  key={v}
                  type="button"
                  size="sm"
                  variant={rateBoost === v ? "default" : "outline"}
                  aria-pressed={rateBoost === v}
                  onClick={() => setRateBoost(v)}
                  className={`min-h-[44px] min-w-[48px] ${rateBoost === v ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {v === 0 ? "Base" : `+${v}%`}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor={ids.orcamento} className="text-sm font-medium text-foreground mb-1.5 block">Orçamento de reforma (opcional, R$)</label>
            <Input
              id={ids.orcamento}
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="Ex.: 45000"
              value={simReformaBudget}
              onChange={(e) => setSimReformaBudget(e.target.value)}
              className="min-h-[48px] text-base"
            />
          </div>
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center" aria-live="polite">
            <div><p className="text-2xl font-display font-bold text-primary">{fmtBRL(sim.diariaComMelhoria)}</p><p className="text-xs text-muted-foreground">Diária {rateBoost > 0 ? `(+${rateBoost}%)` : "considerada"}</p></div>
            <div><p className="text-2xl font-display font-bold text-primary">{fmtBRL(sim.receitaMensal)}</p><p className="text-xs text-muted-foreground">Receita / mês</p></div>
            <div><p className="text-2xl font-display font-bold text-primary">{fmtBRL(sim.receitaAnual)}</p><p className="text-xs text-muted-foreground">Receita / ano</p></div>
            <div>
              <p className="text-2xl font-display font-bold text-primary">{sim.paybackMeses ? `${fmtInt(sim.paybackMeses)} meses` : "—"}</p>
              <p className="text-xs text-muted-foreground">
                Payback reforma{!sim.paybackMeses && numeroDoCampo(simReformaBudget) ? " (escolha um aumento de diária)" : ""}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Diária de referência {fmtBRL(sim.diariaReferencia)} ({descreverOrigemDiaria(sim, selected.nome)}) · ocupação considerada {descreverOcupacao(sim, simObjetivo)}. Receita bruta, antes de custos.
          </p>
          {rateBoost > 0 && sim.ganhoMensal > 0 && (
            <div className="bg-gold-light/50 border border-gold/20 rounded-xl p-4 flex items-start gap-3">
              <ArrowUpRight className="text-gold mt-0.5 flex-shrink-0" size={20} aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Com +{rateBoost}% na diária, você ganha <span className="font-bold text-foreground">{fmtBRL(sim.ganhoMensal)}/mês</span> a mais em relação ao cenário base (mesma ocupação e mesmo objetivo).</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full min-h-[44px]"
                onClick={saveScenario}
                disabled={limitReached}
                aria-describedby={limitReached ? ids.limite : undefined}
              >
                <Bookmark size={16} className="mr-2" aria-hidden="true" />
                {limitReached ? `Limite de ${MAX_SCENARIOS} cenários` : "Salvar cenário"}
              </Button>
              {limitReached && (
                <p id={ids.limite} className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle size={12} aria-hidden="true" /> Remova um cenário em "Comparar cenários" para salvar outro.
                </p>
              )}
            </div>
            <Dialog open={exportOpen} onOpenChange={(o) => { setExportOpen(o); if (!o) setCopyState("idle"); }}>
              <DialogTrigger asChild><Button type="button" variant="outline" className="flex-1 min-h-[44px]"><FileText size={16} className="mr-2" aria-hidden="true" />Exportar simulação</Button></DialogTrigger>
              <DialogContent className="font-body">
                <DialogHeader>
                  <DialogTitle className="font-display">Resumo da Simulação</DialogTitle>
                  <DialogDescription>Copie o texto para enviar ou guardar.</DialogDescription>
                </DialogHeader>
                <pre className="bg-muted rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap max-h-80 overflow-y-auto">{summaryText}</pre>
                <Button type="button" onClick={handleCopy} className="w-full bg-primary text-primary-foreground">
                  {copyState === "copied" ? <><Check size={16} className="mr-2" aria-hidden="true" /> Copiado!</> : <><Copy size={16} className="mr-2" aria-hidden="true" /> Copiar texto</>}
                </Button>
                <p className="text-xs text-center min-h-[1rem]" role="status" aria-live="polite">
                  {copyState === "failed" && <span className="text-destructive">Não foi possível copiar automaticamente. Selecione o texto acima e copie manualmente.</span>}
                </p>
              </DialogContent>
            </Dialog>
          </div>
          {scenarios.length >= 2 && (
            <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
              <DialogTrigger asChild><Button type="button" variant="secondary" className="w-full"><Columns2 size={16} className="mr-2" aria-hidden="true" />Comparar cenários ({scenarios.length})</Button></DialogTrigger>
              <DialogContent className="font-body max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display">Comparação de Cenários</DialogTitle>
                  <DialogDescription>O melhor valor de cada linha fica destacado.</DialogDescription>
                </DialogHeader>
                <ScenarioTable scenarios={scenarios} onLoad={loadScenarioIntoSim} onRemove={removeScenario} />
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
      <Accordion type="multiple" className="mt-4 font-body">
        <AccordionItem value="rateboost">
          <AccordionTrigger className="text-primary font-semibold min-h-[48px]">Como funciona o rate boost</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O cenário Base usa a diária média do bairro para a faixa de metragem do seu studio (ou a sua diária atual, se informada), já com o ajuste do objetivo escolhido. <strong className="text-foreground">+10%</strong> = decoração básica melhorada (pintura, iluminação, enxoval novo). <strong className="text-foreground">+20%</strong> = decoração premium com fotos profissionais e mobília planejada. <strong className="text-foreground">+30%</strong> = studio de alto padrão com design autoral, fotos de catálogo e operação otimizada. Cada nível já inclui os itens do anterior, e o percentual é o aumento total sobre a diária base — os níveis não se somam.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="payback">
          <AccordionTrigger className="text-primary font-semibold min-h-[48px]">O que o payback considera</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O cálculo de payback é simplificado: <strong className="text-foreground">Payback = Orçamento de reforma ÷ Receita incremental mensal</strong> (diferença entre o cenário com aumento de diária e o cenário base, com a mesma ocupação e o mesmo objetivo). Sem aumento de diária não há receita incremental, e o payback não é calculado. Não inclui custos operacionais como limpeza (~R$ 80–120/virada), taxa da plataforma (~15%), condomínio, IPTU ou imposto de renda. Para uma projeção completa, solicite um diagnóstico personalizado.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </SectionBlock>
  );
}

type Linha = {
  label: string;
  valor: (s: SavedScenario) => number | string | null;
  fmt: (v: number | string | null) => string;
  best: "max" | "min" | null;
};

const LINHAS: Linha[] = [
  { label: "Bairro", valor: (s) => s.bairro, fmt: (v) => String(v ?? "—"), best: null },
  { label: "Metragem", valor: (s) => s.metragem, fmt: (v) => `${fmtInt(Number(v))} m²`, best: null },
  { label: "Ocupação considerada", valor: (s) => s.ocupacaoConsiderada ?? s.ocupacao, fmt: (v) => fmtPct(Number(v)), best: "max" },
  { label: "Diária", valor: (s) => s.boostedDaily, fmt: (v) => fmtBRL(Number(v)), best: "max" },
  { label: "Aumento de diária", valor: (s) => s.rateBoost, fmt: (v) => (v === 0 ? "Base" : `+${v}%`), best: null },
  { label: "Receita/mês", valor: (s) => s.receitaMensal, fmt: (v) => fmtBRL(Number(v)), best: "max" },
  { label: "Receita/ano", valor: (s) => s.receitaAnual, fmt: (v) => fmtBRL(Number(v)), best: "max" },
  { label: "Payback", valor: (s) => s.paybackMonths, fmt: (v) => (v ? `${fmtInt(Number(v))} meses` : "—"), best: "min" },
];

function ScenarioTable({ scenarios, onLoad, onRemove }: { scenarios: SavedScenario[]; onLoad: (s: SavedScenario) => void; onRemove: (id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="text-left py-2 px-2 text-muted-foreground font-medium">Métrica</th>
            {scenarios.map((s) => <th scope="col" key={s.id} className="text-center py-2 px-2 font-medium text-foreground min-w-[120px]"><div className="text-xs">{s.name}</div></th>)}
          </tr>
        </thead>
        <tbody>
          {LINHAS.map((row) => {
            const values = scenarios.map(row.valor);
            const numeric = values.filter((v): v is number => typeof v === "number" && v > 0);
            const bestVal = row.best === "max" ? Math.max(...numeric) : row.best === "min" ? Math.min(...numeric) : null;
            return (
              <tr key={row.label} className="border-b border-border/50">
                <th scope="row" className="py-2 px-2 text-left font-normal text-muted-foreground">{row.label}</th>
                {scenarios.map((s, i) => {
                  const v = values[i];
                  const isBest = bestVal !== null && v === bestVal && numeric.length > 1;
                  return <td key={s.id} className={`text-center py-2 px-2 ${isBest ? "text-primary font-bold bg-primary/5" : "text-foreground"}`}>{row.fmt(v)}</td>;
                })}
              </tr>
            );
          })}
          <tr>
            <th scope="row" className="py-2 px-2 text-left font-normal text-muted-foreground">Ações</th>
            {scenarios.map((s) => (
              <td key={s.id} className="text-center py-2 px-2">
                <div className="flex flex-col gap-1">
                  <Button type="button" size="sm" variant="ghost" className="text-xs h-7" onClick={() => onLoad(s)}>Usar no simulador</Button>
                  <Button type="button" size="sm" variant="ghost" className="text-xs h-7 text-destructive hover:text-destructive" onClick={() => onRemove(s.id)} aria-label={`Remover ${s.name}`}>
                    <Trash2 size={12} className="mr-1" aria-hidden="true" /> Remover
                  </Button>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
