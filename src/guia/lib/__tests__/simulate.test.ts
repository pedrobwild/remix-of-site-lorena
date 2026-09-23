import { describe, expect, it } from "vitest";
import { BAIRROS, type BairroMercado } from "@/guia/data/bairros";
import {
  OBJETIVOS,
  faixaDaMetragem,
  simulate,
  textoResumoSimulacao,
  type EntradaSimulacao,
} from "@/guia/lib/simulate";

const mercado = (id: string): BairroMercado => {
  const b = BAIRROS.find((x) => x.id === id);
  if (!b) throw new Error(`bairro ${id} não existe na base`);
  return b.mercado;
};

const PINHEIROS = mercado("pinheiros"); // faixas 300 / 380 / 470
const ITAQUERA = mercado("itaquera"); // sem recorte por metragem, diária média 260

const base = (over: Partial<EntradaSimulacao> = {}): EntradaSimulacao => ({
  mercado: PINHEIROS,
  metragem: 30,
  ocupacao: 75,
  objetivo: "maximizar",
  aumentoDiaria: 0,
  ...over,
});

describe("faixaDaMetragem", () => {
  it.each([
    [15, "20–25 m²"],
    [25, "20–25 m²"],
    [25.5, "26–35 m²"],
    [35, "26–35 m²"],
    [36, "36–50 m²"],
    [80, "36–50 m²"],
  ])("%s m² → %s", (m, faixa) => {
    expect(faixaDaMetragem(m)).toBe(faixa);
  });
});

describe("simulate — diária de referência", () => {
  it("usa a média da faixa de metragem do bairro (a metragem não é mais ignorada)", () => {
    expect(simulate(base({ metragem: 22 })).diariaReferencia).toBe(300);
    expect(simulate(base({ metragem: 30 })).diariaReferencia).toBe(380);
    expect(simulate(base({ metragem: 45 })).diariaReferencia).toBe(470);
    const r = simulate(base({ metragem: 30 }));
    expect(r.origemDiaria).toBe("metragem");
    expect(r.faixaMetragem).toBe("26–35 m²");
  });

  it("limita a metragem a 15–80 m² e trata valor inválido como 30 m²", () => {
    expect(simulate(base({ metragem: 5 })).metragem).toBe(15);
    expect(simulate(base({ metragem: 500 })).metragem).toBe(80);
    expect(simulate(base({ metragem: Number.NaN })).metragem).toBe(30);
  });

  it("a diária informada substitui a de referência; vazia, zero ou negativa é ignorada", () => {
    const r = simulate(base({ diariaInformada: 420 }));
    expect(r.diariaReferencia).toBe(420);
    expect(r.origemDiaria).toBe("informada");
    expect(r.faixaMetragem).toBeNull();
    for (const invalida of [0, -10, Number.NaN, null, undefined]) {
      expect(simulate(base({ diariaInformada: invalida })).origemDiaria).toBe("metragem");
    }
  });

  it("bairro sem recorte por metragem usa a diária média do bairro", () => {
    const r = simulate(base({ mercado: ITAQUERA, metragem: 45 }));
    expect(r.origemDiaria).toBe("media");
    expect(r.diariaReferencia).toBe(260);
  });
});

describe("simulate — objetivo e ocupação", () => {
  it("'maximizar' soma +5 p.p. e a ocupação considerada é devolvida (não fica escondida)", () => {
    const r = simulate(base({ ocupacao: 75, objetivo: "maximizar" }));
    expect(r.ocupacaoEscolhida).toBe(75);
    expect(r.ocupacaoConsiderada).toBe(80);
    // 380 × 30 × 80% = 9.120
    expect(r.receitaMensal).toBe(9120);
    expect(r.receitaAnual).toBe(9120 * 12);
  });

  it("'estabilidade' reduz a diária em 10% sem mexer na ocupação", () => {
    const r = simulate(base({ objetivo: "estabilidade" }));
    expect(r.ocupacaoConsiderada).toBe(75);
    expect(r.diariaConsiderada).toBe(342);
  });

  it("'premium' tira 10 p.p. de ocupação e soma 20% na diária", () => {
    const r = simulate(base({ objetivo: "premium" }));
    expect(r.ocupacaoConsiderada).toBe(65);
    expect(r.diariaConsiderada).toBe(456);
  });

  it("a ocupação ajustada fica entre 30% e 95%", () => {
    expect(simulate(base({ ocupacao: 93, objetivo: "maximizar" })).ocupacaoConsiderada).toBe(95);
    expect(simulate(base({ ocupacao: 35, objetivo: "premium" })).ocupacaoConsiderada).toBe(30);
  });

  it("objetivo desconhecido cai no padrão em vez de quebrar", () => {
    const r = simulate(base({ objetivo: "xyz" as never }));
    expect(r.ocupacaoConsiderada).toBe(75 + OBJETIVOS.maximizar.ocupacaoPp);
  });
});

describe("simulate — ganho e payback são só o efeito da melhoria", () => {
  it.each(Object.keys(OBJETIVOS))("sem melhoria não há ganho nem payback (objetivo %s)", (objetivo) => {
    const r = simulate(base({ objetivo: objetivo as EntradaSimulacao["objetivo"], orcamentoReforma: 45000 }));
    expect(r.ganhoMensal).toBe(0);
    expect(r.receitaMensal).toBe(r.receitaMensalBase);
    expect(r.paybackMeses).toBeNull();
  });

  it("base e melhoria usam a mesma ocupação ajustada: ganho = diária considerada × aumento × noites", () => {
    const r = simulate(base({ aumentoDiaria: 20, orcamentoReforma: 45000 }));
    // 380 × 30 × 80% = 9.120 → com +20% = 10.944 → ganho 1.824
    expect(r.receitaMensalBase).toBe(9120);
    expect(r.receitaMensal).toBe(10944);
    expect(r.ganhoMensal).toBe(1824);
    expect(r.paybackMeses).toBe(Math.ceil(45000 / 1824));
  });

  it("ganho nunca é negativo e o payback ignora orçamento vazio ou inválido", () => {
    for (const aumento of [0, 10, 20, 30]) {
      for (const objetivo of Object.keys(OBJETIVOS) as EntradaSimulacao["objetivo"][]) {
        expect(simulate(base({ aumentoDiaria: aumento, objetivo })).ganhoMensal).toBeGreaterThanOrEqual(0);
      }
    }
    for (const orcamento of [0, -1, Number.NaN, null]) {
      expect(simulate(base({ aumentoDiaria: 20, orcamentoReforma: orcamento })).paybackMeses).toBeNull();
    }
  });
});

describe("textoResumoSimulacao", () => {
  const entrada = base({ aumentoDiaria: 20, orcamentoReforma: 45000 });
  const texto = textoResumoSimulacao("Pinheiros", entrada, simulate(entrada));

  it("assina com o domínio da Bewild (não o do app antigo)", () => {
    expect(texto).toContain("bewild.com.br/guia-do-investidor");
    expect(texto).not.toContain("guiadoinvestidor");
  });

  it("mostra a ocupação considerada e a origem da diária", () => {
    expect(texto).toContain('Ocupação considerada: 80% (75% escolhida + 5 p.p. do objetivo "Maximizar receita")');
    expect(texto).toContain("Diária de referência: R$ 380 (média de studios de 26–35 m² em Pinheiros)");
  });

  it("formata valores em pt-BR", () => {
    expect(texto).toContain("Receita bruta mensal: R$ 10.944");
    expect(texto).toContain("Receita bruta anual: R$ 131.328");
    expect(texto).toContain("Ganho mensal com a melhoria: R$ 1.824");
    expect(texto).toContain("Payback da reforma: ~25 meses");
  });
});
