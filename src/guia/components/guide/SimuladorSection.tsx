import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/guia/components/ui/card";
import { Badge } from "@/guia/components/ui/badge";
import { Separator } from "@/guia/components/ui/separator";
import { Input } from "@/guia/components/ui/input";
import { Button } from "@/guia/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/guia/components/ui/select";
import { Slider } from "@/guia/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/guia/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/guia/components/ui/accordion";
import { ArrowUpRight, FileText, Copy, Check, Bookmark, Columns2, Trash2 } from "lucide-react";
import { toast } from "@/guia/hooks/use-toast";
import { trackGlobal } from "@/guia/hooks/useGuideAnalytics";
import { useBairroData } from "@/guia/hooks/useBairroData";
import SectionBlock from "./SectionBlock";
import { fmt, type SavedScenario, loadScenarios, persistScenarios } from "@/guia/data/guide-data";

export default function SimuladorSection() {
  const { bairros } = useBairroData();
  const [simBairro, setSimBairro] = useState<string>(bairros[0]?.name ?? "");
  const [simMetragem, setSimMetragem] = useState(30);
  const [simOcupacao, setSimOcupacao] = useState([75]);
  const [simDiariaAtual, setSimDiariaAtual] = useState("");
  const [simObjetivo, setSimObjetivo] = useState("maximizar");
  const [simReformaBudget, setSimReformaBudget] = useState("");
  const [rateBoost, setRateBoost] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scenarios, setScenarios] = useState<SavedScenario[]>(loadScenarios);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.bairro) setSimBairro(detail.bairro);
      if (detail.diaria) setSimDiariaAtual(detail.diaria);
      if (detail.ocupacao) setSimOcupacao([detail.ocupacao]);
      if (detail.boost !== undefined) setRateBoost(detail.boost);
    };
    window.addEventListener("populate-simulator", handler);
    return () => window.removeEventListener("populate-simulator", handler);
  }, []);

  const selected = bairros.find((b) => b.name === simBairro) ?? bairros[0];

  const sim = useMemo(() => {
    const baseDaily = simDiariaAtual ? Number(simDiariaAtual) : (selected.dailyMin + selected.dailyMax) / 2;
    let occMod = 0, dailyMod = 0;
    if (simObjetivo === "maximizar") { occMod = 5; } else if (simObjetivo === "estabilidade") { dailyMod = -10; } else if (simObjetivo === "premium") { occMod = -10; dailyMod = 20; }
    const adjustedDaily = baseDaily * (1 + dailyMod / 100);
    const adjustedOcc = Math.min(95, Math.max(30, simOcupacao[0] + occMod));
    const boostedDaily = adjustedDaily * (1 + rateBoost / 100);
    const nights = 30 * (adjustedOcc / 100);
    const receitaMensal = Math.round(boostedDaily * nights);
    const receitaAnual = receitaMensal * 12;
    const baseMensal = Math.round(baseDaily * (30 * (simOcupacao[0] / 100)));
    const delta = receitaMensal - baseMensal;
    const budget = Number(simReformaBudget) || 0;
    const paybackMonths = delta > 0 && budget > 0 ? Math.ceil(budget / delta) : null;
    return { baseDaily: Math.round(baseDaily), boostedDaily: Math.round(boostedDaily), receitaMensal, receitaAnual, baseMensal, delta, paybackMonths, adjustedOcc };
  }, [selected, simDiariaAtual, simOcupacao, rateBoost, simReformaBudget, simObjetivo]);

  const summaryText = useMemo(() => {
    return `📊 Simulação de Receita — Short Stay\n\nBairro: ${simBairro}\nMetragem: ${simMetragem}m²\nOcupação: ${simOcupacao[0]}%\nDiária base: R$ ${fmt(sim.baseDaily)}\n` +
      (rateBoost > 0 ? `Diária c/ boost +${rateBoost}%: R$ ${fmt(sim.boostedDaily)}\n` : "") +
      `\nReceita mensal: R$ ${fmt(sim.receitaMensal)}\nReceita anual: R$ ${fmt(sim.receitaAnual)}\n` +
      (sim.paybackMonths ? `\nPayback da reforma: ~${sim.paybackMonths} meses\n` : "") +
      `\nGerado em guiadoinvestidor.com.br`;
  }, [simBairro, simMetragem, simOcupacao, sim, rateBoost]);

  const handleCopy = () => { navigator.clipboard.writeText(summaryText); setCopied(true); trackGlobal("export_simulation", { bairro: simBairro, metragem: simMetragem, ocupacao: simOcupacao[0], resultado: sim.receitaMensal }); setTimeout(() => setCopied(false), 2000); };

  const saveScenario = () => {
    if (scenarios.length >= 5) { toast({ title: "Limite atingido", description: "Remova um cenário antes de salvar outro.", variant: "destructive" }); return; }
    const ns: SavedScenario = { id: crypto.randomUUID(), name: `Cenário ${scenarios.length + 1} — ${simBairro} ${simMetragem}m²`, bairro: simBairro, metragem: simMetragem, ocupacao: simOcupacao[0], diariaAtual: simDiariaAtual, objetivo: simObjetivo, rateBoost, reformaBudget: simReformaBudget, boostedDaily: sim.boostedDaily, receitaMensal: sim.receitaMensal, receitaAnual: sim.receitaAnual, paybackMonths: sim.paybackMonths };
    const updated = [...scenarios, ns]; setScenarios(updated); persistScenarios(updated);
    toast({ title: "Cenário salvo!", description: `Você tem ${updated.length} de 5 cenários.` });
  };

  const removeScenario = (id: string) => { const u = scenarios.filter(s => s.id !== id); setScenarios(u); persistScenarios(u); };
  const loadScenarioIntoSim = (s: SavedScenario) => { setSimBairro(s.bairro); setSimMetragem(s.metragem); setSimOcupacao([s.ocupacao]); setSimDiariaAtual(s.diariaAtual); setSimObjetivo(s.objetivo); setRateBoost(s.rateBoost); setSimReformaBudget(s.reformaBudget); setCompareOpen(false); };

  const simTracked = useRef(false);
  useEffect(() => {
    if (simTracked.current) return;
    const t = setTimeout(() => { if (simDiariaAtual || rateBoost > 0 || simReformaBudget) { trackGlobal("simulator_used", { bairro: simBairro, metragem: simMetragem, ocupacao: simOcupacao[0], diaria: sim.boostedDaily, resultado: sim.receitaMensal }); simTracked.current = true; } }, 2000);
    return () => clearTimeout(t);
  }, [sim.receitaMensal]);

  return (
    <SectionBlock id="simulador" title="Simulador de Receita" takeaway="Calcule sua rentabilidade estimada em menos de 1 minuto.">
      {scenarios.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {scenarios.map((s) => <Badge key={s.id} variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1.5 text-xs" onClick={() => loadScenarioIntoSim(s)}>{s.name}</Badge>)}
        </div>
      )}
      <Card className="border-border">
        <CardContent className="p-6 space-y-5 font-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Bairro</label><Select value={simBairro} onValueChange={setSimBairro}><SelectTrigger className="min-h-[48px] text-base"><SelectValue /></SelectTrigger><SelectContent>{bairros.map((b) => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Metragem (m²)</label><Input type="number" min={15} max={80} value={simMetragem} onChange={(e) => setSimMetragem(Number(e.target.value) || 30)} className="min-h-[48px] text-base" /></div>
          </div>
          <div><label className="text-sm font-medium text-foreground mb-2 block">Ocupação estimada: <span className="font-bold text-primary">{simOcupacao[0]}%</span></label><Slider value={simOcupacao} onValueChange={setSimOcupacao} min={50} max={90} step={1} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Diária atual (opcional, R$)</label><Input type="number" placeholder={`Média do bairro: R$ ${fmt((selected.dailyMin + selected.dailyMax) / 2)}`} value={simDiariaAtual} onChange={(e) => setSimDiariaAtual(e.target.value)} className="min-h-[48px] text-base" /></div>
            <div><label className="text-sm font-medium text-foreground mb-1.5 block">Objetivo</label><Select value={simObjetivo} onValueChange={setSimObjetivo}><SelectTrigger className="min-h-[48px] text-base"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="maximizar">Maximizar receita</SelectItem><SelectItem value="estabilidade">Estabilidade de ocupação</SelectItem><SelectItem value="premium">Posicionamento premium</SelectItem></SelectContent></Select></div>
          </div>
          <div><label className="text-sm font-medium text-foreground mb-2 block">Impacto de aumento na diária</label><div className="flex gap-2 flex-wrap">{[0, 10, 20, 30].map((v) => <Button key={v} size="sm" variant={rateBoost === v ? "default" : "outline"} onClick={() => setRateBoost(v)} className={`min-h-[44px] min-w-[48px] ${rateBoost === v ? "bg-primary text-primary-foreground" : ""}`}>{v === 0 ? "Base" : `+${v}%`}</Button>)}</div></div>
          <div><label className="text-sm font-medium text-foreground mb-1.5 block">Orçamento de reforma (opcional, R$)</label><Input type="number" placeholder="Ex: 45.000" value={simReformaBudget} onChange={(e) => setSimReformaBudget(e.target.value)} className="min-h-[48px] text-base" /></div>
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-2xl font-display font-bold text-primary">R$ {fmt(sim.boostedDaily)}</p><p className="text-xs text-muted-foreground">Diária {rateBoost > 0 ? `(+${rateBoost}%)` : "base"}</p></div>
            <div><p className="text-2xl font-display font-bold text-primary">R$ {fmt(sim.receitaMensal)}</p><p className="text-xs text-muted-foreground">Receita / mês</p></div>
            <div><p className="text-2xl font-display font-bold text-primary">R$ {fmt(sim.receitaAnual)}</p><p className="text-xs text-muted-foreground">Receita / ano</p></div>
            <div><p className="text-2xl font-display font-bold text-primary">{sim.paybackMonths ? `${sim.paybackMonths} meses` : "—"}</p><p className="text-xs text-muted-foreground">Payback reforma</p></div>
          </div>
          {rateBoost > 0 && sim.delta > 0 && (
            <div className="bg-gold-light/50 border border-gold/20 rounded-xl p-4 flex items-start gap-3">
              <ArrowUpRight className="text-gold mt-0.5 flex-shrink-0" size={20} />
              <p className="text-sm text-muted-foreground">Com +{rateBoost}% na diária, você ganha <span className="font-bold text-foreground">R$ {fmt(sim.delta)}/mês</span> a mais em relação ao cenário base.</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1 min-h-[44px]" onClick={saveScenario}><Bookmark size={16} className="mr-2" />Salvar cenário</Button>
            <Dialog open={exportOpen} onOpenChange={setExportOpen}>
              <DialogTrigger asChild><Button variant="outline" className="flex-1 min-h-[44px]"><FileText size={16} className="mr-2" />Exportar simulação</Button></DialogTrigger>
              <DialogContent className="font-body"><DialogHeader><DialogTitle className="font-display">Resumo da Simulação</DialogTitle></DialogHeader><pre className="bg-muted rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap max-h-80 overflow-y-auto">{summaryText}</pre><Button onClick={handleCopy} className="w-full bg-primary text-primary-foreground">{copied ? <><Check size={16} className="mr-2" /> Copiado!</> : <><Copy size={16} className="mr-2" /> Copiar texto</>}</Button></DialogContent>
            </Dialog>
          </div>
          {scenarios.length >= 2 && (
            <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
              <DialogTrigger asChild><Button variant="secondary" className="w-full"><Columns2 size={16} className="mr-2" />Comparar cenários ({scenarios.length})</Button></DialogTrigger>
              <DialogContent className="font-body max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="font-display">Comparação de Cenários</DialogTitle></DialogHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border"><th className="text-left py-2 px-2 text-muted-foreground font-medium">Métrica</th>{scenarios.map(s => <th key={s.id} className="text-center py-2 px-2 font-medium text-foreground min-w-[120px]"><div className="text-xs">{s.name}</div></th>)}</tr></thead>
                    <tbody>
                      {([
                        { label: "Bairro", key: "bairro", fmt: (v: any) => v, best: null },
                        { label: "Metragem", key: "metragem", fmt: (v: any) => `${v}m²`, best: null },
                        { label: "Ocupação", key: "ocupacao", fmt: (v: any) => `${v}%`, best: "max" },
                        { label: "Diária", key: "boostedDaily", fmt: (v: any) => `R$ ${fmt(v)}`, best: "max" },
                        { label: "Rate boost", key: "rateBoost", fmt: (v: any) => v === 0 ? "Base" : `+${v}%`, best: null },
                        { label: "Receita/mês", key: "receitaMensal", fmt: (v: any) => `R$ ${fmt(v)}`, best: "max" },
                        { label: "Receita/ano", key: "receitaAnual", fmt: (v: any) => `R$ ${fmt(v)}`, best: "max" },
                        { label: "Payback", key: "paybackMonths", fmt: (v: any) => v ? `${v} meses` : "—", best: "min" },
                      ] as const).map(row => {
                        const values = scenarios.map(s => (s as any)[row.key]);
                        const numericValues = values.filter(v => typeof v === "number" && v > 0);
                        const bestVal = row.best === "max" ? Math.max(...numericValues) : row.best === "min" ? Math.min(...numericValues) : null;
                        return (
                          <tr key={row.key} className="border-b border-border/50">
                            <td className="py-2 px-2 text-muted-foreground">{row.label}</td>
                            {scenarios.map(s => { const v = (s as any)[row.key]; const isBest = bestVal !== null && v === bestVal && numericValues.length > 1; return <td key={s.id} className={`text-center py-2 px-2 ${isBest ? "text-primary font-bold bg-primary/5" : "text-foreground"}`}>{row.fmt(v)}</td>; })}
                          </tr>
                        );
                      })}
                      <tr><td className="py-2 px-2 text-muted-foreground">Ações</td>{scenarios.map(s => <td key={s.id} className="text-center py-2 px-2"><div className="flex flex-col gap-1"><Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => loadScenarioIntoSim(s)}>Usar no simulador</Button><Button size="sm" variant="ghost" className="text-xs h-7 text-destructive hover:text-destructive" onClick={() => removeScenario(s.id)}><Trash2 size={12} className="mr-1" /> Remover</Button></div></td>)}</tr>
                    </tbody>
                  </table>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
      <Accordion type="multiple" className="mt-4 font-body">
         <AccordionItem value="rateboost"><AccordionTrigger className="text-primary font-semibold min-h-[48px]">Como funciona o rate boost</AccordionTrigger><AccordionContent><p className="text-sm text-muted-foreground leading-relaxed">O cenário Base usa a diária média do bairro (ou sua diária atual, se informada). <strong className="text-foreground">+10%</strong> = decoração básica melhorada (pintura, iluminação, enxoval novo). <strong className="text-foreground">+20%</strong> = decoração premium com fotos profissionais e mobília planejada. <strong className="text-foreground">+30%</strong> = studio de alto padrão com design autoral, fotos de catálogo e operação otimizada. Cada nível é cumulativo ao anterior.</p></AccordionContent></AccordionItem>
        <AccordionItem value="payback"><AccordionTrigger className="text-primary font-semibold min-h-[48px]">O que o payback considera</AccordionTrigger><AccordionContent><p className="text-sm text-muted-foreground leading-relaxed">O cálculo de payback é simplificado: <strong className="text-foreground">Payback = Orçamento de reforma ÷ Receita incremental mensal</strong> (diferença entre cenário boosted e cenário base). Não inclui custos operacionais como limpeza (~R$ 80-120/virada), taxa da plataforma (~15%), condomínio, IPTU ou imposto de renda. Para uma projeção completa, solicite um diagnóstico personalizado.</p></AccordionContent></AccordionItem>
      </Accordion>
    </SectionBlock>
  );
}
