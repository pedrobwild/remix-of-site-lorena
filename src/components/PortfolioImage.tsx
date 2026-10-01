import { useState, type ImgHTMLAttributes } from "react";
import { optimizedImageUrl, optimizedSrcSet, THUMB_WIDTHS } from "@/lib/imageUrl";

export const DETAIL_IMAGE_WIDTHS = [480, 768, 1024, 1440, 1920] as const;

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "onError"> & {
  src: string;
  alt: string;
  imageWidth?: number;
  quality?: number;
  widths?: readonly number[];
};

/** Derivadas responsivas, com retorno ao original se o Storage não transformar. */
export default function PortfolioImage({
  src,
  alt,
  imageWidth = 960,
  quality = 70,
  widths = THUMB_WIDTHS,
  decoding = "async",
  ...props
}: Props) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const failed = failedSource === src;
  const optimized = optimizedImageUrl(src, imageWidth, quality);
  return (
    <img
      {...props}
      src={failed ? src : optimized}
      srcSet={failed ? undefined : optimizedSrcSet(src, widths, quality)}
      alt={alt}
      decoding={decoding}
      onError={!failed && optimized !== src ? () => setFailedSource(src) : undefined}
    />
  );
}
