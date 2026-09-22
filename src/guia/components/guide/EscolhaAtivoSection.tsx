import { useState, useEffect } from "react";
import { Card, CardContent } from "@/guia/components/ui/card";
import { Badge } from "@/guia/components/ui/badge";
import { Checkbox } from "@/guia/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/guia/components/ui/accordion";
import { motion } from "framer-motion";
import { Building2, Home, MapPin, ShieldCheck, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import SectionBlock from "./SectionBlock";
import { useGuideDecision } from "@/guia/hooks/useGuideDecision";

/* ── Scoring checklist data ── */
const EVAL_CATEGORIES = [
  {
    key: "predio",
    label: "Prédio",
    icon: Building2,
    items: [
      { id: "p1", text: "Permite short stay (sem restrição em convenção)" },
      { id: "p2", text: "Portaria 24h ou controle de acesso" },
      { id: "p3", text: "Áreas comuns relevantes (academia, coworking, lavanderia)" },
      { id: "p4", text: "Bom estado de conservação e manutenção" },
      { id: "p5", text: "Vizinhança sem histórico de reclamações contra locação curta" },
    ],
  },
  {
    key: "unidade",
    label: "Unidade",
    icon: Home,
    items: [
      { id: "u1", text: "Metragem eficiente (20–40 m²)" },
      { id: "u2", text: "Planta inteligente (sem corredores desperdiçados)" },
      { id: "u3", text: "Boa insolação e ventilação natural" },
      { id: "u4", text: "Andar alto ou posição com menos ruído" },
      { id: "u5", text: "Banheiro com ventilação (janela ou exaustão)" },
      { id: "u6", text: "Varanda ou sacada (diferencial competitivo)" },
    ],
  },
  {
    key: "localizacao",
    label: "Localização",
    icon: MapPin,
    items: [
      { id: "l1", text: "Próximo a metrô ou transporte público" },
      { id: "l2", text: "Bairro com demanda comprovada para short stay" },
      { id: "l3", text: "Comércio, restaurantes e serviços a pé" },
      { id: "l4", text: "Região percebida como segura" },
      { id: "l5", text: "Mercado não saturado (concorrência saudável)" },
    ],
  },
];

const SCORE_TIERS = [
  { min: 0, max: 5, label: "Alto risco", color: "bg-destructive", textColor: "text-destructive", desc: "A unidade tem gaps importantes. Revise antes de avançar." },
  { min: 6, max: 9, label: "Potencial com ressalvas", color: "bg-amber-500", textColor: "text-amber-600", desc: "Há oportunidade, mas itens críticos precisam de atenção." },
  { min: 10, max: 13, label: "Boa oportunidade", color: "bg-primary/70", textColor: "text-primary", desc: "Ativo sólido. Foque nos itens pendentes para maximizar retorno." },
  { min: 14, max: 16, label: "Excelente ativo", color: "bg-primary", textColor: "text-primary", desc: "Perfil ideal para short stay. Avance com confiança." },
];

/* ── Comparison data ── */
const COMPARISON = [
  {
    title: "Bom para operação",
    subtitle: "Gera receita mensal alta e consistente",
    color: "border-primary/30 bg-primary/[0.03]",
    icon: CheckCircle2,
    iconColor: "text-primary",
    items: [
      "Planta eficiente e fácil de mobiliar",
      "Bairro com demanda real de hóspedes",
      "Condomínio acessível e que permite short stay",
      "Fácil de decorar com investimento controlado",
      "Preço de aquisição permite yield saudável",
    ],
  },
  {
    title: "Bom para revenda",
    subtitle: "Valoriza no longo prazo mas pode render pouco",
    color: "border-amber-500/30 bg-amber-500/[0.03]",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    items: [
      "Localização premium com valorização histórica",
      "Acabamento de alto padrão e marca do incorporador",
      "Metragem generosa (pode reduzir eficiência/m²)",
      "Condomínio alto que comprime margem operacional",
      "Demanda de hóspedes pode não justificar o ADR necessário",
    ],
  },
];

export default function EscolhaAtivoSection() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const { setUnitScore } = useGuideDecision();

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allItems = EVAL_CATEGORIES.flatMap((c) => c.items);
  const score = checked.size;
  const total = allItems.length;
  const tier = SCORE_TIERS.find((t) => score >= t.min && score <= t.max) ?? SCORE_TIERS[0];
  const pct = Math.round((score / total) * 100);

  // Report score to decision context
  useEffect(() => {
    if (score > 0) {
      setUnitScore({
        total: score,
        max: total,
        pct,
        tier: tier.label,
        categoryScores: EVAL_CATEGORIES.map((c) => ({
          key: c.key,
          label: c.label,
          checked: c.items.filter((i) => checked.has(i.id)).length,
          total: c.items.length,
        })),
      });
    }
  }, [score, total, pct, tier.label, checked, setUnitScore]);

  return (
    <SectionBlock
      id="escolha-ativo"
      title="Como Avaliar a Unidade"
      takeaway="Nem todo studio é bom para short stay. Use este framework para avaliar antes de comprar."
    >
      {/* ── Scoring Tool ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {EVAL_CATEGORIES.map((cat, ci) => (
          <motion.div
            key={cat.key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: ci * 0.1 }}
          >
            <Card className="border-border h-full">
              <CardContent className="p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <cat.icon className="text-primary" size={18} />
                  </div>
                  <div>
                    <p className="font-display font-bold text-foreground text-sm">{cat.label}</p>
                    <p className="text-xs text-muted-foreground font-body">{cat.items.length} critérios</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {cat.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-3">
                      <Checkbox
                        id={item.id}
                        checked={checked.has(item.id)}
                        onCheckedChange={() => toggle(item.id)}
                        className="mt-0.5"
                      />
                      <label htmlFor={item.id} className="text-sm text-foreground font-body cursor-pointer leading-snug">
                        {item.text}
                      </label>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Score Result ── */}
      <Card className="border-border mb-10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative h-16 w-16 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeDasharray={`${pct}, 100`}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-lg text-foreground">
                  {score}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`${tier.color} text-primary-foreground font-body text-xs`}>{tier.label}</Badge>
                  <span className="text-xs text-muted-foreground font-body">{score} de {total} critérios</span>
                </div>
                <p className="text-sm text-muted-foreground font-body">{tier.desc}</p>
              </div>
            </div>
            {score > 0 && (
              <button
                onClick={() => setChecked(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground font-body underline underline-offset-2 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Comparison: Operação vs Revenda ── */}
      <h3 className="font-display text-xl font-bold text-foreground mb-4">Operação vs. Revenda: ativo certo para cada objetivo</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {COMPARISON.map((col, i) => (
          <motion.div
            key={col.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`border-2 ${col.color} h-full`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <col.icon className={col.iconColor} size={20} />
                  <div>
                    <p className="font-display font-bold text-foreground text-sm">{col.title}</p>
                    <p className="text-xs text-muted-foreground font-body">{col.subtitle}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {col.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-foreground font-body">
                      <ArrowRight size={12} className="text-muted-foreground mt-1 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Due Diligence Accordion ── */}
      <Accordion type="multiple" className="font-body">
        <AccordionItem value="due-diligence">
          <AccordionTrigger className="text-primary font-semibold min-h-[48px]">
            <span className="flex items-center gap-2"><ShieldCheck size={16} /> Checklist de due diligence da unidade</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-foreground mb-1">Documental</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Verificar matrícula atualizada do imóvel</li>
                  <li>• Confirmar inexistência de ônus ou penhoras</li>
                  <li>• Ler a convenção do condomínio (cláusulas sobre locação)</li>
                  <li>• Consultar atas de assembleia recentes</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Física</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Visitar em horários diferentes (ruído, luz, circulação)</li>
                  <li>• Verificar estado de instalações (elétrica, hidráulica)</li>
                  <li>• Checar pressão de água e funcionamento de ralos</li>
                  <li>• Avaliar vedação de janelas e acústica</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Mercado</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Pesquisar listings ativos no Airbnb no mesmo edifício</li>
                  <li>• Comparar preço/m² com transações recentes da região</li>
                  <li>• Verificar demanda do bairro no mapa de intelligence</li>
                  <li>• Avaliar concorrência e saturação na micro-região</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="metragem">
          <AccordionTrigger className="text-primary font-semibold min-h-[48px]">
            Metragem ideal e eficiência de planta
          </AccordionTrigger>
          <AccordionContent>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>A faixa <strong className="text-foreground">25–35 m²</strong> é o sweet spot para short stay em São Paulo. Abaixo de 25m², o espaço limita a experiência (especialmente para estadias &gt; 3 noites). Acima de 40m², o custo de aquisição e condomínio sobe sem proporcional aumento na diária.</p>
              <p><strong className="text-foreground">Eficiência de planta</strong>: priorize unidades onde a área útil é maximizada — sem corredores longos, com cozinha integrada e banheiro compacto mas funcional. Uma planta de 28m² bem desenhada pode performar melhor que uma de 35m² com layout ruim.</p>
              <p><strong className="text-foreground">Regra prática</strong>: se a cama, mesa de trabalho, sofá (ou banco) e armário cabem sem comprometer circulação, a planta é eficiente.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="condominio">
          <AccordionTrigger className="text-primary font-semibold min-h-[48px]">
            Restrições de condomínio: o que verificar
          </AccordionTrigger>
          <AccordionContent>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>A <strong className="text-foreground">convenção do condomínio</strong> é o documento decisivo. Busque cláusulas sobre "locação por temporada", "hospedagem" ou "uso residencial exclusivo". Se a convenção é silente sobre o tema, há espaço legal para operar — mas isso pode mudar em assembleia.</p>
              <p><strong className="text-foreground">Sinais de alerta</strong>: proibição explícita de locação por período inferior a 30 dias, histórico de multas a proprietários que operam short stay, ou assembleia recente que deliberou contra.</p>
              <p><strong className="text-foreground">Sinais positivos</strong>: outros proprietários já operando no Airbnb, administradora receptiva, e prédio com perfil de investidores (não apenas moradores).</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </SectionBlock>
  );
}
