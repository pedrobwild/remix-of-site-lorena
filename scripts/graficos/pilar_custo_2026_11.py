#!/usr/bin/env python3
"""Gráficos do artigo pilar de custo (edição de novembro de 2026).

Base: 585 orçamentos de reforma completa do Bwild Engine (última versão
publicada de cada negócio, com metragem, a partir de R$ 50 mil e até 45 m²),
consulta de 16/11/2026. Os dados estão embutidos abaixo; a regra da amostra
está em docs/internal/indice-bewild-orcamentos-engine-2026-11.md.

Uso: python3 scripts/graficos/pilar_custo_2026_11.py
Gera a versão larga (viewBox 600) e a de celular (viewBox 420, sufixo -m).
"""
import os, textwrap

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "images", "blog",
                   "quanto-custa-reformar-apartamento-studio-ate-50-m2")
AZUL, LARANJA, TINTA, CINZA, LINHA, FUNDO, MARCA = "#2F6FA8", "#D07A3E", "#1A2332", "#5A6472", "#E7E2D9", "#F6F3EE", "#11355B"
FONTE = "Fonte: Índice Bewild, nov/2026, 585 orçamentos"

HIST = [(1500, 3), (1750, 21), (2000, 40), (2250, 85), (2500, 111), (2750, 94), (3000, 78), (3250, 47),
        (3500, 32), (3750, 20), (4000, 18), (4250, 9), (4500, 8), (4750, 4), (5000, 15)]
FAIXAS = [("até 20 m²", 42, 3825), ("20 a 24 m²", 64, 3056), ("24 a 28 m²", 241, 2802),
          ("28 a 32 m²", 107, 2594), ("32 a 40 m²", 109, 2550), ("40 a 45 m²", 22, 2649)]
VALOR = [("até R$ 65 mil", 137, 23.4), ("R$ 65 a 75 mil", 174, 29.7), ("R$ 75 a 90 mil", 137, 23.4),
         ("R$ 90 a 120 mil", 100, 17.1), ("acima de R$ 120 mil", 37, 6.3)]
PREDIOS = [("Artz Itaim", "28 a 29 m²", 59420, 112175), ("Living Full Vila Nova Conceição", "24 a 26 m²", 55482, 91282),
           ("HW Style", "25 a 27 m²", 64987, 87728), ("Nex One Pereira Coutinho", "27 a 28 m²", 59510, 76947),
           ("On Flórida", "25 m²", 67063, 74345)]
REGIOES = [("Bela Vista, Consolação e República", 88, 3104), ("Pinheiros e Vila Madalena", 55, 2919),
           ("Itaim Bibi e Vila Olímpia", 40, 2815), ("Moema e Vila Nova Conceição", 60, 2710),
           ("Brooklin e Campo Belo", 39, 2689)]
ALUGUEL = [("Brooklin", 109.30), ("Pinheiros", 105.40), ("Moema", 90.30), ("Itaim Bibi", 88.90), ("Média da cidade", 75.20)]
REGRA = (32950, 1514)
PONTOS = "15.0,539;15.0,560;15.0,593;15.0,625;15.0,696;15.7,600;17.0,576;17.0,600;17.0,706;17.0,769;17.0,654;17.2,653;17.4,600;18.0,568;18.0,573;18.0,598;18.0,651;18.0,665;18.0,669;18.0,670;18.0,689;18.0,703;18.0,725;18.0,736;18.0,756;18.0,766;18.0,766;18.0,766;18.0,770;18.0,773;18.0,1305;18.2,710;18.5,700;18.8,1513;19.0,511;19.0,569;19.0,570;19.0,603;19.0,696;19.5,653;19.7,814;19.7,1060;20.0,550;20.0,600;20.0,600;20.0,600;20.0,636;20.0,640;20.0,657;20.0,686;20.0,700;20.0,700;20.0,739;20.0,916;20.4,814;20.4,825;20.9,599;21.0,550;21.0,571;21.0,588;21.0,654;21.0,695;21.0,736;21.0,750;21.0,767;21.4,636;21.6,680;22.0,565;22.0,628;22.0,650;22.0,654;22.0,854;22.1,613;22.2,1080;22.7,646;22.7,693;22.8,876;23.0,503;23.0,541;23.0,619;23.0,620;23.0,634;23.0,647;23.0,656;23.0,666;23.0,683;23.0,693;23.0,694;23.0,695;23.0,699;23.0,699;23.0,704;23.0,709;23.0,719;23.0,757;23.0,773;23.0,798;23.0,827;23.0,833;23.0,850;23.0,878;23.0,992;23.0,1900;23.0,1900;23.6,597;23.9,691;24.0,515;24.0,529;24.0,546;24.0,548;24.0,566;24.0,584;24.0,597;24.0,600;24.0,600;24.0,600;24.0,600;24.0,600;24.0,604;24.0,617;24.0,620;24.0,629;24.0,642;24.0,644;24.0,645;24.0,649;24.0,649;24.0,650;24.0,651;24.0,656;24.0,660;24.0,663;24.0,665;24.0,667;24.0,670;24.0,672;24.0,677;24.0,682;24.0,682;24.0,682;24.0,684;24.0,689;24.0,693;24.0,695;24.0,699;24.0,699;24.0,700;24.0,710;24.0,711;24.0,720;24.0,721;24.0,723;24.0,729;24.0,746;24.0,748;24.0,749;24.0,749;24.0,756;24.0,768;24.0,781;24.0,788;24.0,788;24.0,796;24.0,800;24.0,826;24.0,838;24.0,841;24.0,849;24.0,855;24.0,872;24.0,894;24.0,899;24.0,942;24.0,946;24.0,977;24.1,770;24.4,642;24.4,624;24.4,698;24.5,575;24.5,560;24.5,800;24.7,739;24.7,743;24.7,750;24.7,753;24.7,618;24.7,621;24.7,674;24.7,671;24.7,694;24.9,767;24.9,852;24.9,764;24.9,637;24.9,742;24.9,787;25.0,870;25.0,555;25.0,567;25.0,569;25.0,585;25.0,585;25.0,589;25.0,593;25.0,594;25.0,599;25.0,600;25.0,600;25.0,600;25.0,605;25.0,610;25.0,611;25.0,624;25.0,627;25.0,629;25.0,633;25.0,647;25.0,650;25.0,660;25.0,672;25.0,672;25.0,679;25.0,683;25.0,686;25.0,696;25.0,698;25.0,698;25.0,699;25.0,700;25.0,700;25.0,705;25.0,714;25.0,715;25.0,719;25.0,722;25.0,722;25.0,727;25.0,730;25.0,739;25.0,741;25.0,743;25.0,749;25.0,751;25.0,779;25.0,781;25.0,782;25.0,793;25.0,796;25.0,797;25.0,834;25.0,868;25.0,921;25.0,994;25.0,996;25.0,1007;25.0,1113;25.0,1126;25.0,1531;25.0,786;25.1,856;25.1,642;25.3,1025;25.3,1076;25.3,835;25.3,833;25.5,768;25.6,659;25.6,834;25.9,598;25.9,715;25.9,789;25.9,600;26.0,548;26.0,550;26.0,601;26.0,606;26.0,616;26.0,619;26.0,634;26.0,646;26.0,647;26.0,650;26.0,658;26.0,676;26.0,677;26.0,677;26.0,681;26.0,686;26.0,690;26.0,710;26.0,723;26.0,736;26.0,744;26.0,746;26.0,751;26.0,758;26.0,765;26.0,783;26.0,818;26.0,850;26.0,892;26.0,896;26.0,899;26.0,913;26.0,1061;26.3,850;26.3,867;26.5,778;26.5,506;26.6,742;26.7,890;26.8,709;26.9,595;26.9,610;27.0,640;27.0,640;27.0,644;27.0,649;27.0,649;27.0,650;27.0,673;27.0,678;27.0,697;27.0,705;27.0,708;27.0,709;27.0,714;27.0,730;27.0,740;27.0,741;27.0,754;27.0,768;27.0,769;27.0,776;27.0,817;27.0,836;27.0,869;27.0,877;27.0,1034;27.0,1107;27.1,1065;27.2,605;27.5,1060;27.5,1102;27.8,750;27.9,729;28.0,545;28.0,547;28.0,571;28.0,600;28.0,618;28.0,629;28.0,642;28.0,655;28.0,667;28.0,668;28.0,701;28.0,710;28.0,712;28.0,722;28.0,726;28.0,749;28.0,766;28.0,779;28.0,793;28.0,794;28.0,810;28.0,871;28.0,877;28.0,882;28.0,898;28.0,918;28.0,922;28.0,980;28.0,998;28.0,1052;28.0,1122;28.0,1146;28.0,1350;28.0,1807;28.0,983;28.2,669;28.3,605;28.8,720;28.8,503;28.8,693;28.9,833;29.0,535;29.0,549;29.0,594;29.0,612;29.0,617;29.0,640;29.0,646;29.0,657;29.0,669;29.0,670;29.0,670;29.0,689;29.0,698;29.0,736;29.0,740;29.0,749;29.0,759;29.0,766;29.0,770;29.0,800;29.0,803;29.0,870;29.0,999;29.1,831;30.0,549;30.0,634;30.0,655;30.0,659;30.0,660;30.0,666;30.0,686;30.0,715;30.0,715;30.0,735;30.0,737;30.0,748;30.0,757;30.0,798;30.0,853;30.0,1011;30.0,1036;30.0,1041;30.0,1206;30.3,996;30.4,985;30.6,629;30.7,685;30.7,988;30.7,1008;31.0,576;31.0,669;31.0,809;31.0,817;31.0,844;31.0,867;31.0,893;31.0,909;31.0,922;31.0,953;31.0,966;31.0,1061;31.0,1100;31.0,1286;31.0,1417;31.0,1798;31.3,790;32.0,694;32.0,725;32.0,743;32.0,750;32.0,953;32.0,963;32.0,1515;32.0,1569;33.0,962;33.0,730;33.0,786;33.0,789;33.0,856;33.0,1039;33.0,1125;33.3,615;33.3,798;33.3,812;33.5,612;33.5,645;34.0,620;34.0,818;34.0,867;34.0,897;34.0,998;34.0,1034;34.0,1050;34.0,1053;34.0,1060;34.0,1188;34.0,2255;34.8,1796;35.0,709;35.0,711;35.0,761;35.0,795;35.0,849;35.0,850;35.0,862;35.0,865;35.0,871;35.0,871;35.0,895;35.0,900;35.0,1015;35.0,1077;35.0,1134;35.0,1216;35.0,1765;35.2,620;35.7,1044;35.7,883;35.7,2016;36.0,599;36.0,675;36.0,742;36.0,871;36.0,1113;36.0,1269;36.0,1308;36.7,920;36.7,920;36.8,811;36.8,943;37.0,625;37.0,650;37.0,761;37.0,767;37.0,814;37.0,920;37.0,960;37.0,977;37.0,990;37.0,1139;37.0,1171;37.0,1187;37.0,1502;37.0,1767;37.9,670;37.9,700;38.0,852;38.0,915;38.0,955;38.0,963;38.0,1008;38.0,1044;38.0,1060;38.0,1160;38.0,1166;38.5,975;38.5,1070;38.5,1786;38.5,1797;39.0,997;39.0,997;39.0,1257;39.0,1371;39.0,2059;40.0,753;40.0,736;40.0,948;40.0,950;40.0,1000;40.0,1013;40.0,1018;40.0,1018;40.0,1131;40.0,1142;40.0,2145;40.2,1070;40.2,1465;40.6,2572;41.0,1317;41.1,1142;41.7,1057;42.0,881;42.0,913;42.0,996;42.0,1106;42.0,1385;43.0,936;43.0,1016;43.0,1900;43.5,765;43.7,773;43.7,800;44.0,1093;44.2,1499;45.0,1215;45.0,1212;45.0,1252"


def brl(v):
    return "R$ " + f"{round(v):,}".replace(",", ".")

def num(v, casas=1):
    return f"{v:.{casas}f}".replace(".", ",")

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

class Svg:
    def __init__(self, W, titulo_acess, desc):
        self.W, self.o, self.y = W, [], 0
        self.titulo_acess, self.desc = titulo_acess, desc
    def t(self, x, y, txt, size=13, cls="s", fill=CINZA, weight=None, anchor=None, extra=""):
        a = f' text-anchor="{anchor}"' if anchor else ""
        w = f' font-weight="{weight}"' if weight else ""
        self.o.append(f'<text x="{x:g}" y="{y:g}" class="{cls}" font-size="{size:g}"{w} fill="{fill}"{a}{extra}>{esc(txt)}</text>')
    def rect(self, x, y, w, h, fill, rx=0):
        r = f' rx="{rx}"' if rx else ""
        self.o.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{max(w,0):.1f}" height="{h:.1f}"{r} fill="{fill}"/>')
    def line(self, x1, y1, x2, y2, stroke=LINHA, w=1, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.o.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{stroke}" stroke-width="{w}"{d}/>')
    def circ(self, x, y, r, fill, op=1.0):
        self.o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{fill}" fill-opacity="{op}"/>')
    def cabecalho(self, rotulo, titulo, sub):
        larg = 34 if self.W == 600 else 25
        self.t(32, 44, rotulo, 13, "m", MARCA, 700, extra=' letter-spacing="1.5"')
        y = 78
        for l in textwrap.wrap(titulo, larg):
            self.t(32, y, l, 24, "s", TINTA, 700, extra=' letter-spacing="-0.5"'); y += 30
        y += 2
        for l in textwrap.wrap(sub, 56 if self.W == 600 else 40):
            self.t(32, y, l, 15, "s", CINZA); y += 21
        self.y = y + 14
        return self.y
    def rodape(self, y, fonte=FONTE):
        self.line(32, y, self.W - 32, y)
        if self.W == 600:
            self.t(32, y + 22, fonte, 13, "m"); self.t(self.W - 32, y + 22, "bewild.com.br", 13, "m", MARCA, 700, "end")
            return y + 44
        self.t(32, y + 22, fonte, 12, "m"); self.t(32, y + 42, "bewild.com.br", 13, "m", MARCA, 700)
        return y + 62
    def salvar(self, nome, H):
        W = self.W
        wpx, hpx = (720, round(H * 1.2)) if W == 600 else (420, round(H))
        head = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {round(H)}" width="{wpx}" height="{hpx}" role="img" aria-labelledby="t d">'
                f'<title id="t">{esc(self.titulo_acess)}</title><desc id="d">{esc(self.desc)}</desc>'
                "<style>.s{font-family:Manrope, 'Helvetica Neue', Helvetica, Arial, sans-serif}.m{font-family:'JetBrains Mono', Menlo, Consolas, monospace}</style>"
                f'<rect width="{W}" height="{round(H)}" fill="#FFFFFF"/>')
        arq = os.path.join(OUT, nome + ("" if W == 600 else "-m") + ".svg")
        open(arq, "w", encoding="utf8").write(head + "".join(self.o) + "</svg>\n")
        return os.path.basename(arq), wpx, hpx


def barras_h(s, y, itens, vmax, cor_destaque=None, sufixo=lambda v: str(v)):
    """itens: (rotulo, nota_direita, valor). Devolve y final."""
    larg = s.W - 64 - 70
    for rot, nota, v in itens:
        s.t(32, y, rot, 14.5, "s", TINTA, 600)
        if nota: s.t(s.W - 32, y, nota, 13 if s.W == 600 else 12, "m", CINZA, anchor="end")
        w = larg * v / vmax
        s.rect(32, y + 8, w, 16, LARANJA if cor_destaque is not None and v == cor_destaque else AZUL, 4)
        s.t(32 + w + 8, y + 21, sufixo(v), 14, "s", TINTA, 700)
        y += 54
    return y

def g_resumo(W):
    s = Svg(W, "Resumo: reforma completa em São Paulo em 585 orçamentos",
            "Orçamento mediano de R$ 74,1 mil; R$ 2.831 por m² na mediana, metade entre R$ 2.499 e R$ 3.283; metragem mediana de 26 m²; regra de bolso R$ 33 mil mais R$ 1.514 por m² entre 21 e 35 m²; 60 a 75 dias úteis de obra; 585 orçamentos de março a novembro de 2026.")
    y = s.cabecalho("RESUMO DO ÍNDICE BEWILD", "Reforma completa em São Paulo: o que dizem 585 orçamentos",
                    "Studios e apartamentos compactos de até 45 m², com projeto, obra, marcenaria, mobiliário e eletros no mesmo orçamento.")
    cards = [("R$ 74,1 mil", "orçamento mediano"), ("R$ 2.831/m²", "mediana; metade entre R$ 2.499 e R$ 3.283"),
             ("26 m²", "metragem mediana"), ("R$ 33 mil + R$ 1.514/m²", "regra de bolso, de 21 a 35 m²"),
             ("60 a 75 dias úteis", "prazo de obra em contrato"), ("585 orçamentos", "de março a novembro de 2026")]
    cols = 2 if W == 600 else 1
    cw = (W - 64 - (cols - 1) * 16) / cols
    for i, (v, l) in enumerate(cards):
        cx = 32 + (i % cols) * (cw + 16); cy = y + (i // cols) * 112
        s.rect(cx, cy, cw, 96, FUNDO, 6); s.rect(cx, cy, 4, 96, AZUL if i % 3 else LARANJA, 2)
        s.t(cx + 20, cy + 42, v, 18 if len(v) > 20 else (22 if len(v) > 16 else 28), "s", TINTA, 700)
        for k, l2 in enumerate(textwrap.wrap(l, 30 if W == 600 else 40)):
            s.t(cx + 20, cy + 66 + k * 17, l2, 13.5, "s", CINZA)
    y += ((len(cards) + cols - 1) // cols) * 112 + 12
    return s.salvar("01-resumo-indice-nov26", s.rodape(y))

def g_hist(W):
    s = Svg(W, "Distribuição do valor por m² de 585 orçamentos de reforma completa",
            "Histograma em faixas de R$ 250 por m²: " + "; ".join(f"a partir de R$ {b}: {n}" for b, n in HIST) + ". Mediana de R$ 2.831; metade central entre R$ 2.499 e R$ 3.283.")
    y = s.cabecalho("VALOR POR M²", "Metade dos orçamentos fica entre R$ 2.499 e R$ 3.283 por m²",
                    "Quantidade de orçamentos em cada faixa de R$ 250 por m². A linha marca a mediana, R$ 2.831.")
    h = 300; x0 = 40; larg = W - x0 - 32; bw = larg / len(HIST); mx = max(n for _, n in HIST)
    base = y + h
    for i, (b, n) in enumerate(HIST):
        bh = (h - 24) * n / mx
        s.rect(x0 + i * bw + 2, base - bh, bw - 4, bh, LARANJA if 2500 <= b < 3250 else AZUL, 3)
        if W == 600 or n >= 40:
            s.t(x0 + i * bw + bw / 2, base - bh - 6, str(n), 12, "m", TINTA, 700, "middle")
    s.line(x0, base, W - 32, base, CINZA)
    for i, (b, n) in enumerate(HIST):
        if i % (2 if W == 600 else 4) == 0:
            s.t(x0 + i * bw, base + 18, (f"{b/1000:.2f}".replace(".", ",").rstrip("0").rstrip(",") + " mil") if b < 5000 else "5 mil+", 12, "m", CINZA, anchor="start")
    xm = x0 + (2831 - 1500) / 250 * bw
    s.line(xm, y - 4, xm, base, TINTA, 1.5, "4 3"); s.t(xm + 6, y + 8, "mediana R$ 2.831", 12.5, "s", TINTA, 700)
    s.t(x0, base + 40, "R$ por m² (início de cada faixa)", 12.5, "s", CINZA)
    return s.salvar("02-distribuicao-valor-m2-nov26", s.rodape(base + 62))

def g_faixas(W):
    s = Svg(W, "Valor por m² por faixa de metragem",
            "; ".join(f"{f}: {brl(v)} por m² ({n} orçamentos)" for f, n, v in FAIXAS))
    y = s.cabecalho("CUSTO POR METRAGEM", "Quanto menor o studio, mais caro o metro quadrado",
                    "Mediana do valor por m² em cada faixa de metragem. O m² cai até perto de 32 m² e depois se estabiliza.")
    y = barras_h(s, y + 10, [(f, f"{n} orçamentos", v) for f, n, v in FAIXAS], 4300, 3825, brl)
    return s.salvar("03-custo-m2-por-metragem-nov26", s.rodape(y - 14))

def g_dispersao(W):
    pts = [tuple(float(a) for a in p.split(",")) for p in PONTOS.split(";")]
    a, b = REGRA
    s = Svg(W, "Valor do orçamento por metragem com a regra de bolso",
            f"Gráfico de dispersão de {len(pts)} orçamentos. Entre 21 e 35 m², a reta robusta (Theil-Sen) é R$ 32.950 mais R$ 1.514 por m²; um studio de 26 m² fica perto de R$ 72 mil.")
    y = s.cabecalho("REGRA DE BOLSO", "R$ 32.950 fixos mais R$ 1.514 por metro quadrado",
                    "Cada ponto é um orçamento. A reta resume os 446 orçamentos de 21 a 35 m²; fora dela estão as escolhas de escopo e de padrão.")
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
    return s.salvar("04-dispersao-regra-de-bolso-nov26", s.rodape(y + h + 60))

def g_predios(W):
    s = Svg(W, "Mesmo prédio, orçamentos diferentes",
            "Menor e maior orçamento em unidades de metragem parecida no mesmo empreendimento: " + "; ".join(f"{p} {m}: {brl(a)} a {brl(b)}" for p, m, a, b in PREDIOS))
    y = s.cabecalho("MESMA PLANTA, PREÇOS DIFERENTES", "No mesmo prédio, o orçamento variou de 11% a 89%",
                    "Menor e maior orçamento de reforma completa em unidades de metragem parecida, em cinco empreendimentos.")
    x0, x1 = 32, W - 32; X = lambda v: x0 + (v - 50000) / (115000 - 50000) * (x1 - x0)
    y += 10
    for p, m, a, b in PREDIOS:
        s.t(32, y, p, 14.5, "s", TINTA, 600); s.t(W - 32, y, m, 12.5, "m", CINZA, anchor="end")
        s.rect(x0, y + 12, x1 - x0, 6, FUNDO, 3); s.rect(X(a), y + 12, X(b) - X(a), 6, LARANJA, 3)
        s.circ(X(a), y + 15, 6, AZUL); s.circ(X(b), y + 15, 6, LARANJA)
        s.t(32, y + 42, f"{brl(a)} a {brl(b)}", 12.5, "m", TINTA, 700)
        s.t(W - 32, y + 42, f"+{round((b / a - 1) * 100)}%", 13, "s", LARANJA, 700, "end")
        y += 74
    return s.salvar("05-mesmo-predio-orcamentos-diferentes-nov26", s.rodape(y - 12))

def g_valor(W):
    s = Svg(W, "Orçamentos por faixa de valor", "; ".join(f"{f}: {num(p)}%" for f, n, p in VALOR))
    y = s.cabecalho("FAIXAS DE INVESTIMENTO", "3 em cada 10 orçamentos ficam entre R$ 65 mil e R$ 75 mil",
                    "Distribuição dos 585 orçamentos por faixa de valor total.")
    y = barras_h(s, y + 10, [(f, f"{n} orçamentos", p) for f, n, p in VALOR], 36, 29.7, lambda v: num(v) + "%")
    return s.salvar("07-faixas-de-investimento-nov26", s.rodape(y - 14))

def g_payback(W):
    refs = [65, 74, 90, 120]; ganhos = [600, 1200, 1800, 2400]
    s = Svg(W, "Em quantos anos a reforma se paga",
            "Mapa de calor: anos de payback para reformas de R$ 65 mil a R$ 120 mil e ganho líquido mensal de R$ 600 a R$ 2.400. Ex.: R$ 74 mil com R$ 1.800 por mês = 3,4 anos.")
    y = s.cabecalho("PAYBACK SIMPLES", "Em quantos anos a reforma se paga?",
                    "Anos = investimento na reforma ÷ ganho líquido que ela cria por mês. Sem juros e sem valorização do imóvel.")
    x0 = 118 if W == 600 else 112; cw = (W - 32 - x0) / 4; ch = 62
    s.t(x0 + 2 * cw, y + 6, "ganho líquido mensal criado pela reforma", 13, "s", CINZA, anchor="middle")
    for j, g in enumerate(ganhos):
        s.t(x0 + j * cw + cw / 2, y + 28, brl(g), 13 if W == 600 else 12, "m", TINTA, 700, "middle")
    y += 38
    for i, r in enumerate(refs):
        s.t(32, y + i * ch + ch / 2 + 5, f"R$ {r} mil", 13, "m", TINTA, 700)
        for j, g in enumerate(ganhos):
            anos = r * 1000 / g / 12
            cor = "#2E7D5B" if anos <= 4 else ("#E9C46A" if anos <= 7 else "#D9634C")
            s.rect(x0 + j * cw + 3, y + i * ch + 3, cw - 6, ch - 6, cor, 6)
            s.t(x0 + j * cw + cw / 2, y + i * ch + ch / 2 + 7, num(anos), 18, "s", "#FFFFFF" if anos <= 4 or anos > 7 else TINTA, 700, "middle")
    y += 4 * ch + 22
    s.t(32, y, "A linha de R$ 74 mil é a mediana do Índice Bewild.", 12.5, "s", CINZA)
    return s.salvar("09-payback-da-reforma-nov26", s.rodape(y + 20, "Conta: Bewild, mediana do Índice nov/2026"))

def g_peso(W):
    im, itbi, ref = 315718, 9472, 74132; tot = im + itbi + ref
    s = Svg(W, "Quanto a reforma pesa no investimento total",
            f"Imóvel de 26 m² a R$ 12.143 por m² = {brl(im)}; ITBI {brl(itbi)}; reforma {brl(ref)}; a reforma é 19% do total de {brl(tot)}.")
    y = s.cabecalho("PESO NO INVESTIMENTO", "A reforma é 19% do investimento num studio de 26 m²",
                    "Imóvel ao preço médio de venda de São Paulo (FipeZap, ago/2026), ITBI de 3% e a reforma mediana do Índice Bewild.")
    x = 32; larg = W - 64
    for v, cor in ((im, AZUL), (itbi, CINZA), (ref, LARANJA)):
        w = larg * v / tot; s.rect(x, y, w, 44, cor); x += w
    y += 72
    for rot, v, cor in (("Imóvel", im, AZUL), ("ITBI", itbi, CINZA), ("Reforma completa", ref, LARANJA)):
        s.rect(32, y - 11, 12, 12, cor, 2); s.t(52, y, rot, 14.5, "s", TINTA, 600)
        s.t(W - 32, y, f"{brl(v)} · {round(v / tot * 100)}%", 13, "m", TINTA, 700, "end"); y += 28
    s.t(32, y + 6, f"Total: {brl(tot)}", 14.5, "s", TINTA, 700)
    return s.salvar("11-peso-da-reforma-no-investimento-nov26", s.rodape(y + 26, "Fontes: Índice Bewild; FipeZap ago/2026"))

def g_bairro(W):
    s = Svg(W, "O bairro muda o m² da reforma, mas muda mais o aluguel",
            "Reforma por m² (mediana do Índice Bewild): " + "; ".join(f"{r} {brl(v)} ({n} orçamentos)" for r, n, v in REGIOES)
            + ". Aluguel anunciado por m² (QuintoAndar e Imovelweb, jul/2026): " + "; ".join(f"{r} R$ {num(v, 2)}" for r, v in ALUGUEL) + ".")
    y = s.cabecalho("BAIRRO: OBRA E ALUGUEL", "O m² da reforma varia até 15% entre regiões; o aluguel, até 23%",
                    "Mediana da reforma por m² em cinco regiões e aluguel anunciado por m² em quatro bairros.")
    s.t(32, y + 4, "REFORMA POR M²", 12.5, "m", MARCA, 700); y += 30
    y = barras_h(s, y, [(r, f"{n} orçamentos", v) for r, n, v in REGIOES], 3600, 3104, brl)
    s.t(32, y, "ALUGUEL ANUNCIADO POR M²", 12.5, "m", MARCA, 700); y += 30
    y = barras_h(s, y, [(r, "", v) for r, v in ALUGUEL], 128, 109.30, lambda v: "R$ " + num(v, 2))
    return s.salvar("12-bairro-obra-x-aluguel-nov26", s.rodape(y - 14, "Fontes: Índice Bewild; QuintoAndar e Imovelweb"))

if __name__ == "__main__":
    for g in (g_resumo, g_hist, g_faixas, g_dispersao, g_predios, g_valor, g_payback, g_peso, g_bairro):
        for W in (600, 420):
            print(*g(W))
