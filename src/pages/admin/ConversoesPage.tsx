/**
 * /admin/conversoes — painel de conversões de mídia por mês.
 *
 * Lê o espelho próprio dos eventos enviados ao Pixel da Meta e ao Google Ads
 * (analytics_events, tipo `ad_event` — gravado por src/lib/conversions.ts,
 * sem dado pessoal) e agrupa por mês. Cada evento listado foi disparado para
 * as duas plataformas ao mesmo tempo, então os números valem para ambas.
 *
 * Conversões = Lead (orçamento/contato), SubmitApplication (parceiro,
 * incorporadora, indicação) e Contact (clique em e-mail/WhatsApp). Os demais
 * eventos alimentam os públicos de remarketing.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

type AdEventRow = {
  value: { name?: string; content_category?: string } | null;
  created_at: string;
};

type MesResumo = {
  mes: string; // "2026-09"
  rotulo: string; // "set/2026"
  eventos: number;
  conversoes: number;
  engajados: number;
};

type MesEvento = {
  mes: string;
  rotulo: string;
  evento: string;
  quantidade: number;
};

const CONVERSOES = new Set(["Lead", "SubmitApplication", "Contact"]);

const EVENTO_LABEL: Readonly<Record<string, string>> = {
  Lead: "Lead (orçamento/contato)",
  SubmitApplication: "Cadastro (parceiro/incorporadora/indicação)",
  Contact: "Contato (e-mail/WhatsApp)",
  ViewContent: "ViewContent (página de projeto/conteúdo)",
  CliqueProjeto: "Clique em projeto no portfólio",
  IniciouFormulario: "Formulário iniciado",
  VisitanteEngajado: "Visitante engajado",
};

const PAGE = 1000;

function rotuloMes(mes: string): string {
  const [ano, m] = mes.split("-");
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${nomes[Number(m) - 1] ?? m}/${ano}`;
}

export default function ConversoesPage() {
  const [resumo, setResumo] = useState<MesResumo[]>([]);
  const [detalhe, setDetalhe] = useState<MesEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setErro(null);

    // Pagina de 1000 em 1000 (o PostgREST corta nesse teto).
    const rows: AdEventRow[] = [];
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("value, created_at")
        .eq("event_type", "ad_event")
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE - 1);
      if (error) {
        if (id === requestId.current) {
          setErro(`Não foi possível ler os eventos de mídia: ${error.message}`);
          setResumo([]);
          setDetalhe([]);
          setLoading(false);
        }
        return;
      }
      rows.push(...(data as AdEventRow[]));
      if (data.length < PAGE) break;
      offset += PAGE;
    }
    if (id !== requestId.current) return;

    const porMes = new Map<string, MesResumo>();
    const porMesEvento = new Map<string, number>();
    for (const ev of rows) {
      const mes = ev.created_at.slice(0, 7); // "2026-09"
      const nome = typeof ev.value?.name === "string" && ev.value.name ? ev.value.name : "(sem nome)";
      const r = porMes.get(mes) ?? { mes, rotulo: rotuloMes(mes), eventos: 0, conversoes: 0, engajados: 0 };
      r.eventos += 1;
      if (CONVERSOES.has(nome)) r.conversoes += 1;
      if (nome === "VisitanteEngajado") r.engajados += 1;
      porMes.set(mes, r);
      const chave = `${mes}|${nome}`;
      porMesEvento.set(chave, (porMesEvento.get(chave) ?? 0) + 1);
    }

    setResumo([...porMes.values()].sort((a, b) => b.mes.localeCompare(a.mes)));
    setDetalhe(
      [...porMesEvento.entries()]
        .map(([chave, quantidade]) => {
          const [mes, evento] = chave.split("|");
          return { mes, rotulo: rotuloMes(mes), evento, quantidade };
        })
        .sort((a, b) => b.mes.localeCompare(a.mes) || b.quantidade - a.quantidade),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminLayout
      active="conversoes"
      title="Conversões"
      description="Eventos enviados ao Pixel da Meta e ao Google Ads, por mês. Cada evento vale para as duas plataformas — é o que alimenta as conversões e os públicos de remarketing."
    >
      <section className="admin-section">
        <h2 className="admin-section-title">Resumo por mês</h2>
        {erro ? (
          <p className="admin-flash admin-flash--err mono" role="alert">{erro}</p>
        ) : loading ? (
          <p className="mono">carregando…</p>
        ) : resumo.length === 0 ? (
          <p className="mono">
            nenhum evento de mídia registrado ainda. A contagem começa quando os visitantes aceitam
            os cookies e interagem com o site.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Eventos (Meta + Google)</th>
                  <th>Conversões</th>
                  <th>Visitantes engajados</th>
                </tr>
              </thead>
              <tbody>
                {resumo.map((r) => (
                  <tr key={r.mes}>
                    <td>{r.rotulo}</td>
                    <td className="mono">{r.eventos}</td>
                    <td className="mono">{r.conversoes}</td>
                    <td className="mono">{r.engajados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Detalhe por mês e evento</h2>
        {erro ? null : loading ? null : detalhe.length === 0 ? null : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Evento</th>
                  <th>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {detalhe.map((r) => (
                  <tr key={`${r.mes}-${r.evento}`}>
                    <td>{r.rotulo}</td>
                    <td>{EVENTO_LABEL[r.evento] ?? r.evento}</td>
                    <td className="mono">{r.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
