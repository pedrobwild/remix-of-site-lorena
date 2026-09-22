import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { breadcrumbJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./como-funciona.css";

/* ============================================================
 * ComoFuncionaPage — /como-funciona
 * Apresenta o modelo Bewild em dois cartões (Arquitetura e
 * Engenharia & gestão). Texto-fonte: docs/internal/como-funciona-cartoes.md
 * (cartões removidos do bloco #certeza da home, já corrigidos).
 * ============================================================ */

type HowItem = { glyph: string; titulo: string; detalhe: string };

const ARQUITETURA: HowItem[] = [
  { glyph: "decisions", titulo: "Consultoria", detalhe: "orientação para o melhor resultado do investimento." },
  { glyph: "architecture", titulo: "Projeto 3D", detalhe: "maquete realista com revisões até a aprovação." },
  { glyph: "craft", titulo: "Personalização", detalhe: "cores, materiais e disposição guiados pelo arquiteto." },
  { glyph: "contract", titulo: "Projeto executivo", detalhe: "plantas detalhadas que eliminam improvisos." },
  { glyph: "reports", titulo: "Documentação", detalhe: "ART, CREA e liberação do condomínio." },
  { glyph: "assurance", titulo: "Acompanhamento", detalhe: "arquiteto e engenheiro juntos durante toda a obra." },
];

const ENGENHARIA: HowItem[] = [
  { glyph: "workflow", titulo: "Gestão centralizada", detalhe: "planejamento, execução e qualidade sob uma única responsabilidade." },
  { glyph: "delivery", titulo: "Logística integrada", detalhe: "materiais, fornecedores e entregas coordenados." },
  { glyph: "deadline", titulo: "Engenheiro dedicado", detalhe: "vistorias e gestão ativa de cronograma." },
  { glyph: "suppliers", titulo: "Sem terceirização", detalhe: "equipe própria de marcenaria, empreita, vidraçaria, elétrica e ar-condicionado." },
];

function HowCard({
  badge,
  titulo,
  sub,
  itens,
}: {
  badge: string;
  titulo: string;
  sub: string;
  itens: HowItem[];
}) {
  return (
    <article className="bwa-how-card">
      <header className="bwa-how-card-head">
        <span className="bwa-how-card-badge" aria-hidden="true">
          <svg>
            <use href={`#bwa-glyph-${badge}`} />
          </svg>
        </span>
        <div>
          <h2 className="bwa-how-card-title">{titulo}</h2>
          <p className="bwa-how-card-sub">{sub}</p>
        </div>
      </header>
      <ul className="bwa-how-card-list">
        {itens.map((item) => (
          <li key={item.titulo}>
            <svg className="bwa-how-card-ico" aria-hidden="true">
              <use href={`#bwa-glyph-${item.glyph}`} />
            </svg>
            <p>
              <strong>{item.titulo}:</strong> {item.detalhe}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function ComoFuncionaPage() {
  const { settings } = useSiteSettings();

  useSeo({
    title: "Como funciona a reforma completa de apartamento em SP | Bewild",
    description:
      "Arquitetura e engenharia sob um único contrato: projeto 3D, documentação, obra com equipe própria e entrega do apartamento pronto em São Paulo.",
    canonicalPath: "/como-funciona",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Como funciona", path: "/como-funciona" },
          ]),
        ]
      : undefined,
  });

  return (
    <div className="bwa-how-page">
      {/* Biblioteca de glifos .bwa (os símbolos moram na home; aqui vão inline) */}
      <svg className="bwa-svg-library" aria-hidden="true" focusable="false">
        <defs>
          <symbol id="bwa-glyph-architecture" viewBox="0 0 64 64">
            <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" vectorEffect="non-scaling-stroke">
              <path d="M8 55V10h29v15h19v30H8Z" /><path d="M37 10v15M25 55V40H8M44 25v17h12" />
              <path d="M15 29c7-11 16-11 23 0s13 11 18 3" />
            </g>
            <circle cx="15" cy="29" r="2.2" fill="currentColor" />
          </symbol>
          <symbol id="bwa-glyph-contract" viewBox="0 0 64 64">
            <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" vectorEffect="non-scaling-stroke">
              <path d="M16 7h23l9 9v41H16Z" /><path d="M39 7v11h9M23 28h18M23 36h14" /><path d="M23 47h10l4 4 9-12" />
            </g>
            <circle cx="23" cy="28" r="1.9" fill="currentColor" />
          </symbol>
          <symbol id="bwa-glyph-deadline" viewBox="0 0 64 64">
            <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" vectorEffect="non-scaling-stroke">
              <path d="M17 49a22 22 0 1 1 9 5" /><path d="M32 16v17l11 7M9 47h13v10" />
            </g>
            <circle cx="32" cy="33" r="2.2" fill="currentColor" />
          </symbol>
          <symbol id="bwa-glyph-craft" viewBox="0 0 64 64">
            <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" vectorEffect="non-scaling-stroke">
              <path d="M9 17h29v16H9ZM26 33h29v16H26Z" /><path d="M38 17v16M26 40h12M46 33v16M14 55h36" />
            </g>
            <rect x="14" y="22" width="4" height="4" fill="currentColor" />
          </symbol>
          <symbol id="bwa-glyph-delivery" viewBox="0 0 64 64">
            <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" vectorEffect="non-scaling-stroke">
              <path d="M10 57V11h22v46M32 11h22v46M18 45h19" /><circle cx="45" cy="35" r="6" /><path d="M39 35H24v8h5v5h5" />
            </g>
            <circle cx="45" cy="35" r="2" fill="currentColor" />
          </symbol>
          <symbol id="bwa-glyph-workflow" viewBox="0 0 64 64">
            <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" vectorEffect="non-scaling-stroke">
              <rect x="15" y="6" width="34" height="52" /><path d="M22 19h14M22 25h9M22 46c7 0 7-12 14-12s7-13 13-13" /><path d="M22 52h20" />
            </g>
            <circle cx="22" cy="46" r="2.1" fill="currentColor" /><circle cx="36" cy="34" r="2.1" fill="currentColor" /><circle cx="49" cy="21" r="2.1" fill="currentColor" />
          </symbol>
          <symbol id="bwa-glyph-assurance" viewBox="0 0 64 64">
            <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" vectorEffect="non-scaling-stroke">
              <path d="M32 7 51 15v16c0 12-7 21-19 27C20 52 13 43 13 31V15Z" /><path d="m22 32 7 7 14-17" />
            </g>
            <circle cx="32" cy="7" r="2.1" fill="currentColor" />
          </symbol>
          <symbol id="bwa-glyph-decisions" viewBox="0 0 64 64">
            <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" vectorEffect="non-scaling-stroke">
              <circle cx="12" cy="18" r="4" /><circle cx="12" cy="46" r="4" />
              <path d="M16 18h12c9 0 8 14 17 14h7M16 46h12c9 0 8-14 17-14" /><path d="m46 32 4 4 7-9" />
            </g>
            <circle cx="45" cy="32" r="2.2" fill="currentColor" />
          </symbol>
          <symbol id="bwa-glyph-suppliers" viewBox="0 0 64 64">
            <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" vectorEffect="non-scaling-stroke">
              <path d="m8 19 24-10 24 10-24 10Z" /><path d="m8 31 24 10 24-10M8 43l24 10 24-10" /><path d="M8 19v24M56 19v24" />
            </g>
            <circle cx="32" cy="29" r="2.2" fill="currentColor" />
          </symbol>
          <symbol id="bwa-glyph-reports" viewBox="0 0 64 64">
            <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" vectorEffect="non-scaling-stroke">
              <path d="M14 9h28l8 8v38H14Z" /><path d="M42 9v10h8M22 29h20M22 37h20M22 45h13" />
            </g>
            <rect x="22" y="21" width="7" height="3" fill="currentColor" />
          </symbol>
        </defs>
      </svg>

      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-how-intro">
          <div className="bwa-shell bwa-how-intro-grid">
            <div>
              <p className="bwa-label">Como funciona · Modelo Bewild</p>
              <h1>A Bewild assume o processo inteiro. Você recebe o apartamento pronto.</h1>
            </div>
            <p className="bwa-how-lead">
              Arquitetura, engenharia, marcenaria e mobiliário sob um único contrato,
              com preço e prazo fechados. É isso que entra em cada frente:
            </p>
          </div>
        </section>

        <section className="bwa-how-cards" aria-label="O que a Bewild entrega">
          <div className="bwa-shell bwa-how-grid">
            <HowCard
              badge="architecture"
              titulo="Arquitetura"
              sub="Do conceito à documentação."
              itens={ARQUITETURA}
            />
            <HowCard
              badge="workflow"
              titulo="Engenharia & gestão"
              sub="Engenharia que entrega no prazo, no orçamento e no padrão."
              itens={ENGENHARIA}
            />
          </div>
        </section>

        <section className="bwa-how-cta">
          <div className="bwa-shell bwa-how-cta-grid">
            <h2>Um contrato, uma responsabilidade, um apartamento pronto.</h2>
            <a className="bwa-button" href="/diagnostico">
              Solicitar Orçamento
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
