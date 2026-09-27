import { useState } from "react";

/**
 * Domínios que apontam para o site (levantamento Semrush de 27/09/2026) e
 * arquivo de disavow pronto para o Search Console. Lista estática: a consulta
 * rápida da Semrush só devolve os principais domínios; o envio ao Google é
 * manual (não há API de disavow).
 */
type Dominio = { dominio: string; tipo: "legitimo" | "spam"; ancora: string };

const LEVANTAMENTO = { data: "27/09/2026", total: 184, backlinks: 269, ancoraSpam: 72, ancoraTiered: 16 };

const DOMINIOS: Dominio[] = [
  { dominio: "bwild.com.br", tipo: "legitimo", ancora: "Referência do Grupo Bwild" },
  ...[
    "alltopleveldomains.space",
    "allwebsitesdirectory.com",
    "australianwebdirectory.shop",
    "bestwebstats.com",
    "blogerreviewers.com",
    "cgpa2percentag.com",
    "domain.com.lc",
    "domainanalysis.org",
    "domainsc.com",
  ].map((d) => ({ dominio: d, tipo: "spam" as const, ancora: "high quality dofollow backlinks / link building" })),
];

export function gerarDisavow(dominios: Dominio[] = DOMINIOS): string {
  const linhas = [
    "# Disavow file — bewild.com.br",
    `# Gerado em ${LEVANTAMENTO.data} a partir da análise de backlinks (Semrush)`,
    "# Manter: bwild.com.br (referência legítima do grupo) — NÃO desautorizar.",
    "",
    ...dominios.filter((d) => d.tipo === "spam").map((d) => `domain:${d.dominio}`),
  ];
  return linhas.join("\n") + "\n";
}

export default function BacklinksDisavow() {
  const [copiado, setCopiado] = useState(false);
  const texto = gerarDisavow();

  const baixar = () => {
    const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "disavow-bewild.com.br.txt";
    a.click();
    URL.revokeObjectURL(url);
  };
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <div>
      <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>
        Levantamento de {LEVANTAMENTO.data}: {LEVANTAMENTO.total} domínios e {LEVANTAMENTO.backlinks} links.
        {" "}{LEVANTAMENTO.ancoraSpam} usam âncora "high quality dofollow backlinks" e {LEVANTAMENTO.ancoraTiered} usam
        "premium tiered link building" (link farm). Abaixo, os principais domínios identificados.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr><th>Domínio</th><th>Classificação</th><th>Âncora / origem</th></tr>
          </thead>
          <tbody>
            {DOMINIOS.map((d) => (
              <tr key={d.dominio}>
                <td className="mono">{d.dominio}</td>
                <td>{d.tipo === "spam" ? "Spam — desautorizar" : "Legítimo — manter"}</td>
                <td>{d.ancora}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, margin: "20px 0 8px" }}>Arquivo de disavow</h3>
      <pre className="mono" style={{ fontSize: 12, padding: 12, border: "1px solid currentColor", borderRadius: 6, opacity: 0.85, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {texto}
      </pre>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0 12px" }}>
        <button type="button" className="btn" onClick={baixar} style={{ minHeight: 44 }}>Baixar .txt</button>
        <button type="button" className="btn" onClick={copiar} style={{ minHeight: 44 }}>{copiado ? "Copiado!" : "Copiar"}</button>
        <a className="btn" href="https://search.google.com/search-console/disavow-links" target="_blank" rel="noopener noreferrer" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>
          Abrir ferramenta de disavow
        </a>
      </div>
      <p style={{ fontSize: 12, opacity: 0.7 }}>
        O Google recomenda enviar só se houver ação manual contra o site ou queda brusca de tráfego. O envio é manual,
        escolhendo a propriedade bewild.com.br. A lista cobre os principais domínios; a exportação completa exige a conta Semrush ligada.
      </p>
    </div>
  );
}
