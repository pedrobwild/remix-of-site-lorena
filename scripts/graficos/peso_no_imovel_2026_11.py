#!/usr/bin/env python3
"""Gráficos dos artigos "reformar para vender ou alugar" e "quanto gastar na
reforma" na base do Índice Bewild de novembro de 2026 (585 orçamentos).
Preços de venda: FipeZap set/2026. Aluguel: FipeZap ago/2026.

Uso: python3 scripts/graficos/peso_no_imovel_2026_11.py
"""
import os, sys, textwrap
sys.path.insert(0, os.path.dirname(__file__))
import pilar_custo_2026_11 as g
from pilar_custo_2026_11 import Svg, brl, num, AZUL, LARANJA, TINTA, CINZA, LINHA, FUNDO, MARCA, FONTE
from por_bairro_2026_11 import linhas, BASE

VA = os.path.join(BASE, "reformar-apartamento-para-vender-ou-alugar-sp")
QG = os.path.join(BASE, "quanto-gastar-na-reforma-do-apartamento-valor-do-imovel")
M2, Q1, Q3, MED = 2831, 2499, 3283, 74132
VENDA = [("Itaim Bibi", 19989), ("Pinheiros", 18260), ("Jardins", 18028), ("Moema", 16520), ("Vila Mariana", 14879), ("Paraíso", 14108),
         ("Perdizes", 13455), ("Bela Vista", 12703), ("São Paulo (média)", 12206), ("Santana", 9288), ("Vila Andrade", 8372)]
ALUGUEL = [("Pinheiros", 99.60), ("Itaim Bibi", 94.00), ("Moema", 84.80), ("São Paulo (média)", 65.36)]
FAIXAS = [("Até 20 m²", 42, 66969), ("20 a 24 m²", 64, 69160), ("24 a 28 m²", 241, 70537), ("28 a 32 m²", 107, 75656),
          ("32 a 40 m²", 109, 95459), ("40 a 45 m²", 22, 109938)]
CENARIOS = [("Preço do m² do bairro (FipeZap)", 20.4, 16.7, 24.3), ("Média de São Paulo (R$ 12.206/m²)", 23.2, 20.5, 26.9),
            ("Imóvel novo (R$ 15.800/m², Brain)", 17.9, 15.8, 20.8)]
DIST = [("Abaixo de 10%", 3), ("10% a 15%", 96), ("15% a 20%", 177), ("20% a 25%", 182), ("25% a 30%", 72), ("30% ou mais", 55)]
METRAGEM = [("Até 21 m²", 65, 28.7, 25.1, 31.7), ("21 a 25 m²", 194, 20.1, 15.9, 23.7), ("25 a 30 m²", 172, 19.3, 16.1, 21.5),
            ("30 a 35 m²", 72, 20.2, 16.6, 25.5), ("35 a 45 m²", 82, 20.2, 16.9, 22.6)]
REGRA = [("Média de São Paulo", 317), ("Bela Vista", 330), ("Imóvel novo", 411), ("Pinheiros", 475)]
TERCOS = [("Março a junho", 20.1), ("Junho a setembro", 20.8), ("Setembro a novembro", 20.5)]
SENS = [("m² 15% abaixo", 24.0), ("m² do FipeZap", 20.4), ("m² 15% acima", 17.7)]
pct = lambda v: num(v) + "%"


def cards(s, y, itens):
    cols = 2 if s.W == 600 else 1
    cw = (s.W - 64 - (cols - 1) * 16) / cols
    for i, (v, l) in enumerate(itens):
        cx = 32 + (i % cols) * (cw + 16); cy = y + (i // cols) * 112
        s.rect(cx, cy, cw, 96, FUNDO, 6); s.rect(cx, cy, 4, 96, AZUL if i % 3 else LARANJA, 2)
        s.t(cx + 20, cy + 42, v, 18 if len(v) > 20 else (22 if len(v) > 13 else 28), "s", TINTA, 700)
        for k, l2 in enumerate(textwrap.wrap(l, 32 if s.W == 600 else 42)):
            s.t(cx + 20, cy + 66 + k * 17, l2, 13.5, "s", CINZA)
    return y + ((len(itens) + cols - 1) // cols) * 112 + 12


def intervalo(s, y, itens, vmax, cor=AZUL):
    """Linhas com faixa (Q1 a Q3) e marcador da mediana: (rótulo, nota, med, q1, q3)."""
    larg = s.W - 64
    for rot, nota, m, a, b in itens:
        s.t(32, y, rot, 14.5, "s", TINTA, 600)
        if nota: s.t(s.W - 32, y, nota, 12, "m", CINZA, anchor="end")
        s.rect(32, y + 12, larg, 8, FUNDO, 4)
        s.rect(32 + larg * a / vmax, y + 12, larg * (b - a) / vmax, 8, cor, 4)
        x = 32 + larg * m / vmax
        s.circ(x, y + 16, 7, LARANJA)
        s.t(x, y + 42, pct(m), 14, "s", TINTA, 700, "middle")
        estreito = s.W != 600
        s.t(32, y + (60 if estreito else 42), f"metade central: {pct(a)} a {pct(b)}", 11.5, "m", CINZA)
        y += 90 if estreito else 72
    return y


def va_resumo(W):
    s = Svg(W, "Reformar apartamento para vender ou alugar em SP: os números",
            "Reforma completa a R$ 2.831 por m² na mediana de 585 orçamentos; 14% a 34% do preço de venda do imóvel conforme o bairro; cerca de 43 meses de aluguel bruto na média da cidade e 28 a 33 meses em Pinheiros, Itaim Bibi e Moema; preço de venda +3,64% e custo de construção +6,61% em 12 meses; R$ 80 mil de reforma comprovada zeram R$ 10.372 de imposto no exemplo.")
    y = s.cabecalho("VENDER OU ALUGAR", "Reformar apartamento para vender ou alugar em SP: os números",
                    "Índice Bewild de novembro de 2026 cruzado com FipeZap, INCC e regras da Receita Federal.")
    y = cards(s, y, [("R$ 2.831/m²", "mediana da reforma completa em 585 orçamentos"), ("14% a 34%", "do preço de venda do imóvel, conforme o bairro"),
                     ("43 meses", "de aluguel bruto na média de São Paulo"), ("28 a 33 meses", "em Pinheiros, Itaim Bibi e Moema"),
                     ("+3,64% e +6,61%", "preço de venda e custo de construção em 12 meses"), ("R$ 10.372 a zero", "imposto no exemplo, com R$ 80 mil comprovados")])
    return s.salvar("01-resumo-numeros-nov26", s.rodape(y, "Fontes: Índice Bewild; FipeZap; FGV; Receita"))


def peso_bairro(W, nome, rotulo):
    s = Svg(W, "Quanto a reforma completa pesa no preço do apartamento, por bairro",
            "Mediana da reforma por m² (R$ 2.831) dividida pelo preço de venda por m² do FipeZap de setembro de 2026: " + "; ".join(f"{b} {pct(M2 / p * 100)}" for b, p in VENDA) + ".")
    y = s.cabecalho(rotulo, "Quanto a reforma completa pesa no preço do apartamento, por bairro",
                    "Mediana do Índice Bewild (R$ 2.831/m²) dividida pelo preço de venda por m² de cada bairro.")
    y = linhas(s, y + 6, [(b, brl(p) + "/m²", round(M2 / p * 100, 1)) for b, p in VENDA], 38, {"São Paulo (média)"}, pct, alt=32)
    return s.salvar(nome, s.rodape(y + 4, "Fontes: Índice Bewild; FipeZap set/2026"))


def va_meses(W):
    s = Svg(W, "Quantos meses de aluguel bruto cobrem a reforma completa",
            "; ".join(f"{b}: {num(M2 / a)} meses (aluguel de R$ {num(a, 2)} por m²)" for b, a in ALUGUEL) + ".")
    y = s.cabecalho("REFORMA EM MESES DE ALUGUEL", "Quantos meses de aluguel bruto cobrem a reforma completa",
                    "Mediana da reforma por m² (R$ 2.831) dividida pelo aluguel anunciado por m² ao mês.")
    y = linhas(s, y + 6, [(b, f"R$ {num(a, 2)}/m²", round(M2 / a, 1)) for b, a in ALUGUEL], 50, {"São Paulo (média)"}, lambda v: num(v) + " meses", alt=36)
    return s.salvar("03-meses-de-aluguel-nov26", s.rodape(y + 4, "Fontes: Índice Bewild; FipeZap ago/2026"))


def va_metragem(W):
    s = Svg(W, "Valor do orçamento de reforma completa por faixa de metragem",
            "; ".join(f"{f}: {brl(v)} ({n} orçamentos)" for f, n, v in FAIXAS) + ".")
    y = s.cabecalho("ORÇAMENTO POR METRAGEM", "Valor do orçamento de reforma completa por faixa de metragem",
                    "Orçamento mediano em cada faixa. Abaixo de 28 m², o valor fica perto de R$ 70 mil; acima de 32 m², sobe de patamar.")
    y = linhas(s, y + 6, [(f, f"{n} orç.", v) for f, n, v in FAIXAS], 125000, {"32 a 40 m²", "40 a 45 m²"}, brl, alt=34)
    return s.salvar("06-valor-por-metragem-nov26", s.rodape(y + 4))


def qg_cenarios(W):
    s = Svg(W, "Peso da reforma completa no valor do imóvel em três cenários de preço",
            "; ".join(f"{r}: {pct(m)} (metade central de {pct(a)} a {pct(b)})" for r, m, a, b in CENARIOS) + ". A regra citada em guias é de 20% a 35%.")
    y = s.cabecalho("PESO DA REFORMA NO IMÓVEL", "A reforma completa pesa de 18% a 23% do valor do imóvel",
                    "Mediana e metade central do peso em 585 orçamentos, conforme o preço usado para o imóvel. A regra dos guias é de 20% a 35%.")
    y = intervalo(s, y + 8, [(r, "", m, a, b) for r, m, a, b in CENARIOS], 36)
    return s.salvar("01-peso-da-reforma-tres-cenarios-nov26", s.rodape(y - 12, "Fontes: Índice Bewild; FipeZap set/2026; Brain"))


def qg_dist(W):
    s = Svg(W, "Orçamentos por faixa de peso no valor do imóvel", "; ".join(f"{f}: {n}" for f, n in DIST) + ".")
    y = s.cabecalho("DISTRIBUIÇÃO DO PESO", "6 em cada 10 orçamentos pesam de 15% a 25% do imóvel",
                    "Orçamentos por faixa de peso no valor do imóvel, com o m² do bairro de referência.")
    y = linhas(s, y + 6, [(f, "", n) for f, n in DIST], 215, {"15% a 20%", "20% a 25%"}, lambda v: f"{v} orçamentos", alt=34)
    return s.salvar("02-distribuicao-do-peso-nov26", s.rodape(y + 4, "Fontes: Índice Bewild; FipeZap set/2026"))


def qg_metragem(W):
    s = Svg(W, "Peso mediano da reforma no valor do imóvel por faixa de metragem",
            "; ".join(f"{f}: {pct(m)} ({n} orçamentos, metade central de {pct(a)} a {pct(b)})" for f, n, m, a, b in METRAGEM) + ".")
    y = s.cabecalho("PESO POR METRAGEM", "Até 21 m², a reforma pesa 29% do imóvel; acima disso, perto de 20%",
                    "Peso mediano e metade central em cada faixa de metragem.")
    y = intervalo(s, y + 8, [(f, f"{n} orçamentos", m, a, b) for f, n, m, a, b in METRAGEM], 36)
    return s.salvar("03-peso-por-metragem-nov26", s.rodape(y - 12, "Fontes: Índice Bewild; FipeZap set/2026"))


def qg_regra(W):
    s = Svg(W, "Regra de 20% a 35% do valor do imóvel contra o orçamento mediano, para 26 m²",
            "; ".join(f"{r} (imóvel de R$ {v} mil): R$ {round(v * .2)} mil a R$ {round(v * .35)} mil" for r, v in REGRA) + ". O orçamento mediano do Índice Bewild é R$ 74.132.")
    y = s.cabecalho("A REGRA CONTRA O ORÇAMENTO", "A regra de 20% a 35% passa do orçamento em quase todos os casos",
                    "Faixa que a regra manda reservar para um apartamento de 26 m² (cinza) e o orçamento mediano do Índice, R$ 74 mil (laranja).")
    larg = W - 64; vmax = 180.0; X = lambda v: 32 + larg * v / vmax
    y += 8
    for r, v in REGRA:
        a, b = v * .2, v * .35
        s.t(32, y, r, 14.5, "s", TINTA, 600); s.t(W - 32, y, f"imóvel de R$ {v} mil", 12, "m", CINZA, anchor="end")
        s.rect(32, y + 12, larg, 10, FUNDO, 5); s.rect(X(a), y + 12, X(b) - X(a), 10, "#B9C0C9", 5)
        s.line(X(MED / 1000), y + 6, X(MED / 1000), y + 28, LARANJA, 3)
        s.t(X(a), y + 44, f"R$ {round(a)} mil", 12.5, "m", TINTA, 700, "middle"); s.t(X(b), y + 44, f"R$ {round(b)} mil", 12.5, "m", TINTA, 700, "middle")
        y += 74
    return s.salvar("05-regra-de-mercado-x-orcamento-nov26", s.rodape(y - 12, "Fontes: Índice Bewild; FipeZap set/2026; Brain"))


def qg_estab(W):
    s = Svg(W, "Estabilidade e sensibilidade do peso da reforma no valor do imóvel",
            "Medianas por período: " + "; ".join(f"{t} {pct(v)}" for t, v in TERCOS) + ". Sensibilidade ao preço do imóvel: " + "; ".join(f"{t} {pct(v)}" for t, v in SENS) + ".")
    y = s.cabecalho("ESTABILIDADE E SENSIBILIDADE", "O peso fica perto de 20% o ano todo e muda com o preço do imóvel",
                    "Mediana do peso em três grupos de 195 orçamentos, pela data, e com o m² do imóvel 15% abaixo ou acima do FipeZap.")
    s.t(32, y + 4, "POR PERÍODO DE 2026", 12.5, "m", MARCA, 700); y += 26
    y = linhas(s, y, [(t, "", v) for t, v in TERCOS], 30, None, pct, alt=32)
    s.t(32, y + 10, "POR PREÇO DO IMÓVEL", 12.5, "m", MARCA, 700); y += 32
    y = linhas(s, y, [(t, "", v) for t, v in SENS], 30, {"m² do FipeZap"}, pct, alt=32)
    return s.salvar("06-estabilidade-e-sensibilidade-nov26", s.rodape(y + 4, "Fontes: Índice Bewild; FipeZap set/2026"))


if __name__ == "__main__":
    g.OUT = VA
    for f in (va_resumo, lambda W: peso_bairro(W, "02-reforma-percentual-do-valor-nov26", "PESO NO PREÇO DO IMÓVEL"), va_meses, va_metragem):
        for W in (600, 420): print(*f(W))
    g.OUT = QG
    for f in (qg_cenarios, qg_dist, qg_metragem, lambda W: peso_bairro(W, "04-peso-por-bairro-fipezap-nov26", "PESO POR BAIRRO"), qg_regra, qg_estab):
        for W in (600, 420): print(*f(W))
