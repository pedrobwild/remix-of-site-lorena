#!/usr/bin/env python3
"""Gráficos dos artigos "reforma para morar", "parcial ou completa" e "antes ou
depois das chaves" na base do Índice Bewild de novembro de 2026 (585 orçamentos).
As faixas fecham no limite superior (21 a 25 m² inclui 25,00).

Uso: python3 scripts/graficos/lote_final_2026_11.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import pilar_custo_2026_11 as g
from pilar_custo_2026_11 import Svg, brl, num, barras_h, PONTOS, AZUL, LARANJA, TINTA, CINZA, LINHA, FUNDO, MARCA
from por_bairro_2026_11 import linhas, BASE

MORAR = os.path.join(BASE, "reforma-de-apartamento-para-morar-sao-paulo")
PARCIAL = os.path.join(BASE, "reforma-parcial-ou-completa-de-apartamento-sao-paulo")
CHAVES = os.path.join(BASE, "reforma-de-apartamento-antes-ou-depois-das-chaves")
MED, M2 = 74132, 2831
REGRA = (32950, 1514)
# faixa, orçamentos, Q1, mediana, Q3, mediana por m²
G5 = [("Até 21 m²", 65, 59984, 66937, 73939, 3665), ("21 a 25 m²", 194, 63447, 69491, 76769, 2887),
      ("25 a 30 m²", 172, 65690, 73258, 83315, 2632), ("30 a 35 m²", 72, 78984, 89402, 104144, 2681),
      ("35 a 45 m²", 82, 89046, 101021, 118329, 2557)]
G4 = [("Até 25 m²", 259, 62466, 69347, 76049, 3000)] + G5[2:]
MERCADO = [(40, 47500, 85000), (50, 62500, 135000), (60, 75000, 170000), (70, 87500, 205000), (80, 100000, 240000)]
ESPERA = [("Aluguel que não entra, 26 m²", "R$ 65,78 a 91,14/m²", 1710, 2370), ("Reajuste da obra pelo INCC-M", "6,60% em 12 meses", 408, None),
          ("Reajuste da obra pelo IPCA", "4,58% em 12 meses", 283, None)]


def intervalos(W, nome, rotulo, titulo, sub, grupos, v0=40000, v1=125000, destaque=()):
    s = Svg(W, titulo, "; ".join(f"{f}: mediana {brl(m)}, metade central de {brl(a)} a {brl(b)} ({n} orçamentos)" for f, n, a, m, b, _ in grupos) + ".")
    y = s.cabecalho(rotulo, titulo, sub)
    larg = W - 64
    X = lambda v: 32 + larg * (min(v, v1) - v0) / (v1 - v0)
    estreito = W != 600
    for f, n, a, m, b, _ in grupos:
        s.t(32, y, f, 14.5, "s", TINTA, 600); s.t(W - 32, y, f"{n} orçamentos", 12, "m", CINZA, anchor="end")
        s.rect(32, y + 12, larg, 8, FUNDO, 4)
        s.rect(X(a), y + 12, X(b) - X(a), 8, LARANJA if f in destaque else AZUL, 4)
        s.circ(X(m), y + 16, 7, MARCA)
        s.t(X(m), y + 42, brl(m), 14, "s", TINTA, 700, "middle")
        if estreito:
            s.t(32, y + 60, f"metade central: {brl(a)} a {brl(b)}", 11.5, "m", CINZA)
        elif X(m) < W - 250:
            s.t(W - 32, y + 42, f"{brl(a)} a {brl(b)}", 11.5, "m", CINZA, anchor="end")
        else:
            s.t(32, y + 42, f"{brl(a)} a {brl(b)}", 11.5, "m", CINZA)
        y += 90 if estreito else 72
    return s.salvar(nome, s.rodape(y - 8))


def m2_faixa(W, nome, grupos, titulo, sub):
    s = Svg(W, "Valor por m² da reforma completa por faixa de metragem",
            "; ".join(f"{f}: {brl(p)} por m² ({n} orçamentos)" for f, n, _, _, _, p in grupos) + f". Índice Bewild geral: {brl(M2)} por m².")
    y = s.cabecalho("VALOR POR M²", titulo, sub)
    y = barras_h(s, y + 10, [(f, f"{n} orçamentos", p) for f, n, _, _, _, p in grupos], 4300, grupos[0][5], lambda v: brl(v) + "/m²")
    return s.salvar(nome, s.rodape(y - 14))


def dispersao(W, nome):
    pts = [tuple(float(a) for a in p.split(",")) for p in PONTOS.split(";")]
    a, b = REGRA
    s = Svg(W, "Valor do orçamento por metragem com a regra de bolso do Índice Bewild",
            f"Gráfico de dispersão de {len(pts)} orçamentos de 15 a 45 m². Entre 21 e 35 m², a regra de bolso é R$ 32.950 mais R$ 1.514 por m².")
    y = s.cabecalho("ÁREA × VALOR", "Uma parte do orçamento não depende da metragem",
                    "Cada ponto é um orçamento. A reta é a regra de bolso do Índice: R$ 32.950 fixos mais R$ 1.514 por m², de 21 a 35 m².")
    h = 340; x0 = 82; x1 = W - 32; ymaxv = 200.0
    X = lambda m: x0 + (m - 14) / (46 - 14) * (x1 - x0)
    Y = lambda v: y + h - (min(v, ymaxv) - 40) / (ymaxv - 40) * h
    for v in (50, 75, 100, 125, 150, 175, 200):
        s.line(x0, Y(v), x1, Y(v)); s.t(x0 - 8, Y(v) + 4, f"{v} mil" + ("+" if v == 200 else ""), 12, "m", CINZA, anchor="end")
    for m in (15, 20, 25, 30, 35, 40, 45):
        s.t(X(m), y + h + 18, f"{m} m²" if W == 600 or m % 10 == 5 else str(m), 12, "m", CINZA, anchor="middle")
    for m, v in pts:
        s.circ(X(m), Y(v / 10), 2.6, AZUL, 0.38)
    s.o.append(f'<line x1="{X(21):.1f}" y1="{Y((a + b * 21) / 1000):.1f}" x2="{X(35):.1f}" y2="{Y((a + b * 35) / 1000):.1f}" stroke="{LARANJA}" stroke-width="3" stroke-linecap="round"/>')
    s.t(x0, y + h + 40, "Valores acima de R$ 200 mil aparecem na linha de cima.", 12.5, "s", CINZA)
    return s.salvar(nome, s.rodape(y + h + 60))


def simples_x_completa(W):
    s = Svg(W, "Reforma simples e reforma completa por metragem em São Paulo",
            "Faixa de mercado da Lar Pontual (custo de São Paulo em outubro de 2026) para 40, 50, 60, 70 e 80 m²: simples R$ 47.500, 62.500, 75.000, 87.500 e 100.000; completa sem mobília R$ 85.000, 135.000, 170.000, 205.000 e 240.000. Orçamentos Bewild de reforma completa com mobília: mediana de R$ 89.402 em 30 a 35 m² (72 orçamentos) e R$ 101.021 em 35 a 45 m² (82). O Índice Bewild vai até 45 m².")
    y = s.cabecalho("SIMPLES × COMPLETA", "Simples ou completa: a diferença cresce com a metragem",
                    "Total por metragem na tabela de mercado (Lar Pontual) e mediana dos orçamentos Bewild, que vão até 45 m².")
    h = 300; x0 = 78; x1 = W - 32; vmax = 260.0
    X = lambda m: x0 + (m - 28) / (82 - 28) * (x1 - x0)
    Y = lambda v: y + h - v / vmax * h
    for v in (0, 65, 130, 195, 260):
        s.line(x0, Y(v), x1, Y(v)); s.t(x0 - 8, Y(v) + 4, f"{v} mil", 12, "m", CINZA, anchor="end")
    for m in (30, 40, 50, 60, 70, 80):
        s.t(X(m), y + h + 18, f"{m} m²" if W == 600 or m % 20 == 0 else str(m), 12, "m", CINZA, anchor="middle")
    for k, cor in ((1, "#8B95A1"), (2, TINTA)):
        pts = " ".join(f"{X(m):.1f},{Y(r[k] / 1000):.1f}" for m, *r0 in MERCADO for r in [(m, *r0)])
        s.o.append(f'<polyline points="{pts}" fill="none" stroke="{cor}" stroke-width="2.5"/>')
        for m, sp, cp in MERCADO: s.circ(X(m), Y((sp if k == 1 else cp) / 1000), 3.5, cor)
    for m, v in ((33, 89402), (38.5, 101021)):
        s.circ(X(m), Y(v / 1000), 7, LARANJA)
    s.t(X(80), Y(240) - 10, "Completa, mercado: 240", 12, "s", TINTA, 700, "end")
    s.t(X(80), Y(100) - 12, "Simples, mercado: 100", 12, "s", "#5A6472", 700, "end")
    s.t(x0 + 6, Y(152), "Bewild com mobília", 12, "s", LARANJA, 700)
    s.t(x0 + 6, Y(152) + 15, "R$ 89 e 101 mil", 12, "s", LARANJA, 700)
    y2 = y + h + 40
    s.t(32, y2, "Pontos laranja: mediana dos orçamentos de 30 a 35 m² e de 35 a 45 m²." if W == 600 else "Laranja: medianas Bewild, 30–35 e 35–45 m².", 12.5, "s", CINZA)
    return s.salvar("03-simples-x-completa-por-metragem-nov26", s.rodape(y2 + 18, "Fontes: Lar Pontual (out/2026); Índice Bewild"))


def parte_fixa(W):
    a, b = REGRA
    it = [(f"{m} m²", brl(a + b * m), round(a / (a + b * m) * 100, 1)) for m in (20, 25, 30, 35, 40, 45)]
    s = Svg(W, "Parte do orçamento que não depende da metragem, pela regra de bolso do Índice Bewild",
            "; ".join(f"{r}: {num(v)}% de {n}" for r, n, v in it) + ". Regra ajustada de 21 a 35 m²; fora dessa faixa é extrapolação.")
    y = s.cabecalho("O CUSTO QUE NÃO ENCOLHE", "A parte fixa pesa metade do orçamento em 20 m² e um terço em 45 m²",
                    "Parcela de R$ 32.950 da regra de bolso sobre o valor estimado em cada metragem.")
    y = linhas(s, y + 6, it, 70, {"20 m²"}, lambda v: num(v) + "%", alt=34)
    return s.salvar("04-custo-fixo-por-metragem-nov26", s.rodape(y + 4))


def espera(W):
    s = Svg(W, "Custo ilustrativo de cada mês de espera para um apartamento de 26 m² e orçamento mediano de R$ 74.132",
            "Aluguel que não entra: de R$ 1.710 a R$ 2.370 por mês (FipeZap locação set/2026 e QuintoAndar jul/2026); reajuste da obra pelo INCC-M: R$ 408 por mês (6,60% em 12 meses); reajuste pelo IPCA: R$ 283 por mês (4,58% em 12 meses).")
    y = s.cabecalho("CUSTO DE ESPERAR", "O imóvel parado custa de 4 a 6 vezes o reajuste da obra",
                    "Cenário ilustrativo por mês, para 26 m² e orçamento mediano de R$ 74.132. Não é previsão.")
    larg = W - 64 - 130; vmax = 2600.0
    for rot, nota, v, v2 in ESPERA:
        s.t(32, y, rot, 14.5, "s", TINTA, 600); s.t(W - 32, y, nota, 12, "m", CINZA, anchor="end")
        if v2:
            s.rect(32, y + 8, larg * v / vmax, 16, AZUL, 4); s.rect(32 + larg * v / vmax, y + 8, larg * (v2 - v) / vmax, 16, "#9DBAD6", 4)
            s.t(32 + larg * v2 / vmax + 8, y + 21, f"{brl(v)} a {brl(v2)}", 13.5, "s", TINTA, 700)
        else:
            s.rect(32, y + 8, larg * v / vmax, 16, LARANJA, 4); s.t(32 + larg * v / vmax + 8, y + 21, brl(v), 14, "s", TINTA, 700)
        y += 54
    return s.salvar("05-custo-de-cada-mes-de-espera-nov26", s.rodape(y - 14, "Fontes: Índice Bewild; FipeZap; FGV; IBGE"))


if __name__ == "__main__":
    S5 = "Mediana (ponto) e metade central (barra) do orçamento de reforma completa em cada faixa."
    g.OUT = MORAR
    fs = [lambda W: intervalos(W, "04-custo-por-faixa-nov26", "ORÇAMENTO POR METRAGEM", "De 35 a 45 m², a reforma completa fica em R$ 101 mil na mediana", S5, G4, destaque={"30 a 35 m²", "35 a 45 m²"}),
          lambda W: dispersao(W, "05-area-x-valor-nov26"),
          lambda W: m2_faixa(W, "07-custo-m2-por-faixa-nov26", G4, "O m² cai até 30 m² e depois se estabiliza", "Mediana do valor por m² em cada faixa. No Índice Bewild inteiro, a mediana é R$ 2.831 por m².")]
    for f in fs:
        for W in (600, 420): print(*f(W))
    g.OUT = PARCIAL
    fs = [lambda W: intervalos(W, "01-reforma-completa-por-metragem-nov26", "REFORMA COMPLETA POR METRAGEM", "Reforma completa: de R$ 67 mil a R$ 101 mil na mediana, conforme a metragem", S5, G5),
          simples_x_completa, parte_fixa]
    for f in fs:
        for W in (600, 420): print(*f(W))
    g.OUT = CHAVES
    fs = [espera, lambda W: intervalos(W, "06-orcamento-por-metragem-nov26", "QUANTO RESERVAR", "Quanto reservar para a reforma completa, por metragem", S5, G5)]
    for f in fs:
        for W in (600, 420): print(*f(W))
