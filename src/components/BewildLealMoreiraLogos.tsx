import "./bewild-leal-moreira-logos.css";

type BewildLealMoreiraLogosProps = {
  className?: string;
  /** Tag do container: "h3" por padrão; "span" ou "div" quando não for um título. */
  as?: "h3" | "span" | "div";
  priority?: boolean;
};

export default function BewildLealMoreiraLogos({
  className = "",
  as: Tag = "h3",
  priority = false,
}: BewildLealMoreiraLogosProps) {
  return (
    <Tag className={`bwa-partner-logos ${className}`.trim()}>
      <span className="sr-only">Bewild e Leal Moreira</span>
      <img
        className="bwa-partner-logos-bewild"
        src="/brand/bewild-logo-branca-horizontal.webp"
        alt=""
        width={525}
        height={201}
        decoding="async"
        loading={priority ? "eager" : undefined}
        fetchPriority={priority ? "high" : undefined}
      />
      <span className="bwa-partner-logos-x" aria-hidden="true">×</span>
      <img
        className="bwa-partner-logos-leal"
        src="/brand/leal-moreira-logo-branca.png"
        alt=""
        width={320}
        height={35}
        decoding="async"
        loading={priority ? "eager" : undefined}
        fetchPriority={priority ? "high" : undefined}
      />
    </Tag>
  );
}