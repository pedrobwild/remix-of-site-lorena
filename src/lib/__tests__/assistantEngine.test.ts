import { describe, expect, it } from "vitest";
import { maskPII, reply, suggestionsForPath, type KbItem } from "@/lib/assistant/assistantEngine";

const base = {
  exemplos: [],
  relacionadas: [],
  palavras: [],
  palavras_fortes: [],
  gatilhos: [],
  sugerir_em: [],
  acoes: [],
};

const KB: KbItem[] = [
  {
    ...base,
    id: "prazo",
    tema: "Prazo",
    status: "pronto",
    pergunta: "Quanto tempo leva a obra?",
    resposta: "O prazo de obra começa em 60 dias úteis para imóveis de até 30 m².",
    gatilhos: ["quanto tempo", "prazo", "tempo de entrega"],
    palavras_fortes: ["prazo"],
    palavras: ["tempo", "demora"],
    acoes: [{ tipo: "link", rotulo: "Ler", url: "/conteudos/quanto-tempo-demora-reforma-apartamento" }],
    sugerir_em: ["*", "/conteudos/quanto-tempo-demora-reforma-apartamento"],
    ordem: 10,
  },
  {
    ...base,
    id: "pagamento",
    tema: "Pagamento",
    status: "pronto",
    pergunta: "Quais são as formas de pagamento?",
    resposta: "Há três caminhos: à vista com desconto, duas parcelas ou até 12 vezes sem juros no cartão.",
    gatilhos: ["forma de pagamento", "formas de pagamento"],
    palavras_fortes: ["pagamento", "cartao", "boleto"],
    sugerir_em: ["/orcamento"],
    ordem: 20,
  },
  {
    ...base,
    id: "escritorio",
    tema: "Atendimento",
    status: "whatsapp",
    pergunta: "Posso ir ao escritório de vocês?",
    resposta: "A equipe combina com você o melhor formato. Fale com eles no WhatsApp.",
    palavras_fortes: ["escritorio", "endereco"],
    sugerir_em: ["/conteudos*"],
    ordem: 30,
  },
];

const ctx = { path: "/", waHref: (t: string) => `https://wa.me/5511911906183?text=${encodeURIComponent(t)}` };

describe("assistantEngine.reply", () => {
  it("responde saudação sem pergunta", () => {
    expect(reply("Bom dia!", KB, ctx).tipo).toBe("saudacao");
    expect(reply("Bom dia!", KB, ctx).texto.startsWith("Bom dia!")).toBe(true);
  });

  it("responde agradecimento e despedida", () => {
    expect(reply("obrigado pelas informações", KB, ctx).tipo).toBe("agradecimento");
    expect(reply("valeu, tchau", KB, ctx).tipo).toBe("despedida");
  });

  it("encontra o item pelo jeito real de perguntar", () => {
    const r = reply("Qual a média o tempo de entrega?", KB, ctx);
    expect(r.tipo).toBe("resposta");
    expect(r.item?.id).toBe("prazo");
    const p = reply("Posso passar em 2 cartões?", KB, ctx);
    expect(p.item?.id).toBe("pagamento");
  });

  it("mantém a saudação junto da resposta", () => {
    const r = reply("Boa tarde, qual o prazo da obra?", KB, ctx);
    expect(r.item?.id).toBe("prazo");
    expect(r.texto.startsWith("Boa tarde!")).toBe(true);
  });

  it("leva negociação e pedido de humano para o WhatsApp", () => {
    const n = reply("esse valor tem negociação?", KB, ctx);
    expect(n.tipo).toBe("negociacao");
    expect(n.acoes[0].tipo).toBe("whatsapp");
    expect(reply("quero falar com um atendente", KB, ctx).tipo).toBe("humano");
  });

  it("não arrisca quando não reconhece a pergunta", () => {
    const r = reply("vocês abrem arquivo skp?", KB, ctx);
    expect(r.tipo).toBe("sem_resposta");
    expect(r.acoes[0].url).toContain("wa.me/5511911906183");
  });

  it("item com status whatsapp sempre oferece o WhatsApp", () => {
    const r = reply("onde fica o escritório de vocês?", KB, ctx);
    expect(r.item?.id).toBe("escritorio");
    expect(r.acoes.some((a) => a.tipo === "whatsapp")).toBe(true);
  });
});

describe("assistantEngine.suggestionsForPath", () => {
  it("prioriza caminho exato, depois prefixo, depois padrão", () => {
    expect(suggestionsForPath(KB, "/conteudos/quanto-tempo-demora-reforma-apartamento")).toEqual(["prazo"]);
    expect(suggestionsForPath(KB, "/conteudos/outro-artigo")).toEqual(["escritorio"]);
    expect(suggestionsForPath(KB, "/orcamento")).toEqual(["pagamento"]);
    expect(suggestionsForPath(KB, "/qualquer")).toEqual(["prazo"]);
  });
});

describe("assistantEngine.maskPII", () => {
  it("remove e-mail, telefone e CPF", () => {
    const m = maskPII("meu email é joao@gmail.com, cel (11) 98765-4321, cpf 123.456.789-00, studio de 25 m");
    expect(m).not.toContain("joao@gmail.com");
    expect(m).not.toContain("98765-4321");
    expect(m).not.toContain("123.456.789-00");
    expect(m).toContain("studio de 25 m");
  });
});
