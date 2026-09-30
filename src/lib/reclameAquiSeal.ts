/**
 * Selo "RA Verificada" do Reclame Aqui no rodapé.
 *
 * O script do selo (s3.amazonaws.com) traz a própria folha de estilo, que
 * pede Open Sans e Inter Tight ao Google Fonts. Carregado na montagem, isso
 * punha mais duas famílias e três domínios no carregamento inicial de toda
 * página, disputando banda com o hero. Agora o script só é pedido quando o
 * rodapé chega perto da tela (400 px antes); sem IntersectionObserver,
 * carrega depois do `load`.
 *
 * Devolve a limpeza (desliga o observador se a página sair antes).
 */
export const RA_SEAL_SRC = "https://s3.amazonaws.com/raichu-beta/ra-verified/bundle.js";
const RA_SEAL_ID = "SEpqak1Mcm9aM09nMm0wbDpid2lsZC1yZWZvcm1hcw==";

function appendSealScript(holder: HTMLElement): void {
  if (holder.querySelector("script")) return;
  const s = document.createElement("script");
  s.type = "text/javascript";
  s.id = "ra-embed-verified-seal";
  s.src = RA_SEAL_SRC;
  s.async = true;
  s.setAttribute("data-id", RA_SEAL_ID);
  s.setAttribute("data-target", "ra-verified-seal");
  s.setAttribute("data-model", "horizontal_1");
  holder.appendChild(s);
}

export function mountReclameAquiSealWhenVisible(holder: HTMLElement | null): () => void {
  if (!holder || holder.querySelector("script")) return () => {};

  if (typeof IntersectionObserver === "undefined") {
    const onLoad = () => appendSealScript(holder);
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }

  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        appendSealScript(holder);
      }
    },
    { rootMargin: "400px 0px" },
  );
  io.observe(holder);
  return () => io.disconnect();
}
