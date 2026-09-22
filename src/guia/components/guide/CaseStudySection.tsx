import { useMemo } from "react";
import { Card, CardContent } from "@/guia/components/ui/card";
import { Badge } from "@/guia/components/ui/badge";
import { TrendingUp, Calendar, MapPin, Ruler, DollarSign } from "lucide-react";
import SectionBlock from "./SectionBlock";
import { useGuideDecision } from "@/guia/hooks/useGuideDecision";
import { loadPendingProvision } from "@/guia/lib/leadProvisioning";
import { selectCaseStudies, type MatchLevel } from "@/guia/data/caseStudies";

/** Banner de relevância: explica por que este case está sendo mostrado ao lead. */
function relevanceCopy(matchLevel: MatchLevel, leadBairro: string | null, region: string | null) {
  switch (matchLevel) {
    case "bairro":
      return {
        label: "No seu bairro",
        text: `Você demonstrou interesse em ${leadBairro}. Veja um case real que a Bewild operou aqui.`,
      };
    case "regiao":
      return {
        label: `Perto de você · ${region}`,
        text: `Ainda não temos um case público em ${leadBairro}, mas este studio fica na mesma região (${region}).`,
      };
    default:
      return {
        label: "Case real Bewild",
        text: leadBairro
          ? `Ainda não temos um case público em ${leadBairro}. Veja um de nossos cases de referência.`
          : "Uma jornada real de investidor — do imóvel à receita recorrente.",
      };
  }
}

export default function CaseStudySection() {
  const { selectedBairro, investorProfile } = useGuideDecision();

  // Bairro do lead: seleção em sessão (quiz/recomendação) ou bairro informado
  // na captura do lead (persistido em localStorage). Fallback gracioso quando
  // não há nenhum dos dois.
  const selection = useMemo(() => {
    const leadBairro = selectedBairro ?? loadPendingProvision()?.neighborhood ?? null;
    return selectCaseStudies({ bairro: leadBairro, profile: investorProfile });
  }, [selectedBairro, investorProfile]);

  const caseData = selection.cases[0];
  if (!caseData) return null;

  const { matchLevel, leadBairro, region } = selection;
  const copy = relevanceCopy(matchLevel, leadBairro, region ?? null);
  const isContextual = matchLevel !== "geral";

  return (
    <SectionBlock
      id="casestudy"
      title={`Case Study: Studio em ${caseData.bairro}`}
      takeaway="Jornada real de um investidor — do imóvel à receita recorrente."
    >
      {/* Banner de relevância contextual */}
      <div
        className={`flex items-start gap-3 rounded-lg border p-4 mb-6 ${
          isContextual ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"
        }`}
        role="note"
      >
        <MapPin size={18} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <Badge variant={isContextual ? "default" : "secondary"} className="font-body text-xs mb-1">
            {copy.label}
          </Badge>
          <p className="text-sm text-muted-foreground">{copy.text}</p>
        </div>
      </div>

      {caseData.fotos?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {caseData.fotos.map((foto) => (
            <figure key={foto.src} className="overflow-hidden rounded-lg border border-border">
              <img src={foto.src} alt={foto.alt} loading="lazy" className="w-full h-auto object-cover" />
              {foto.label && (
                <figcaption className="px-3 py-2 text-xs font-body text-muted-foreground bg-muted/40">{foto.label}</figcaption>
              )}
            </figure>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card className="border-border"><CardContent className="p-4 text-center"><MapPin size={18} className="text-primary mx-auto mb-1" aria-hidden="true" /><p className="text-lg font-display font-bold text-foreground">{caseData.bairro}</p><p className="text-xs text-muted-foreground">Bairro</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 text-center"><Ruler size={18} className="text-primary mx-auto mb-1" aria-hidden="true" /><p className="text-lg font-display font-bold text-foreground">{caseData.metragem}m²</p><p className="text-xs text-muted-foreground">Metragem</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 text-center"><DollarSign size={18} className="text-primary mx-auto mb-1" aria-hidden="true" /><p className="text-lg font-display font-bold text-primary">R$ {caseData.receitaMensal.toLocaleString("pt-BR")}/mês</p><p className="text-xs text-muted-foreground">Receita média</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 text-center"><TrendingUp size={18} className="text-primary mx-auto mb-1" aria-hidden="true" /><p className="text-lg font-display font-bold text-primary">{caseData.yieldBruto}</p><p className="text-xs text-muted-foreground">Yield bruto</p></CardContent></Card>
      </div>

      <h3 className="font-display text-xl font-bold text-foreground mb-4">Investimento</h3>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Card className="border-border"><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Imóvel</p><p className="font-display font-bold text-foreground">R$ {caseData.investimento.imovel.toLocaleString("pt-BR")}</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Reforma</p><p className="font-display font-bold text-foreground">R$ {caseData.investimento.reforma.toLocaleString("pt-BR")}</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Decoração</p><p className="font-display font-bold text-foreground">R$ {caseData.investimento.decoracao.toLocaleString("pt-BR")}</p></CardContent></Card>
      </div>

      <h3 className="font-display text-xl font-bold text-foreground mb-4">Timeline do Projeto</h3>
      <div className="space-y-3">
        {caseData.timeline.map((step, i) => (
          <div key={step.month} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar size={14} className="text-primary" aria-hidden="true" />
              </div>
              {i < caseData.timeline.length - 1 && <div className="w-px h-6 bg-border" />}
            </div>
            <div>
              <Badge variant="secondary" className="font-body text-xs mb-1">{step.month}</Badge>
              <p className="font-semibold text-foreground text-sm">{step.label}</p>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionBlock>
  );
}
