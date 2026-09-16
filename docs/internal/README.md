# docs/internal — material interno (NÃO publicado)

Estes arquivos estavam em `public/` e, por isso, eram servidos publicamente
em `https://bewild.com.br/gpt-knowledge/*.md` e `/bakeoff/proposta-sol.html`
(qualquer pessoa ou crawler podia baixá-los). Contêm estratégia da holding,
decisões de negócio da Bewander, copy travada e material de mentoria.

Movidos para cá na auditoria de 16/09/2026 (achado SEC-01 em
`AUDITORIA_SITE.md`). Nada no código referenciava esses caminhos.

- `gpt-knowledge/` — base de conhecimento usada em agentes/GPTs internos.
- `bakeoff/` — protótipo HTML de proposta (não é página do site).

Se precisarem voltar a ser públicos, essa é uma decisão explícita do negócio,
não um efeito colateral da pasta `public/`.
