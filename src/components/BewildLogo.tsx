import bewildLogoBlue from "@/assets/bewild-logo-blue-2026.png.asset.json";
import bewildLogoWhite from "@/assets/bewild-logo-white-2026.png.asset.json";

type BewildLogoProps = {
  className?: string;
  decorative?: boolean;
  variant?: "blue" | "white";
};

export const BEWILD_LOGO_URL = bewildLogoBlue.url;
export const BEWILD_LOGO_WHITE_URL = bewildLogoWhite.url;

export default function BewildLogo({
  className,
  decorative = false,
  variant = "blue",
}: BewildLogoProps) {
  return (
    <img
      className={className}
      src={variant === "white" ? BEWILD_LOGO_WHITE_URL : BEWILD_LOGO_URL}
      alt={decorative ? "" : "Bewild"}
      width={variant === "white" ? 1435 : 1607}
      height={variant === "white" ? 458 : 502}
      decoding="async"
    />
  );
}