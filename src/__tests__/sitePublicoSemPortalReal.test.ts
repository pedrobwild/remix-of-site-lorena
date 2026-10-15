/**
 * Site público nunca leva ao portal real (incidente de 15/10/2026).
 *
 * Até 15/10/2026, depois do formulário, o /o (QR da placa de obra) mandava o
 * visitante para `bwildworkflow.com/vitrine/<obra>`, rota do portal de verdade
 * que entrava sozinha numa conta de demonstração e abria uma obra completa,
 * com dados de cliente. A home também tinha um "Ver demonstração" apontando
 * para o login do portal real.
 *
 * Regra: demonstração do portal é sempre a réplica com dados fictícios
 * (`src/components/workflow-replica`). Nenhum arquivo do site (código ou
 * `public/`) tem link para o portal real — bwildworkflow.com, o domínio
 * portal-bwild.lovable.app ou o preview do projeto do portal —, para a rota
 * `/vitrine/` nem login por URL (`/auth?email=…&password=…`). O texto
 * decorativo "bwildworkflow.com/obra/…" da moldura da réplica não é link e
 * não tem protocolo, então não conta.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = path.resolve(__dirname, "../..");
const PASTAS = ["src", "public"];
const EXTENSOES = /\.(tsx?|jsx?|mjs|html|json|txt|xml|css|md)$/;
const TESTE = /(\.test\.|\.spec\.|__tests__)/;

function arquivos(dir: string): string[] {
  const saida: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = path.join(dir, nome);
    const info = statSync(caminho);
    if (info.isDirectory()) saida.push(...arquivos(caminho));
    else if (EXTENSOES.test(nome) && !TESTE.test(caminho)) saida.push(caminho);
  }
  return saida;
}

const PROIBIDOS: Array<[string, RegExp]> = [
  ["URL do portal real", /https?:\/\/(www\.)?bwildworkflow\.com/i],
  ["domínio Lovable do portal", /portal-bwild\.lovable\.app/i],
  ["preview do projeto do portal", /c9754542-d1f4-4007-9ead-4212e17bb44e/i],
  ["rota vitrine do portal", /\/vitrine\//i],
  ["login por URL", /\/auth\?[^"'\s]*(email|password)=|[?&]password=/i],
];

describe("site público não leva ao portal real", () => {
  const todos = PASTAS.flatMap((p) => arquivos(path.join(RAIZ, p)));

  it("encontra os arquivos do site", () => {
    expect(todos.length).toBeGreaterThan(50);
  });

  it.each(PROIBIDOS)("nenhum arquivo com %s", (_nome, padrao) => {
    const achados = todos
      .filter((arquivo) => padrao.test(readFileSync(arquivo, "utf8")))
      .map((arquivo) => path.relative(RAIZ, arquivo));
    expect(achados).toEqual([]);
  });

  it("o /o abre a réplica com dados fictícios", () => {
    const pagina = readFileSync(path.join(RAIZ, "src/pages/LpObraPage.tsx"), "utf8");
    expect(pagina).toContain('import("@/components/workflow-replica/WorkflowPortalReplica")');
    expect(pagina).not.toMatch(/location\.(assign|replace)\s*\(|location\.href\s*=/);
  });
});
