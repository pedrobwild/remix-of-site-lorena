#!/usr/bin/env python3
"""Gráficos do artigo de reforma por bairro (base: Índice Bewild, nov/2026)
e nova versão do gráfico 12 do artigo pilar. Dados embutidos, calculados em
16/11/2026 sobre os 585 orçamentos da edição.

Uso: python3 scripts/graficos/por_bairro_2026_11.py
"""
import os, sys, textwrap
sys.path.insert(0, os.path.dirname(__file__))
import pilar_custo_2026_11 as g
from pilar_custo_2026_11 import Svg, brl, num, AZUL, LARANJA, TINTA, CINZA, LINHA, FUNDO, MARCA, FONTE

BASE = os.path.join(os.path.dirname(__file__), "..", "..", "public", "images", "blog")
BAIRRO_DIR = os.path.join(BASE, "reforma-de-apartamento-sao-paulo-por-bairro")
PILAR_DIR = os.path.join(BASE, "quanto-custa-reformar-apartamento-studio-ate-50-m2")

CONTAGEM = [("Pinheiros", 46), ("Bela Vista", 39), ("Consolação", 38), ("Moema", 33), ("Brooklin", 28), ("Vila Mariana", 27),
            ("Vila Olímpia", 27), ("Vila Nova Conceição", 26), ("Perdizes", 23), ("Butantã", 20), ("Vila Clementino", 19),
            ("Pompeia", 16), ("Itaim Bibi", 14), ("Campo Belo", 13), ("República", 11), ("Santo Amaro", 11)]
# bairro, orçamentos, mediana R$/m², metragem mediana
CUSTO = [("Consolação", 38, 3117, 32), ("Bela Vista", 39, 3019, 25), ("Pinheiros", 46, 2973, 25), ("Vila Clementino", 19, 2914, 26),
         ("Vila Mariana", 27, 2914, 25), ("Perdizes", 23, 2867, 27), ("Moema", 33, 2863, 27), ("Vila Olímpia", 27, 2795, 24),
         ("Brooklin", 28, 2726, 25), ("Pompeia", 16, 2639, 29), ("Butantã", 20, 2638, 26), ("Vila Nova Conceição", 26, 2556, 25.5)]
# faixa, (Centro, Oeste, Sul) em R$/m² e número de orçamentos
FAIXAS = [("Abaixo de 24 m²", (3794, 3386, 3040), (43, 22, 28)), ("24 a 28 m²", (2743, 2786, 2840), (21, 60, 128)),
          ("28 a 32 m²", (2374, 2661, 2542), (17, 21, 43)), ("32 a 38 m²", (2641, 2573, 2472), (7, 14, 33)),
          ("38 a 45 m²", (2651, 2595, 2625), (19, 14, 10))]
VENDA = [("Itaim Bibi", 19990), ("Pinheiros", 18302), ("Jardins", 17833), ("Moema", 16349), ("Vila Mariana", 14792), ("Paraíso", 13943),
         ("Perdizes", 13303), ("Bela Vista", 12454), ("São Paulo (média)", 12099), ("Santana", 9090), ("Vila Andrade", 8347)]
TERCOS = [("Março a junho", (28, 24, 48)), ("Julho a setembro", (13, 34, 52)), ("Outubro e novembro", (26, 23, 51))]
GRUPOS = [("Bela Vista, Consolação e República", 88, 3104), ("Pinheiros e Vila Madalena", 54, 2914),
          ("Itaim Bibi e Vila Olímpia", 41, 2831), ("Moema e Vila Nova Conceição", 59, 2717), ("Brooklin e Campo Belo", 41, 2693)]
M2 = 2831
CORES3 = (LARANJA, AZUL, MARCA)
REG = ("Centro", "Zona Oeste", "Zona Sul")


def linhas(s, y, itens, vmax, destaque=None, fmt=str, alt=34):
    """Barras compactas: (rótulo, nota, valor)."""
    larga = s.W == 600
    x0 = 200 if larga else 32
    larg = s.W - 32 - x0 - (200 if larga and any(i[1] for i in itens) else 86)
    for rot, nota, v in itens:
        if larga:
            s.t(32, y + 13, rot, 14, "s", TINTA, 600)
            by = y
        else:
            s.t(32, y + 4, rot, 14, "s", TINTA, 600)
            if nota: s.t(s.W - 32, y + 4, nota, 11.5, "m", CINZA, anchor="end")
            by = y + 11
        w = larg * v / vmax
        s.rect(x0, by, w, 16, LARANJA if destaque and rot in destaque else AZUL, 4)
        s.t(x0 + w + 8, by + 13, fmt(v), 13.5, "s", TINTA, 700)
        if larga and nota: s.t(s.W - 32, by + 13, nota, 11.5, "m", CINZA, anchor="end")
        y += alt if larga else alt + 14
    return y


def b_resumo(W):
    s = Svg(W, "Resumo da análise por bairro: 585 orçamentos de reforma completa em São Paulo",
            "535 dos 585 orçamentos têm bairro identificado; a mediana por m² vai de R$ 2.770 na Zona Sul a R$ 3.038 no Centro; na faixa de 24 a 28 m² a diferença entre regiões é de 3,5%; Zona Sul 45%, Zona Oeste 24% e Centro 20% dos orçamentos; o aluguel por m² varia 2 vezes entre bairros; a reforma pesa de 14% a 34% do m² à venda.")
    y = s.cabecalho("REFORMA POR BAIRRO", "O bairro muda o metro quadrado, não o orçamento",
                    "Seis números da análise por bairro do Índice Bewild, edição de novembro de 2026.")
    cards = [("585 orçamentos", "535 com bairro identificado, em mais de 60 bairros"), ("R$ 2.770 a R$ 3.038/m²", "mediana por região, da Zona Sul ao Centro"),
             ("3,5%", "diferença entre regiões na faixa de 24 a 28 m²"), ("45% · 24% · 20%", "Zona Sul, Zona Oeste e Centro"),
             ("2 vezes", "variação do aluguel por m² entre bairros (FipeZap)"), ("14% a 34%", "peso da reforma no m² à venda")]
    cols = 2 if W == 600 else 1
    cw = (W - 64 - (cols - 1) * 16) / cols
    for i, (v, l) in enumerate(cards):
        cx = 32 + (i % cols) * (cw + 16); cy = y + (i // cols) * 112
        s.rect(cx, cy, cw, 96, FUNDO, 6); s.rect(cx, cy, 4, 96, AZUL if i % 3 else LARANJA, 2)
        s.t(cx + 20, cy + 42, v, 18 if len(v) > 20 else (22 if len(v) > 13 else 28), "s", TINTA, 700)
        for k, l2 in enumerate(textwrap.wrap(l, 32 if W == 600 else 42)):
            s.t(cx + 20, cy + 66 + k * 17, l2, 13.5, "s", CINZA)
    y += ((len(cards) + cols - 1) // cols) * 112 + 12
    return s.salvar("01-resumo-por-bairro-nov26", s.rodape(y))


def b_contagem(W):
    s = Svg(W, "Orçamentos de reforma por bairro", "Bairros com 10 orçamentos ou mais: " + "; ".join(f"{b} {n}" for b, n in CONTAGEM) + ".")
    y = s.cabecalho("ONDE ESTÃO OS ORÇAMENTOS", "Pinheiros, Bela Vista e Consolação somam 123 orçamentos",
                    "Bairros com 10 orçamentos ou mais, entre os 535 com bairro identificado.")
    y = linhas(s, y + 6, [(b, "", n) for b, n in CONTAGEM], 50, {"Pinheiros", "Bela Vista", "Consolação"}, alt=30)
    return s.salvar("02-orcamentos-por-bairro-nov26", s.rodape(y + 4))


def b_custo(W):
    s = Svg(W, "Custo mediano da reforma por m² em 12 bairros",
            "; ".join(f"{b} {brl(v)} por m² ({n} orçamentos, {num(m, 1 if m % 1 else 0)} m² na mediana)" for b, n, v, m in CUSTO) + ".")
    y = s.cabecalho("CUSTO POR M² POR BAIRRO", "De R$ 2.556 a R$ 3.117 por m² entre 12 bairros",
                    "Mediana por m² nos bairros com 15 orçamentos ou mais, com o número de orçamentos e a metragem mediana.")
    y = linhas(s, y + 6, [(b, f"{n} orç. · {num(m, 1 if m % 1 else 0)} m²", v) for b, n, v, m in CUSTO], 3400,
               {"Consolação", "Bela Vista"}, brl, alt=32)
    return s.salvar("03-custo-m2-por-bairro-nov26", s.rodape(y + 4))


def b_faixas(W):
    s = Svg(W, "Custo por m² por faixa de metragem e região",
            "; ".join(f"{f}: Centro {brl(v[0])} ({n[0]}), Zona Oeste {brl(v[1])} ({n[1]}), Zona Sul {brl(v[2])} ({n[2]})" for f, v, n in FAIXAS) + ".")
    y = s.cabecalho("MESMA METRAGEM, REGIÕES LADO A LADO", "Na mesma faixa de metragem, as regiões se aproximam",
                    "Mediana por m² em cada faixa. A diferença só é grande abaixo de 24 m², onde o Centro tem os studios menores.")
    x = 32
    for r, c in zip(REG, CORES3):
        s.rect(x, y - 10, 12, 12, c, 2); s.t(x + 18, y, r, 13, "s", TINTA, 600); x += 110 if W == 600 else 104
    y += 26
    larg = W - 64 - 150
    for f, v, n in FAIXAS:
        s.t(32, y, f, 14.5, "s", TINTA, 700)
        s.t(W - 32, y, f"diferença de {num((max(v) / min(v) - 1) * 100)}%", 12, "m", CINZA, anchor="end")
        y += 10
        for val, nn, c in zip(v, n, CORES3):
            w = larg * val / 4000
            s.rect(32, y, w, 13, c, 3); s.t(32 + w + 8, y + 11, f"{brl(val)} · {nn} orç.", 12.5, "s", TINTA, 600); y += 17
        y += 22
    return s.salvar("04-regiao-x-metragem-nov26", s.rodape(y - 8))


def b_peso(W):
    s = Svg(W, "Peso da reforma sobre o preço de venda por m² em cada bairro",
            "Reforma de R$ 2.831 por m² como parcela do m² à venda (FipeZap, julho de 2026): " + "; ".join(f"{b} {num(M2 / p * 100)}%" for b, p in VENDA) + ".")
    y = s.cabecalho("PESO DA REFORMA NO M² À VENDA", "A reforma vai de 14% a 34% do metro quadrado à venda",
                    "Mediana do Índice Bewild (R$ 2.831/m²) dividida pelo preço de venda por m² de cada bairro.")
    y = linhas(s, y + 6, [(b, brl(p) + "/m²", round(M2 / p * 100, 1)) for b, p in VENDA], 38, {"São Paulo (média)"}, lambda v: num(v) + "%", alt=32)
    return s.salvar("06-peso-reforma-no-m2-venda-nov26", s.rodape(y + 4, "Fontes: Índice Bewild nov/2026; FipeZap jul/2026"))


def b_tercos(W):
    s = Svg(W, "Participação de cada região nos orçamentos ao longo de 2026",
            "; ".join(f"{t}: Centro {v[0]}%, Zona Oeste {v[1]}%, Zona Sul {v[2]}%" for t, v in TERCOS) + ".")
    y = s.cabecalho("REGIÕES AO LONGO DO PERÍODO", "A Zona Sul responde por metade dos orçamentos o ano todo",
                    "Participação de cada região em três grupos de 160 orçamentos, pela data de criação.")
    x = 32
    for r, c in zip(REG, CORES3):
        s.rect(x, y - 10, 12, 12, c, 2); s.t(x + 18, y, r, 13, "s", TINTA, 600); x += 110 if W == 600 else 104
    y += 28
    larg = W - 64
    for t, v in TERCOS:
        s.t(32, y, t, 14.5, "s", TINTA, 600); y += 10
        x = 32; tot = sum(v)
        for val, c in zip(v, CORES3):
            w = larg * val / tot
            s.rect(x, y, w, 34, c)
            s.t(x + w / 2, y + 22, f"{val}%", 14, "s", "#FFFFFF", 700, "middle"); x += w
        y += 62
    return s.salvar("07-regioes-ao-longo-do-periodo-nov26", s.rodape(y - 12))


def p_bairro(W):
    g.REGIOES = GRUPOS
    nome = g.g_bairro
    # mesma arte do gráfico 12 do pilar, com os grupos recalculados
    import types
    orig = Svg.salvar
    def salvar(self, _n, H): return orig(self, "12-bairro-obra-x-aluguel-nov26b", H)
    Svg.salvar = salvar
    try: return nome(W)
    finally: Svg.salvar = orig


if __name__ == "__main__":
    g.OUT = BAIRRO_DIR
    for f in (b_resumo, b_contagem, b_custo, b_faixas, b_peso, b_tercos):
        for W in (600, 420): print(*f(W))
    g.OUT = PILAR_DIR
    for W in (600, 420): print(*p_bairro(W))
