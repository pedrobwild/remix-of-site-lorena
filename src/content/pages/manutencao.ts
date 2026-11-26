import { MANUTENCAO } from "@/content/pages/servicos";
import { MANUTENCAO_PATH } from "@/content/pages/manutencao.seo";

/** A oferta usa o mesmo plano da página de serviços, sem novas condições. */
export const MANUTENCAO_JSONLD: Array<Record<string, unknown>> = [{
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `https://bewild.com.br${MANUTENCAO_PATH}#service`,
  name: MANUTENCAO.nome,
  serviceType: "Manutenção preventiva de studios",
  description: MANUTENCAO.resumo,
  url: `https://bewild.com.br${MANUTENCAO_PATH}`,
  provider: { "@id": "https://bewild.com.br/#org" },
  areaServed: { "@type": "City", name: "São Paulo" },
  offers: {
    "@type": "Offer",
    price: MANUTENCAO.precoMensal,
    priceCurrency: "BRL",
    description: MANUTENCAO.regras,
    url: `https://bewild.com.br${MANUTENCAO_PATH}`,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: MANUTENCAO.precoMensal,
      priceCurrency: "BRL",
      unitCode: "MON",
    },
  },
}];