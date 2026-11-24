#!/usr/bin/env python3
"""Gráficos e infográficos do Perfil Bewild de Quem Reforma Studio (nov/2026).

Os números NÃO ficam embutidos aqui: saem de src/content/perfilReforma.dados.json,
o mesmo arquivo que alimenta a página /perfil-de-quem-reforma-studio. Refez o
estudo? Rode o script de novo e os gráficos acompanham.

Uso: python3 scripts/graficos/perfil_quem_reforma_2026_11.py
Gera a versão larga (viewBox 600) e a de celular (viewBox 420, sufixo -m) em
public/images/blog/quem-reforma-studio-sao-paulo-perfil/ e imprime, por arquivo,
nome, largura e altura (usados no <img> do artigo e em perfilGraficos.ts).
"""
import json, os, sys, textwrap
sys.path.insert(0, os.path.dirname(__file__))
import pilar_custo_2026_11 as g
from pilar_custo_2026_11 import Svg, AZUL, LARANJA, TINTA, CINZA, LINHA, FUNDO, MARCA

RAIZ = os.path.join(os.path.dirname(__file__), "..", "..")
OUT = os.path.join(RAIZ, "public", "images", "blog", "quem-reforma-studio-sao-paulo-perfil")
D = json.load(open(os.path.join(RAIZ, "src", "content", "perfilReforma.dados.json"), encoding="utf8"))
N = D["base"]["pedidos"]
FONTE = f"Fonte: Perfil Bewild, nov/2026, {N} orçamentos"
NEUTRO = "#C9CED6"


def pct(n, base):
    """Mesmo arredondamento da página (Math.round)."""
    return int(100 * n / base + 0.5)


def pess(n):
    return f"{n} pessoa" if n == 1 else f"{n} pessoas"


def mil(v):
    return f"{v:,}".replace(",", ".")


def barras(s, y, itens, vmax, destaque=(), passo=50, alt=16):
    """itens: (rótulo, nota à direita, valor numérico, texto do valor). Rótulo acima da barra."""
    larg = s.W - 64 - 74
    fn = 12.5 if s.W == 600 else 11.5
    # sem espaço para rótulo e nota na mesma linha: a nota desce para a linha de baixo
    abaixo = any(len(r) * 7.9 + len(n) * fn * 0.62 > s.W - 64 - 12 for r, n, _, _ in itens if n)
    for rot, nota, v, txt in itens:
        s.t(32, y, rot, 14.5, "s", TINTA, 600)
        if nota and abaixo:
            y += 17; s.t(32, y, nota, fn, "m", CINZA)
        elif nota: s.t(s.W - 32, y, nota, fn, "m", CINZA, anchor="end")
        w = max(larg * v / vmax, 2)
        s.rect(32, y + 8, w, alt, LARANJA if rot in destaque else AZUL, 4)
        s.t(32 + w + 8, y + 8 + alt - 3, txt, 14, "s", TINTA, 700)
        y += passo
    return y


def legenda(s, y, itens):
    x = 32
    for cor, txt in itens:
        if x > 32 and x + 18 + len(txt) * 7.1 > s.W - 32: x, y = 32, y + 20
        s.rect(x, y - 10, 12, 12, cor, 3); s.t(x + 18, y, txt, 12.5, "s", TINTA, 600)
        x += 30 + len(txt) * 7.1
    return y + 24


def nota(s, y, txt, larg=None):
    for l in textwrap.wrap(txt, larg or (84 if s.W == 600 else 56)):
        s.t(32, y, l, 12.5, "s", CINZA); y += 17
    return y


def p_resumo(W):
    fin, ori, ch, m2, cv = D["finalidade"], D["origem"], D["chaves"], D["metragem"], D["conversas"]
    alugar = pct(sum(i["pessoas"] for i in fin["itens"] if i["alugar"]), fin["base"])
    fora = pct(sum(i["pessoas"] for i in ori["itens"] if i["fora"]), ori["base"])
    sem = pct(sum(i["pessoas"] for i in ch["itens"] if not i["temChave"]), ch["base"])
    renda = next(t for t in cv["temas"] if t["difere"])
    ra, rm = pct(renda["alugar"], cv["alugar"]), pct(renda["morar"], cv["morar"])
    cards = [(f"{alugar}%", f"vão alugar o imóvel ({fin['base']} pessoas disseram a finalidade)"),
             (f"{fora}%", f"têm telefone de fora da Grande São Paulo ({ori['base']} pessoas)"),
             (f"{m2['mediana']:g} m²".replace(".", ","), f"metragem mediana; metade entre {m2['p25']:g} e {m2['p75']:g} m²"),
             (f"{sem}%", f"pedem o orçamento antes de ter a chave ({ch['base']} pessoas)"),
             (f"{ra}% e {rm}%", "falam de renda: quem vai alugar e quem vai morar"),
             (f"{N} orçamentos", f"de {D['base']['pessoas']} pessoas, de março a novembro de 2026")]
    s = Svg(W, "Quem reforma studio em São Paulo, em seis números",
            "; ".join(f"{v}: {l}" for v, l in cards) + ". Orçamentos de reforma completa enviados pela Bewild.")
    y = s.cabecalho("PERFIL BEWILD · NOV/2026", "Quem reforma studio em São Paulo, em seis números",
                    "Orçamentos de reforma completa enviados pela Bewild para studios e apartamentos de até 45 m².")
    cols = 2 if W == 600 else 1
    cw = (W - 64 - (cols - 1) * 16) / cols
    for i, (v, l) in enumerate(cards):
        cx = 32 + (i % cols) * (cw + 16); cy = y + (i // cols) * 112
        s.rect(cx, cy, cw, 96, FUNDO, 6); s.rect(cx, cy, 4, 96, AZUL if i % 3 else LARANJA, 2)
        s.t(cx + 20, cy + 42, v, 22 if len(v) > 9 else 28, "s", TINTA, 700)
        for k, l2 in enumerate(textwrap.wrap(l, 31 if W == 600 else 42)):
            s.t(cx + 20, cy + 66 + k * 17, l2, 13.5, "s", CINZA)
    y += ((len(cards) + cols - 1) // cols) * 112 + 12
    return s.salvar("01-perfil-em-seis-numeros", s.rodape(y, FONTE))


def p_finalidade(W):
    fin = D["finalidade"]; base = fin["base"]
    alugar = pct(sum(i["pessoas"] for i in fin["itens"] if i["alugar"]), base)
    temp = pct(fin["itens"][0]["pessoas"], base)
    s = Svg(W, "Finalidade do imóvel de quem recebe orçamento de reforma de studio",
            "; ".join(f"{i['rotulo']}: {pct(i['pessoas'], base)}% ({i['pessoas']} pessoas)" for i in fin["itens"]) + f". Base: {base} pessoas.")
    y = s.cabecalho("PARA QUE SERVE O IMÓVEL", f"{alugar}% reformam para alugar, {temp}% por temporada",
                    f"Finalidade declarada por {base} pessoas que receberam orçamento de reforma completa.")
    y = legenda(s, y + 2, [(LARANJA, "vai alugar"), (AZUL, "outras finalidades")])
    y = barras(s, y + 6, [(i["rotulo"], pess(i["pessoas"]), i["pessoas"], f"{pct(i['pessoas'], base)}%") for i in fin["itens"]],
               fin["itens"][0]["pessoas"] * 1.08, {i["rotulo"] for i in fin["itens"] if i["alugar"]})
    return s.salvar("02-finalidade-do-imovel", s.rodape(y - 8, FONTE))


def p_origem(W):
    ori, est = D["origem"], D["estados"]; base = ori["base"]
    fora = pct(sum(i["pessoas"] for i in ori["itens"] if i["fora"]), base)
    estados = ", ".join(f"{e['nome']} ({e['pessoas']})" for e in est["itens"])
    s = Svg(W, "Origem do telefone de quem recebe orçamento de reforma de studio em São Paulo",
            "; ".join(f"{i['rotulo']}: {pct(i['pessoas'], base)}% ({i['pessoas']} pessoas)" for i in ori["itens"])
            + f". Base: {base} pessoas com telefone identificado. Depois de São Paulo, os estados mais frequentes: {estados}.")
    y = s.cabecalho("DE ONDE É O TELEFONE", f"{fora}% têm telefone de fora da Grande São Paulo",
                    f"DDD ou código do país de {base} pessoas com telefone identificado. O DDD mostra onde o número foi habilitado.")
    y = legenda(s, y + 2, [(LARANJA, "fora da Grande São Paulo"), (AZUL, "capital e Grande São Paulo")])
    y = barras(s, y + 6, [(i["rotulo"], pess(i["pessoas"]), i["pessoas"], f"{pct(i['pessoas'], base)}%") for i in ori["itens"]],
               ori["itens"][0]["pessoas"] * 1.08, {i["rotulo"] for i in ori["itens"] if i["fora"]})
    y = nota(s, y + 2, f"Depois de São Paulo, os estados mais frequentes entre {est['base']} pessoas com DDD brasileiro: {estados}.")
    return s.salvar("03-origem-do-telefone", s.rodape(y + 4, FONTE))


def p_chaves(W):
    ch = D["chaves"]; base = ch["base"]
    sem = pct(sum(i["pessoas"] for i in ch["itens"] if not i["temChave"]), base)
    s = Svg(W, "Momento das chaves de quem pede orçamento de reforma de studio",
            "; ".join(f"{i['rotulo']}: {pct(i['pessoas'], base)}% ({i['pessoas']} pessoas)" for i in ch["itens"]) + f". Base: {base} pessoas.")
    y = s.cabecalho("MOMENTO DAS CHAVES", f"{sem}% pedem o orçamento antes de ter a chave",
                    f"Situação informada por {base} das {D['base']['pessoas']} pessoas do estudo ({pct(base, D['base']['pessoas'])}%).")
    y = legenda(s, y + 2, [(LARANJA, "ainda sem a chave"), (AZUL, "já tem a chave")])
    y = barras(s, y + 6, [(i["rotulo"], pess(i["pessoas"]), i["pessoas"], f"{pct(i['pessoas'], base)}%") for i in ch["itens"]],
               ch["itens"][0]["pessoas"] * 1.08, {i["rotulo"] for i in ch["itens"] if not i["temChave"]})
    return s.salvar("04-momento-das-chaves", s.rodape(y - 8, FONTE))


def p_temas(W):
    cv = D["conversas"]; na, nm = cv["alugar"], cv["morar"]
    temas = [(t["tema"], pct(t["alugar"], na), pct(t["morar"], nm), t["difere"]) for t in cv["temas"]]
    renda = next(t for t in temas if t[3])
    s = Svg(W, "Temas das conversas antes do contrato, por finalidade do imóvel",
            f"Parcela das conversas em que o tema aparece, entre {na} pessoas que vão alugar e {nm} que vão morar: "
            + "; ".join(f"{t}: {a}% e {m}%" for t, a, m, _ in temas) + ". Diferença estatística só em aluguel e renda.")
    y = s.cabecalho("O QUE PERGUNTAM ANTES DE CONTRATAR", f"Renda: {renda[1]}% de quem vai alugar, {renda[2]}% de quem vai morar",
                    f"Parcela das conversas em que cada tema aparece: {na} pessoas que vão alugar e {nm} que vão morar.")
    y = legenda(s, y + 2, [(AZUL, "vão alugar"), (LARANJA, "vão morar")])
    larga = W == 600
    x0 = 272 if larga else 60
    larg = W - 32 - x0 - (30 if larga else 34)
    esc = lambda v: x0 + larg * v / 80
    topo = y
    for v in (0, 20, 40, 60, 80):
        s.t(esc(v), topo + 4, f"{v}%", 11, "m", CINZA, anchor="middle")
    y = topo + 14
    y_ini = y
    linhas_y = []
    for tema, a, m, dif in temas:
        if larga:
            s.t(32, y + 15, tema, 12.5, "s", TINTA, 700 if dif else 500); cy = y + 11
        else:
            s.t(32, y + 12, tema, 13, "s", TINTA, 700 if dif else 500); cy = y + 30
        linhas_y.append(cy)
        lo, hi = min(a, m), max(a, m)
        s.line(esc(lo), cy, esc(hi), cy, NEUTRO if not dif else TINTA, 2 if not dif else 2.5)
        for val, cor in ((a, AZUL), (m, LARANJA)):
            s.circ(esc(val), cy, 6, "#FFFFFF"); s.circ(esc(val), cy, 5, cor)
        # valor do menor à esquerda, do maior à direita, para não se sobreporem
        s.t(esc(lo) - 10, cy + 4, f"{lo}%", 12, "s", TINTA, 700, "end")
        s.t(esc(hi) + 10, cy + 4, f"{hi}%", 12, "s", TINTA, 700)
        y += 30 if larga else 46
    for v in (0, 20, 40, 60, 80):
        s.o.insert(0, f'<line x1="{esc(v):.1f}" y1="{y_ini - 2:.1f}" x2="{esc(v):.1f}" y2="{y - 6:.1f}" stroke="{LINHA}" stroke-width="1"/>')
    y = nota(s, y + 18, "Mensagens escritas antes do contrato, de quem escreveu 3 ou mais. Diferença com teste exato de Fisher e correção de Benjamini-Hochberg: só em aluguel e renda.")
    return s.salvar("05-temas-das-conversas", s.rodape(y + 4, FONTE))


def p_regioes(W):
    reg = D["regioes"]; base = reg["base"]; itens = reg["itens"]
    tres = pct(sum(r["pedidos"] for r in itens[:3]), base)
    centro = next(r for r in itens if r["regiao"] == "Centro")
    s = Svg(W, "Orçamentos de reforma por região de São Paulo e parcela para aluguel por temporada",
            "; ".join(f"{r['regiao']}: {r['pedidos']} orçamentos, " + (f"{r['temporadaPct']}% para temporada" if r["temporadaPct"] is not None else "percentual não calculado")
                      for r in itens) + f". Base: {base} orçamentos com bairro informado.")
    y = s.cabecalho("ONDE FICAM OS IMÓVEIS", f"No Centro, {centro['temporadaPct']}% reformam para alugar por temporada",
                    f"Zona Sul, Zona Oeste e Centro somam {tres}% dos {base} orçamentos com bairro informado.")
    larga = W == 600
    paineis = [("ORÇAMENTOS", lambda r: r["pedidos"], lambda r: str(r["pedidos"]), max(r["pedidos"] for r in itens) * 1.1, AZUL),
               ("VÃO ALUGAR POR TEMPORADA", lambda r: r["temporadaPct"], lambda r: f"{r['temporadaPct']}%", 100, LARANJA)]
    pw = (W - 64 - 28) / 2 if larga else W - 64
    y0 = y + 6
    for k, (rot, val, txt, vmax, cor) in enumerate(paineis):
        px = 32 + k * (pw + 28) if larga else 32
        py = y0 if larga else y0 + k * (len(itens) * 46 + 44)
        s.t(px, py, rot, 12, "m", MARCA, 700, extra=' letter-spacing="1"')
        yy = py + 24
        for r in itens:
            s.t(px, yy, r["regiao"], 13.5, "s", TINTA, 600)
            v = val(r)
            if v is None:
                s.t(px, yy + 20, "não calculado (menos de 25 respostas)", 12, "s", CINZA)
            else:
                w = (pw - 52) * v / vmax
                s.rect(px, yy + 7, w, 15, cor, 4); s.t(px + w + 8, yy + 19, txt(r), 13.5, "s", TINTA, 700)
            yy += 46
        fim = yy
    y = fim - 6
    y = nota(s, y + 8, "Temporada: percentual de quem declarou a finalidade em cada região. Os Jardins entram na Zona Sul, como no Índice Bewild.")
    return s.salvar("06-regioes-de-sao-paulo", s.rodape(y + 4, FONTE))


def p_bairros(W):
    bai = D["bairros"]; itens = bai["itens"]; base = bai["base"]
    tres = itens[:3]; soma = sum(b["pedidos"] for b in tres)
    s = Svg(W, f"Bairros de São Paulo com {bai['minimo']} orçamentos de reforma ou mais",
            "; ".join(f"{b['bairro']} {b['pedidos']}" for b in itens) + f". Base: {base} orçamentos com bairro informado.")
    nomes = f"{tres[0]['bairro']}, {tres[1]['bairro']} e {tres[2]['bairro']}"
    y = s.cabecalho("BAIRROS COM MAIS ORÇAMENTOS", f"{nomes} somam {soma} dos {base} orçamentos",
                    f"Os {len(itens)} bairros com {bai['minimo']} orçamentos ou mais, entre os {base} com bairro informado.")
    larga = W == 600
    x0 = 190 if larga else 172
    larg = W - 32 - x0 - 40
    vmax = itens[0]["pedidos"] * 1.05
    y += 6
    for b in itens:
        s.t(32, y + 13, b["bairro"], 13.5 if larga else 12.5, "s", TINTA, 600)
        w = larg * b["pedidos"] / vmax
        s.rect(x0, y, w, 16, LARANJA if b in tres else AZUL, 4)
        s.t(x0 + w + 8, y + 13, str(b["pedidos"]), 13.5, "s", TINTA, 700)
        y += 28
    return s.salvar("07-bairros-com-mais-orcamentos", s.rodape(y + 6, FONTE))


def p_perfis(W):
    per = D["perfis"]; base = per["base"]; itens = per["itens"]
    dois = pct(itens[0]["pessoas"] + itens[1]["pessoas"], base)
    def obs(i):
        return f"{i['m2']:g} m² · {i['ate30Pct']}% até 30 m²" if i["m2"] is not None else "menos de 25 pessoas"
    s = Svg(W, "Seis perfis de quem recebe orçamento de reforma de studio em São Paulo",
            "; ".join(f"{i['nome']}: {pct(i['pessoas'], base)}% ({i['pessoas']} pessoas"
                      + (f", {i['m2']:g} m² de mediana, {i['ate30Pct']}% com até 30 m²)" if i["m2"] is not None else ")") for i in itens)
            + f". Base: {base} pessoas com finalidade e telefone identificados.")
    y = s.cabecalho("SEIS PERFIS", f"Os dois perfis de investidor de temporada somam {dois}%",
                    f"{base} pessoas com finalidade e telefone identificados, com a metragem mediana e a parcela de imóveis de até 30 m² de cada perfil.")
    y = barras(s, y + 8, [(i["nome"], obs(i), i["pessoas"], f"{pct(i['pessoas'], base)}% · {pess(i['pessoas'])}") for i in itens],
               itens[0]["pessoas"] * 1.45, {itens[0]["nome"], itens[1]["nome"]})
    y = nota(s, y - 2, f"Ficaram fora {per['semFinalidade']} pessoas sem finalidade declarada e {per['semTelefone']} sem telefone identificado.")
    return s.salvar("08-seis-perfis", s.rodape(y + 4, FONTE))


def p_metodo(W):
    b = D["base"]; exc = D["exclusoes"]; cob = D["cobertura"]
    data = lambda iso: "/".join(reversed(iso.split("-")))
    s = Svg(W, f"Como o Perfil Bewild foi montado: de {b['negociosIniciais']} negócios a {b['pedidos']} orçamentos",
            f"Partida: {b['negociosIniciais']} negócios com orçamento enviado ao cliente. Saíram: "
            + "; ".join(f"{e['n']} {e['motivo']}" for e in exc) + f". Ficaram {b['pedidos']} orçamentos de {b['pessoas']} pessoas. Cobertura: "
            + "; ".join(f"{c['dado']}: {c['com']} de {c['total']} {c['unidade']}" for c in cob) + ".")
    y = s.cabecalho("COMO O ESTUDO FOI MONTADO", f"De {b['negociosIniciais']} negócios com orçamento enviado a {b['pedidos']} orçamentos",
                    f"A regra de amostra do Índice Bewild de custo de reforma, aplicada em {data(b['consulta'])}.")
    cw = W - 64
    def caixa(y, numero, texto, cor):
        ls = textwrap.wrap(texto, 44 if W == 600 else 30)
        h = max(58, 24 + 17 * len(ls))
        s.rect(32, y, cw, h, FUNDO, 6); s.rect(32, y, 4, h, cor, 2)
        s.t(52, y + h / 2 + 9, numero, 26, "s", TINTA, 700)
        tx = 52 + len(numero) * 17 + 12
        for k, l in enumerate(ls):
            s.t(tx, y + h / 2 + 5 - (len(ls) - 1) * 8.5 + k * 17, l, 13.5, "s", CINZA)
        return y + h
    y = caixa(y + 4, mil(b["negociosIniciais"]), "negócios com orçamento enviado ao cliente, contados uma vez", AZUL)
    y += 22
    s.t(32, y, "SAÍRAM, NESTA ORDEM", 12, "m", MARCA, 700, extra=' letter-spacing="1"'); y += 20
    bw = cw - (230 if W == 600 else 0)
    for e in exc:
        s.t(32, y + 4, f"− {e['n']}", 15, "s", TINTA, 700)
        s.t(92, y + 4, e["motivo"], 13.5, "s", TINTA, 500)
        if W == 600:
            s.rect(32 + 300, y - 8, max((cw - 300) * e["n"] / exc[0]["n"], 2), 14, NEUTRO, 4)
        y += 28
    y = caixa(y + 4, mil(b["pedidos"]), f"orçamentos de {b['pessoas']} pessoas, criados de {data(b['de'])} a {data(b['ate'])}", LARANJA)
    y += 30
    s.t(32, y, "QUANTO DA AMOSTRA TEM CADA INFORMAÇÃO", 12, "m", MARCA, 700, extra=' letter-spacing="1"'); y += 26
    y = barras(s, y, [(c["dado"], f"{c['com']} de {c['total']} {c['unidade']}", c["com"] / c["total"], f"{pct(c['com'], c['total'])}%") for c in cob],
               1.0, (), passo=46, alt=13)
    y = nota(s, y - 4, "Cada percentual do estudo usa como base quem tem aquele dado.")
    return s.salvar("09-como-o-estudo-foi-montado", s.rodape(y + 4, FONTE))


def og():
    """Imagem de compartilhamento (1200×630). Precisa de rsvg-convert, Pillow e das
    fontes Manrope e JetBrains Mono instaladas (as de src/assets/fonts)."""
    import subprocess, tempfile
    from PIL import Image
    from pilar_custo_2026_11 import esc
    fin = D["finalidade"]; base = fin["base"]
    alugar = pct(sum(i["pessoas"] for i in fin["itens"] if i["alugar"]), base)
    o = ['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">'
         "<style>.s{font-family:Manrope, 'Helvetica Neue', Helvetica, Arial, sans-serif}.m{font-family:'JetBrains Mono', Menlo, Consolas, monospace}</style>"
         f'<rect width="1200" height="630" fill="#FFFFFF"/><rect width="520" height="630" fill="{MARCA}"/>']
    def t(x, y, txt, size, cls="s", fill=TINTA, weight=None, extra=""):
        w = f' font-weight="{weight}"' if weight else ""
        o.append(f'<text x="{x}" y="{y}" class="{cls}" font-size="{size}" fill="{fill}"{w}{extra}>{esc(txt)}</text>')
    t(48, 186, "PERFIL BEWILD · NOV/2026", 17, "m", "#9FB3C8", 500, ' letter-spacing="3.5"')
    t(48, 250, "Quem reforma", 46, "s", "#FFFFFF", 700, ' letter-spacing="-1"')
    t(48, 304, "studio em SP:", 46, "s", "#FFFFFF", 700, ' letter-spacing="-1"')
    t(48, 358, f"{alugar}% vão alugar", 46, "s", "#F0A36B", 700, ' letter-spacing="-1"')
    for k, l in enumerate(textwrap.wrap(f"{N} orçamentos de reforma completa de studios e apartamentos compactos em São Paulo.", 36)):
        t(48, 408 + k * 28, l, 19, "s", "#D5DEE8")
    t(48, 582, "bewild.com.br", 17, "m", "#FFFFFF", 700, ' letter-spacing="3"')
    t(576, 70, "PARA QUE SERVE O IMÓVEL", 15, "m", MARCA, 700, ' letter-spacing="3"')
    t(576, 106, f"Finalidade declarada por {base} pessoas.", 21, "s", TINTA, 700)
    y, vmax = 158, fin["itens"][0]["pessoas"]
    for i in fin["itens"]:
        t(576, y, i["rotulo"], 16.5, "s", TINTA, 600)
        w = max(470 * i["pessoas"] / vmax, 3)
        o.append(f'<rect x="576" y="{y + 11}" width="{w:.1f}" height="18" rx="5" fill="{LARANJA if i["alugar"] else AZUL}"/>')
        t(576 + w + 12, y + 26, f"{pct(i['pessoas'], base)}%", 17, "s", TINTA, 700)
        y += 68
    o.append(f'<line x1="576" y1="534" x2="1148" y2="534" stroke="{LINHA}" stroke-width="1"/>')
    for k, l in enumerate(textwrap.wrap("Laranja: vai alugar. Orçamentos de reforma completa enviados pela Bewild de mar. a nov. de 2026, "
                                        "imóveis de até 45 m². Fonte: Perfil Bewild.", 82)):
        t(576, 562 + k * 21, l, 13.5, "s", CINZA)
    o.append("</svg>")
    tmp = os.path.join(tempfile.mkdtemp(), "og.svg")
    open(tmp, "w", encoding="utf8").write("".join(o))
    png = os.path.join(OUT, "og-perfil-quem-reforma-studio.png")
    subprocess.run(["rsvg-convert", "-w", "1200", "-h", "630", tmp, "-o", png], check=True)
    img = Image.open(png).convert("RGBA")
    logo = Image.open(os.path.join(RAIZ, "src", "assets", "bewild-logo-white-480.webp")).convert("RGBA")
    logo = logo.resize((176, round(176 * logo.height / logo.width)), Image.LANCZOS)
    img.alpha_composite(logo, (46, 48))
    img.convert("RGB").save(png, optimize=True)
    return os.path.basename(png), 1200, 630


GRAFICOS = (p_resumo, p_finalidade, p_origem, p_chaves, p_temas, p_regioes, p_bairros, p_perfis, p_metodo)

if __name__ == "__main__":
    g.OUT = OUT
    os.makedirs(OUT, exist_ok=True)
    for f in GRAFICOS:
        for W in (600, 420): print(*f(W))
    if "--og" in sys.argv: print(*og())
