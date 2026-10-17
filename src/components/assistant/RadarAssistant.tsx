import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askRadar } from "@/lib/assistant/radar.functions";
import { isCollectionQuestion, isMarketQuestion } from "@/lib/assistant/radarData";
import { reply, type KbItem } from "@/lib/assistant/assistantEngine";
import { whatsappHref } from "@/components/landing/content";
import { RadarLink } from "@/components/RadarLink";
import LiveRadarHistory from "./LiveRadarHistory";

export default function RadarAssistant({ kb }: { kb: KbItem[] | null }) {
  const ask = useServerFn(askRadar);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ question: string; answer: string; market: boolean; history?: boolean; bairros?: string[] }>>([]);
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const previous = useRef<{ market: boolean; bairros: string[]; history?: boolean }>({ market: false, bairros: [] });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const input = question.trim();
    if (!input || busy.current) return;
    busy.current = true;
    setLoading(true);
    setQuestion("");
    const market = isMarketQuestion(input, previous.current.market);
    try {
      let answer: string;
      let history = false;
      let bairros: string[] = [];
      if (market) {
        const result = await ask({ data: { question: input, previousBairros: previous.current.bairros, previousHistory: previous.current.history ?? false } });
        answer = result.text;
        history = result.history ?? false;
        bairros = result.bairros;
        previous.current = { market: true, bairros: result.bairros, history: result.history };
      } else {
        answer = reply(input, kb ?? [], { path: "/faq", waHref: (text) => whatsappHref(text) }).texto;
        previous.current = { market: false, bairros: [] };
      }
      setMessages((old) => [...old, { question: input, answer, market, history, bairros }]);
    } catch {
      setMessages((old) => [...old, { question: input, market, answer: market
        ? (isCollectionQuestion(input) || previous.current.history ? "O histórico de coletas do Radar Bewild está indisponível agora." : "Os dados de mercado do Radar Bewild estão indisponíveis agora. Não posso informar números sem a base atual.")
        : "Não foi possível responder agora. Fale com a equipe pelo WhatsApp." }]);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  return (
    <div>
      <form className="bwa-faqpage-ask-form" onSubmit={submit}>
        <label className="bwa-faqpage-ask-label" htmlFor="bewild-question">Sua pergunta</label>
        <textarea id="bewild-question" className="bwa-faqpage-ask-input" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={500} rows={2} required />
        <button className="bwa-button" type="submit" disabled={loading || !question.trim()}>{loading ? "Consultando…" : "Perguntar"} <span aria-hidden="true">→</span></button>
      </form>
      <div aria-live="polite" aria-busy={loading}>
        {loading && <p role="status">Consultando a resposta…</p>}
        {messages.map((message, index) => (
          <article className="bwa-faqpage-ask-answer" key={index}>
            <h3 className="bwa-faqpage-ask-text">{message.question}</h3>
            {message.history && message.bairros ? <LiveRadarHistory bairros={message.bairros} initialAnswer={message.answer} /> : <p className="bwa-radar-answer-text">{message.answer}</p>}
            {message.market && <RadarLink label="Consultar Radar Bewild" className="bwa-faqpage-ask-whats" />}
          </article>
        ))}
      </div>
    </div>
  );
}