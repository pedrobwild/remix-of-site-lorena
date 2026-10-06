/**
 * Em que caminhos o botão "Dúvidas" (SiteAssistant) aparece.
 *
 * Fica num arquivo sem JSX porque é usado em dois lugares: pelo componente e
 * pelo RootShell (src/routes/__root.tsx), que já manda `data-bwas` no `<html>`
 * do servidor — assim a hidratação não precisa escrever nada no `<html>`
 * (cada escrita ali recalcula o estilo do documento inteiro, MOB-03).
 */
import { ASSISTANT_ENABLED, MAINTENANCE_MODE } from "@/config/site";

/** Primeiro segmento das rotas em que o botão não aparece. */
const HIDDEN_SEGMENTS = new Set(["admin", "diagnostico", "o", "p", "bakeoff", "mockups", "faq"]);
/** Rotas em que o botão some só no celular (o desktop continua igual). */
const MOBILE_HIDDEN_SEGMENTS = new Set(["orcamento"]);

export function firstSegment(path: string): string {
  return path.split("/")[1] || "";
}

export function isHiddenPath(path: string): boolean {
  return HIDDEN_SEGMENTS.has(firstSegment(path));
}

export function isMobileHiddenPath(path: string): boolean {
  return MOBILE_HIDDEN_SEGMENTS.has(firstSegment(path));
}

/** O botão aparece neste caminho? Mesma regra do componente, sem depender do navegador. */
export function assistantShowsOn(path: string): boolean {
  return ASSISTANT_ENABLED && !MAINTENANCE_MODE && !isHiddenPath(path);
}
