/**
 * FAQ da home a partir do banco: perguntas de `assistant_kb` marcadas como
 * "Mostrar na home" (painel /admin/faq) substituem a lista fixa do HTML.
 * Sem perguntas marcadas ou com erro de leitura, a lista fixa continua no ar.
 * Texto entra via textContent e URLs só depois de safeKbActions.
 */
import { supabase } from "@/integrations/supabase/client";
import { whatsappHref } from "@/components/landing/content";
import { safeKbActions } from "@/lib/assistant/assistantEngine";
import { isExternalHref } from "@/lib/safeUrl";

type Linha = { id: string; pergunta: string; resposta: string; acoes: unknown };

export function hydrateHomeFaq(root: HTMLElement): () => void {
  const ctrl = new AbortController();
  void (async () => {
    const { data, error } = await supabase
      .from("assistant_kb")
      .select("id, pergunta, resposta, acoes")
      .eq("ativo", true)
      .eq("mostrar_na_home", true)
      .order("ordem", { ascending: true });
    if (ctrl.signal.aborted || error || !data || data.length === 0) return;
    const list = root.querySelector<HTMLElement>(".bwa-faq-list");
    if (!list) return;

    const setOpen = (item: HTMLElement, open: boolean) => {
      const answer = item.querySelector<HTMLElement>(".bwa-faq-answer")!;
      item.classList.toggle("bwa-open", open);
      item.querySelector(".bwa-faq-question")!.setAttribute("aria-expanded", String(open));
      answer.style.maxHeight = open ? `${answer.scrollHeight}px` : "0px";
    };

    const items = (data as Linha[]).map((r, i) => {
      const item = document.createElement("article");
      item.className = "bwa-faq-item";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bwa-faq-question";
      const num = document.createElement("span");
      num.className = "bwa-faq-num";
      num.textContent = String(i + 1).padStart(2, "0");
      const strong = document.createElement("strong");
      strong.textContent = r.pergunta;
      const icon = document.createElement("span");
      icon.className = "bwa-faq-icon";
      icon.setAttribute("aria-hidden", "true");
      btn.append(num, strong, icon);

      const answer = document.createElement("div");
      answer.className = "bwa-faq-answer";
      answer.id = `bwa-home-faq-db-${i + 1}`;
      btn.setAttribute("aria-controls", answer.id);
      const p = document.createElement("p");
      p.textContent = r.resposta;
      answer.append(p);
      for (const acao of safeKbActions(r.acoes)) {
        const href = acao.tipo === "whatsapp" ? whatsappHref() : acao.url;
        if (!href) continue;
        const a = document.createElement("a");
        a.className = "bwa-home-faq-link";
        a.href = href;
        a.textContent = `${acao.rotulo || "Falar no WhatsApp"} →`;
        if (isExternalHref(href)) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
        answer.append(a);
      }
      item.append(btn, answer);
      btn.addEventListener("click", () => setOpen(item, !item.classList.contains("bwa-open")), {
        signal: ctrl.signal,
      });
      return item;
    });

    list.replaceChildren(...items);
    items.forEach((item, i) => setOpen(item, i === 0));
  })();
  return () => ctrl.abort();
}
