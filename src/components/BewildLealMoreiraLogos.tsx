import bewildLogo from "@/assets/bewild-logo-white.png.asset.json";
import lealMoreiraLogo from "@/assets/leal-moreira-logo.png.asset.json";
import "./bewild-leal-moreira-logos.css";

type BewildLealMoreiraLogosProps = {
  className?: string;
};

export default function BewildLealMoreiraLogos({ className = "" }: BewildLealMoreiraLogosProps) {
  return (
    <h3 className={`bwa-partner-logos ${className}`.trim()}>
      <span className="sr-only">Bewild e Leal Moreira</span>
      <img src={bewildLogo.url} alt="" width={2000} height={600} decoding="async" />
      <span className="bwa-partner-logos-x" aria-hidden="true">×</span>
      <img src={lealMoreiraLogo.url} alt="" width={316} height={67} decoding="async" />
    </h3>
  );
}