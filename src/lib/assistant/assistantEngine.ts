/**
 * assistantEngine.ts: motor do Assistente Bewild.
 *
 * Não usa IA generativa nem chama nenhum serviço: roda inteiro no navegador.
 * 1. Normaliza a frase (minúsculas, sem acento, abreviações, plural).
 * 2. Reconhece conversa: saudação, agradecimento, despedida, "é robô?",
 *    pedido de humano e negociação (estes dois vão direto para o WhatsApp).
 * 3. Pontua cada item do banco: frase-gatilho (1,5 + 0,5 por palavra extra),
 *    palavra forte (1), palavra fraca (0,5, soma de palavras limitada a 2),
 *    sobreposição com a pergunta e os exemplos (até 1) e bônus de 0,3 se o
 *    item é sugerido na página atual.
 * 4. Abaixo de 1 ponto não arrisca: oferece o WhatsApp.
 *
 * As ações vêm do banco (`assistant_kb.acoes`) e viram `href`: toda URL passa
 * por `safeHref` (src/lib/safeUrl.ts) e link inválido é descartado.
 */
import { safeHref } from "@/lib/safeUrl";

export type KbAction = { tipo: "link" | "whatsapp"; rotulo: string; url?: string };

/**
 * Ações de "link" do banco prontas para virar `href`: URL validada por
 * `safeHref`, sem rótulo vazio. Ações de WhatsApp passam adiante (o link do
 * WhatsApp é sempre montado pelo site, nunca lido do banco).
 */
export function safeKbActions(acoes: unknown): KbAction[] {
  if (!Array.isArray(acoes)) return [];
  const out: KbAction[] = [];
  for (const raw of acoes) {
    if (!raw || typeof raw !== "object") continue;
    const a = raw as Partial<KbAction>;
    const rotulo = typeof a.rotulo === "string" ? a.rotulo.trim() : "";
    if (a.tipo === "whatsapp") {
      out.push({ tipo: "whatsapp", rotulo });
      continue;
    }
    const url = safeHref(a.url);
    if (a.tipo === "link" && url && rotulo) out.push({ tipo: "link", rotulo, url });
  }
  return out;
}

export type KbItem = {
  id: string;
  tema: string;
  status: "pronto" | "whatsapp";
  pergunta: string;
  resposta: string;
  gatilhos: string[];
  palavras_fortes: string[];
  palavras: string[];
  exemplos: string[];
  acoes: KbAction[];
  relacionadas: string[];
  sugerir_em: string[];
  ordem: number;
};

export type ReplyType =
  | "saudacao"
  | "agradecimento"
  | "despedida"
  | "ok"
  | "identidade"
  | "humano"
  | "negociacao"
  | "sem_resposta"
  | "resposta";

export type Reply = {
  tipo: ReplyType;
  texto: string;
  acoes: KbAction[];
  /** ids de itens do banco para oferecer como próximas perguntas */
  sugestoes: string[];
  item: KbItem | null;
  pontos: number;
  hits: string[];
};

export type ReplyContext = {
  /** caminho atual, ex.: "/portfolio" */
  path: string;
  /** ids sugeridos na página atual (recebem bônus de 0,3) */
  pageItems?: string[];
  /** monta o link do WhatsApp oficial com o texto pré-preenchido */
  waHref: (text: string) => string;
};

const SYN: Array<[RegExp, string]> = [
  [/\bvcs?\b/g, "voces"],
  [/\bvoce\b/g, "voces"],
  [/\bqto\b|\bqnto\b/g, "quanto"],
  [/\baptos?\b/g, "apartamento"],
  [/\bm2\b|\bmetros quadrados\b|\bmts?\b/g, "m"],
  [/\btbm?\b/g, "tambem"],
  [/\borc\b/g, "orcamento"],
  [/\bhj\b/g, "hoje"],
  [/\bpq\b/g, "porque"],
  [/\bq\b/g, "que"],
  [/\bobg\w*\b/g, "obrigado"],
  [/\bblz\b/g, "beleza"],
  [/\bair ?b ?n ?b\b/g, "airbnb"],
  [/\bcotacoes?\b/g, "cotacao"],
  [/\bcondominios?\b/g, "condominio"],
  [/\bparcelad[oa]\b/g, "parcelamento"],
  [/\bqdo\b/g, "quando"],
];

export function norm(s: string): string {
  let t = String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/²/g, "2")
    .replace(/(\d)\s*m\b/g, "$1 m")
    .replace(/[^a-z0-9 ]+/g, " ");
  for (const [re, to] of SYN) t = t.replace(re, to);
  t = t
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => {
      if (/oes$|aes$/.test(w) && w.length > 4) return w.slice(0, -3) + "ao";
      if (w.length > 4 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
      return w;
    })
    .join(" ");
  return " " + t + " ";
}

const STOP = new Set(
  "a o e de da do das dos em no na nos nas um uma uns umas para pra por com que se eu voces voce me meu minha isso esse essa isto como qual quais tem ter ja ou mas mais muito sim nao sobre ai la ele ela seu sua ser esta estou sao".split(
    " ",
  ),
);

function toks(t: string): string[] {
  return t
    .trim()
    .split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w));
}

const RE = {
  saudacao: /^\s*(oi+|ola|opa|eai|e ai|bom dia|boa tarde|boa noite|tudo bem|td bem|tudo bom|hello|hi|hey)\b/,
  obrigado: /\b(obrigado|obrigada|valeu|agradeco|brigado|brigada|thanks|grato|grata)\b/,
  tchau: /\b(tchau|ate mais|ate logo|falou|bom fim de semana|boa semana)\b/,
  humano:
    /\b(falar com (alguem|uma pessoa|um humano|atendente|vendedor|vendedora|consultor|a equipe|voces)|atendente|atendimento humano|pessoa de verdade|whatsapp|zap|wpp|me liga|ligacao|telefone|numero de contato|contato de voces)\b/,
  robo: /\b(voces e (humano|robo)|e um robo|e humano|e uma ia|inteligencia artificial|voce e real|robo)\b/,
  negocia:
    /\b(negociacao|negociar|negocia|desconto maior|mais desconto|abaixar o valor|baixar o valor|fechar negocio|fechar com voce|chegar no valor)\b/,
  ok: /^\s*(ok|okay|certo|entendi|beleza|perfeito|show|legal|otimo|bacana|combinado|top|massa|entendido)\s*$/,
};

function score(item: KbItem, t: string, pageItems?: string[]) {
  let s = 0;
  const hits: string[] = [];
  for (const g of item.gatilhos || []) {
    const ng = norm(g).trim();
    if (!ng) continue;
    if (t.indexOf(" " + ng + " ") >= 0) {
      const w = ng.split(" ").length;
      s += w > 1 ? 1.5 + 0.5 * (w - 1) : 1;
      hits.push(g);
    }
  }
  const words = new Set(t.trim().split(" "));
  let kw = 0;
  for (const w of item.palavras_fortes || []) {
    if (words.has(norm(w).trim())) {
      kw += 1;
      hits.push(w);
    }
  }
  for (const w of item.palavras || []) {
    if (words.has(norm(w).trim())) {
      kw += 0.5;
      hits.push(w);
    }
  }
  s += Math.min(kw, 2);
  const bag = new Set(toks(norm(item.pergunta + " " + (item.exemplos || []).join(" "))));
  let ov = 0;
  for (const w of toks(t)) if (bag.has(w)) ov += 0.3;
  s += Math.min(ov, 1);
  if (pageItems && pageItems.indexOf(item.id) >= 0 && s > 0) s += 0.3;
  return { s, hits };
}

/** Itens sugeridos para um caminho: caminho exato > prefixo com "*" > padrão "*". */
export function suggestionsForPath(kb: KbItem[], path: string, max = 3): string[] {
  const p = (path || "/").replace(/\/+$/, "") || "/";
  const byOrder = [...kb].sort((a, b) => a.ordem - b.ordem);
  const exact = byOrder.filter((k) => (k.sugerir_em || []).includes(p));
  if (exact.length) return exact.slice(0, max).map((k) => k.id);
  let best = "";
  for (const k of byOrder)
    for (const s of k.sugerir_em || [])
      if (s.length > 1 && s.endsWith("*") && p.startsWith(s.slice(0, -1)) && s.length > best.length) best = s;
  if (best) return byOrder.filter((k) => k.sugerir_em.includes(best)).slice(0, max).map((k) => k.id);
  return byOrder
    .filter((k) => (k.sugerir_em || []).includes("*"))
    .slice(0, max)
    .map((k) => k.id);
}

/** Remove e-mail, telefone e CPF antes de registrar uma pergunta. */
export function maskPII(text: string): string {
  return String(text || "")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[cpf]")
    .replace(/(\+?\d[\d\s().-]{7,}\d)/g, "[telefone]")
    .slice(0, 300);
}

export function reply(input: string, kb: KbItem[], ctx: ReplyContext): Reply {
  const raw = String(input || "").trim();
  const t = norm(raw);
  const out: Reply = { tipo: "sem_resposta", texto: "", acoes: [], sugestoes: [], item: null, pontos: 0, hits: [] };
  const waText =
    "Olá! Vim pelo site (" + (ctx.path || "/") + "). " +
    (raw.length > 3 ? "Minha dúvida: " + raw : "Gostaria de tirar uma dúvida.");
  const waAction: KbAction = { tipo: "whatsapp", rotulo: "Falar no WhatsApp", url: ctx.waHref(waText) };

  const isHello = RE.saudacao.test(t);
  const isThanks = RE.obrigado.test(t);
  const isBye = RE.tchau.test(t);
  const rest = t
    .replace(RE.saudacao, " ")
    .replace(/\b(tudo bem|td bem|tudo bom|e voce|e voces|como vai)\b/g, " ")
    .replace(RE.obrigado, " ")
    .replace(RE.tchau, " ")
    .replace(/\b(pela ajuda|pela informacao|pela resposta|pelo retorno|pelo contato|pela atencao|muito)\b/g, " ");
  const hasQuestion = toks(rest).length >= 2 || (/\?/.test(raw) && toks(rest).length >= 1);

  let hello = "";
  if (isHello) {
    const m = t.match(/bom dia|boa tarde|boa noite/);
    hello = m ? m[0].charAt(0).toUpperCase() + m[0].slice(1) + "! " : "Oi! ";
  }

  if (!hasQuestion) {
    if (isThanks || isBye) {
      out.tipo = isBye ? "despedida" : "agradecimento";
      out.texto = isBye
        ? "Até mais! Quando quiser, o orçamento é sem custo e sem compromisso."
        : "Por nada! Se surgir outra dúvida, é só escrever aqui.";
      out.acoes = [{ tipo: "link", rotulo: "Solicitar orçamento", url: "/diagnostico" }, waAction];
      return out;
    }
    if (isHello) {
      out.tipo = "saudacao";
      out.texto =
        hello +
        "Sou o assistente da Bewild. Respondo as dúvidas mais comuns sobre reforma, prazo e orçamento. Escolha uma pergunta abaixo ou escreva a sua.";
      return out;
    }
    if (RE.ok.test(t)) {
      out.tipo = "ok";
      out.texto = "Combinado. Quer saber mais alguma coisa?";
      return out;
    }
  }
  if (RE.robo.test(t)) {
    out.tipo = "identidade";
    out.texto =
      hello +
      "Sou um assistente automático, com respostas preparadas pela equipe da Bewild. Para falar com uma pessoa, é só abrir o WhatsApp.";
    out.acoes = [waAction];
    return out;
  }
  if (RE.negocia.test(t)) {
    out.tipo = "negociacao";
    out.texto =
      hello +
      "Condição comercial é com a equipe, que vê o seu caso com você. Toque abaixo e a conversa abre no WhatsApp com a sua mensagem já escrita.";
    out.acoes = [waAction];
    return out;
  }

  const ranked = kb
    .map((it) => {
      const r = score(it, t, ctx.pageItems);
      return { it, s: r.s, hits: r.hits };
    })
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);
  const best = ranked[0];

  if (RE.humano.test(t) && (!best || best.s < 2)) {
    out.tipo = "humano";
    out.texto = hello + "Claro. Toque abaixo e a conversa abre no WhatsApp da equipe, com a sua mensagem já escrita.";
    out.acoes = [waAction];
    return out;
  }
  if (!best || best.s < 1) {
    out.tipo = "sem_resposta";
    out.texto = hello + "Não tenho essa resposta pronta aqui. A equipe responde pelo WhatsApp, com a sua pergunta já escrita.";
    out.acoes = [waAction];
    out.pontos = best ? Math.round(best.s * 10) / 10 : 0;
    return out;
  }

  const it = best.it;
  out.tipo = "resposta";
  out.item = it;
  out.pontos = Math.round(best.s * 10) / 10;
  out.hits = best.hits;
  out.texto = hello + it.resposta + (isThanks ? " E obrigado pelo contato." : "");
  out.acoes = safeKbActions(it.acoes).map((a) =>
    a.tipo === "whatsapp" ? { tipo: "whatsapp", rotulo: a.rotulo || "Falar no WhatsApp", url: ctx.waHref(waText) } : a,
  );
  if (it.status === "whatsapp" && !out.acoes.some((a) => a.tipo === "whatsapp")) out.acoes.push(waAction);
  const sug: string[] = [];
  if (ranked[1] && ranked[1].s >= 1 && ranked[1].it.tema !== it.tema) sug.push(ranked[1].it.id);
  for (const id of it.relacionadas || []) if (sug.indexOf(id) < 0 && id !== it.id) sug.push(id);
  out.sugestoes = sug.slice(0, 3);
  return out;
}
