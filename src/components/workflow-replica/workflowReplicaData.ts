import studioZipAntes from "@/assets/portfolio/studio-zip-brooklin-antes.jpg.asset.json";

export type WorkflowStatus = "Concluído" | "Em andamento" | "Pendente";

export type WorkflowActivity = {
  number: string;
  name: string;
  stage: "Preparação" | "Instalações" | "Marcenaria" | "Acabamento" | "Entrega";
  plannedStart: string;
  plannedEnd: string;
  actualStart: string;
  actualEnd: string;
  status: WorkflowStatus;
};

export const project = {
  title: "Studio Urban Flex · Unidade 1204",
  client: "Investidor Bewild",
  address: "Rua Exemplo, 100 · Pinheiros, São Paulo",
  currentStage: "Instalação de marcenaria",
  activityCount: "7 de 12 atividades",
  period: "Início 04/08 › Entrega 10/10",
  progress: 52,
  plannedProgress: 55,
} as const;

export const milestones = [
  { label: "Assin. Contrato", date: "10/07" },
  { label: "Briefing Arq.", date: "14/07" },
  { label: "Aprov. 3D", date: "22/07" },
  { label: "Aprov. Executivo", date: "29/07" },
  { label: "Aprov. Obra", date: "01/08" },
  { label: "Início Mobilização", date: "04/08" },
] as const;

export const activities: WorkflowActivity[] = [
  { number: "01", name: "Mobilização de mão de obra, medições e alinhamento com o projeto executivo", stage: "Preparação", plannedStart: "04/08", plannedEnd: "06/08", actualStart: "04/08", actualEnd: "06/08", status: "Concluído" },
  { number: "02", name: "Fechadura eletrônica, adequações elétricas e infra de ar-condicionado", stage: "Preparação", plannedStart: "05/08", plannedEnd: "14/08", actualStart: "06/08", actualEnd: "15/08", status: "Concluído" },
  { number: "03", name: "Bancadas, cubas e luminárias", stage: "Instalações", plannedStart: "13/08", plannedEnd: "18/08", actualStart: "14/08", actualEnd: "18/08", status: "Concluído" },
  { number: "04", name: "Backsplash, nivelamento e piso vinílico", stage: "Instalações", plannedStart: "17/08", plannedEnd: "24/08", actualStart: "18/08", actualEnd: "25/08", status: "Concluído" },
  { number: "05", name: "Medição de marcenaria, produção das peças e box/espelhos", stage: "Instalações", plannedStart: "21/08", plannedEnd: "31/08", actualStart: "21/08", actualEnd: "02/09", status: "Concluído" },
  { number: "06", name: "Fechamento de shaft do ar-condicionado, drywall e metais", stage: "Instalações", plannedStart: "28/08", plannedEnd: "04/09", actualStart: "29/08", actualEnd: "05/09", status: "Concluído" },
  { number: "07", name: "Ar-condicionado e primeira demão de pintura", stage: "Instalações", plannedStart: "05/09", plannedEnd: "12/09", actualStart: "06/09", actualEnd: "13/09", status: "Concluído" },
  { number: "08", name: "Marcenaria", stage: "Marcenaria", plannedStart: "15/09", plannedEnd: "25/09", actualStart: "16/09", actualEnd: "–", status: "Em andamento" },
  { number: "09", name: "Ajustes de marcenaria, rodapé e acabamentos de civil", stage: "Marcenaria", plannedStart: "24/09", plannedEnd: "30/09", actualStart: "–", actualEnd: "–", status: "Pendente" },
  { number: "10", name: "Segunda demão de pintura, acabamentos elétricos e acessórios", stage: "Acabamento", plannedStart: "29/09", plannedEnd: "04/10", actualStart: "–", actualEnd: "–", status: "Pendente" },
  { number: "11", name: "Cortinas, eletros e móveis", stage: "Acabamento", plannedStart: "03/10", plannedEnd: "07/10", actualStart: "–", actualEnd: "–", status: "Pendente" },
  { number: "12", name: "Vistoria Bwild, limpeza fina e vistoria cliente", stage: "Entrega", plannedStart: "08/10", plannedEnd: "10/10", actualStart: "–", actualEnd: "–", status: "Pendente" },
];

const DAY = 86_400_000;
const curveStart = new Date(2026, 7, 4).getTime();
const planned = [0, 2, 5, 8, 12, 16, 21, 27, 33, 39, 45, 50, 54, 58, 63, 68, 73, 79, 84, 89, 93, 97, 100];
const actual = [0, 1, 4, 7, 11, 15, 19, 25, 31, 37, 42, 47, 50, 52];

const regularCurveData = planned.map((value, index) => ({
  timestamp: curveStart + index * 3 * DAY,
  previsto: value,
  realizado: actual[index],
}));

export const curveData = [
  ...regularCurveData,
  { timestamp: new Date(2026, 8, 19).getTime(), previsto: 55, realizado: 52 },
].sort((left, right) => left.timestamp - right.timestamp);

export const reportPhotos = [
  { src: "/videos/time-obra-poster.jpg", caption: "Marcenaria · instalação", alt: "Instalação de marcenaria durante a obra" },
  { src: "/videos/arquiteta-medicao-poster.jpg", caption: "Medição técnica", alt: "Medição técnica realizada pela equipe Bewild" },
  { src: studioZipAntes.url, caption: "Antes da obra", alt: "Apartamento antes do início da obra" },
] as const;

export const reports = [
  { week: 6, dates: "15 set - 19 set", fullDates: "15/09/2026 - 19/09/2026", stage: "Instalação de marcenaria", progress: 52, planned: 55, current: true, summary: "Instalação de ar-condicionado e primeira demão de pintura concluídas. Início da instalação de marcenaria.", completed: ["Ar-condicionado instalado", "Primeira demão de pintura"], next: ["Instalação de marcenaria e ajustes", "Instalação de rodapé e acabamentos de civil"], decision: "Puxador da marcenaria da cozinha aprovado", decisionDate: "17/09" },
  { week: 5, dates: "08 set - 12 set", fullDates: "08/09/2026 - 12/09/2026", stage: "Instalações e pintura", progress: 45, planned: 47, current: false, summary: "Infraestrutura de ar-condicionado revisada e pintura preparada para a primeira demão.", completed: ["Infraestrutura testada", "Paredes preparadas"], next: ["Instalação do ar-condicionado", "Primeira demão de pintura"], decision: "Tom da pintura confirmado", decisionDate: "10/09" },
  { week: 4, dates: "01 set - 05 set", fullDates: "01/09/2026 - 05/09/2026", stage: "Drywall e metais", progress: 36, planned: 38, current: false, summary: "Fechamento do shaft concluído, com instalação dos metais e conferência das medidas.", completed: ["Shaft fechado", "Metais instalados"], next: ["Preparação da pintura", "Testes das instalações"], decision: "Posição dos metais aprovada", decisionDate: "03/09" },
  { week: 3, dates: "25 ago - 29 ago", fullDates: "25/08/2026 - 29/08/2026", stage: "Piso e marcenaria", progress: 28, planned: 29, current: false, summary: "Piso vinílico instalado e medição final da marcenaria registrada para produção.", completed: ["Piso vinílico instalado", "Marcenaria medida"], next: ["Fechamento do shaft", "Instalação dos metais"], decision: "Paginação do piso aprovada", decisionDate: "27/08" },
  { week: 2, dates: "18 ago - 22 ago", fullDates: "18/08/2026 - 22/08/2026", stage: "Instalações", progress: 18, planned: 18, current: false, summary: "Bancadas e cubas posicionadas, com avanço das adequações elétricas do apartamento.", completed: ["Bancadas posicionadas", "Cubas instaladas"], next: ["Nivelamento do piso", "Medição da marcenaria"], decision: "Modelo das luminárias aprovado", decisionDate: "20/08" },
  { week: 1, dates: "11 ago - 15 ago", fullDates: "11/08/2026 - 15/08/2026", stage: "Preparação", progress: 9, planned: 10, current: false, summary: "Mobilização concluída e primeiros pontos elétricos preparados para o início das instalações.", completed: ["Equipe mobilizada", "Medições conferidas"], next: ["Adequações elétricas", "Infraestrutura de ar-condicionado"], decision: "Posição da fechadura aprovada", decisionDate: "13/08" },
] as const;

export type WorkflowReport = (typeof reports)[number];