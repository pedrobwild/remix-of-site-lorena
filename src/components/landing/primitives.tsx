/**
 * primitives.tsx — blocos reutilizáveis da landing **BeWild**.
 */
import { useState, type ReactNode } from "react";
import { ImageIcon } from "lucide-react";

/* ----------------------------------------------------------------
 * Wordmark BeWild — `Be` + `Wild` itálico, sem espaço.
 * Tone:
 *  - "light" (sobre escuro): "Wild" em gold-400
 *  - "dark"  (sobre claro): "Wild" em petróleo
 * -------------------------------------------------------------- */
export function BewildLogo({
  className = "",
  heightClass = "h-7",
  tone = "light",
}: {
  className?: string;
  heightClass?: string;
  tone?: "light" | "dark";
}) {
  // Mapeia heightClass → tamanho de fonte aproximado para casar com a barra.
  const sizeMap: Record<string, string> = {
    "h-6": "text-[1.35rem]",
    "h-6 sm:h-7": "text-[1.35rem] sm:text-[1.6rem]",
    "h-7": "text-[1.6rem]",
    "h-8": "text-[1.85rem]",
    "h-9": "text-[2.1rem]",
  };
  const sizeClass = sizeMap[heightClass] ?? "text-[1.6rem]";
  const beColor = tone === "light" ? "text-white" : "text-bewild-ink";
  const wildColor = tone === "light" ? "text-bewild-blue-400" : "text-bewild-blue";
  return (
    <span
      aria-label="BeWild"
      className={`inline-flex items-baseline font-display font-semibold leading-none tracking-tight ${sizeClass} ${className}`}
    >
      <span className={beColor}>Be</span>
      <span className={`italic ${wildColor}`}>Wild</span>
    </span>
  );
}

/** Mark geométrico legado (mantido para compatibilidade). */
export function BewildMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <path
        d="M24 7.5c4.3 2.6 8.7 2.9 11.6 6.6 2.9 3.7 1.6 7.9.9 12.4-.7 4.5-1.9 8.6-6.2 10.3-4.3 1.7-8.4-1.1-12.6-1.1s-8.3 2.8-12.6 1.1"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ---------------------------- Layout ---------------------------- */
export function Container({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`mx-auto w-full max-w-wrap px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Eyebrow({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "light" | "gold";
}) {
  const color =
    tone === "light"
      ? "text-bewild-blue-400"
      : tone === "gold"
        ? "text-[#C9A24B]"
        : "text-bewild-blue-600";
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-[0.68rem] font-medium uppercase tracking-[0.28em] ${color}`}
    >
      <span className="inline-block h-px w-6 bg-current opacity-60" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  tone = "dark",
  align = "left",
  className = "",
  eyebrowTone,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  tone?: "dark" | "light";
  align?: "left" | "center";
  className?: string;
  eyebrowTone?: "blue" | "light" | "gold";
}) {
  const titleColor = tone === "light" ? "text-white" : "text-bewild-ink";
  const subColor = tone === "light" ? "text-white/70" : "text-bewild-steel";
  const alignClass =
    align === "center" ? "mx-auto max-w-3xl text-center items-center" : "max-w-3xl";
  return (
    <div className={`flex flex-col gap-4 ${alignClass} ${className}`}>
      {eyebrow && (
        <Eyebrow tone={eyebrowTone ?? (tone === "light" ? "gold" : "blue")}>{eyebrow}</Eyebrow>
      )}
      <h2
        className={`font-display text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl md:text-[2.75rem] ${titleColor}`}
      >
        {title}
      </h2>
      {subtitle && <p className={`text-base leading-relaxed sm:text-lg ${subColor}`}>{subtitle}</p>}
    </div>
  );
}

/* --------------------------- Buttons --------------------------- */
type BtnProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "ghost-ink";
  className?: string;
  external?: boolean;
  ariaLabel?: string;
  onClick?: () => void;
};

export function CTAButton({
  href,
  children,
  variant = "primary",
  className = "",
  external = false,
  ariaLabel,
  onClick,
}: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-[1.7rem] py-3 text-[0.95rem] font-semibold tracking-tight transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bewild-blue-400";
  const styles: Record<string, string> = {
    primary:
      "bg-bewild-blue text-white shadow-[0_14px_34px_-14px_rgba(0,76,127,0.55)] hover:bg-[#005C99] hover:-translate-y-0.5",
    secondary:
      "border border-bewild-ink/15 bg-white text-bewild-ink hover:border-bewild-blue/40 hover:text-bewild-blue",
    ghost: "border border-white/30 text-white hover:border-white/70 hover:bg-white/5",
    "ghost-ink":
      "border border-bewild-ink/20 text-bewild-ink hover:border-bewild-blue/60 hover:text-bewild-blue",
  };
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`${base} ${styles[variant]} ${className}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

/** Pill mono "selo" — borda gold, texto gold caps. */
export function Selo({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "blue" }) {
  const cls =
    tone === "gold"
      ? "border-[rgba(201,162,75,0.45)] text-[#C9A24B]"
      : "border-bewild-blue-400/40 text-bewild-blue-400";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.28em] ${cls}`}
    >
      {children}
    </span>
  );
}

/* Mantém compat com componente legado Chip. */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-white/85 backdrop-blur">
      {children}
    </span>
  );
}

/* --------------------------- Imagem ---------------------------- */
export function LandingImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  rounded = "rounded-2xl",
  loading = "lazy",
  label,
}: {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  rounded?: string;
  loading?: "lazy" | "eager";
  label?: string;
}) {
  const [failed, setFailed] = useState(!src);
  const fileName = label ?? (src ? src.split("/").pop() : "imagem-bewild.jpg");

  if (failed) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden border border-bewild-line/70 bg-gradient-to-br from-[#eef0f3] via-[#e3e6ea] to-[#d6dae0] ${rounded} ${className}`}
        role="img"
        aria-label={alt}
      >
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(#102a4f0f 1px, transparent 1px), linear-gradient(90deg, #102a4f0f 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center gap-2 px-4 text-center">
          <ImageIcon className="h-6 w-6 text-bewild-steel/70" aria-hidden="true" />
          <span className="font-mono text-[0.7rem] uppercase tracking-wider text-bewild-steel/80">
            {fileName}
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      className={`block h-full w-full object-cover ${rounded} ${imgClassName} ${className}`}
    />
  );
}
