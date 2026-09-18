import { useState, useEffect } from "react";
import BewildLogo from "@/components/BewildLogo";
import "@/styles/bwa-nav-shared.css";

const OPEN_CLASS = "bwa-menu-open"; // classe que o script da home aplica no body para abrir o mobile menu

export default function BewildSiteNav(_props: Record<string, unknown>) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return () => {
      document.body.classList.remove("bwa-menu-open");
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("bwa-menu-open", open);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <a className="bwa-skip" href="#conteudo">Pular para o conteúdo</a>
      <header className="bwa-nav">
        <div className="bwa-shell bwa-nav-inner">
          <a className="bwa-wordmark" href="/" aria-label="Bewild, início">
            <BewildLogo decorative />
          </a>
          <nav className="bwa-nav-links" aria-label="Navegação principal">
            <a href="/#certeza">O contrato</a>
            <a href="/#historia">A história</a>
            <a href="/#projetos">Projetos</a>
            <a href="/#workflow">Bwild Workflow</a>
            <a href="/#prova">Prova</a>
            <a href="/portfolio">Portfólio</a>
            <a href="/conteudos">Conteúdos</a>
            <a href="/faq">FAQ</a>
            <a href="/contato">Contato</a>
          </nav>
          <a className="bwa-button" href="/diagnostico">
            Solicitar Orçamento
            <span aria-hidden="true">→</span>
          </a>
          <button
            className="bwa-menu-button"
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span></span>
          </button>
        </div>
      </header>
      <div className={"bwa-mobile-menu" + (open ? " " + OPEN_CLASS : "")}>
        <nav aria-label="Navegação mobile" onClick={close}>
          <a href="/#certeza">O contrato</a>
          <a href="/#historia">A história</a>
          <a href="/#projetos">Projetos</a>
          <a href="/#workflow">Bwild Workflow</a>
          <a href="/#prova">Prova</a>
          <a href="/portfolio">Portfólio</a>
          <a href="/conteudos">Conteúdos</a>
          <a href="/faq">FAQ</a>
          <a href="/contato">Contato</a>
          <a href="/diagnostico">Solicitar Orçamento</a>
        </nav>
      </div>
    </>
  );
}
