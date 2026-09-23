import { useSeo, breadcrumbJsonLd } from "../lib/useSeo";
import { useSiteSettings } from "../lib/useSiteSettings";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
/* Mesma casca da /privacidade: classes .bw-post/.pt-* de post.css. */
import "@/styles/post.css";

/**
 * /acessibilidade: declaração de acessibilidade do site, design Bewild.
 * O link fica só no rodapé (BwaFooter), fora do menu principal.
 *
 * "O que o site já oferece" e "O que ainda falta" vêm da checagem de
 * 23/09/2026 em 14 páginas (idioma, link de pular, foco visível, legenda
 * de vídeo, movimento reduzido e 320 px), da revisão dos formulários e das
 * correções do mesmo dia (legenda do depoimento e Guia do Investidor).
 * Ao mudar o site de forma relevante, refazer a checagem e atualizar as
 * listas e a data.
 */
export default function AcessibilidadePage() {
  const { settings } = useSiteSettings();

  const contactEmail = settings?.contact_email || "contato@bewild.com.br";
  const lastReview = "23 de setembro de 2026";
  const whatsLink = whatsappHref(
    "Olá! Encontrei uma dificuldade de acessibilidade no site da Bewild.",
  );

  useSeo({
    title: "Acessibilidade | Bewild",
    description:
      "Como o site da Bewild atende pessoas com deficiência, o que ainda falta e como avisar a equipe sobre uma barreira de acesso.",
    canonicalPath: "/acessibilidade",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Acessibilidade", path: "/acessibilidade" },
          ]),
        ]
      : undefined,
  });

  return (
    <div className="bw-home bw-post">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="pt-hero">
          <div className="container">
            <div className="pt-cat">Acessibilidade · Bewild</div>
            <h1 className="pt-title">Acessibilidade.</h1>
            <p className="pt-excerpt">
              Queremos que qualquer pessoa consiga usar este site, pedir um
              orçamento e falar com a equipe, inclusive quem navega com leitor
              de tela, só pelo teclado ou com ampliação de tela.
            </p>
            <div className="pt-meta">
              <span>Última revisão: {lastReview}</span>
            </div>
          </div>
        </section>

        <section className="pt-body-section">
          <div className="container">
            <div className="pt-body">
              <h2>Referências que seguimos</h2>
              <p>
                A Lei Brasileira de Inclusão da Pessoa com Deficiência (Lei nº
                13.146/2015, art. 63) torna obrigatória a acessibilidade nos
                sites de empresas com sede no Brasil. Como referência técnica,
                usamos as Diretrizes de Acessibilidade para Conteúdo Web (WCAG)
                2.2, do W3C, e a norma brasileira ABNT NBR 17225:2025, que
                segue as mesmas diretrizes. A meta é o nível AA.
              </p>

              <h2>O que o site já oferece</h2>
              <ul>
                <li>
                  Link &ldquo;Pular para o conteúdo&rdquo; no início das
                  páginas, que leva direto ao texto principal.
                </li>
                <li>
                  Destaque visível no link ou botão em foco, para quem navega
                  pelo teclado.
                </li>
                <li>
                  Menu do celular e menu Parceiros que abrem e fecham pelo
                  teclado, inclusive com a tecla Esc. Com o menu do celular
                  aberto, o foco fica dentro dele.
                </li>
                <li>
                  Formulários de orçamento, de contato e do programa de
                  parceiros com rótulo em cada campo, aviso de erro escrito
                  junto ao campo e foco levado ao primeiro campo que precisa de
                  correção.
                </li>
                <li>
                  Legendas em português no vídeo de depoimento da página
                  inicial.
                </li>
                <li>
                  Idioma das páginas marcado como português do Brasil, para o
                  leitor de tela usar a pronúncia certa.
                </li>
                <li>
                  Animações e carrosséis que param quando o sistema está
                  configurado para reduzir o movimento.
                </li>
                <li>
                  Páginas que se ajustam a telas de 320 pixels de largura sem
                  rolagem para os lados, o que também ajuda quem amplia a tela.
                </li>
                <li>
                  Assistente de dúvidas (&ldquo;Dúvidas? Pergunte aqui&rdquo;)
                  que funciona pelo teclado e fecha com a tecla Esc.
                </li>
                <li>
                  Mapa da página de contato com título descritivo, endereço
                  escrito e link para abrir o local no Google Maps.
                </li>
              </ul>

              <h2>O que ainda falta</h2>
              <ul>
                <li>
                  Postagens do Instagram, mapa do Google Maps, conversa no
                  WhatsApp e selo do Reclame Aqui vêm de serviços de
                  terceiros, e a acessibilidade deles depende desses serviços.
                </li>
                <li>
                  Ainda não fizemos uma varredura automática completa do site
                  nem testes com leitores de tela, como NVDA e VoiceOver, ou
                  com pessoas com deficiência.
                </li>
              </ul>

              <h2>Como avaliamos</h2>
              <p>
                A última avaliação foi feita em {lastReview}, em 14 páginas
                do site. Conferimos o idioma da página, o link para pular para
                o conteúdo, o foco visível na navegação pelo teclado, as
                legendas de vídeo, o movimento reduzido e a leitura em telas
                de 320 pixels de largura.
              </p>

              <h2>Encontrou uma barreira?</h2>
              <p>
                Se alguma parte do site não funcionou para você, conte para a
                gente. Diga a página, o que você tentou fazer e, se quiser, a
                tecnologia que usa. Se preferir, a equipe envia por escrito
                qualquer informação publicada aqui.
              </p>
              <ul>
                <li>
                  E-mail:{" "}
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </li>
                <li>
                  WhatsApp:{" "}
                  <a href={whatsLink} target="_blank" rel="noopener noreferrer">
                    falar com a equipe
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
