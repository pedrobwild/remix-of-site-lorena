/**
 * Página /escopo: monta o resumo do escopo e a faixa de investimento.
 *
 * Preço: só existe faixa para a reforma COMPLETA (projeto, obra, marcenaria,
 * mobiliário e eletrodomésticos), a mesma base e os mesmos valores por m² da
 * calculadora do artigo (`CUSTO_M2`, em reformaCalc.ts). A base da Bewild não
 * tem preço por item: com escopo parcial não publicamos faixa, o orçamento calcula.
 * Função pura, sem React.
 */
import { CUSTO_M2, LIMITES } from "@/lib/reformaCalc";

export type ItemEscopoId = "projeto" | "obra" | "marcenaria" | "mobiliario" | "eletro";

/** Itens que a faixa por m² cobre. A ordem é a da jornada: projeto → obra → entrega. */
export const ITENS_ESCOPO: ReadonlyArray<{ id: ItemEscopoId; nome: string; detalhe: string }> = [
  { id: "projeto", nome: "Projeto 3D e executivo", detalhe: "Maquete aprovada por você e plantas com cada material e acabamento." },
  { id: "obra", nome: "Obra completa", detalhe: "Elétrica, hidráulica, revestimentos, pintura e a documentação do condomínio (ART e plano da NBR 16280)." },
  { id: "marcenaria", nome: "Marcenaria sob medida", detalhe: "Feita pela marcenaria da Bewild, a partir do projeto executivo." },
  { id: "mobiliario", nome: "Mobiliário", detalhe: "Móveis soltos e decoração definidos no projeto." },
  { id: "eletro", nome: "Eletrodomésticos", detalhe: "Os que o projeto prevê, comprados e instalados pela Bewild." },
];

export const IDS_ITENS: ReadonlyArray<ItemEscopoId> = ITENS_ESCOPO.map((i) => i.id);

export type EscopoInput = {
  areaM2: number;
  itens: ReadonlyArray<ItemEscopoId>;
};

export type EscopoResult = {
  /** Itens escolhidos, na ordem da jornada. */
  itens: ItemEscopoId[];
  /** true quando todos os itens que a faixa cobre foram escolhidos. */
  completo: boolean;
  /** null quando o escopo é parcial: não há preço publicado por item. */
  faixa: { baixo: number; mediano: number; alto: number } | null;
  porM2: { baixo: number; mediano: number; alto: number };
};

export function areaValida(areaM2: number): boolean {
  return Number.isFinite(areaM2) && areaM2 >= LIMITES.areaMin && areaM2 <= LIMITES.areaMax;
}

export function montarEscopo(input: EscopoInput): EscopoResult {
  const escolhidos = IDS_ITENS.filter((id) => input.itens.includes(id));
  const completo = escolhidos.length === IDS_ITENS.length;
  return {
    itens: escolhidos,
    completo,
    faixa: completo
      ? {
          baixo: CUSTO_M2.baixo * input.areaM2,
          mediano: CUSTO_M2.mediano * input.areaM2,
          alto: CUSTO_M2.alto * input.areaM2,
        }
      : null,
    porM2: { ...CUSTO_M2 },
  };
}

/** Lê itens vindos da URL; ignora o que não está na lista. */
export function parseItens(valor: string | null | undefined): ItemEscopoId[] {
  if (!valor) return [];
  const pedidos = valor.split(",").map((s) => s.trim());
  return IDS_ITENS.filter((id) => pedidos.includes(id));
}

export type EscopoParams = {
  area?: number;
  estado?: string;
  objetivo?: string;
  itens: ItemEscopoId[];
};

/** Monta a query de /orcamento com o escopo escolhido. */
export function escopoParaQuery(p: { areaM2: number; estado?: string; objetivo?: string; itens: ReadonlyArray<ItemEscopoId> }): string {
  const q = new URLSearchParams();
  q.set("area", String(Math.round(p.areaM2)));
  if (p.estado) q.set("estado", p.estado);
  if (p.objetivo) q.set("objetivo", p.objetivo);
  q.set("itens", p.itens.join(","));
  return q.toString();
}

/** Lê a query enviada por /escopo; o que vier fora do esperado é ignorado. */
export function lerEscopoDaQuery(
  search: string,
  validos: { estados: ReadonlyArray<string>; objetivos: ReadonlyArray<string> },
): EscopoParams {
  const q = new URLSearchParams(search);
  const area = Number(q.get("area"));
  const estado = q.get("estado") ?? "";
  const objetivo = q.get("objetivo") ?? "";
  return {
    area: Number.isFinite(area) && area > 0 ? area : undefined,
    estado: validos.estados.includes(estado) ? estado : undefined,
    objetivo: validos.objetivos.includes(objetivo) ? objetivo : undefined,
    itens: parseItens(q.get("itens")),
  };
}

export function rotuloItens(itens: ReadonlyArray<ItemEscopoId>): string {
  return ITENS_ESCOPO.filter((i) => itens.includes(i.id)).map((i) => i.nome).join(", ");
}
