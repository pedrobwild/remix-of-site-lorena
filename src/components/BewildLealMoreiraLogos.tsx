import "./bewild-leal-moreira-logos.css";

type BewildLealMoreiraLogosProps = {
  className?: string;
};

export default function BewildLealMoreiraLogos({ className = "" }: BewildLealMoreiraLogosProps) {
  return (
    <h3 className={`bwa-partner-logos ${className}`.trim()}>
      <span className="sr-only">Bewild e Leal Moreira</span>
      <span className="bwa-partner-logos-bewild" aria-hidden="true">
        <img src="/brand/bewild-logo-branca.png" alt="" width={1080} height={1350} decoding="async" />
      </span>
      <span className="bwa-partner-logos-x" aria-hidden="true">×</span>
      <img
        className="bwa-partner-logos-leal"
        src="/brand/leal-moreira-logo.png"
        alt=""
        width={320}
        height={35}
        decoding="async"
      />
    </h3>
  );
}