import { useEffect } from "react";
import "./home-bwa.css";
import { HOME_BWA_HTML } from "./home-bwa-body";
// @ts-expect-error - JS module, no types
import { initHomeBwa } from "./home-bwa-script.js";

const TITLE = "Bewild | Projetamos e reformamos por completo";
const DESCRIPTION =
  "A Bewild projeta e reforma apartamentos por completo, reunindo arquitetura, design, engenharia, gestão, tecnologia, marcenaria e entrega em uma única responsabilidade.";
const THEME_COLOR = "#0B2342";
const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Manrope:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,500&display=swap";
const PRECONNECTS: Array<{ href: string; crossOrigin?: string }> = [
  { href: "https://fonts.googleapis.com" },
  { href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    href: "https://id-preview--6a6657bf-3700-4d35-867e-c076acbf7613.lovable.app",
    crossOrigin: "anonymous",
  },
];
const HERO_PRELOAD =
  "https://id-preview--6a6657bf-3700-4d35-867e-c076acbf7613.lovable.app/__l5e/assets-v1/86a64095-51d0-47de-b722-a8023fb5a64e/erik-03-8-1.png";

function ensureMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return el;
}

function ensureLink(rel: string, href: string, extra: Record<string, string> = {}) {
  const selectorParts = [`link[rel="${rel}"][href="${href}"]`];
  const existing = document.head.querySelector<HTMLLinkElement>(selectorParts[0]);
  if (existing) return existing;
  const el = document.createElement("link");
  el.rel = rel;
  el.href = href;
  Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
  document.head.appendChild(el);
  return el;
}

export default function HomePage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = TITLE;
    ensureMeta("description", DESCRIPTION);
    ensureMeta("theme-color", THEME_COLOR);

    PRECONNECTS.forEach((p) =>
      ensureLink("preconnect", p.href, p.crossOrigin ? { crossorigin: p.crossOrigin } : {}),
    );
    ensureLink("preload", HERO_PRELOAD, { as: "image", fetchpriority: "high" });
    ensureLink("stylesheet", FONTS_HREF);

    // Run the original init script (same logic as the source HTML).
    initHomeBwa();

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: HOME_BWA_HTML }} />;
}
