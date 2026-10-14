/**
 * Licenças editáveis no painel /admin/licencas (tabela `site_licenses`).
 * Campo vazio no banco = usa o texto padrão daqui; o corpo é Markdown.
 */
import { COMO_CITAR, INDICE_CANONICAL } from "@/content/indiceCusto";

export type LicencaSlug = "cc-by-4-0" | "cc-by-sa-4-0";

export type LicencaPadrao = {
  slug: LicencaSlug;
  nome: string;
  path: string;
  eyebrow: string;
  title: string;
  intro: string;
  body: string;
  seo: { title: string; description: string; ogTitle: string; ogDescription: string };
};

const AVISOS =
  "**Avisos:** Você não tem de cumprir com os termos da licença relativamente a elementos do material que estejam no domínio público ou cuja utilização seja permitida por uma exceção ou limitação que seja aplicável. Não são dadas quaisquer garantias. A licença pode não lhe dar todas as autorizações necessárias para o uso pretendido. Por exemplo, outros direitos, tais como direitos de imagem, de privacidade ou direitos morais, podem limitar o uso do material.";

const SEM_VALOR_LEGAL =
  "Este resumo destaca apenas algumas das principais características e termos da licença real; ele não é a licença e não tem valor legal. Antes de usar o material, revise os termos completos na licença oficial:";

export const LICENCAS: Record<LicencaSlug, LicencaPadrao> = {
  "cc-by-4-0": {
    slug: "cc-by-4-0",
    nome: "CC BY 4.0",
    path: "/licenca-cc-by-4-0",
    eyebrow: "Licença de dados · Bewild",
    title: "Licença CC BY 4.0.",
    intro:
      "Os dados do Índice Bewild de custo de reforma estão disponíveis sob a licença Creative Commons Atribuição 4.0 Internacional (CC BY 4.0): você pode usá-los em reportagens, estudos e materiais próprios, inclusive comercialmente, desde que cite a Bewild como fonte e indique o link da licença.",
    body: `## O que está sob esta licença

A licença vale para os **dados** do [Índice Bewild de custo de reforma](${INDICE_CANONICAL}): os números publicados (mediana, quartis, tabela por faixa de metragem e distribuição de valores) e a tabela agregada em [CSV](/dados/indice-custo-reforma-bewild-2026-10.csv). Você pode copiar, publicar, adaptar e criar a partir deles para qualquer fim, inclusive comercial, sem pedir autorização — basta citar a fonte e indicar a licença.

O restante deste site não está sob a licença: textos, fotografias de obras, projetos e a marca Bewild continuam protegidos pelos direitos autorais da Bewild. Dúvidas sobre um uso específico podem ser enviadas pelo [contato](/contato).

## Resumo oficial da licença (tradução do deed, em português)

**Você tem o direito de:**

- **Compartilhar** — copiar e redistribuir o material em qualquer suporte ou formato para qualquer fim, mesmo que comercial.
- **Adaptar** — remixar, transformar, e criar a partir do material para qualquer fim, mesmo que comercial.

O licenciante não pode revogar estes direitos desde que você respeite os termos da licença.

**De acordo com os termos seguintes:**

- **Atribuição** — Você deve dar o crédito apropriado, prover um link para a licença e indicar se mudanças foram feitas. Você deve fazê-lo em qualquer circunstância razoável, mas de nenhuma maneira que sugira que o licenciante apoia você ou o seu uso.
- **Sem restrições adicionais** — Você não pode aplicar termos jurídicos ou medidas de caráter tecnológico que restrinjam legalmente outros de fazerem algo que a licença permita.

${AVISOS}

## Texto oficial

${SEM_VALOR_LEGAL}

- [Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) — página canônica da licença;
- [Legal Code](https://creativecommons.org/licenses/by/4.0/legalcode) — o texto legal completo, em inglês, que prevalece em caso de divergência;
- [Resumo em português (deed pt-BR)](https://creativecommons.org/licenses/by/4.0/deed.pt-br) — tradução oficial do Creative Commons.

## Como citar

${COMO_CITAR}

Em uma reportagem, um crédito como “Fonte: Bewild — Índice Bewild de custo de reforma (out. 2026), https://bewild.com.br/indice-de-custo-de-reforma. Licença CC BY 4.0.” já atende aos termos. Em trabalhos acadêmicos, use o formato de citação da sua instituição, incluindo a licença.

Se você adaptar os dados (por exemplo, recalcular, agrupar ou converter), indique no material que houve adaptação e mantenha a citação da Bewild — é o que o termo “Atribuição” pede.

## Perguntas frequentes

- **Preciso pedir autorização?** Não. A licença já autoriza o uso para qualquer fim, inclusive comercial, desde que a Bewild seja citada e o link da licença seja indicado.
- **Preciso usar a citação completa?** O termo é dar o crédito apropriado: nome da fonte, link para a página e link para a licença, de forma razoável ao meio (legenda, rodapé ou nota).
- **Posso publicar os dados em outro formato?** Sim — planilha, gráfico ou base nova. Indique que a base original é da Bewild e o que você mudou.

Mais sobre os dados: [Índice Bewild de custo de reforma](${INDICE_CANONICAL}).
`,
    seo: {
      title: "Licença CC BY 4.0 dos dados do Índice Bewild | Bewild",
      description:
        "Os dados do Índice Bewild de custo de reforma estão sob a licença Creative Commons CC BY 4.0: use em reportagens e estudos citando a Bewild. Resumo oficial, texto legal e como citar.",
      ogTitle: "Licença CC BY 4.0 | Bewild",
      ogDescription:
        "Use os dados do Índice Bewild de custo de reforma citando a fonte: resumo oficial da licença CC BY 4.0, texto legal e modelos de citação.",
    },
  },
  "cc-by-sa-4-0": {
    slug: "cc-by-sa-4-0",
    nome: "CC BY-SA 4.0",
    path: "/licenca-cc-by-sa-4-0",
    eyebrow: "Licença · Bewild",
    title: "Licença CC BY-SA 4.0.",
    intro:
      "Materiais da Bewild marcados com CC BY-SA 4.0 (Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional) podem ser usados, inclusive comercialmente, citando a Bewild — e o que for criado a partir deles tem de ser distribuído sob a mesma licença.",
    body: `## O que está sob esta licença

Só os materiais em que a Bewild indicar expressamente “CC BY-SA 4.0”. O restante do site (textos, fotografias de obras, projetos e a marca Bewild) continua protegido pelos direitos autorais da Bewild. Dúvidas sobre um uso específico podem ser enviadas pelo [contato](/contato).

## Resumo oficial da licença (tradução do deed, em português)

**Você tem o direito de:**

- **Compartilhar** — copiar e redistribuir o material em qualquer suporte ou formato para qualquer fim, mesmo que comercial.
- **Adaptar** — remixar, transformar, e criar a partir do material para qualquer fim, mesmo que comercial.

O licenciante não pode revogar estes direitos desde que você respeite os termos da licença.

**De acordo com os termos seguintes:**

- **Atribuição** — Você deve dar o crédito apropriado, prover um link para a licença e indicar se mudanças foram feitas. Você deve fazê-lo em qualquer circunstância razoável, mas de nenhuma maneira que sugira que o licenciante apoia você ou o seu uso.
- **CompartilhaIgual** — Se você remixar, transformar, ou criar a partir do material, tem de distribuir as suas contribuições sob a mesma licença que o original.
- **Sem restrições adicionais** — Você não pode aplicar termos jurídicos ou medidas de caráter tecnológico que restrinjam legalmente outros de fazerem algo que a licença permita.

${AVISOS}

## Texto oficial

${SEM_VALOR_LEGAL}

- [Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/) — página canônica da licença;
- [Legal Code](https://creativecommons.org/licenses/by-sa/4.0/legalcode) — o texto legal completo, em inglês, que prevalece em caso de divergência;
- [Resumo em português (deed pt-BR)](https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br) — tradução oficial do Creative Commons.
`,
    seo: {
      title: "Licença CC BY-SA 4.0 | Bewild",
      description:
        "Materiais da Bewild sob a licença Creative Commons CC BY-SA 4.0: use citando a Bewild e compartilhe adaptações pela mesma licença. Resumo oficial e texto legal.",
      ogTitle: "Licença CC BY-SA 4.0 | Bewild",
      ogDescription:
        "Resumo oficial da licença CC BY-SA 4.0, texto legal e como usar materiais da Bewild citando a fonte.",
    },
  },
};

export const LICENCA_SLUGS = Object.keys(LICENCAS) as LicencaSlug[];

/** Texto do banco quando preenchido; senão o padrão. */
export function mergeLicenca(
  slug: LicencaSlug,
  row: { title?: string | null; intro?: string | null; body?: string | null } | null,
) {
  const p = LICENCAS[slug];
  const pick = (v: string | null | undefined, d: string) => (v && v.trim() ? v : d);
  return { title: pick(row?.title, p.title), intro: pick(row?.intro, p.intro), body: pick(row?.body, p.body) };
}
