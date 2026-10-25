/**
 * Fotos da home (blocos de projeto, depoimentos e Serviços) empacotadas pelo
 * Vite: nome com hash e cache de 1 ano. As cópias em /public/images/hero-slides/
 * saíam com `Cache-Control: private, no-store` (medido em 25/10/2026) e a
 * largura intermediária de 960 px não existia: no celular o navegador baixava
 * a de 1280 px (100 KB) para exibir uns 630 px (PageSpeed: 168 KB a economizar).
 * As de /public continuam no ar para og:image, JSON-LD e outras páginas.
 */
import StudioTijolo640 from "@/assets/home-slides/studio-tijolo-640.webp";
import StudioTijolo960 from "@/assets/home-slides/studio-tijolo-960.webp";
import StudioTijolo1280 from "@/assets/home-slides/studio-tijolo-1280.webp";
import StudioTijolo1732 from "@/assets/home-slides/studio-tijolo-1732.webp";
import Rodrigo1640 from "@/assets/home-slides/rodrigo-1-640.webp";
import Rodrigo1960 from "@/assets/home-slides/rodrigo-1-960.webp";
import Rodrigo11280 from "@/assets/home-slides/rodrigo-1-1280.webp";
import Rodrigo11732 from "@/assets/home-slides/rodrigo-1-1732.webp";
import Rodrigo8640 from "@/assets/home-slides/rodrigo-8-640.webp";
import Rodrigo8960 from "@/assets/home-slides/rodrigo-8-960.webp";
import Rodrigo81280 from "@/assets/home-slides/rodrigo-8-1280.webp";
import Rodrigo81645 from "@/assets/home-slides/rodrigo-8-1645.webp";
import Marcos104640 from "@/assets/home-slides/marcos-10-4-640.webp";
import Marcos104960 from "@/assets/home-slides/marcos-10-4-960.webp";
import Marcos1041280 from "@/assets/home-slides/marcos-10-4-1280.webp";
import Marcos1041732 from "@/assets/home-slides/marcos-10-4-1732.webp";
import Premium74640 from "@/assets/home-slides/premium-7-4-640.webp";
import Premium74960 from "@/assets/home-slides/premium-7-4-960.webp";
import Premium741280 from "@/assets/home-slides/premium-7-4-1280.webp";
import Premium741645 from "@/assets/home-slides/premium-7-4-1645.webp";
import Marcos62640 from "@/assets/home-slides/marcos-6-2-640.webp";
import Marcos62960 from "@/assets/home-slides/marcos-6-2-960.webp";
import Marcos621280 from "@/assets/home-slides/marcos-6-2-1280.webp";
import Marcos621562 from "@/assets/home-slides/marcos-6-2-1562.webp";

export type HomeSlide = { src: string; srcset: string; width: number; height: number };

const slide = (urls: readonly [string, string, string, string], width: number, height: number): HomeSlide => ({
  // `src` = 1280 px: o mesmo que o srcset escolhe para um desktop comum.
  src: urls[2],
  srcset: `${urls[0]} 640w, ${urls[1]} 960w, ${urls[2]} 1280w, ${urls[3]} ${width}w`,
  width,
  height,
});

export const HOME_SLIDES = {
  "studio-tijolo": slide([StudioTijolo640, StudioTijolo960, StudioTijolo1280, StudioTijolo1732], 1732, 1225),
  "rodrigo-1": slide([Rodrigo1640, Rodrigo1960, Rodrigo11280, Rodrigo11732], 1732, 974),
  "rodrigo-8": slide([Rodrigo8640, Rodrigo8960, Rodrigo81280, Rodrigo81645], 1645, 925),
  "marcos-10-4": slide([Marcos104640, Marcos104960, Marcos1041280, Marcos1041732], 1732, 974),
  "premium-7-4": slide([Premium74640, Premium74960, Premium741280, Premium741645], 1645, 925),
  "marcos-6-2": slide([Marcos62640, Marcos62960, Marcos621280, Marcos621562], 1562, 878),
} as const satisfies Record<string, HomeSlide>;

export type HomeSlideName = keyof typeof HOME_SLIDES;
