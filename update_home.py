import os

file_path = "src/pages/home-bwa-body.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Substituições solicitadas (usando strings literais para evitar problemas de escape)
replacements = [
    (
        "<strong>Consultoria:</strong> orientação para o melhor resultado do investimento.",
        "<strong>Consultoria:</strong>\u00a0leitura do imóvel e do perfil de uso para direcionar cada o design e real investido."
    ),
    (
        "<strong>Projeto 3D:</strong> maquete realista com revisões até a aprovação.",
        "<strong>Projeto 3D:</strong>\u00a0maquete realista com rodadas de revisão até você aprovar sem dúvidas"
    ),
    (
        "<strong>Personalização:</strong> cores, materiais e disposição guiados pelo arquiteto.",
        "<strong>Personalização:</strong>\u00a0cores, materiais e layout escolhidos junto ao arquiteto, com foco em durabilidade e estética"
    ),
    (
        "<strong>Projeto executivo:</strong> plantas detalhadas que eliminam improvisos.",
        "<strong>Projeto executivo:</strong>\u00a0plantas detalhadas que eliminam improviso e retrabalho no canteiro."
    ),
    (
        "<strong>Documentação:</strong> ART, CREA e liberação do condomínio.",
        "<strong>Documentação:</strong>\u00a0ART, CREA e aprovação em condomínio resolvidos por nós"
    ),
    (
        "<strong>Acompanhamento:</strong> arquiteto e engenheiro juntos durante toda a obra.",
        "<strong>Acompanhamento:</strong> arquiteto e engenheiro juntos, do desenho à entrega das chaves."
    ),
    (
        "<p class=\"bwa-ccard-sub\">Execução previsível e transparente.</p>",
        "<p class=\"bwa-ccard-sub\">Engenharia que entrega no prazo, no orçamento e no padrão</p>"
    ),
    (
        "<strong>Gestão centralizada:</strong> planejamento, execução e qualidade sob uma única responsabilidade.",
        "<strong>Gestão centralizada:</strong>\u00a0planejamento, execução e qualidade sob uma única responsabilidade — você fala com um só interlocutor"
    ),
    (
        "<strong>Logística integrada:</strong> materiais, fornecedores e entregas coordenados.",
        "<strong>Logística integrada:</strong>\u00a0compra de materiais, fornecedores e entregas coordenados por unicamente por nós"
    ),
    (
        "<strong>Engenheiro dedicado:</strong> vistorias e gestão ativa de cronograma.",
        "<strong>Engenheiro dedicado:</strong>\u00a0vistorias de qualidade frequentes, relatórios semanais e gestão ativa de cronograma, custo e escopo."
    ),
    (
        "<strong>Sem terceirização:</strong>",
        "<strong>Equipe própria, sem terceirização:</strong>"
    ),
    (
        "<strong>Empreita própria, sem terceirização:</strong> equipe própria de marcenaria, empreita, vidraçaria, elétrica e ar-condicionado.",
        "<strong>Empreita própria, sem terceirização:</strong>\u00a0marcenaria, empreita, vidraçaria, elétrica, hidráulica, ar-condicionado, tudo sob nosso comando e padrão."
    ),
    (
        "<h2 class=\"bwa-title bwa-certainty-title\">\n              A Bewild assume o processo inteiro. <strong>Você recebe o apartamento pronto</strong>\n            </h2>",
        "<h2 class=\"bwa-title bwa-certainty-title\">\n              A Bewild assume o processo inteiro. Seu tempo é valioso,\u00a0entregamos\nseu apartamento pronto, do seu jeito, com zero dedicação com a obra.\n            </h2>"
    ),
    (
        "<p class=\"bwa-label bwa-label-light\">O que entra no contrato · 01</p>",
        "<p class=\"bwa-label bwa-label-light\">COMO TRABALHAMOS · 01</p>"
    )
]

new_content = content
for old, new in replacements:
    if old not in new_content:
        print(f"Warning: could not find exact match for: {old[:50]}...")
    new_content = new_content.replace(old, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Update complete.")
