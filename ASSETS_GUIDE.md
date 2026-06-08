# Be Wild — Guia de Assets Visuais

Checklist de fotos e imagens necessárias para o site.
Cada item tem prioridade, instrução para o fotógrafo e onde aparece no site.

---

## Prioridades

| Código | Significado |
|--------|-------------|
| **P0** | Bloqueante — sem essa foto, o site exibe placeholder visível |
| **P1** | Importante — melhora muito a conversão, mas não bloqueia |
| **P2** | Complementar — conteúdo editorial, SEO, redes sociais |

---

## P0 — Fotos bloqueantes (fazer primeiro)

### 1. Hero do site — `hero-studio`
- **Onde aparece**: primeira dobra da Home, coluna direita
- **Formato**: 16:9 desktop (1280×720px mínimo) + versão 4:5 mobile
- **Instrução**: Studio entregue com luz natural. Ângulo amplo mostrando cama, mesa de trabalho e cozinha ao mesmo tempo. Sem pessoa posada. Temperatura quente (não HDR). Overlay escuro será aplicado pelo site.

---

### 2. Case Pinheiros 28m² — 2 fotos

**`pinheiros-antes`** — Estado inicial
- Formato: 4:3
- Instrução: Mesmo ângulo exato que a foto "pronto". Studio recém-entregue, sem mobília, paredes nuas.

**`pinheiros-pronto`** — Após Be Wild Reformas
- Formato: 4:3
- Instrução: Ângulo idêntico ao "antes". Studio com cama, iluminação, cozinha. Luz natural. Temperatura quente.

---

### 3. Case Vila Madalena 42m² — 2 fotos

**`vilamadalena-antes`** — Estado antes
- Formato: 4:3
- Instrução: Mesmo ângulo do "pronto". Mobília antiga, sem identidade de short stay.

**`vilamadalena-pronto`** — Após readequação
- Formato: 4:3
- Instrução: Ângulo idêntico. Novo layout, nova iluminação, composição para Airbnb.

---

### 4. Case Consolação 22m² — 2 fotos

**`consolacao-antes`** — Estado com baixa performance
- Formato: 4:3
- Instrução: Foto documental. Mobília sem identidade, iluminação deficiente.

**`consolacao-pronto`** — Após otimização
- Formato: 4:3
- Instrução: Mesmo ângulo. Studio relançado com nova composição e iluminação.

---

### 5. Be Wild Reformas — detalhe de acabamento

**`bewild-detalhe-1`** — Marcenaria ou iluminação
- Formato: 1:1 (quadrado)
- Instrução: Close de marcenaria, LED embutido ou bancada. Temperatura quente, sombras preservadas. Macro.

---

### 6. BeWild Host Care — studio em operação

**`hostcare-studio`** — Studio pronto para hóspede
- Formato: 4:3
- Instrução: Cama com enxoval, luz natural, cozinha equipada. Nenhuma pessoa. Badge "Superhost" pode aparecer ao fundo (screenshot do app, desfocado).

---

### 7. Host Care — relatório mensal

**`hostcare-relatorio`** — Screenshot de transparência financeira
- Formato: 16:9
- Instrução: Screenshot real do relatório mensal com dados sensíveis redigidos (valores mascarados, nomes substituídos). Mostrar estrutura: receita, ocupação, repasse. Pode ser o PDF ou o painel.

---

## P1 — Fotos importantes

| ID | Descrição | Formato | Instrução |
|----|-----------|---------|-----------|
| `pinheiros-operando` | Screenshot do anúncio Airbnb ou dashboard redigido | 4:3 | Dados de ocupação e receita mascarados. Mostrar estrutura de listagem. |
| `vilamadalena-operando` | Avaliação real redigida ou calendário de reservas | 4:3 | Review de 5 estrelas com nome redigido. |
| `bewild-detalhe-2` | Detalhe de enxoval e cama | 1:1 | Cama arrumada, close de textura do lençol. Temperatura quente. |
| `bewild-obra` | Equipe em execução | 16:9 | Equipe em vistoria, medição ou montagem. Obra organizada, com proteção. Sem bagunça. |
| `hostcare-limpeza` | Operação de limpeza entre reservas | 4:3 | Profissional com checklist, enxoval sendo trocado ou fechadura digital. Foto documental premium. |

---

## P2 — Fotos complementares

| ID | Descrição | Onde usar |
|----|-----------|-----------|
| `bairro-pinheiros` | Exterior, rua, entorno de Pinheiros | Conteúdos, casos |
| `bairro-vilamadalena` | Exterior Vila Madalena | Conteúdos |
| `equipe-bewild` | Founder/equipe em reunião ou visita técnica | /sobre |
| `founder-portrait` | Retrato do(s) founder(s) | /sobre |

---

## Direção fotográfica — padrões obrigatórios

- **Luz natural** sempre que possível. Sem flash duro.
- **Sem HDR exagerado**. Contraste médio, temperatura quente (+200K do neutro).
- **Sombras preservadas**. Não clarear demais.
- **Mesmo ângulo** nas fotos antes/depois de cada case. Tripé na mesma posição.
- **Sem pessoas posadas** nos studios. Objetos operacionais são bem-vindos (enxoval, checklist, fechadura).
- **Formato de entrega**: JPG, mínimo 2400px no lado maior, máximo 8MB por arquivo.
- **Nomenclatura**: usar exatamente os IDs desta tabela (ex: `pinheiros-pronto.jpg`).

---

## Como substituir um placeholder por foto real

1. Copiar o arquivo JPG para `/public/assets/` com o nome exato do ID (ex: `/public/assets/hero-studio.jpg`).
2. Abrir `src/components/landing/ImagePlaceholder.tsx`.
3. Localizar o ID correspondente em `BEWILD_ASSETS`.
4. Alterar `src: null` para `src: "/assets/nome-do-arquivo.jpg"`.
5. Rodar `npm run build` e verificar o resultado.

---

*Documento gerado automaticamente pelo sistema de assets da Be Wild. Atualizado em junho de 2026.*
