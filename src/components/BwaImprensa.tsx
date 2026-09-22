import { ITENS_IMPRENSA } from "@/lib/imprensa";
import "./bwa-imprensa.css";

/* ============================================================
 * BwaImprensa — faixa "Na imprensa" (prova de mídia externa).
 * Itens vêm de src/lib/imprensa.ts; sem logo de veículo
 * (não temos autorização de uso de marca).
 * ============================================================ */

export default function BwaImprensa() {
  return (
    <section className="bwa-imprensa" aria-labelledby="bwa-imprensa-title">
      <div className="bwa-shell">
        <p className="bwa-label" id="bwa-imprensa-title">
          Na imprensa
        </p>
        <ul className="bwa-imprensa-list">
          {ITENS_IMPRENSA.map((item) => (
            <li key={item.url} className="bwa-imprensa-item">
              <p className="bwa-imprensa-fonte">
                {item.veiculo} · {item.data}
              </p>
              <h2 className="bwa-imprensa-titulo">
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.titulo}
                </a>
              </h2>
              <p className="bwa-imprensa-apoio">{item.apoio}</p>
              <a
                className="bwa-imprensa-link"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.cta} <span aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
