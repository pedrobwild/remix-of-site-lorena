import { useEffect, useRef } from "react";
import { withUtm } from "@/lib/utm";

/**
 * MobileQuoteBar — barra fixa "Solicitar orçamento" do celular nas páginas
 * comerciais internas (Serviços, Portfólio e página de projeto), igual à da
 * home (relatório mobile de 27/10/2026, prioridade 4). No celular o botão do
 * cabeçalho fica oculto e o pedido só existia no menu e nas chamadas ao longo
 * da página; agora ele acompanha a rolagem.
 *
 * Reutiliza as classes da barra da home (`.bwa-mobile-cta`, `is-hidden`),
 * que o shell (bwa-shell.css) passa a carregar porque a classe aparece neste
 * arquivo. Os tratamentos de cookies (`--cookie-banner-h`), teclado aberto
 * (`data-bwa-typing`), menu aberto (`.bwa-menu-open`) e botão "Dúvidas"
 * (`data-bwas`) continuam valendo pelo mesmo CSS. Acima de 900 px não existe.
 *
 * Regra de exibição (a mesma da home): nunca duas chamadas iguais na mesma
 * tela — a barra some enquanto um link da própria página para /orcamento está
 * visível (herói, fechamento) e do rodapé até o fim. A posição é lida na
 * rolagem (um quadro por vez), não por IntersectionObserver: um salto direto
 * (âncora, Voltar) não cruza os limites e o observer não avisaria.
 */
export default function MobileQuoteBar({ cta }: { cta: string }) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    const main = document.querySelector<HTMLElement>("main");
    const footer = document.querySelector<HTMLElement>("footer");
    let pending = false;
    let frame = 0;

    const visible = (el: Element, vh: number) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < vh && r.width > 0;
    };

    const update = () => {
      pending = false;
      const vh = window.innerHeight;
      // Links da página para o orçamento (fora do cabeçalho/menu e da própria barra).
      const ctas = main ? Array.from(main.querySelectorAll<HTMLElement>('a[href^="/orcamento"]')) : [];
      const ctaVisible = ctas.some((a) => a !== bar && visible(a, vh));
      const atEnd = !!footer && footer.getBoundingClientRect().top < vh;
      bar.classList.toggle("is-hidden", ctaVisible || atEnd);
    };
    const schedule = () => {
      if (pending) return;
      pending = true;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <a ref={ref} className="bwa-mobile-cta is-hidden" href={withUtm("/orcamento")} data-cta={cta}>
      Solicitar orçamento <span aria-hidden="true">→</span>
    </a>
  );
}
