export type TopoVariante = "padrao" | "studio" | "arquitetura" | "custo" | "investidor" | "planta";

/** Minúsculas e sem acento, para casar "locação" e "locacao", "estúdio" e "estudio". */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Intenção pela palavra-chave do anúncio (`utm_term`, preenchido pelo sufixo
 * `{keyword}` da conta do Google Ads). A ordem é a prioridade: a primeira
 * regra que casar decide.
 *
 * Base (leads do Google de 15/09 a 30/10/2026): palavras de aluguel/Airbnb e de
 * "apartamento pequeno" trouxeram quase só investidor; "reforma de
 * apartamento", "empresa de reforma" e "reforma e decoração" trouxeram quase
 * só moradia. Por isso investidor e "comprou na planta" vêm antes de tudo.
 */
const INTENCAO_DO_TERMO: ReadonlyArray<readonly [TopoVariante, RegExp]> = [
  ["investidor", /\b(airbnb|short ?stay|temporada|alug\w*|locacao|locar|renda|rentab\w*|invest\w*)\b/],
  ["planta", /\b(na planta|apartamento novo|apto novo|ape novo|imovel novo|recem[- ]entregue\w*|contrapiso|entrega das chaves)\b/],
  ["custo", /\b(quanto custa|custo|preco|valor|orcamento|m2|metro quadrado)\b/],
  ["studio", /\b(studios?|estudios?|kitnet\w*|kitinete\w*|compactos?|pequenos?)\b/],
  ["arquitetura", /\b(arquitet\w*|projeto)\b/],
];

/** Variante pela palavra-chave; null quando o termo não diz nada. */
export function intencaoDoTermo(termo: string): TopoVariante | null {
  const t = normalizar(termo);
  if (!t.trim()) return null;
  for (const [variante, regra] of INTENCAO_DO_TERMO) if (regra.test(t)) return variante;
  return null;
}

/** Regra antiga, pelo anúncio (utm_content) e pela campanha. */
function varianteDoAnuncio(content: string, campaign: string): TopoVariante {
  if (content.endsWith("investidor") || content.startsWith("airbnb") || content.startsWith("aluguel") || content.startsWith("investidor") || campaign === "sea_investidor") return "investidor";
  if (content === "studio-ape-pequeno") return "studio";
  if (content === "arquitetura-reforma") return "arquitetura";
  if (content === "custo-orcamento") return "custo";
  return "padrao";
}

/**
 * Uma única regra para a promessa do anúncio, o topo das páginas de destino
 * (/orcamento e /reforma-de-studio-sao-paulo) e os relatórios de cliques.
 *
 * 1. Palavra-chave de investidor ou de "comprou na planta" decide.
 * 2. Senão, anúncio ou campanha de investidor decide (todo anúncio pago fala
 *    com investidor, decisão de 26/10/2026; o tema da busca não tira o ângulo).
 * 3. Senão, o tema da palavra-chave (custo, studio, arquitetura).
 * 4. Senão, a regra antiga pelo anúncio.
 */
export function topoVarianteDaBusca(search: string | Record<string, unknown>): TopoVariante {
  const first = (value: unknown): string => {
    const v = Array.isArray(value) ? value[0] : value;
    return typeof v === "string" || typeof v === "number" ? String(v) : "";
  };
  const params = typeof search === "string" ? new URLSearchParams(search) : null;
  const pick = (key: string) => (params ? params.get(key) ?? "" : first(typeof search === "object" ? search[key] : null));
  const content = pick("utm_content");
  const campaign = pick("utm_campaign");
  const doTermo = intencaoDoTermo(pick("utm_term"));
  if (doTermo === "investidor" || doTermo === "planta") return doTermo;
  const doAnuncio = varianteDoAnuncio(content, campaign);
  if (doAnuncio === "investidor") return "investidor";
  return doTermo ?? doAnuncio;
}
