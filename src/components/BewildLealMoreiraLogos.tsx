import "./bewild-leal-moreira-logos.css";

type BewildLealMoreiraLogosProps = {
  className?: string;
};

export default function BewildLealMoreiraLogos({ className = "" }: BewildLealMoreiraLogosProps) {
  return (
    <h3 className={`bwa-partner-logos ${className}`.trim()}>
      <span className="sr-only">Bewild e Leal Moreira</span>
      <img
        className="bwa-partner-logos-bewild"
        src="/brand/bewild-logo-branca-horizontal.png"
        alt=""
        width={525}
        height={201}
        decoding="async"
      />
      <span className="bwa-partner-logos-x" aria-hidden="true">×</span>
      <img
        className="bwa-partner-logos-leal"
        src="/brand/leal-moreira-logo-branca.png"
        alt=""
        width={320}
        height={35}
        decoding="async"
      />
    </h3>
  );
}