
# Diagnóstico — /admin/leads (BewildLeadsAdminPage)

Escopo: `src/pages/admin/BewildLeadsAdminPage.tsx` (338 linhas) + tabela `public.leads` + RLS. Nenhuma correção foi aplicada.

---

## PARTE 1 — BUGS REAIS (com evidência)

### Confirmações que NÃO são bugs (ruled out)
- **Fetch funciona:** lê de `public.leads` (linhas 78–84), colunas batem com o schema. `whatsapp` e `status` são NOT NULL no banco — sem risco de undefined nesses campos.
- **RLS está OK:** `Admins can view leads = is_admin()` para SELECT, idem UPDATE e DELETE; `Anyone can submit a lead` para INSERT. Grants efetivos OK (`has_table_privilege` confirma SELECT/UPDATE para `authenticated` e INSERT para `anon`). Não há o mesmo problema de GRANT que poderia esvaziar a lista.
- **Nenhum link/rota quebrada** dentro deste admin (diferente do bug de `/admin/conteudos/novo`).
- **Acesso a campos nulos** está protegido com `??`, `filter(Boolean)` e `value` checked no `DetailItem`. Não há `.map` que estoure em undefined.
- **Tabela hoje:** `SELECT count(*) FROM leads` → 0 linhas. A tela nunca foi exercitada com dados reais — boa parte da percepção de "não funcional" pode vir do estado vazio puro.

### Bugs reais, do mais grave ao mais leve

**P0 — `load()` engole erros silenciosamente** (linhas 76–87)
```ts
const { data } = await supabase.from("leads").select(...).limit(200);
setRows((data ?? []) as Lead[]);
```
- O `error` do Supabase é descartado. Se a query falhar (rede, RLS, sessão expirada, role errada), a UI mostra exatamente a mesma coisa que "sem leads": *"Nenhum lead ainda…"*. Isso é o sintoma clássico de "parece quebrado, não sei se é bug ou se não tem dado". 
- **Fix:** desestruturar `error`, guardar em estado e renderizar bloco de erro distinto do empty (com botão "tentar de novo").

**P0 — `changeStatus()` também engole erros** (linhas 98–104)
```ts
await supabase.from("leads").update({ status: next }).eq("id", lead.id);
setBusy(null); load();
```
- Sem checar `error`. Se o UPDATE falhar (ex.: sessão admin expirou), o `load()` em seguida vai trazer o status antigo e o usuário vê o dropdown "voltar sozinho" — parece bug fantasma. A persistência em si está correta (UPDATE direto na tabela; RLS permite). 
- **Fix:** checar `error`, exibir toast/alert, e fazer update otimista com rollback.

**P1 — Limite hardcoded de 200 sem indicação e sem paginação** (linha 84)
- `.limit(200)` + sem `count`. Quando passar de 200 leads, o 201º simplesmente some — e os KPIs no topo (Novos/Contatados/…) são calculados em cima de `rows` (linha 120–127), então também ficam errados sem aviso. 
- **Fix mínimo:** pedir `{ count: 'exact' }`, mostrar "exibindo 200 de N" e adicionar paginação ou "carregar mais". Os KPIs deveriam vir de um `count` agregado por status, não do array local.

**P1 — KPIs do topo refletem só o que foi carregado** (linhas 120–127, 136–141)
- Mesma raiz do item anterior. Hoje, com 0 leads, não tem impacto; com volume real, vira métrica falsa no painel.
- **Fix:** consulta separada `select status, count(*) ... group by status` (ou RPC) executada junto do `load()`.

**P2 — Key warning do React no `.map`** (linhas 179–301)
```tsx
{filtered.map((r) => { ...
  return (<> <tr key={r.id}>...</tr> {isOpen && <tr key={`${r.id}-detail`}>...} </>);
})}
```
- O Fragment `<>` dentro do `.map` é o filho direto iterado — ele precisa de `key`, não os `<tr>` internos. Vai gerar warning no console e, em casos de reordenação, pode bagunçar o estado do `<select>` de status. 
- **Fix:** trocar `<>` por `<React.Fragment key={r.id}>` (ou repensar como `<tbody>` por linha).

**P2 — `waLink()` cobre mal números fora do formato BR padrão** (linhas 56–62)
```ts
const withCountry = digits.length === 11 || digits.length === 10 ? `55${digits}` : digits;
```
- 11 dígitos (DDD+9+8) e 10 dígitos (DDD+8, fixo) recebem `55`. Qualquer outro tamanho (ex.: 12 ou 13 que já vem com 55) cai no `else` e é usado como está — o que está certo para "55 + 11" mas erra silenciosamente para entradas em outros formatos. Como `whatsapp` é NOT NULL e validado no form, baixo risco hoje, mas é falha de robustez.
- **Sem mensagem pré-pronta** no link (`?text=`), apesar do briefing pedir "número + texto" — listado também como gap em Parte 2.
- **Fix:** normalizar mais tolerante (sempre garantir prefixo 55, deduplicar se já tiver) e anexar `?text=` parametrizado.

**P2 — Filtro "todos" e contagem usam `r.status ?? "novo"` mas `status` é NOT NULL no banco** (linhas 95, 123)
- Código defensivo desnecessário; não quebra nada, só confunde quem lê. Cosmético.

**P3 — Sem realtime/auto-refresh**
- O comercial precisa apertar F5 para ver lead novo entrando. Não é bug, mas combina com a percepção "não parece funcional".

---

## PARTE 2 — O QUE FALTA (features ausentes)

Nenhuma existe parcialmente — todas seriam do zero, exceto onde indicado.

| Feature | Estado atual | Esforço |
|---|---|---|
| **Busca por nome / telefone / bairro (location)** | 0 — não tem input nenhum | Baixo (filter client-side em cima de `rows`) |
| **Export CSV** | 0 | Baixo (gerar do array filtrado, com BOM p/ Excel pt-BR) |
| **Ordenação por coluna (data, status, tempo)** | Parcial — só ordena por `created_at desc` no fetch | Baixo (estado local de sort) |
| **SLA / speed-to-lead** (quanto tempo o lead está esperando) | 0 — só mostra `fmtDate(created_at)` absoluto | Baixo (helper "há 12 min" + badge vermelho > N horas em status `novo`) |
| **Filtros salvos / views ("novos de hoje", "leads pagos via UTM")** | 0 — só tem filtro por status | Médio (presets fixos primeiro, salvos depois) |
| **Score / priorização de lead** | 0 — campo não existe na tabela | Médio (regra simples: tem `area_m2` + `chaves` + UTM pago = quente; precisa decidir regra com o dono) |
| **Tela de detalhe dedicada do lead** | Hoje só tem o `<dl>` expandível inline | — não pedido, mas ajudaria |
| **Mensagem pré-preenchida no WhatsApp** | 0 — link só com número | Baixíssimo |

---

## Proposta de correção dos BUGS (sem aplicar)

Tudo isolado em **um único arquivo: `src/pages/admin/BewildLeadsAdminPage.tsx`**. Nenhuma mudança de schema, RLS, edge function ou rota.

1. **Adicionar estado de erro** ao `load()` e ao `changeStatus()/deleteLead()`; renderizar bloco de erro distinto do empty; logar `error` no console para diagnóstico.
2. **Update otimista no `changeStatus`** com rollback em erro + toast (`window.alert` já é o padrão usado no `deleteLead`, mantemos consistência por ora).
3. **Pedir `count: 'exact'`** no `.select(..., { count: 'exact' })`, exibir "mostrando X de N", e fazer os KPIs do topo a partir de uma segunda query agregada por status (ou RPC) em vez de `rows`.
4. **Trocar `<>` por `<React.Fragment key={r.id}>`** no `.map`.
5. **Reescrever `waLink`** para sempre normalizar BR + adicionar `?text=` com mensagem padrão tipo *"Oi {nome}, aqui é da Bewild, recebi seu diagnóstico…"* (texto exato a confirmar).
6. **Remover defensivos mortos** (`?? "novo"`) já que `status` é NOT NULL — opcional, só limpeza.

P3 (auto-refresh / realtime) e a Parte 2 inteira **ficam fora** desta rodada de correção — entram em fases separadas para você priorizar.

---

## Próximo passo
Confirma quais itens autoriza para a próxima rodada:
- **(a)** só os P0 (erro silencioso de load + changeStatus),
- **(b)** P0 + P1 (paginação/KPIs corretos),
- **(c)** P0+P1+P2 (tudo de bug, inclusive `waLink` e key do fragment),
- **(d)** tudo de bug **+** algum subset de features da Parte 2 (diga quais).
