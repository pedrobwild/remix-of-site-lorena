#!/usr/bin/env python3
"""Gráficos dos artigos "como pagar a reforma" e "studio de 20 m²" na base do
Índice Bewild de novembro de 2026 (585 orçamentos).
Juros: tabela Price sobre o orçamento mediano (R$ 74.132), sem IOF e tarifas.

Uso: python3 scripts/graficos/pagar_e_studio20_2026_11.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import pilar_custo_2026_11 as g
from pilar_custo_2026_11 import Svg, brl, num, barras_h, AZUL, LARANJA, TINTA, CINZA, LINHA, FUNDO, MARCA
from por_bairro_2026_11 import linhas, BASE
from peso_no_imovel_2026_11 import cards, FAIXAS

CP = os.path.join(BASE, "como-pagar-reforma-apartamento-financiamento-sp")
S20 = os.path.join(BASE, "quanto-custa-reformar-studio-20-m2-sao-paulo")
MED, M2 = 74132, 2831
REGRA = (32950, 1514)


def pmt(v, i, n):
    return v * i / (1 - (1 + i) ** -n)


CONSIG = 1.2843 ** (1 / 12) - 1  # 28,43% a.a.
JUROS = [("Crédito pessoal", "6,39% a.m.", round(pmt(MED, .0639, 36) * 36 - MED)),
         ("Consignado", "2,11% a.m.", round(pmt(MED, CONSIG, 36) * 36 - MED)),
         ("Garantia imóvel 1,95%", "1,95% a.m.", round(pmt(MED, .0195, 36) * 36 - MED)),
         ("Garantia imóvel 1,33%", "1,33% a.m.", round(pmt(MED, .0133, 36) * 36 - MED)),
         ("Esperar 12 meses", "INCC 6,66%", round(MED * .0666)),
         ("Entrada + 12x sem juros", "cartão", 0)]
# faixa, orçamentos, Q1, mediana, Q3, mediana por m²
GRUPOS = [("Até 21 m²", 65, 59984, 66937, 73939, 3665), ("21 a 25 m²", 194, 63447, 69491, 76769, 2887),
          ("25 a 30 m²", 172, 65690, 73258, 83315, 2632), ("30 a 45 m²", 154, 81218, 96296, 112952, 2603)]
# metragem, orçamentos, área mediana, mediana observada
SUB = [("15 a 17 m²", 13, 17.0, 59998), ("18 e 19 m²", 27, 18.0, 69633), ("20 m²", 16, 20.0, 69300), ("21 m²", 9, 21.0, 65445)]


def cp_resumo(W):
    j = JUROS[0][2]
    s = Svg(W, "Como pagar a reforma do apartamento: os números",
            f"Orçamento mediano de R$ 74.132 em 585 orçamentos de reforma completa da Bewild; crédito pessoal a 6,39% ao mês (Banco Central, agosto de 2026); {brl(j)} de juros nesse crédito em 36 meses; 1,33% a 1,95% ao mês no crédito com garantia de imóvel da Caixa; {brl(JUROS[4][2])} de alta da obra em 12 meses de INCC; 30% de entrada e saldo em até 12 vezes sem juros no cartão na Bewild.")
    y = s.cabecalho("COMO PAGAR A REFORMA", "Como pagar a reforma do apartamento: os números",
                    "Índice Bewild de novembro de 2026 com as taxas do Banco Central, da Caixa e o INCC da FGV.")
    y = cards(s, y, [("R$ 74.132", "orçamento mediano de reforma completa, 585 orçamentos"), ("6,39% a.m.", "crédito pessoal sem garantia (BCB, ago/2026)"),
                     (f"R$ {round(j / 1000)} mil", "de juros nesse crédito em 36 parcelas"), ("1,33% a 1,95%", "ao mês com garantia de imóvel (Caixa)"),
                     (brl(JUROS[4][2]), "alta da obra mediana em 12 meses de INCC"), ("30% + 12x", "entrada e saldo no cartão sem juros (Bewild)")])
    return s.salvar("01-resumo-numeros-nov26", s.rodape(y, "Fontes: Índice Bewild; BCB; Caixa; FGV"))


def cp_juros(W):
    s = Svg(W, "Juros totais para financiar o orçamento mediano de R$ 74.132 em 36 parcelas",
            "; ".join(f"{r} ({n}): {brl(v)}" for r, n, v in JUROS) + ". Tabela Price, sem IOF, seguros e tarifas.")
    y = s.cabecalho("QUANTO CUSTA A MAIS", "Quanto custa a mais pagar uma reforma de R$ 74.132",
                    "Juros totais em 36 parcelas fixas sobre o orçamento mediano do Índice Bewild, sem IOF, seguros e tarifas.")
    y = linhas(s, y + 6, JUROS, 150000, {"Crédito pessoal"}, brl, alt=36)
    return s.salvar("02-juros-totais-36-meses-nov26", s.rodape(y + 4, "Fontes: Índice Bewild; BCB; Caixa; FGV"))


def cp_metragem(W):
    s = Svg(W, "Quanto você precisa pagar: orçamento de reforma completa por faixa de metragem",
            "; ".join(f"{f}: {brl(v)} ({n} orçamentos)" for f, n, v in FAIXAS) + ".")
    y = s.cabecalho("O VALOR A PAGAR", "Quanto você precisa pagar: orçamento por faixa de metragem",
                    "Orçamento mediano de reforma completa em cada faixa. Até 32 m², fica entre R$ 67 mil e R$ 76 mil; acima disso, sobe de patamar.")
    y = linhas(s, y + 6, [(f, f"{n} orç.", v) for f, n, v in FAIXAS], 125000, {"32 a 40 m²", "40 a 45 m²"}, brl, alt=34)
    return s.salvar("04-valor-por-metragem-nov26", s.rodape(y + 4))


def s_faixa(W):
    s = Svg(W, "Orçamento de reforma completa por faixa de metragem: mediana e metade central",
            "; ".join(f"{f}: mediana {brl(m)}, metade central de {brl(a)} a {brl(b)} ({n} orçamentos)" for f, n, a, m, b, _ in GRUPOS) + ".")
    y = s.cabecalho("ORÇAMENTO POR METRAGEM", "O studio de até 21 m² custa 9% menos que o de 25 a 30 m²",
                    "Mediana (ponto) e metade central (barra) do orçamento de reforma completa. A área é 33% menor; o valor, 9%.")
    larg = W - 64; v0, v1 = 40000, 120000
    X = lambda v: 32 + larg * (v - v0) / (v1 - v0)
    estreito = W != 600
    for i, (f, n, a, m, b, _) in enumerate(GRUPOS):
        s.t(32, y, f, 14.5, "s", TINTA, 600); s.t(W - 32, y, f"{n} orçamentos", 12, "m", CINZA, anchor="end")
        s.rect(32, y + 12, larg, 8, FUNDO, 4)
        s.rect(X(a), y + 12, X(b) - X(a), 8, LARANJA if i == 0 else AZUL, 4)
        s.circ(X(m), y + 16, 7, MARCA)
        s.t(X(m), y + 42, brl(m), 14, "s", TINTA, 700, "middle")
        s.t(32, y + (60 if estreito else 42), f"metade central: {brl(a)} a {brl(b)}" if estreito else "", 11.5, "m", CINZA)
        if not estreito:
            s.t(W - 32, y + 42, f"{brl(a)} a {brl(b)}", 11.5, "m", CINZA, anchor="end") if X(m) < W - 250 else s.t(32, y + 42, f"{brl(a)} a {brl(b)}", 11.5, "m", CINZA)
        y += 90 if estreito else 72
    return s.salvar("01-custo-por-faixa-nov26", s.rodape(y - 8))


def s_m2(W):
    s = Svg(W, "Valor por m² da reforma completa por faixa de metragem",
            "; ".join(f"{f}: {brl(p)} por m² ({n} orçamentos)" for f, n, _, _, _, p in GRUPOS) + f". Índice Bewild geral: {brl(M2)} por m².")
    y = s.cabecalho("VALOR POR M²", "O m² do studio de até 21 m² sai 39% acima do de 25 a 30 m²",
                    "Mediana do valor por m² em cada faixa. No Índice Bewild inteiro, a mediana é R$ 2.831 por m².")
    y = barras_h(s, y + 10, [(f, f"{n} orçamentos", p) for f, n, _, _, _, p in GRUPOS], 4300, 3665, lambda v: brl(v) + "/m²")
    return s.salvar("02-custo-m2-por-faixa-nov26", s.rodape(y - 14))


def s_conta(W):
    a, b = REGRA
    linhas3 = [(f, n, round(M2 * ar), round(a + b * ar), obs) for f, n, ar, obs in SUB]
    s = Svg(W, "Conta por m² contra o orçamento mediano em studios de até 21 m²",
            "; ".join(f"{f} ({n} orçamentos): conta por m² {brl(c)}, regra de bolso {brl(r)}, mediana dos orçamentos {brl(o)}" for f, n, c, r, o in linhas3) + ".")
    y = s.cabecalho("A CONTA POR M² ERRA", "Abaixo de 21 m², a conta por m² fica 10% a 37% abaixo do orçamento",
                    "Índice × área (cinza), regra de bolso de R$ 32.950 + R$ 1.514/m² (azul) e mediana dos orçamentos (laranja).")
    larg = W - 64 - 86; vmax = 80000.0
    for f, n, c, r, o in linhas3:
        s.t(32, y, f, 14.5, "s", TINTA, 600); s.t(W - 32, y, f"{n} orçamentos", 12, "m", CINZA, anchor="end")
        for k, (v, cor, rot) in enumerate(((c, "#B9C0C9", "conta por m²"), (r, AZUL, "regra de bolso"), (o, LARANJA, "orçamentos"))):
            by = y + 10 + k * 20
            w = larg * v / vmax
            s.rect(32, by, w, 14, cor, 3)
            s.t(32 + w + 8, by + 12, brl(v), 13, "s", TINTA, 700 if k == 2 else 500)
            if W == 600: s.t(40, by + 11, rot, 10.5, "m", "#FFFFFF" if k else TINTA, 700)
        y += 92
    if W != 600:
        s.t(32, y, "cinza: conta por m² · azul: regra de bolso", 11.5, "m", CINZA); s.t(32, y + 16, "laranja: mediana dos orçamentos", 11.5, "m", CINZA); y += 34
    return s.salvar("03-conta-por-m2-x-orcamento-nov26", s.rodape(y - 6))


if __name__ == "__main__":
    g.OUT = CP
    for f in (cp_resumo, cp_juros, cp_metragem):
        for W in (600, 420): print(*f(W))
    g.OUT = S20
    for f in (s_faixa, s_m2, s_conta):
        for W in (600, 420): print(*f(W))
