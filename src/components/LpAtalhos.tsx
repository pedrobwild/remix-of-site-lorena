import { LP_ATALHOS } from "@/content/pages/lp-reforma-de-studio-sao-paulo";

/**
 * Atalhos da LP dos anúncios do Google para o resto do site (25/11/2026).
 *
 * `origem` vira o meio do `data-cta` (`lp-studio-<origem>-<cta>`), para o
 * relatório de botões separar a faixa do fim da página ("atalho") da
 * confirmação do envio ("pos-envio"). Na confirmação a lista é compacta: só
 * o título, sem a frase de apoio.
 *
 * O nome acessível de cada link é o próprio texto visível (WCAG 2.5.3); a
 * seta é decorativa.
 */
type Props = { origem: "atalho" | "pos-envio"; compacto?: boolean };

export default function LpAtalhos({ origem, compacto = false }: Props) {
  return (
    <ul className={compacto ? "bwa-lp-atalhos bwa-lp-atalhos-compacto" : "bwa-lp-atalhos"}>
      {LP_ATALHOS.map((atalho) => (
        <li key={atalho.cta}>
          <a href={atalho.href} data-cta={`lp-studio-${origem}-${atalho.cta}`}>
            <strong>{atalho.titulo}</strong>
            {!compacto && <span className="bwa-lp-atalho-texto">{atalho.texto}</span>}
            <span className="bwa-lp-atalho-seta" aria-hidden="true">→</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
