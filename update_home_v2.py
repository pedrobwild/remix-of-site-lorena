import os

file_path = "src/pages/home-bwa-body.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    (
        "Execução previsível e transparente.",
        "Engenharia que entrega no prazo, no orçamento e no padrão"
    ),
    (
        "O que entra no contrato · 01",
        "COMO TRABALHAMOS · 01"
    ),
    (
        "A Bewild assume o processo inteiro. <strong>Você recebe o apartamento pronto</strong>",
        "A Bewild assume o processo inteiro. Seu tempo é valioso,\u00a0entregamos\nseu apartamento pronto, do seu jeito, com zero dedicação com a obra."
    ),
    (
        "<strong>Sem terceirização:</strong> equipe própria de marcenaria, empreita, vidraçaria, elétrica e ar-condicionado.",
        "<strong>Empreita própria, sem terceirização:</strong>\u00a0marcenaria, empreita, vidraçaria, elétrica, hidráulica, ar-condicionado, tudo sob nosso comando e padrão."
    )
]

new_content = content
for old, new in replacements:
    if old in new_content:
        new_content = new_content.replace(old, new)
        print(f"Replaced: {old[:30]}...")
    else:
        print(f"NOT FOUND: {old[:30]}...")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
