import bewildLogoBlue from "@/assets/bewild-logo-blue-2026.png.asset.json";
import bewildLogoWhite from "@/assets/bewild-logo-white-2026.png.asset.json";

type BewildLogoProps = {
  className?: string;
  decorative?: boolean;
  variant?: "blue" | "white";
  /**
   * `"lazy"` para logo fora da primeira tela (rodapé). Sem isso o React, ao
   * renderizar no servidor, põe um `<link rel="preload">` da imagem no topo do
   * `<head>`: a logo do rodapé disputava a banda do celular com o CSS e com a
   * imagem principal de todas as páginas (MOB-08).
   */
  loading?: "eager" | "lazy";
};

export const BEWILD_LOGO_URL = bewildLogoBlue.url;
export const BEWILD_LOGO_WHITE_URL = bewildLogoWhite.url;

export default function BewildLogo({
  className,
  decorative = false,
  variant = "blue",
  loading,
}: BewildLogoProps) {
  return (
    <img
      className={className}
      src={variant === "white" ? "/images/opt/bewild-logo-white-2026.webp" : "/images/opt/bewild-logo-blue-2026.webp"}
      alt={decorative ? "" : "Bewild"}
      width={variant === "white" ? 1435 : 1607}
      height={variant === "white" ? 458 : 502}
      loading={loading}
      decoding="async"
    />
  );
}