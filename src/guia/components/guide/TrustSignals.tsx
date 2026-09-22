import { TRUST_SIGNALS_DATA } from "@/guia/data/guide-data";

export default function TrustSignals() {
  return (
    <div className="py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {TRUST_SIGNALS_DATA.map((s) => (
          <div key={s.label} className="flex items-center gap-2 font-body">
            <s.icon size={16} className="text-primary flex-shrink-0" />
            <span className="text-sm text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
