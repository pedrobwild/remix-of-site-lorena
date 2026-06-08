/**
 * ConteudosPage — /conteudos
 * Content Hub com 6 artigos completos sobre short stay, preparação de ativo e gestão.
 * Sprint 5 — conteúdo real, dados de mercado SP 2025/2026, leitura inline.
 */
import { useState } from "react";
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import {
  ArrowRight,
  BookOpen,
  Building2,
  BarChart3,
  Wrench,
  MapPin,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";

/* ─── Tipos ─────────────────────────────────────────────── */
interface Artigo {
  id: string;
  titulo: string;
  categoria: string;
  categoriaColor: string;
  resumo: string;
  tempoLeitura: string;
  dataPublicacao: string;
  cta: string;
  corpo: React.ReactNode;
}

/* ─── Categorias ─────────────────────────────────────────── */
const CATEGORIAS = [
  {
    icon: Building2,
    label: "Short Stay",
    desc: "Como funciona, o que esperar e como preparar seu imóvel para locação por temporada.",
  },
  {
    icon: Wrench,
    label: "Preparação do ativo",
    desc: "Reforma, mobiliário, decisões de projeto e o que diferencia preparação de obra simples.",
  },
  {
    icon: BarChart3,
    label: "Performance",
    desc: "Ocupação, precificação, canais, sazonalidade e como avaliar se seu imóvel está competitivo.",
  },
  {
    icon: MapPin,
    label: "Bairros de SP",
    desc: "Análise de bairros com potencial para short stay em São Paulo.",
  },
  {
    icon: Shield,
    label: "Riscos e comparativos",
    desc: "Gestão própria vs. profissional. Erros comuns, custos ocultos e como reduzir atrito.",
  },
];

/* ─── Artigos ────────────────────────────────────────────── */
const ARTIGOS: Artigo[] = [
  {
    id: "studio-short-stay",
    titulo: "Como preparar um studio para short stay: o que muda no projeto?",
    categoria: "Preparação do ativo",
    categoriaColor: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    resumo:
      "Reformar para morar e preparar para a diária são duas coisas diferentes. Entenda quais decisões de projeto fazem o imóvel performar melhor — e quais são desperdício.",
    tempoLeitura: "6 min",
    dataPublicacao: "Jun 2026",
    cta: "Ler guia",
    corpo: (
      <div className="space-y-5 text-sm text-white/70 leading-relaxed">
        <p>
          A maioria dos proprietários que prepara um imóvel para o short stay começa pelo erro mais caro: tratar a reforma como se fosse para moradia. O critério é o mesmo — "ficou bonito?" — mas o produto é completamente diferente.
        </p>
        <p>
          Um apartamento para moradia precisa durar décadas com uso moderado. Um studio para short stay precisa durar décadas com uso intenso — e ainda converter bem nas fotos do Airbnb, ser limpo em 45 minutos entre hóspedes, e não gerar chamados de manutenção toda semana.
        </p>

        <h4 className="text-white font-semibold text-base mt-6">O que realmente impacta a performance</h4>

        <p><span className="text-white font-medium">1. Material de piso:</span> Porcelanato 60×60 acetinado parece bonito na foto, mas ranha com facilidade e mostra cada marca de mala. Imóveis de short stay de alto desempenho em São Paulo usam porcelanato matte ou piso vinílico de alta resistência — durável, fotogênico e mais barato de substituir parcialmente.</p>

        <p><span className="text-white font-medium">2. Layout de circulação:</span> Em um studio de 25–35m², cada metro quadrado conta. O erro mais comum é posicionar a cama de forma que ela "preencha" o cômodo visualmente — o que é ótimo para sensação de conforto, mas péssimo para foto. A cama sempre deve ser fotografável de pelo menos dois ângulos.</p>

        <p><span className="text-white font-medium">3. Iluminação:</span> O principal diferencial visual de listings de alto desempenho no Airbnb de São Paulo é iluminação quente e direta. Ponto de luz no teto centralizado é o erro mais comum — iluminação indireta em faixa de LED embutida no forro custa menos e faz diferença brutal nas fotos.</p>

        <p><span className="text-white font-medium">4. Pontos de energia:</span> Studios para short stay precisam de tomadas em quantidade acima do padrão: ao menos 2 tomadas em cada lado da cama (para carregadores), 2 tomadas na bancada de trabalho, 1 tomada USB embutida próxima à entrada. Hóspedes que viajam a trabalho — perfil dominante nos bairros corporativos de SP — pontuam mal imóveis sem pontos de energia suficientes.</p>

        <p><span className="text-white font-medium">5. Facilidade de limpeza:</span> Cortinas de tecido são inimigo declarado do short stay. Cada lavagem é uma hora de trabalho. Persianas de blackout ou cortinas de rolo em tecido técnico custam mais na compra e economizam tempo operacional por anos.</p>

        <h4 className="text-white font-semibold text-base mt-6">O que pode ser simplificado</h4>
        <p>Marmorizado no banheiro, bancada de porcelanito, acabamento de luxo na área de serviço — são investimentos que raramente aparecem nas avaliações de hóspedes. Hóspedes de short stay avaliam: espaço percebido, limpeza, conforto da cama e velocidade do Wi-Fi. Acabamentos premium em áreas de pouca foto têm ROI baixo.</p>

        <h4 className="text-white font-semibold text-base mt-6">A diferença que a Be Wild faz</h4>
        <p>
          A Be Wild projeta para o short stay desde a prancha — não adapta projetos residenciais. Isso significa que cada decisão de material, layout e instalação considera os critérios de performance operacional e fotográfica desde o início. O resultado é um imóvel que fotograga melhor, é mais fácil de operar e tem custo de manutenção previsível.
        </p>
        <p className="text-white/40 text-xs border-t border-white/10 pt-4">
          Este conteúdo é informativo. Cada imóvel tem suas especificidades — o diagnóstico Be Wild considera as características do seu ativo antes de qualquer recomendação.
        </p>
      </div>
    ),
  },
  {
    id: "short-stay-vale-pena-sp",
    titulo: "Short stay ainda vale a pena em São Paulo? Uma análise sem promessa de renda garantida.",
    categoria: "Short Stay",
    categoriaColor: "text-bewild-blue-400 border-bewild-blue/30 bg-bewild-blue/10",
    resumo:
      "Com premissas reais, contexto de mercado e sem prometer renda passiva mágica. O que os dados dizem sobre curta temporada na capital.",
    tempoLeitura: "8 min",
    dataPublicacao: "Jun 2026",
    cta: "Ler análise",
    corpo: (
      <div className="space-y-5 text-sm text-white/70 leading-relaxed">
        <p>
          São Paulo tem aproximadamente 30.000–32.000 listagens ativas no Airbnb em 2026, segundo dados da <a href="https://airbtics.com/annual-airbnb-revenue-in-sao-paulo-brazil-pt" target="_blank" rel="noopener noreferrer" className="text-bewild-blue-400 underline underline-offset-2">Airbtics (2025)</a>. A pergunta que todo investidor faz é inevitável: o mercado está saturado?
        </p>
        <p>
          A resposta honesta é: depende de qual parte do mercado você está olhando.
        </p>

        <h4 className="text-white font-semibold text-base mt-6">O que os dados mostram</h4>
        <p>
          A taxa de ocupação mediana em São Paulo está entre 58–62% segundo a <a href="https://thelatinvestor.com/blogs/news/sao-paulo-airbnb" target="_blank" rel="noopener noreferrer" className="text-bewild-blue-400 underline underline-offset-2">TheLatinvestor (2026)</a>. Isso significa que um imóvel mediano fica ocupado 17–19 noites por mês. Com diária média (ADR) de R$220–R$350 para studios e 1 dormitório em bairros como Pinheiros, Itaim e Vila Madalena, a receita bruta mensal fica em torno de R$3.740–R$6.650.
        </p>
        <p>
          Mas a média esconde uma distorção importante: os <strong className="text-white">top performers chegam a 65–75% de ocupação</strong>, enquanto imóveis mal posicionados ficam abaixo de 50%. A diferença não é o bairro — é a qualidade da preparação e da gestão.
        </p>

        <h4 className="text-white font-semibold text-base mt-6">Por que a "saturação" não é o problema real</h4>
        <p>
          Das ~30.000 listagens ativas em SP, a maioria é operada por proprietários individuais sem preparação profissional: fotos medianas, textos automáticos, precificação estática, atendimento lento. Esse é o padrão contra o qual um imóvel profissionalmente preparado compete — e vence com frequência.
        </p>
        <p>
          Imóveis que combinam preparação voltada para short stay (layout, fotografia, equipamentos) com gestão profissional (precificação dinâmica, listagem otimizada, atendimento 24h) sistematicamente ficam acima da média de ocupação do bairro. Não é garantia — mas é uma vantagem estrutural real.
        </p>

        <h4 className="text-white font-semibold text-base mt-6">Quando o short stay não faz sentido</h4>
        <p>
          Short stay tem custos operacionais maiores que locação convencional: gestora, limpeza entre hóspedes, enxoval, consumíveis, manutenção mais frequente. Imóveis em bairros com baixa demanda de viajantes ou de negócios têm dificuldade de compensar esse custo operacional com diária.
        </p>
        <p>
          Por isso, o diagnóstico é a etapa mais crítica — antes de reformar ou colocar no Airbnb, é preciso entender se aquele ativo específico tem potencial real para o short stay.
        </p>

        <p className="text-white/40 text-xs border-t border-white/10 pt-4">
          Dados de mercado são referência de contexto, não projeção individual. Resultado passado não garante resultado futuro. O desempenho de cada imóvel depende de localização, estado, gestão e condições de mercado específicas.
        </p>
      </div>
    ),
  },
  {
    id: "airbnb-vs-booking",
    titulo: "Airbnb ou Booking? Como os canais de distribuição impactam sua taxa de ocupação.",
    categoria: "Performance",
    categoriaColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    resumo:
      "Cada plataforma tem perfil de hóspede, algoritmo e taxa diferente. Entenda como a estratégia de canais afeta receita e ocupação.",
    tempoLeitura: "7 min",
    dataPublicacao: "Jun 2026",
    cta: "Ler guia",
    corpo: (
      <div className="space-y-5 text-sm text-white/70 leading-relaxed">
        <p>
          A pergunta "qual plataforma devo usar?" é formulada ao contrário. A pergunta certa é: "qual perfil de hóspede meu imóvel atende melhor — e quais plataformas alcançam esse perfil?"
        </p>

        <h4 className="text-white font-semibold text-base mt-6">Airbnb: força nas estadias de experiência</h4>
        <p>
          O Airbnb tem maior penetração entre viajantes de lazer, turismo e visitantes de curta permanência (1–3 noites). O algoritmo prioriza imóveis com alto número de avaliações positivas recentes, taxa de resposta acima de 90% e preço competitivo frente ao mercado local. Superhost aumenta visibilidade em média 25–30% nos resultados de busca.
        </p>
        <p>
          A comissão padrão para o anfitrião é de 3% por reserva confirmada (modelo split, onde o hóspede paga mais 14%). Esse modelo é mais favorável ao anfitrião que a maioria das OTAs (Online Travel Agencies).
        </p>

        <h4 className="text-white font-semibold text-base mt-6">Booking.com: força em viagens corporativas e estadias longas</h4>
        <p>
          O Booking tem maior penetração em viagens corporativas, eventos e estadias médias (3–7 noites). A plataforma opera com comissão mais alta (15–17% para hospedagem), mas o volume de busca internacional é significativamente maior — especialmente para São Paulo, que recebe fluxo constante de executivos e congressistas.
        </p>
        <p>
          Imóveis em bairros corporativos (Itaim Bibi, Vila Olímpia, Brooklin) tipicamente têm melhor performance no Booking que no Airbnb para estadias de semana — o perfil de hóspede de negócios valoriza estabilidade de reserva e sistema de faturamento, não experiência "única".
        </p>

        <h4 className="text-white font-semibold text-base mt-6">Por que a distribuição multicanal é a estratégia correta</h4>
        <p>
          A maior alavanca de ocupação não é escolher a "melhor" plataforma — é estar em múltiplos canais com calendário sincronizado (via PMS como Guesty ou Hostfully) e precificação dinâmica calibrada por demanda. Gestoras que operam em apenas um canal deixam diárias na mesa nas janelas de baixa demanda de cada plataforma.
        </p>
        <p>
          A BeWild Host Care opera nos dois canais simultaneamente com sincronização automática de calendário e precificação dinâmica ajustada por sazonalidade, eventos em SP e comportamento de demanda em tempo real.
        </p>

        <p className="text-white/40 text-xs border-t border-white/10 pt-4">
          Taxas e condições das plataformas podem mudar. Consulte os termos atualizados do Airbnb e Booking.com diretamente nas plataformas.
        </p>
      </div>
    ),
  },
  {
    id: "gestao-propria-vs-profissional",
    titulo: "Gestão própria vs. gestora profissional: o custo real de cada caminho.",
    categoria: "Riscos e comparativos",
    categoriaColor: "text-rose-400 border-rose-400/30 bg-rose-400/10",
    resumo:
      "Além do percentual de administração, existem custos de tempo, erro, manutenção e oportunidade que raramente aparecem na planilha. Veja a comparação completa.",
    tempoLeitura: "9 min",
    dataPublicacao: "Jun 2026",
    cta: "Ver comparativo",
    corpo: (
      <div className="space-y-5 text-sm text-white/70 leading-relaxed">
        <p>
          O raciocínio parece simples: "se a gestora cobra 20–25% da receita, fico com 75–80% gerindo sozinho." O problema é que esse cálculo só compara percentuais — não compara receita total, nem custo operacional real.
        </p>

        <h4 className="text-white font-semibold text-base mt-6">O que a gestão própria realmente custa</h4>

        <p><span className="text-white font-medium">Tempo de atendimento:</span> Em um imóvel com 18–22 reservas por mês (média de short stay em SP), o proprietário gasta em média 3–5h/semana com mensagens de hóspedes, check-in/out, coordenação de limpeza e resolução de problemas. Nas primeiras semanas, esse número pode dobrar.</p>

        <p><span className="text-white font-medium">Precificação estática:</span> O maior erro operacional de proprietários independentes é manter preço fixo ou ajustar manualmente com pouca frequência. Ferramentas de precificação dinâmica (PriceLabs, Wheelhouse) ajustam o preço diariamente com base em demanda, eventos e concorrência. A diferença média de receita entre precificação dinâmica e estática em São Paulo é de 15–30%.</p>

        <p><span className="text-white font-medium">Score e visibilidade:</span> O algoritmo do Airbnb penaliza cancelamentos, atraso em resposta e avaliações abaixo de 4.7. Um proprietário que demora 4h para responder uma mensagem de hóspede (o que é normal em qualquer agenda profissional) já compromete o ranqueamento.</p>

        <p><span className="text-white font-medium">Manutenção reativa:</span> Sem sistema de triagem de problemas, o proprietário recebe diretamente a pressão de hóspede insatisfeito com chuveiro com pressão baixa às 23h de uma sexta-feira.</p>

        <h4 className="text-white font-semibold text-base mt-6">O comparativo real</h4>

        <div className="rounded-xl border border-white/10 overflow-hidden mt-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left p-3 text-white/60 font-medium">Critério</th>
                <th className="text-center p-3 text-white/60 font-medium">Gestão própria</th>
                <th className="text-center p-3 text-bewild-blue-400 font-medium">Gestora profissional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                ["Precificação", "Manual/estática", "Dinâmica — diária"],
                ["Atendimento", "Proprietário 24h", "Equipe dedicada 24h"],
                ["Ranqueamento nas plataformas", "Variável", "Otimizado"],
                ["Manutenção", "Reativa", "Preventiva + ágil"],
                ["Relatórios de receita", "Manual/nenhum", "Mensal detalhado"],
                ["Tempo gasto/semana", "3–8h", "~0h"],
                ["Receita potencial vs. média", "Igual ou abaixo", "Acima da média"],
              ].map(([criterio, proprio, profissional]) => (
                <tr key={criterio}>
                  <td className="p-3 text-white/70">{criterio}</td>
                  <td className="p-3 text-center text-white/40">{proprio}</td>
                  <td className="p-3 text-center text-bewild-blue-400">{profissional}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          A conta final raramente favorece a gestão própria quando o proprietário considera o custo de oportunidade do seu tempo — especialmente para imóveis com receita potencial acima de R$4.000/mês, onde a taxa de gestão é compensada pela diferença de receita gerada por precificação dinâmica e ranqueamento otimizado.
        </p>

        <p className="text-white/40 text-xs border-t border-white/10 pt-4">
          Comparativo baseado em dados de mercado e benchmarks de gestão de short stay em São Paulo. Cada imóvel tem especificidades que afetam o resultado final.
        </p>
      </div>
    ),
  },
  {
    id: "7-erros-short-stay",
    titulo: "Os 7 erros mais comuns de quem prepara imóvel para short stay.",
    categoria: "Preparação do ativo",
    categoriaColor: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    resumo:
      "De material inadequado a layout que dificulta a limpeza. Erros que parecem pequenos e custam caro na operação — identificados a partir de cases reais.",
    tempoLeitura: "5 min",
    dataPublicacao: "Jun 2026",
    cta: "Ler guia",
    corpo: (
      <div className="space-y-4 text-sm text-white/70 leading-relaxed">
        <p>Estes erros aparecem repetidamente em imóveis que chegam ao diagnóstico Bwild já em operação — ou que precisam de reforma antes de começar.</p>

        {[
          {
            n: "1",
            titulo: "Cama fora de posição fotográfica",
            desc: "A principal foto do listing precisa mostrar a cama com espaço visual em pelo menos dois lados. Camas encostadas na parede lateral reduzem o espaço percebido e a taxa de clique no anúncio.",
          },
          {
            n: "2",
            titulo: "Cortinas de tecido",
            desc: "Cada lavagem leva 45–60 minutos de trabalho de limpeza. Imóveis com cortinas de tecido em todas as janelas acumulam custo operacional invisível que corrói a margem ao longo do tempo.",
          },
          {
            n: "3",
            titulo: "Cozinha sem bancada de trabalho clara",
            desc: "Mesmo em studios compactos, hóspedes de short stay avaliam a funcionalidade da cozinha. Bancada escura, sem espaço para trabalho e sem tomadas de fácil acesso é um ponto negativo recorrente em avaliações.",
          },
          {
            n: "4",
            titulo: "Wi-Fi em ponto único central",
            desc: "Em studios com laje de concreto armado, o roteador em posição central pode ter sinal fraco no banheiro e na área de serviço — exatamente onde hóspedes costumam conectar. Dois pontos de acesso (um em cada extremidade) eliminam esse problema.",
          },
          {
            n: "5",
            titulo: "Armazenamento insuficiente",
            desc: "Hóspedes de mais de 3 noites precisam de espaço para malas abertas, roupas e itens de higiene. Imóveis sem armário de corpo inteiro ou sem espaço embaixo da cama têm avaliações piores em estadias médias.",
          },
          {
            n: "6",
            titulo: "Ausência de blackout no quarto",
            desc: "São Paulo tem bairros com intensa iluminação noturna. Imóveis sem cortina blackout ou persiana opaca recebem reclamações consistentes de hóspedes. Custo da solução: R$300–R$600 por janela. Custo de ignorar: avaliação 4 estrelas que penaliza o ranqueamento.",
          },
          {
            n: "7",
            titulo: "Ignorar o enxoval",
            desc: "Enxoval de qualidade — lençol 200 fios, toalha densa, fronha sem marcas — é o item mais mencionado positivamente em reviews de 5 estrelas. É também o item mais ignorado por proprietários que tentam cortar custo na preparação.",
          },
        ].map((item) => (
          <div key={item.n} className="flex gap-3">
            <span className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-bewild-blue/20 border border-bewild-blue/30 flex items-center justify-center text-xs font-bold text-bewild-blue-400">
              {item.n}
            </span>
            <div>
              <p className="font-medium text-white">{item.titulo}</p>
              <p className="mt-1">{item.desc}</p>
            </div>
          </div>
        ))}

        <p className="text-white/40 text-xs border-t border-white/10 pt-4">
          Levantamento baseado em visitas técnicas e diagnósticos realizados pela equipe Be Wild. Cada imóvel é avaliado individualmente.
        </p>
      </div>
    ),
  },
  {
    id: "bairros-sp-short-stay",
    titulo: "Pinheiros, Vila Madalena e Consolação: qual bairro tem mais potencial para short stay?",
    categoria: "Bairros de SP",
    categoriaColor: "text-violet-400 border-violet-400/30 bg-violet-400/10",
    resumo:
      "Análise comparativa com dados de demanda, perfil de hóspede, concorrência e sazonalidade nos bairros mais buscados de São Paulo.",
    tempoLeitura: "7 min",
    dataPublicacao: "Jun 2026",
    cta: "Ver análise",
    corpo: (
      <div className="space-y-5 text-sm text-white/70 leading-relaxed">
        <p>
          São Paulo tem bairros com perfis muito distintos de demanda para short stay. Entender o perfil de cada um ajuda a calibrar expectativas de diária, ocupação e tipo de hóspede — antes de reformar ou colocar no mercado.
        </p>

        <h4 className="text-white font-semibold text-base mt-6">Pinheiros</h4>
        <p>
          Um dos bairros com maior demanda de short stay em São Paulo. Combina público de lazer (restaurantes, bares, cultura) com demanda corporativa (proximidade da Faria Lima). O perfil de hóspede é diversificado — viajante nacional de final de semana, executivo de passagem e nômade digital. ADR de referência para studios bem preparados: R$260–R$340/noite. Ocupação de top performers: 65–73%.
        </p>
        <p>
          O mercado de Pinheiros é competitivo e relativamente maduro. Imóveis sem diferenciação visual e operacional ficam no meio do pack — abaixo da média de ocupação. Com preparação profissional e gestão ativa, a diferença de receita entre o median e o top performer pode ser de R$1.500–R$2.500/mês em um mesmo bairro.
        </p>

        <h4 className="text-white font-semibold text-base mt-6">Vila Madalena</h4>
        <p>
          Bairro com forte apelo de lazer e cultura. O perfil dominante é viajante de final de semana — grupos pequenos, casais, turismo cultural. Isso significa pico de ocupação forte às sextas, sábados e domingos, e janela mais fraca de segunda a quinta. Imóveis com capacidade para 3–4 hóspedes performam especialmente bem aqui.
        </p>
        <p>
          A sazonalidade de Vila Madalena é mais marcada que Pinheiros — eventos culturais (shows no Carioca, festivais de rua) criam picos de demanda que multiplicam a diária. Gestão com precificação dinâmica é especialmente importante para capturar esses picos.
        </p>

        <h4 className="text-white font-semibold text-base mt-6">Consolação</h4>
        <p>
          Bairro de transição entre o centro expandido e Higienópolis. Demanda mista: estudantes de passagem, público de eventos na Paulista (congressos, shows) e hóspedes de custo-benefício que querem proximidade da Paulista sem pagar o ticket de Jardins. ADR menor que Pinheiros — mas mercado menos saturado em imóveis de qualidade.
        </p>
        <p>
          O potencial de Consolação está sub-explorado. Studios compactos (22–30m²) bem preparados nessa região têm menor custo de preparação e competem em nicho menos disputado — o que pode resultar em melhor relação investimento/retorno que bairros mais valorizados.
        </p>

        <h4 className="text-white font-semibold text-base mt-6">Qual tem mais potencial?</h4>
        <p>
          Depende do imóvel e do objetivo do proprietário. Para maximizar receita bruta em imóvel já preparado: Pinheiros e Itaim Bibi. Para melhor relação investimento/retorno com imóvel a preparar: Consolação e Vila Mariana. Para demandar de negócios com alta ocupação de semana: Vila Olímpia e Brooklin.
        </p>
        <p>
          O diagnóstico Be Wild avalia o potencial específico do seu ativo considerando bairro, metragem, estado atual e perfil de imóvel — sem generalizar por bairro.
        </p>

        <p className="text-white/40 text-xs border-t border-white/10 pt-4">
          Dados de referência baseados em <a href="https://airbtics.com/annual-airbnb-revenue-in-sao-paulo-brazil-pt" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Airbtics (2025)</a> e <a href="https://thelatinvestor.com/blogs/news/sao-paulo-airbnb" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">TheLatinvestor (2026)</a>. Resultado passado não garante resultado futuro.
        </p>
      </div>
    ),
  },
];

/* ─── Card de artigo ─────────────────────────────────────── */
function ArtigoCard({ artigo }: { artigo: Artigo }) {
  const [aberto, setAberto] = useState(false);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] flex flex-col overflow-hidden transition-colors hover:border-white/20">
      <div className="p-6 flex flex-col flex-1">
        {/* Categoria */}
        <span
          className={`mb-4 inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${artigo.categoriaColor}`}
        >
          {artigo.categoria}
        </span>

        {/* Título */}
        <h3 className="mb-3 font-semibold text-white leading-snug flex-1 text-base">
          {artigo.titulo}
        </h3>

        {/* Resumo */}
        <p className="mb-5 text-sm text-white/55 leading-relaxed">{artigo.resumo}</p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-white/35 mb-5">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {artigo.tempoLeitura} de leitura
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {artigo.dataPublicacao}
          </span>
        </div>

        {/* Botão expand */}
        <button
          onClick={() => setAberto(!aberto)}
          className="flex items-center gap-2 text-sm font-medium text-bewild-blue-400 hover:text-white transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          {aberto ? "Fechar artigo" : artigo.cta}
          {aberto ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Corpo expandido */}
      {aberto && (
        <div className="border-t border-white/10 px-6 py-6 bg-white/[0.02]">
          {artigo.corpo}
        </div>
      )}
    </article>
  );
}

/* ─── Página principal ───────────────────────────────────── */
export default function ConteudosPage() {
  useSeo({
    title: "Conteúdos — Short stay, preparação de ativo e gestão | Be Wild",
    description:
      "Guias, análises e comparativos sobre short stay, reforma para locação por temporada e gestão profissional de imóveis em São Paulo. Conteúdo sem promessa de renda garantida.",
    canonicalPath: "/conteudos",
    ogType: "website",
  });

  return (
    <div className="bewild min-h-screen bg-bewild-ink font-body text-bewild-ink antialiased">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
          <div className="absolute inset-0 bg-gradient-to-br from-bewild-blue/10 via-transparent to-transparent" />
          <div className="relative mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="max-w-3xl">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                Conteúdos Be Wild
              </p>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Conteúdo para quem quer entender o ciclo inteiro — sem promessa de renda garantida.
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-white/70">
                Guias, análises e comparativos sobre short stay, preparação de ativo e gestão
                profissional de imóveis em São Paulo.
              </p>
              <a
                href={whatsappHref("Olá, quero receber os materiais da Be Wild sobre short stay.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-bewild-gold px-6 py-3 text-sm font-semibold text-bewild-ink transition-all hover:bg-bewild-gold-600 hover:-translate-y-0.5"
              >
                Receber materiais <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Categorias */}
        <section className="border-t border-white/10 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {CATEGORIAS.map((cat) => (
                <div
                  key={cat.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <cat.icon className="mb-3 h-6 w-6 text-bewild-blue-400" />
                  <p className="mb-1.5 font-semibold text-white text-sm">{cat.label}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{cat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Artigos */}
        <section className="border-t border-white/10 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-12">
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                {ARTIGOS.length} artigos publicados
              </p>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Guias e análises</h2>
              <p className="mt-3 text-white/50 text-sm max-w-xl">
                Clique em qualquer card para ler o artigo completo. Conteúdo baseado em dados de mercado — sem promessa de resultado garantido.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ARTIGOS.map((artigo) => (
                <ArtigoCard key={artigo.id} artigo={artigo} />
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter / WhatsApp */}
        <section className="border-t border-white/10 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center gap-8">
              <div className="flex-1">
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                  Novos conteúdos
                </p>
                <h3 className="text-xl font-bold text-white sm:text-2xl">
                  Receba análises direto no WhatsApp.
                </h3>
                <p className="mt-3 text-white/55 text-sm leading-relaxed max-w-md">
                  Quando publicamos novos guias ou análises de mercado, enviamos um resumo no WhatsApp. Sem spam, sem lista de e-mail.
                </p>
              </div>
              <a
                href={whatsappHref("Olá, quero receber análises e conteúdos da Be Wild sobre short stay em SP.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-2 rounded-full bg-bewild-gold px-6 py-3 text-sm font-semibold text-bewild-ink transition-all hover:bg-bewild-gold-600 hover:-translate-y-0.5"
              >
                Entrar na lista <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* CTA diagnóstico */}
        <section className="border-t border-white/10 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Prefere uma conversa direta?
            </h2>
            <p className="mb-8 text-white/65 max-w-xl mx-auto">
              O diagnóstico Be Wild avalia o potencial do seu imóvel específico — não uma média de bairro.
            </p>
            <button
              onClick={() => navigate("/diagnostico")}
              className="inline-flex items-center gap-2 rounded-full bg-bewild-gold px-7 py-3.5 text-sm font-semibold text-bewild-ink transition-all hover:bg-bewild-gold-600 hover:-translate-y-0.5"
            >
              Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
}
