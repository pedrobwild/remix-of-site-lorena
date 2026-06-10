/**
 * AssetStatusTag — pílulas de status proprietárias da BeWild.
 * Sprint 1 Design System — linguagem visual de operação e progresso.
 *
 * Uso:
 *   <AssetStatusTag status="pronto" />
 *   <AssetStatusTag status="operando" size="lg" />
 */

export type AssetStatus =
  | "cru"
  | "preparo"
  | "pronto"
  | "operando"
  | "repasse";

interface AssetStatusTagProps {
  status: AssetStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const STATUS_CONFIG: Record<
  AssetStatus,
  { label: string; dot: string; bg: string; border: string; text: string }
> = {
  cru: {
    label: "ATIVO CRU",
    dot: "bg-white/40",
    bg: "bg-white/5",
    border: "border-white/20",
    text: "text-white/50",
  },
  preparo: {
    label: "EM PREPARO",
    dot: "bg-bewild-gold",
    bg: "bg-bewild-gold/10",
    border: "border-bewild-gold/30",
    text: "text-bewild-gold-400",
  },
  pronto: {
    label: "PRONTO PARA HOSPEDAR",
    dot: "bg-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
    text: "text-emerald-400",
  },
  operando: {
    label: "EM OPERAÇÃO",
    dot: "bg-bewild-blue-400 animate-pulse",
    bg: "bg-bewild-blue/10",
    border: "border-bewild-blue/30",
    text: "text-bewild-blue-400",
  },
  repasse: {
    label: "REPASSE",
    dot: "bg-bewild-gold",
    bg: "bg-bewild-gold/10",
    border: "border-bewild-gold/30",
    text: "text-bewild-gold",
  },
};

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-[10px] gap-1.5",
  md: "px-2.5 py-1 text-[11px] gap-1.5",
  lg: "px-3 py-1.5 text-xs gap-2",
};

const DOT_SIZE = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2 w-2",
};

export function AssetStatusTag({
  status,
  size = "md",
  className = "",
}: AssetStatusTagProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border font-mono font-semibold tracking-widest uppercase",
        cfg.bg,
        cfg.border,
        cfg.text,
        SIZE_CLASSES[size],
        className,
      ].join(" ")}
    >
      <span className={["rounded-full flex-shrink-0", cfg.dot, DOT_SIZE[size]].join(" ")} />
      {cfg.label}
    </span>
  );
}

export default AssetStatusTag;
