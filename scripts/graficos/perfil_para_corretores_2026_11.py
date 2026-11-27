#!/usr/bin/env python3
"""Gráfico e imagem de compartilhamento do artigo para corretores
(/conteudos/perfil-do-comprador-de-studio-sao-paulo-para-corretores, nov/2026).

Os números NÃO ficam embutidos aqui: saem de src/content/perfilReforma.dados.json,
o mesmo arquivo do Perfil Bewild de Quem Reforma Studio. Os seis perfis são a
combinação de duas respostas (finalidade e origem do telefone); este gráfico só
os reagrupa pela ordem em que o corretor faz as perguntas.

Uso: python3 scripts/graficos/perfil_para_corretores_2026_11.py [--og]
Gera a versão larga (viewBox 600) e a de celular (380 de largura, sufixo -m) em
public/images/blog/perfil-do-comprador-de-studio-sao-paulo-para-corretores/ e
imprime, por arquivo, nome, largura e altura (usados no <img> do artigo).
"""
import os, sys, textwrap
sys.path.insert(0, os.path.dirname(__file__))
import pilar_custo_2026_11 as g
import perfil_quem_reforma_2026_11 as p  # aplica o corte e o tamanho mínimo da versão de celular
from pilar_custo_2026_11 import Svg, AZUL, LARANJA, TINTA, CINZA, LINHA, MARCA, esc

SLUG = "perfil-do-comprador-de-studio-sao-paulo-para-corretores"
OUT = os.path.join(p.RAIZ, "public", "images", "blog", SLUG)
D, FONTE, pct = p.D, p.FONTE, p.pct

# Ordem do arquivo de dados -> (pergunta 1, pergunta 2). Se o estudo mudar os perfis,
# o assert abaixo quebra antes de o gráfico sair com rótulo trocado.
PERFIS = [
    ("Investidor de temporada com telefone de fora", "VAI ALUGAR POR TEMPORADA", "Mora fora da Grande São Paulo"),
    ("Investidor de temporada da Grande SP", "VAI ALUGAR POR TEMPORADA", "Mora na Grande São Paulo"),
    ("Investidor de aluguel tradicional", "VAI ALUGAR COM CONTRATO TRADICIONAL", "Mora em São Paulo ou fora"),
    ("Morador da Grande SP", "VAI MORAR", "Mora na Grande São Paulo"),
    ("Morador com telefone de fora", "VAI MORAR", "Mora fora da Grande São Paulo"),
    ("Em dúvida ou uso misto", "AINDA DECIDE OU USO MISTO", "Mora em São Paulo ou fora"),
]
ITENS = D["perfis"]["itens"]
assert [i["nome"] for i in ITENS] == [n for n, _, _ in PERFIS], "perfis do estudo mudaram"
BASE = D["perfis"]["base"]
assert sum(i["pessoas"] for i in ITENS) == BASE


def c_perfis(W):
    linhas = [(q1, q2, i["pessoas"], pct(i["pessoas"], BASE)) for (_, q1, q2), i in zip(PERFIS, ITENS)]
    s = Svg(W, "Duas perguntas separam o comprador de studio em seis perfis",
            "; ".join(f"{q1.capitalize()}, {q2[0].lower() + q2[1:]}: {pc}% ({n} pessoas)" for q1, q2, n, pc in linhas)
            + f". Base: {BASE} pessoas com finalidade e telefone identificados, entre as que receberam orçamento de reforma da Bewild.")
    y = s.cabecalho("PERFIL BEWILD · NOV/2026", "Duas perguntas separam o comprador de studio em seis perfis",
                    f"Para que é o imóvel e onde a pessoa mora. Base: {BASE} pessoas que receberam orçamento de reforma da Bewild.")
    vmax = max(n for _, _, n, _ in linhas)
    atual = None
    for q1, q2, n, pc in linhas:
        if q1 != atual:
            if atual is not None: y += 6
            s.t(32, y, q1, 12 if W == 600 else 13, "m", MARCA, 700, extra=' letter-spacing="1"'); y += 26
            atual = q1
        y = p.barras(s, y, [(q2, p.pess(n), n, f"{pc}%")], vmax, destaque=("Mora fora da Grande São Paulo",) if q1 == "VAI ALUGAR POR TEMPORADA" else (), passo=48)
    y = p.nota(s, y - 2, "Onde mora é lido pelo DDD do telefone, que mostra onde o número foi habilitado, não o endereço atual. "
                         "Laranja: o maior grupo.")
    return s.salvar("01-duas-perguntas-seis-perfis", s.rodape(y + 4, FONTE))


def og():
    """Imagem de compartilhamento (1200×630). Precisa de rsvg-convert, Pillow e das
    fontes Manrope e JetBrains Mono instaladas (as de src/assets/fonts)."""
    import subprocess, tempfile
    from PIL import Image
    o = ['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">'
         "<style>.s{font-family:Manrope, 'Helvetica Neue', Helvetica, Arial, sans-serif}.m{font-family:'JetBrains Mono', Menlo, Consolas, monospace}</style>"
         f'<rect width="1200" height="630" fill="#FFFFFF"/><rect width="520" height="630" fill="{MARCA}"/>']
    def t(x, y, txt, size, cls="s", fill=TINTA, weight=None, extra=""):
        w = f' font-weight="{weight}"' if weight else ""
        o.append(f'<text x="{x}" y="{y}" class="{cls}" font-size="{size}" fill="{fill}"{w}{extra}>{esc(txt)}</text>')
    t(48, 186, "PARA CORRETORES · NOV/2026", 17, "m", "#9FB3C8", 500, ' letter-spacing="3.5"')
    t(48, 250, "Comprador de", 46, "s", "#FFFFFF", 700, ' letter-spacing="-1"')
    t(48, 304, "studio em SP:", 46, "s", "#FFFFFF", 700, ' letter-spacing="-1"')
    t(48, 358, "2 perguntas, 6 perfis", 46, "s", "#F0A36B", 700, ' letter-spacing="-1"')
    for k, l in enumerate(textwrap.wrap(f"Para que é o imóvel e onde a pessoa mora, em {D['base']['pedidos']} orçamentos de reforma enviados pela Bewild.", 36)):
        t(48, 408 + k * 28, l, 19, "s", "#D5DEE8")
    t(48, 582, "bewild.com.br", 17, "m", "#FFFFFF", 700, ' letter-spacing="3"')
    t(576, 70, "OS SEIS PERFIS", 15, "m", MARCA, 700, ' letter-spacing="3"')
    t(576, 106, f"{BASE} pessoas com as duas respostas.", 21, "s", TINTA, 700)
    rot = ["Temporada, mora fora da Grande SP", "Temporada, mora na Grande SP", "Aluguel com contrato tradicional",
           "Vai morar, é da Grande SP", "Vai morar, vem de fora", "Ainda decide ou uso misto"]
    y, vmax = 152, ITENS[0]["pessoas"]
    for r, i in zip(rot, ITENS):
        t(576, y, r, 16.5, "s", TINTA, 600)
        w = max(470 * i["pessoas"] / vmax, 3)
        o.append(f'<rect x="576" y="{y + 10}" width="{w:.1f}" height="16" rx="5" fill="{LARANJA if i is ITENS[0] else AZUL}"/>')
        t(576 + w + 12, y + 24, f"{pct(i['pessoas'], BASE)}%", 17, "s", TINTA, 700)
        y += 61
    o.append(f'<line x1="576" y1="528" x2="1148" y2="528" stroke="{LINHA}" stroke-width="1"/>')
    for k, l in enumerate(textwrap.wrap("Orçamentos de reforma completa enviados pela Bewild de mar. a nov. de 2026, imóveis de até 45 m². "
                                        "Onde mora: DDD do telefone. Fonte: Perfil Bewild.", 82)):
        t(576, 556 + k * 21, l, 13.5, "s", CINZA)
    o.append("</svg>")
    tmp = os.path.join(tempfile.mkdtemp(), "og.svg")
    open(tmp, "w", encoding="utf8").write("".join(o))
    png = os.path.join(OUT, "og-perfil-do-comprador-de-studio.png")
    subprocess.run(["rsvg-convert", "-w", "1200", "-h", "630", tmp, "-o", png], check=True)
    img = Image.open(png).convert("RGBA")
    logo = Image.open(os.path.join(p.RAIZ, "src", "assets", "bewild-logo-white-480.webp")).convert("RGBA")
    logo = logo.resize((176, round(176 * logo.height / logo.width)), Image.LANCZOS)
    img.alpha_composite(logo, (46, 48))
    img.convert("RGB").save(png, optimize=True)
    return os.path.basename(png), 1200, 630


if __name__ == "__main__":
    g.OUT = OUT
    os.makedirs(OUT, exist_ok=True)
    for W in (600, 420): print(*c_perfis(W))
    if "--og" in sys.argv: print(*og())
