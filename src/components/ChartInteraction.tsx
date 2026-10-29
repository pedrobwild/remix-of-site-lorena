import { useState, type ReactNode, type SyntheticEvent } from "react";
import { Button } from "@/guia/components/ui/button";

export function ChartInteraction({ labels, children }: { labels: string[]; children: ReactNode }) {
  const [muted, setMuted] = useState<number[]>([]);
  const [detail, setDetail] = useState<string | null>(null);
  function inspect(event: SyntheticEvent) {
    if (!(event.target instanceof HTMLElement)) return;
    const item = event.target.closest<HTMLElement>("[data-detail]");
    if (item) setDetail(item.dataset.detail ?? null);
  }
  return <div className="blog-chart__interactive" data-muted={muted.join(" ")} onPointerOver={inspect} onFocus={inspect} onClick={inspect}>
    <div className="blog-chart__legend" aria-label="Séries do gráfico">
      {labels.map((label, index) => <Button key={label} type="button" variant="ghost" className="blog-chart__legend-button" aria-pressed={!muted.includes(index)} onClick={() => {
        setMuted((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index]);
        setDetail(null);
      }}><i className={`tone-${index}`} aria-hidden="true" /><span>{label}</span></Button>)}
    </div>
    {children}
    <div className="blog-chart__tooltip" role="status" aria-live="polite">{detail ?? "\u00a0"}</div>
  </div>;
}