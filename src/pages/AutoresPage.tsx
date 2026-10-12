import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { PEDRO_NODE, THIAGO_NODE } from "@/lib/orgJsonLd";
import "@/styles/post.css";

/**
 * /autores: os dois autores dos conteúdos. Nome, cargo, CAU e links saem dos
 * mesmos nós Person do schema (orgJsonLd.ts) — não escrever à mão.
 */
const AUTORES = [
  { node: PEDRO_NODE, cau: null as string | null, resumo: "Fundou a Bewild e responde pela operação e pelo atendimento aos investidores." },
  { node: THIAGO_NODE, cau: THIAGO_NODE.identifier, resumo: "Cofundador e arquiteto responsável técnico pelos projetos e obras da Bewild." },
];

export default function AutoresPage() {
  return (
    <div className="bw-home bw-post">
      <BwaNav />
      <main id="main" tabIndex={-1}>
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">Autores · Bewild</div>
            <h1 className="pt-title">Quem escreve na Bewild.</h1>
            <p className="pt-excerpt">
              Os conteúdos do site são escritos e revisados pelos fundadores da Bewild.
            </p>
          </div>
        </section>
        <section className="pt-body-section">
          <div className="container">
            <div className="pt-body">
              {AUTORES.map(({ node, cau, resumo }) => (
                <article key={node["@id"]} id={node["@id"].split("#")[1]}>
                  <h2>{node.name}</h2>
                  <p>
                    <strong>{node.jobTitle}</strong>
                    {cau ? ` · ${cau}` : ""}
                  </p>
                  <p>{resumo}</p>
                  <p>
                    <a href={new URL(node.url).pathname}>Ler o perfil completo</a>
                    {" · "}
                    <a href={node.sameAs[0]} target="_blank" rel="noopener noreferrer">
                      LinkedIn
                    </a>
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <BwaFooter />
    </div>
  );
}
