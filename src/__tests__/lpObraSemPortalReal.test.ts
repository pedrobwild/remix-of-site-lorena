/**
 * /o (QR da placa de obra) nunca leva ao portal real (15/10/2026).
 *
 * Até 15/10/2026, depois do formulário, o /o mandava o visitante para
 * `bwildworkflow.com/vitrine/<obra>`, rota do portal de verdade que entrava
 * sozinha numa conta de demonstração e abria uma obra completa, com dados de
 * cliente. O certo é a demonstração com dados fictícios
 * (`src/components/workflow-replica`), aberta na própria página.
 *
 * Regra: a página do QR não tem link, redirecionamento nem login para o
 * portal real — nada de URL do bwildworkflow, de `/vitrine/`, de `/auth?`
 * com e-mail/senha nem de `location.assign`/`location.replace`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "..");
const ler = (arquivo: string) => readFileSync(path.join(SRC, arquivo), "utf8");

describe("/o não abre o portal real", () => {
  const pagina = ler("pages/LpObraPage.tsx");
  const rota = ler("routes/o.tsx");

  it.each([
    ["URL do portal", /https?:\/\/(www\.)?bwildworkflow\.com/],
    ["rota vitrine do portal", /\/vitrine\//],
    ["login por URL", /\/auth\?/],
    ["redirecionamento", /location\.(assign|replace)\s*\(|location\.href\s*=/],
  ])("página e rota sem %s", (_nome, padrao) => {
    expect(pagina).not.toMatch(padrao);
    expect(rota).not.toMatch(padrao);
  });

  it("a demonstração é a réplica com dados fictícios", () => {
    expect(pagina).toContain('import("@/components/workflow-replica/WorkflowPortalReplica")');
  });
});
