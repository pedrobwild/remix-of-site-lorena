#!/usr/bin/env python3
"""Leitura dos gráficos do blog no celular.

Problema medido em 24/11/2026 (navegador a 375 px): o artigo mostra a versão "-m"
com 331 px de largura. Com viewBox de 420, o texto encolhe para 79% e notas de
11 a 12 unidades aparecem com 9 px ou menos.

O que o script faz em cada public/images/blog/**/*-m.svg ainda com viewBox
"0 0 420 H" e tamanho de texto no atributo font-size (os que definem o tamanho
por CSS ficam de fora e saem listados no fim):
  1. corta a margem lateral interna (até 20 unidades de cada lado; a página já
     tem a própria margem), sem cortar nenhum elemento;
  2. sobe os textos menores que 13 unidades até onde couber, no máximo 13,
     sem criar sobreposição de texto com texto ou com marca, sem tirar texto de
     dentro do cartão em que estava e sem passar da margem. A conferência roda
     no Chrome sem interface com duas fontes: Manrope (a da marca) e uma de
     métrica Arial (a que aparece quando o SVG é usado como imagem).
A linha de fonte e o endereço do site, no rodapé, não mudam de tamanho.
Nenhum número, posição ou cor muda. Rodar de novo não altera o que já foi tratado.

Uso: python3 scripts/graficos/leitura_celular.py [--simular]
Precisa de google-chrome (ou CHROME=/caminho) e das fontes Manrope e Liberation
instaladas. Depois de aplicar, atualizar width (e o parâmetro de versão) das
<source> de celular no corpo dos artigos: a largura nova sai no resumo.
"""
import glob, html, json, os, re, subprocess, sys, tempfile

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
BLOG = os.path.join(RAIZ, "public", "images", "blog")
CHROME = os.environ.get("CHROME", "google-chrome")
RODAPE = ("Fonte", "bewild.com.br")

JS = r"""
// As duas fontes da conferência entram por classe no <div> de cada arquivo (ver o <style> da página).
const ALVO=13, CORTES=[20,16,12,8,4,0], CANDS=[13,12.5,12,11.5,11,10.5,10,9.5];
const res={};
const inter=(a,b)=>[Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x),Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)];
for(const dv of document.querySelectorAll('div[data-f]')){
  const svg=dv.querySelector('svg');
  const ts=[...svg.querySelectorAll('text')];
  ts.forEach(t=>{if(/mono|menlo|consolas|courier/i.test(getComputedStyle(t).fontFamily))t.setAttribute('data-mono','');});
  const fonte=k=>{dv.className='p'+k;};
  const rod=ts.map(t=>t.innerHTML.startsWith('Fonte')||t.innerHTML.startsWith('bewild.com.br'));
  const orig=ts.map(t=>parseFloat(t.getAttribute('font-size')));
  const formas=[...svg.querySelectorAll('rect,circle,ellipse,path,polygon,line,polyline')].filter((m,i)=>!(m.tagName==='rect'&&+m.getAttribute('width')>=419));
  const marcas=formas.filter(m=>!['line','polyline'].includes(m.tagName)&&!['none','#FFFFFF','#ffffff','#fff','white',null].includes(m.getAttribute('fill')));
  const mb=marcas.map(m=>m.getBBox()), fb=formas.map(m=>m.getBBox());
  const medir=()=>ts.map(t=>t.getBBox());
  // estado de partida em cada fonte
  const base=[0,1].map(k=>{fonte(k);const b=medir();const pares=new Set(),toca=new Set(),dentro=[];
    for(let i=0;i<b.length;i++){for(let j=i+1;j<b.length;j++){const [ix,iy]=inter(b[i],b[j]);if(ix>2&&iy>2.5)pares.add(i+'-'+j);}
      mb.forEach((m,j)=>{const [ix,iy]=inter(b[i],m);if(ix>1.5&&iy>2){toca.add(i+'-'+j);if(marcas[j].tagName==='rect'&&b[i].x>=m.x-0.5&&b[i].x+b[i].width<=m.x+m.width+0.5)dentro.push([i,j]);}});}
    return {b,pares,toca,dentro};});
  // corte: o maior que não encosta em nenhum elemento, nas duas fontes
  let minX=1e9,maxX=-1e9;for(const k of [0,1])for(const r of base[k].b){if(r.width>0){minX=Math.min(minX,r.x);maxX=Math.max(maxX,r.x+r.width);}}
  for(const r of fb){if(r.width>0||r.height>0){minX=Math.min(minX,r.x);maxX=Math.max(maxX,r.x+r.width);}}
  const corte=CORTES.find(c=>minX>=c+8&&maxX<=420-c-8);
  const ruim=()=>{for(const k of [0,1]){fonte(k);const b=medir(),B=base[k];
      for(let i=0;i<b.length;i++){if(b[i].width>0&&(b[i].x<corte+5||b[i].x+b[i].width>420-corte-5)&&!(B.b[i].x<corte+5||B.b[i].x+B.b[i].width>420-corte-5))return true;
        for(let j=i+1;j<b.length;j++){const [ix,iy]=inter(b[i],b[j]);if(ix>2&&iy>2.5&&!B.pares.has(i+'-'+j))return true;}
        for(let j=0;j<mb.length;j++){const [ix,iy]=inter(b[i],mb[j]);if(ix>1.5&&iy>2&&!B.toca.has(i+'-'+j))return true;}}
      for(const [i,j] of B.dentro){if(b[i].x<mb[j].x-1||b[i].x+b[i].width>mb[j].x+mb[j].width+1)return true;}}
    return false;};
  const grupos=[...new Set(orig.filter((s,i)=>!rod[i]&&s<ALVO))].sort((a,b)=>a-b), novo={};
  if(corte!==undefined)for(const g of grupos){const idx=ts.map((t,i)=>i).filter(i=>!rod[i]&&orig[i]===g);
    for(const c of CANDS){if(c<=g)break;idx.forEach(i=>ts[i].setAttribute('font-size',c));if(!ruim()){novo[g]=c;break;}idx.forEach(i=>ts[i].setAttribute('font-size',g));}}
  const fim=ts.map((t,i)=>rod[i]?null:parseFloat(t.getAttribute('font-size'))).filter(x=>x);
  res[dv.dataset.f]={corte:corte===undefined?null:corte,novo,menorAntes:Math.min(...orig.filter((s,i)=>!rod[i]&&Number.isFinite(s))),menorDepois:Math.min(...fim.filter(Number.isFinite))};
}
document.getElementById('res').textContent=JSON.stringify(res);
"""


def arquivos():
    for f in sorted(glob.glob(os.path.join(BLOG, "**", "*-m.svg"), recursive=True)):
        t = open(f, encoding="utf8").read()
        if re.search(r"""viewBox=['"]0 0 420 [\d.]+['"]""", t) and re.search(r"<text\b[^>]*font-size=", t):
            yield f, t


def fora_do_padrao():
    for f in sorted(glob.glob(os.path.join(BLOG, "**", "*-m.svg"), recursive=True)):
        t = open(f, encoding="utf8").read()
        if re.search(r"""viewBox=['"]0 0 420 [\d.]+['"]""", t) and not re.search(r"<text\b[^>]*font-size=", t):
            yield os.path.relpath(f, BLOG)


def planejar(lista):
    partes = []
    for f, t in lista:
        t = t.replace(' id="t"', "").replace(' id="d"', "").replace(' aria-labelledby="t d"', "")
        partes.append(f'<div data-f="{html.escape(os.path.relpath(f, BLOG))}">{t}</div>')
    pagina = os.path.join(tempfile.mkdtemp(), "leitura.html")
    open(pagina, "w", encoding="utf8").write(
        '<!doctype html><meta charset="utf8"><style>'
        "div.p0 text{font-family:'Manrope ExtraLight',Manrope!important}div.p0 text[data-mono]{font-family:'JetBrains Mono'!important}"
        "div.p1 text{font-family:'Liberation Sans'!important}div.p1 text[data-mono]{font-family:'Liberation Mono'!important}"
        "</style><body>" + "".join(partes) + '<pre id="res"></pre><script>' + JS + "</script>")
    dom = subprocess.run([CHROME, "--headless=new", "--no-sandbox", "--disable-gpu", "--dump-dom", "file://" + pagina],
                         capture_output=True, text=True, timeout=1500).stdout
    return json.loads(html.unescape(re.search(r'<pre id="res">(.*?)</pre>', dom, re.S).group(1)))


def aplicar(f, t, p):
    c = p["corte"]
    if c:
        raiz = re.search(r"<svg\b[^>]*>", t).group(0)
        nova = re.sub(r"""viewBox=(['"])0 0 420 ([\d.]+)\1""", lambda m: f"viewBox={m.group(1)}{c} 0 {420 - 2 * c} {m.group(2)}{m.group(1)}", raiz)
        nova, n = re.subn(r"""(\swidth=)(['"])420\2""", lambda m: f"{m.group(1)}{m.group(2)}{420 - 2 * c}{m.group(2)}", nova)
        assert n == 1 and nova != raiz, f
        t = t.replace(raiz, nova, 1)
    # Uma passada só, pelo tamanho original: aplicar grupo a grupo encadeava as trocas
    # (10 -> 10,5 e depois 10,5 -> 13 pegava de novo o texto que tinha 10).
    mapa = {f"{float(de):g}": para for de, para in p["novo"].items()}
    padrao = re.compile(r"""(<text\b[^>]*?font-size=(['"]))([\d.]+)(\2[^>]*>)(?!""" + "|".join(map(re.escape, RODAPE)) + ")")

    def troca(m):
        de = f"{float(m.group(3)):g}"
        return m.group(1) + (f"{mapa[de]:g}" if de in mapa else m.group(3)) + m.group(4)

    t = padrao.sub(troca, t)
    return t


if __name__ == "__main__":
    lista = list(arquivos())
    plano = planejar(lista)
    resumo = {}
    for f, t in lista:
        rel = os.path.relpath(f, BLOG)
        p = plano[rel]
        pasta = os.path.dirname(rel)
        r = resumo.setdefault(pasta, {"n": 0, "cortes": set(), "antes": [], "depois": []})
        r["n"] += 1
        if p["corte"] is None:
            r["cortes"].add("sem margem")
            continue
        larg = 420 - 2 * p["corte"]
        r["cortes"].add(larg)
        r["antes"].append(p["menorAntes"] * 331 / 420)
        r["depois"].append(p["menorDepois"] * 331 / larg)
        if "--simular" not in sys.argv:
            open(f, "w", encoding="utf8").write(aplicar(f, t, p))
    for pasta, r in resumo.items():
        a = f"{min(r['antes']):.1f} -> {min(r['depois']):.1f} px" if r["antes"] else "sem mudança"
        print(f"{pasta[:56]:56} n={r['n']:2} largura={sorted(r['cortes'], key=str)} menor texto na tela: {a}")
    print("arquivos tratados:", sum(r["n"] for r in resumo.values()))
    resto = list(fora_do_padrao())
    if resto:
        print("fora do padrão (tamanho de texto por CSS), não tratados:", len(resto), sorted({os.path.dirname(r) for r in resto}))
