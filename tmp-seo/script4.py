p='src/pages/home-bwa-body.ts'; s=open(p,encoding='utf-8').read()
old='          <img\\n            class=\\"bwa-hero-image\\"\\n            src=\\"/__l5e/assets-v1/ebfb0e6b-1fec-4bfe-9cc7-e08776e6e674/apartamento-studio-quarto-realista.jpg\\"\\n            width=\\"1920\\"\\n            height=\\"1280\\"\\n            alt=\\"Quarto de studio com cama, marcenaria em acabamento amadeirado e área de estar integrada junto à janela ampla\\"\\n            fetchpriority=\\"high\\"\\n          >'
new='          <picture>\\n            <source media=\\"(max-width: 760px)\\" type=\\"image/webp\\" srcset=\\"/images/home/hero-studio-828.webp\\">\\n            <img\\n              class=\\"bwa-hero-image\\"\\n              src=\\"/__l5e/assets-v1/ebfb0e6b-1fec-4bfe-9cc7-e08776e6e674/apartamento-studio-quarto-realista.jpg\\"\\n              width=\\"1920\\"\\n              height=\\"1280\\"\\n              alt=\\"Quarto de studio com cama, marcenaria em acabamento amadeirado e área de estar integrada junto à janela ampla\\"\\n              fetchpriority=\\"high\\"\\n            >\\n          </picture>'
assert s.count(old)==1, s.count(old)
s=s.replace(old,new)
open(p,'w',encoding='utf-8').write(s)
print('home-bwa-body.ts: picture ok')
