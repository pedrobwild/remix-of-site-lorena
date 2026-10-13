import type { ReactNode } from "react";
import { NEW_TAB_SUFFIX, RADAR_LINK_ATTRS, RADAR_URL } from "@/config/site";

/** Link para o Radar Bewild: nova aba, aviso acessível e seta externa. */
export function RadarLink({ label, className, children }: { label: string; className?: string; children?: ReactNode }) {
  return (
    <a href={RADAR_URL} {...RADAR_LINK_ATTRS} className={className} aria-label={`${label}${NEW_TAB_SUFFIX}`}>
      {children ?? label}
      <span aria-hidden="true" style={{ fontSize: "0.8em", marginLeft: "0.25em" }}>↗</span>
    </a>
  );
}
