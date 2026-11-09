/**
 * Convite de orçamento no topo do artigo (auditoria de SEO, rodada 4,
 * 09/11/2026, ação 2): os artigos recebem 84% das impressões e somavam 0
 * eventos-chave como entrada orgânica, com o único botão para /orcamento no
 * fim do post. O convite entra logo depois da resposta direta.
 */
import { describe, expect, it } from "vitest";
import { insertLeadCta, leadCtaHtml, LEAD_CTA_ID } from "@/lib/postLeadCta";
import { buttonClickDetails } from "@/lib/buttonClicks";

const CTA = "<aside>CTA</aside>";

describe("insertLeadCta", () => {
  it("entra logo depois do primeiro parágrafo de texto", () => {
    expect(insertLeadCta("<p>Resposta direta.</p><p>Mais contexto.</p><h2>Seção</h2>", CTA)).toBe(
      "<p>Resposta direta.</p><aside>CTA</aside><p>Mais contexto.</p><h2>Seção</h2>"
    );
  });

  it("aceita parágrafo com marcação interna e atributos", () => {
    const html =
      '<p class="lead">De <strong>60 a 110</strong> dias úteis, <a href="/x">veja a tabela</a>.</p>\n<p>Depois.</p>';
    expect(insertLeadCta(html, CTA)).toBe(
      '<p class="lead">De <strong>60 a 110</strong> dias úteis, <a href="/x">veja a tabela</a>.</p><aside>CTA</aside>\n<p>Depois.</p>'
    );
  });

  it("pula parágrafo que só tem imagem", () => {
    expect(
      insertLeadCta(
        '<p><img src="/capa.jpg" alt="Planta"></p><p>Resposta direta.</p><p>Fim.</p>',
        CTA
      )
    ).toBe(
      '<p><img src="/capa.jpg" alt="Planta"></p><p>Resposta direta.</p><aside>CTA</aside><p>Fim.</p>'
    );
  });

  it("sinal de maior dentro de um atributo não confunde a leitura das tags", () => {
    const html =
      '<p><img src="/a.jpg" alt="antes > depois"></p><p>Resposta <a href="/x" title="a > b">direta</a>.</p><p>Fim.</p>';
    expect(insertLeadCta(html, CTA)).toBe(
      '<p><img src="/a.jpg" alt="antes > depois"></p><p>Resposta <a href="/x" title="a > b">direta</a>.</p><aside>CTA</aside><p>Fim.</p>'
    );
  });

  // Abertura que termina em dois-pontos apresenta o bloco seguinte (a lista do
  // artigo de NBR 16280, por exemplo): o convite não pode separar os dois.
  it("parágrafo que termina em dois-pontos leva junto o bloco que ele apresenta", () => {
    const html =
      "<p>A norma pede três coisas:</p>\n<ul><li><p>Plano de reforma.</p></li><li>Responsável técnico.</li></ul>\n<p>Depois.</p><h2>Seção</h2>";
    expect(insertLeadCta(html, CTA)).toBe(
      "<p>A norma pede três coisas:</p>\n<ul><li><p>Plano de reforma.</p></li><li>Responsável técnico.</li></ul><aside>CTA</aside>\n<p>Depois.</p><h2>Seção</h2>"
    );
  });

  it("dois-pontos seguido direto de um H2: o convite fica antes do H2", () => {
    expect(insertLeadCta("<p>Veja a seguir:</p><h2>Seção</h2><ul><li>Item</li></ul>", CTA)).toBe(
      "<p>Veja a seguir:</p><aside>CTA</aside><h2>Seção</h2><ul><li>Item</li></ul>"
    );
  });

  it("dois-pontos no último bloco do corpo: o convite fica no fim", () => {
    expect(insertLeadCta("<p>Em resumo:</p>", CTA)).toBe("<p>Em resumo:</p><aside>CTA</aside>");
  });

  it("não entra dentro de citação, lista ou figura", () => {
    const html =
      '<blockquote><p>Citação de abertura.</p></blockquote><ul><li><p>Item.</p></li></ul><figure><img src="/a.jpg" alt=""><figcaption><p>Legenda.</p></figcaption></figure><p>Resposta direta.</p>';
    expect(insertLeadCta(html, CTA)).toBe(`${html}<aside>CTA</aside>`);
  });

  it("sem parágrafo de texto antes do primeiro H2, fica antes desse H2", () => {
    expect(
      insertLeadCta(
        '<figure><img src="/a.jpg" alt=""></figure><h2 id="custo">Custo</h2><p>Texto.</p>',
        CTA
      )
    ).toBe(
      '<figure><img src="/a.jpg" alt=""></figure><aside>CTA</aside><h2 id="custo">Custo</h2><p>Texto.</p>'
    );
  });

  it("o parágrafo depois do primeiro H2 não conta como abertura", () => {
    expect(insertLeadCta("<h2>Custo</h2><p>Texto.</p>", CTA)).toBe(
      "<aside>CTA</aside><h2>Custo</h2><p>Texto.</p>"
    );
  });

  it("corpo sem parágrafo de texto nem H2 fica como está", () => {
    expect(insertLeadCta("", CTA)).toBe("");
    expect(insertLeadCta("<ul><li>Item</li></ul>", CTA)).toBe("<ul><li>Item</li></ul>");
  });
});

describe("leadCtaHtml", () => {
  const mount = (html: string) => {
    const host = document.createElement("div");
    host.innerHTML = html;
    return host;
  };

  it("tem um único link, para o destino pedido, com o rótulo do botão", () => {
    const host = mount(
      leadCtaHtml({
        text: "Envie os dados do imóvel.",
        label: "Solicitar orçamento",
        href: "/orcamento",
      })
    );
    const links = host.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("/orcamento");
    expect(links[0].textContent).toContain("Solicitar orçamento");
    expect(host.textContent).toContain("Envie os dados do imóvel.");
  });

  it("escapa texto e rótulo: nada do conteúdo vira marcação", () => {
    const host = mount(
      leadCtaHtml({
        text: 'Prazo & preço <b>"fechados"</b>',
        label: "Avaliar <meu> studio",
        href: "/orcamento",
      })
    );
    expect(host.querySelector("b")).toBeNull();
    expect(host.querySelector("meu")).toBeNull();
    expect(host.textContent).toContain('Prazo & preço <b>"fechados"</b>');
    expect(host.querySelector("a")!.textContent).toContain("Avaliar <meu> studio");
  });

  it("o clique é medido com a identificação do topo do artigo", () => {
    const host = mount(
      leadCtaHtml({
        text: "Envie os dados do imóvel.",
        label: "Solicitar orçamento",
        href: "/orcamento",
      })
    );
    document.body.appendChild(host);
    try {
      expect(LEAD_CTA_ID).toBe("artigo-topo-orcamento");
      expect(buttonClickDetails(host.querySelector("a")!)?.cta).toBe("artigo-topo-orcamento");
    } finally {
      host.remove();
    }
  });
});
