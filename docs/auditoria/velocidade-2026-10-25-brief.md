# Velocidade — brief de 25/10/2026

## Alterações

- Publicação solicitada da home com CSS crítico no head e CSS adiado antes de `#para-quem`. Confirmado no domínio real: HTTP 200, `home-critical-CBSeeatl.css` no head e um link `home-deferred` no corpo.
- Regras completas de `src/AGENTS.md` movidas para `AGENTS.md` na raiz, sem enfraquecer o teste de privacidade. As três falhas foram eliminadas; `llmsTxt` e `useLeadSubmit` já passavam, sem correção necessária.
- SiteAssistant carregado dinamicamente após hidratação e manutenção apenas quando renderizada. CookieBanner permanece imediato: adiar seu download poderia perder uma abertura de preferências.
- JPEG desktop original (1920×1357) convertido, sem recorte, em WebP de 960, 1440 e 1920 px. `picture` e preload compartilham `srcset` e `sizes`; celular mantém o arquivo existente. Variantes: 86.996 / 139.878 / 195.522 bytes.
- Sem alterações em dependências, consentimento, campanhas, provas, base de custo, sitemap ou banco.

## Medições reproduzidas

PageSpeed API recusou a consulta por cota diária excedida. Alternativa: Lighthouse 13.5.0, Chromium do Playwright, simulação mobile padrão, sem aceite de cookies, no domínio real. Uma execução por página: variação de rede/servidor pode afetar o resultado; não são dados de campo nem prova de ganho causal.

| Página | Medição inicial: nota / FCP / LCP / bloqueio estimado | Nova medição: nota / FCP / LCP / bloqueio estimado |
|---|---|---|
| `/` | 78 / 3,0 s / 3,5 s / 110 ms | 86 / 2,7 s / 3,4 s / 110 ms |
| `/orcamento` | 91 / 2,5 s / 3,0 s / 100 ms | 91 / 2,5 s / 3,0 s / 110 ms |
| `/reforma-de-studio-sao-paulo` | 90 / 2,6 s / 3,0 s / 250 ms | 93 / 2,5 s / 2,8 s / 100 ms |

**Importante:** a nova medição ainda encontrou os mesmos chunks iniciais da primeira (`index-hRqcw472.js`, `client-B91uCxzg.js`). A conferência do domínio depois dela ainda mostrou o JPEG desktop original, não as novas variantes. Portanto estas duas execuções medem a versão anterior, já com a home dividida; NÃO representam antes/depois das otimizações de JavaScript e imagem deste brief. A publicação final foi solicitada, mas sua conclusão não foi confirmada nesta conferência. A comparação final depende de a hospedagem servir essa versão.

JavaScript não utilizado na versão publicada: ~106 KiB na home e ~107 KiB nas outras duas páginas, sobretudo o chunk inicial (~162 KiB, ~63 KiB não usados) e o cliente de dados (~54 KiB, ~43–44 KiB não usados). Não removido indiscriminadamente: ambos contêm infraestrutura compartilhada necessária. Nenhuma evidência de recharts, maplibre, tiptap ou framer-motion justifica alterar suas bibliotecas neste escopo.

## Validação

- Suíte inteira: 197 arquivos aprovados; 1.978 testes aprovados e 5 ignorados.
- Compilação automática: OK.
- Navegador local em 414 e 1280 px: imagem carregada, variante mobile preservada, versão desktop selecionada por srcset, sem rolagem horizontal ou erros de JavaScript. Menu mobile → Serviços e botão desktop → Orçamento funcionaram; recusa no banner funcionou; botão do assistente presente no portfólio, conforme captura visual.
- Domínio publicado: HTTP 200, imagem carregada, título e descrição presentes, sem erros de JavaScript.
- Checagem básica de segurança concluída sem achados; análise profunda e dependências não foram refeitas nesta etapa.
- Tipos não executados manualmente por restrição do ambiente; essa verificação pertence ao CI.