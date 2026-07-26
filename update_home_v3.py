import os
import re

file_path = "src/pages/home-bwa-body.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Substituir a seção "A Bewild assume o processo inteiro"
pattern_h2 = re.compile(r'<h2 class="bwa-title bwa-certainty-title">.*?</h2>', re.DOTALL)
new_h2 = '<h2 class="bwa-title bwa-certainty-title">\n              A Bewild assume o processo inteiro. Seu tempo é valioso,\u00a0entregamos\nseu apartamento pronto, do seu jeito, com zero dedicação com a obra.\n            </h2>'
content = pattern_h2.sub(new_h2, content)

# Substituir o rótulo
content = content.replace('O que entra no contrato · 01', 'COMO TRABALHAMOS · 01')

# Substituir a subheader de Engenharia
content = content.replace('Execução previsível e transparente.', 'Engenharia que entrega no prazo, no orçamento e no padrão')

# Substituir o item "Sem terceirização" - usando regex para ser flexível com espaços/tags
pattern_terceirizacao = re.compile(r'<li><svg class="bwa-ccard-ico" aria-hidden="true"><use href="#bwa-glyph-suppliers"></use></svg><p><strong>Sem terceirização:</strong> equipe própria de marcenaria, empreita, vidraçaria, elétrica e ar-condicionado.</p></li>')
new_terceirizacao = '<li><svg class="bwa-ccard-ico" aria-hidden="true"><use href="#bwa-glyph-suppliers"></use></svg><p><strong>Equipe própria, sem terceirização:</strong>\u00a0marcenaria, empreita, vidraçaria, elétrica, hidráulica, ar-condicionado, tudo sob nosso comando and padrão.</p></li>'

# Se o regex falhar, tentar uma busca mais simples no texto
if not pattern_terceirizacao.search(content):
    print("Regex for terceirização failed, trying partial match.")
    content = content.replace('<strong>Sem terceirização:</strong> equipe própria de marcenaria, empreita, vidraçaria, elétrica e ar-condicionado.', '<strong>Equipe própria, sem terceirização:</strong>\u00a0marcenaria, empreita, vidraçaria, elétrica, hidráulica, ar-condicionado, tudo sob nosso comando e padrão.')
else:
    content = pattern_terceirizacao.sub(new_terceirizacao, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Update v3 complete.")
