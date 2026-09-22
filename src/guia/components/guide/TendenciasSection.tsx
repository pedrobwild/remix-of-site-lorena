import { useState, useMemo } from "react";
import { Card, CardContent } from "@/guia/components/ui/card";
import { Badge } from "@/guia/components/ui/badge";
import { Button } from "@/guia/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/guia/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, CheckCircle2, ChevronDown, MousePointerClick, DollarSign, CalendarCheck, Star, X } from "lucide-react";
import {
  TRENDS_2026, TREND_ALL_TAGS, TREND_TAG_ICONS, TREND_TAG_COLORS,
  TREND_IMPACT_ORDER, TREND_DIFF_ORDER,
  trendDiffLabel, trendDiffColor, trendImpactLabel, trendImpactColor,
  type TrendSortMode, type TrendItem,
} from "@/guia/data/guide-data";
import SectionBlock from "./SectionBlock";

const PAGE_SIZE_DESKTOP = 8;

const KPI_FILTERS = [
  { id: "ctr", label: "Mais cliques (CTR)", icon: MousePointerClick, tags: ["Fotos", "Design"] },
  { id: "adr", label: "Maior diária média", icon: DollarSign, tags: ["Design", "Precificação", "Experiência"] },
  { id: "occ", label: "Mais reservas", icon: CalendarCheck, tags: ["Operação", "Automação", "Precificação"] },
  { id: "reviews", label: "Melhores avaliações", icon: Star, tags: ["Experiência", "Operação"] },
];

export default function TendenciasSection() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<TrendSortMode>("impact");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE_DESKTOP);
  const [detailTrend, setDetailTrend] = useState<TrendItem | null>(null);

  const filtered = useMemo(() => {
    let items = [...TRENDS_2026];

    // KPI filter takes priority over tag filter
    if (activeKpi) {
      const kpi = KPI_FILTERS.find((k) => k.id === activeKpi);
      if (kpi) items = items.filter((t) => t.tags.some((tag) => kpi.tags.includes(tag)));
    } else if (activeTag) {
      items = items.filter((t) => t.tags.includes(activeTag));
    }

    if (sortMode === "impact") items.sort((a, b) => TREND_IMPACT_ORDER[a.impact] - TREND_IMPACT_ORDER[b.impact]);
    else if (sortMode === "easy") items.sort((a, b) => TREND_DIFF_ORDER[a.difficulty] - TREND_DIFF_ORDER[b.difficulty]);
    else items.sort((a, b) => TREND_DIFF_ORDER[b.difficulty] - TREND_DIFF_ORDER[a.difficulty]);
    return items;
  }, [activeTag, activeKpi, sortMode]);

  // Reset pagination when filters change
  const isFiltered = activeTag !== null || activeKpi !== null;
  const shouldPaginate = !isFiltered || filtered.length > PAGE_SIZE_DESKTOP;
  const visible = shouldPaginate ? filtered.slice(0, visibleCount) : filtered;
  const remaining = filtered.length - visible.length;

  const handleTagClick = (tag: string | null) => {
    setActiveTag(tag);
    setActiveKpi(null);
    setVisibleCount(PAGE_SIZE_DESKTOP);
  };

  const handleKpiClick = (kpiId: string) => {
    if (activeKpi === kpiId) {
      setActiveKpi(null);
    } else {
      setActiveKpi(kpiId);
      setActiveTag(null);
    }
    setVisibleCount(PAGE_SIZE_DESKTOP);
  };

  const loadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE_DESKTOP);
  };

  const sortOptions: { mode: TrendSortMode; label: string }[] = [
    { mode: "impact", label: "Maior impacto" },
    { mode: "easy", label: "Mais fácil" },
    { mode: "pro", label: "Mais avançado" },
  ];

  const activeFilterLabel = activeKpi
    ? KPI_FILTERS.find((k) => k.id === activeKpi)?.label
    : activeTag;

  return (
    <SectionBlock id="tendencias" title="Tendências 2026" takeaway="20 práticas dos hosts mais rentáveis do Brasil.">
      {/* KPI Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {KPI_FILTERS.map((kpi) => {
          const isActive = activeKpi === kpi.id;
          return (
            <Card
              key={kpi.id}
              className={`cursor-pointer transition-all ${isActive ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/30"}`}
              onClick={() => handleKpiClick(kpi.id)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <kpi.icon size={18} className={isActive ? "text-primary-foreground" : "text-primary"} />
                <span className={`text-sm font-medium font-body ${isActive ? "text-primary-foreground" : "text-foreground"}`}>{kpi.label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tag Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge
          variant={!activeTag && !activeKpi ? "default" : "secondary"}
          className="cursor-pointer font-body min-h-[36px] px-3 flex items-center"
          onClick={() => handleTagClick(null)}
        >
          Todos
        </Badge>
        {TREND_ALL_TAGS.map((tag) => {
          const Icon = TREND_TAG_ICONS[tag];
          return (
            <Badge
              key={tag}
              variant={activeTag === tag ? "default" : "secondary"}
              className={`cursor-pointer font-body min-h-[36px] px-3 flex items-center ${activeTag !== tag && !activeKpi ? TREND_TAG_COLORS[tag] || "" : ""}`}
              onClick={() => handleTagClick(tag === activeTag ? null : tag)}
            >
              {Icon && <Icon size={12} className="mr-1" />}
              {tag}
            </Badge>
          );
        })}
      </div>

      {/* Active filter status + sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div className="text-sm text-muted-foreground font-body">
          {isFiltered ? (
            <span className="flex items-center gap-2">
              {filtered.length} tendência{filtered.length !== 1 ? "s" : ""} em "{activeFilterLabel}"
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                onClick={() => { setActiveTag(null); setActiveKpi(null); setVisibleCount(PAGE_SIZE_DESKTOP); }}
              >
                <X size={12} className="mr-1" /> Limpar filtro
              </Button>
            </span>
          ) : (
            "Mostrando todas as tendências"
          )}
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-body">Ordenar:</span>
          {sortOptions.map((opt) => (
            <Button
              key={opt.mode}
              size="sm"
              variant={sortMode === opt.mode ? "default" : "outline"}
              className="text-xs h-7 font-body min-h-[36px]"
              onClick={() => setSortMode(opt.mode)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {visible.map((trend, i) => (
            <motion.div
              key={trend.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: (i % PAGE_SIZE_DESKTOP) * 0.04, duration: 0.3 }}
              layout
            >
              <Card
                className="border-border hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col"
                onClick={() => setDetailTrend(trend)}
              >
                <CardContent className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-primary">{trend.numberLabel}</span>
                    <div className="flex gap-1.5">
                      <Badge className={`text-[10px] px-1.5 py-0 ${trendDiffColor[trend.difficulty]}`}>{trendDiffLabel[trend.difficulty]}</Badge>
                      <Badge className={`text-[10px] px-1.5 py-0 ${trendImpactColor[trend.impact]}`}>{trendImpactLabel[trend.impact]}</Badge>
                    </div>
                  </div>
                  <p className="font-bold text-foreground text-base mb-1.5">{trend.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{trend.short}</p>
                  <p className="text-xs text-primary font-medium mt-3">Ver detalhes →</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {shouldPaginate && remaining > 0 && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={loadMore} className="font-body gap-2">
            <ChevronDown size={16} />
            Ver mais tendências ({remaining} restante{remaining !== 1 ? "s" : ""})
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailTrend} onOpenChange={(open) => !open && setDetailTrend(null)}>
        <DialogContent className="max-w-lg">
          {detailTrend && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-primary">{detailTrend.numberLabel}</span>
                  <Badge className={`text-[10px] px-1.5 py-0 ${trendDiffColor[detailTrend.difficulty]}`}>{trendDiffLabel[detailTrend.difficulty]}</Badge>
                  <Badge className={`text-[10px] px-1.5 py-0 ${trendImpactColor[detailTrend.impact]}`}>{trendImpactLabel[detailTrend.impact]}</Badge>
                </div>
                <DialogTitle className="font-display text-xl">{detailTrend.title}</DialogTitle>
              </DialogHeader>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {detailTrend.tags.map((tag) => {
                  const Icon = TREND_TAG_ICONS[tag];
                  return (
                    <Badge key={tag} variant="secondary" className={`font-body text-xs ${TREND_TAG_COLORS[tag] || ""}`}>
                      {Icon && <Icon size={12} className="mr-1" />}
                      {tag}
                    </Badge>
                  );
                })}
              </div>

              <p className="text-sm text-muted-foreground mb-4">{detailTrend.details.what}</p>

              <p className="text-xs font-semibold text-foreground mb-2">Como implementar:</p>
              <ul className="space-y-1.5 mb-4">
                {detailTrend.details.how.map((step) => (
                  <li key={step} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>

              <p className="text-xs font-semibold text-foreground mb-1">Checklist:</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {detailTrend.details.checklist.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs font-body">{c}</Badge>
                ))}
              </div>

              <p className="text-xs text-primary font-medium">Impacto esperado: {detailTrend.details.expectedImpact}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SectionBlock>
  );
}
