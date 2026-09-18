import bewildLogo from "@/assets/bewild-logo.png.asset.json";

type BewildLogoProps = {
  className?: string;
  decorative?: boolean;
};

export const BEWILD_LOGO_URL = bewildLogo.url;

export default function BewildLogo({ className, decorative = false }: BewildLogoProps) {
  return (
    <img
      className={className}
      src={BEWILD_LOGO_URL}
      alt={decorative ? "" : "Bewild"}
      width={2000}
      height={600}
      decoding="async"
    />
  );
}