/**
 * primitives.tsx — blocos reutilizáveis da landing **bewild**.
 * Mantém o restante dos componentes enxutos e consistentes.
 */
import { useState, type ReactNode } from "react";
import { ImageIcon } from "lucide-react";

/* ----------------------------------------------------------------
 * Logo bewild
 * Usa a logo oficial (PNG branco) em /public/brand/bewild-logo.png.
 * 👉 Para trocar pela logo definitiva, substitua esse arquivo
 *    (ou aponte `src` abaixo). Há fallback textual "bewild".
 * -------------------------------------------------------------- */
export function BewildLogo({
  className = "",
  heightClass = "h-7",
}: {
  className?: string;
  heightClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        className={`font-display text-xl font-semibold tracking-tight text-white ${className}`}
        aria-label="bewild"
      >
        be<span className="text-bewild-blue-400">wild</span>
      </span>
    );
  }
  return (
    <img
      src="/brand/bewild-logo.png"
      alt="bewild — reformas turn-key"
      className={`${heightClass} w-auto select-none ${className}`}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

/** Mark geométrico (SVG) inspirado no nó da marca — uso decorativo/acento. */
export function BewildMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <defs>
        <linearGradient id="bw-mark" x1="6" y1="6" x2="42" y2="42">
          <stop offset="0" stopColor="#006AA8" />
          <stop offset="1" stopColor="#102A4F" />
        </linearGradient>
      </defs>
      <path
        d="M24 5c5 0 7.5 3.4 11.8 6 4.6 2.8 7.2 3.9 7.2 9.2 0 4.7-3.1 6.6-5 11.4-1.9 4.9-2.2 8.4-7.3 9.6-4.7 1.1-7-1.8-12.4-1.8s-7.7 2.9-12.4 1.8c-5.1-1.2-5.4-4.7-7.3-9.6"
        stroke="url(#bw-mark)"
        strokeWidth="4.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0"
      />
      <path
        d="M24 7.5c4.3 2.6 8.7 2.9 11.6 6.6 2.9 3.7 1.6 7.9.9 12.4-.7 4.5-1.9 8.6-6.2 10.3-4.3 1.7-8.4-1.1-12.6-1.1s-8.3 2.8-12.6 1.1"
        stroke="url(#bw-mark)"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M11.8 38c-3.3-2.6-4.6-6.4-3.9-10.9.7-4.5 3.8-7.9 6.7-11.6C17.5 11.8 19.7 7.5 24 7.5"
        stroke="url(#bw-mark)"
        strokeWidth="4"
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
  tone?: "blue" | "light";
}) {
  const color = tone === "light" ? "text-bewild-blue-400" : "text-bewild-blue-600";
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-[0.7rem] font-medium uppercase tracking-[0.22em] ${color}`}
    >
      <span className="inline-block h-px w-6 bg-current opacity-50" />
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
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  tone?: "dark" | "light";
  align?: "left" | "center";
  className?: string;
}) {
  const titleColor = tone === "light" ? "text-white" : "text-bewild-ink";
  const subColor = tone === "light" ? "text-white/70" : "text-bewild-steel";
  const alignClass =
    align === "center" ? "mx-auto max-w-3xl text-center items-center" : "max-w-3xl";
  return (
    <div className={`flex flex-col gap-4 ${alignClass} ${className}`}>
      {eyebrow && <Eyebrow tone={tone === "light" ? "light" : "blue"}>{eyebrow}</Eyebrow>}
      <h2
        className={`font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl md:text-[2.75rem] ${titleColor}`}
      >
        {title}
      </h2>
      {subtitle && <p className={`text-base leading-relaxed sm:text-lg ${subColor}`}>{subtitle}</p>}
    </div>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-white/85 backdrop-blur">
      {children}
    </span>
  );
}

/* --------------------------- Buttons --------------------------- */
type BtnProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  external?: boolean;
  ariaLabel?: string;
};

export function CTAButton({
  href,
  children,
  variant = "primary",
  className = "",
  external = false,
  ariaLabel,
}: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bewild-blue-400";
  const styles: Record<string, string> = {
    primary:
      // era: bg-bewild-gold text-bewild-ink shadow-bewild-gold
      "bg-bewild-blue text-white shadow-[0_8px_24px_rgba(0,76,127,0.22)] hover:bg-bewild-blue-600 hover:-translate-y-0.5",
    secondary:
      "border border-bewild-ink/15 bg-white text-bewild-ink hover:border-bewild-blue/50 hover:text-bewild-blue",
    ghost:
      "border border-white/25 text-white hover:border-white/60 hover:bg-white/5",
  };
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className={`${base} ${styles[variant]} ${className}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

/* --------------------------- Imagem ---------------------------- */
/**
 * LandingImage — renderiza a foto real se existir; caso contrário, mostra
 * um placeholder neutro (gradiente concreto) com o nome do arquivo esperado.
 * Garante estado vazio elegante enquanto as imagens reais do Drive não
 * forem adicionadas em /public/images/.
 */
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
        {/* Grade técnica sutil para sensação arquitetônica */}
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
