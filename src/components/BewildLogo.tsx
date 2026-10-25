import bewildLogoBlue from "@/assets/bewild-logo-blue-2026.png.asset.json";
import bewildLogoWhite from "@/assets/bewild-logo-white-2026.png.asset.json";
// Versões pequenas, empacotadas: nome com hash = cache de 1 ano no navegador.
import blue240 from "@/assets/bewild-logo-blue-240.webp";
import blue480 from "@/assets/bewild-logo-blue-480.webp";
import white240 from "@/assets/bewild-logo-white-240.webp";
import white480 from "@/assets/bewild-logo-white-480.webp";

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
      src={variant === "white" ? white240 : blue240}
      srcSet={variant === "white" ? `${white240} 240w, ${white480} 480w` : `${blue240} 240w, ${blue480} 480w`}
      sizes="118px"
      alt={decorative ? "" : "Bewild"}
      width={variant === "white" ? 640 : 640}
      height={variant === "white" ? 204 : 200}
      loading={loading}
      decoding="async"
    />
  );
}