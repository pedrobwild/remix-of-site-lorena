// Modelo: conteúdo do blog para leads qualificados, escolhido pela etapa do
// funil. Enviado pela função enviar-nutricao a partir da fila
// public.nutricao_envios. Todo o texto chega pronto em templateData.

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface MaisLeitura {
  title: string
  url: string
}

interface Props {
  subject?: string
  preheader?: string
  firstName?: string | null
  intro?: string
  postUrl?: string
  coverUrl?: string
  categoryLabel?: string
  readingTime?: number
  postTitle?: string
  byline?: string
  excerpt?: string
  sections?: string[]
  morePosts?: MaisLeitura[]
  siteUrl?: string
  instagramUrl?: string
  whatsappUrl?: string
}

const NAVY = '#102A4F'
const BLUE = '#1E5BB8'
const BONE = '#F6F5F2'
const INK = '#0A111E'
const STEEL = '#5B6B7F'
const LINE = '#E4E6EA'
const SANS = 'Arial, Helvetica, sans-serif'
const SERIF = "Georgia, 'Times New Roman', serif"

const Email = (p: Props) => {
  const saudacao = p.firstName ? `Olá, ${p.firstName}.` : 'Olá.'
  const meta = [p.categoryLabel, p.readingTime ? `${p.readingTime} min de leitura` : '']
    .filter(Boolean)
    .join(' · ')
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{p.preheader || p.postTitle || 'Conteúdos da Bewild'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={topbar}>
            <Text style={brand}>Bewild</Text>
          </Section>

          <Section style={card}>
            <Text style={paragraph}>{saudacao}</Text>
            {p.intro ? <Text style={paragraphLast}>{p.intro}</Text> : null}

            {p.coverUrl ? (
              <Link href={p.postUrl} style={coverLink}>
                <Img src={p.coverUrl} width="520" alt={p.postTitle || 'Capa do artigo'} style={cover} />
              </Link>
            ) : null}

            {meta ? <Text style={eyebrow}>{meta}</Text> : null}
            <Text style={title}>
              <Link href={p.postUrl} style={titleLink}>{p.postTitle}</Link>
            </Text>
            {p.byline ? <Text style={bylineStyle}>{p.byline}</Text> : null}
            {p.excerpt ? <Text style={excerptStyle}>{p.excerpt}</Text> : null}

            {p.sections && p.sections.length > 0 ? (
              <Section style={toc}>
                <Text style={tocLabel}>No artigo</Text>
                {p.sections.map((s) => (
                  <Text key={s} style={tocItem}>→ {s}</Text>
                ))}
              </Section>
            ) : null}

            <Section style={ctaWrap}>
              <Button href={p.postUrl} style={cta}>Ler o artigo</Button>
            </Section>
          </Section>

          {p.morePosts && p.morePosts.length > 0 ? (
            <Section style={more}>
              <Text style={sectionLabel}>Também no blog</Text>
              {p.morePosts.map((m) => (
                <Text key={m.url} style={moreItem}>
                  <Link href={m.url} style={moreLink}>{m.title}</Link>
                </Text>
              ))}
            </Section>
          ) : null}

          <Section style={closing}>
            <Text style={closingTitle}>Quer seguir a conversa?</Text>
            <Text style={closingText}>
              Veja os projetos no site, acompanhe a Bewild no Instagram ou fale com um consultor pelo WhatsApp.
            </Text>
            <Section style={closingButtons}>
              <Button href={p.whatsappUrl} style={ctaSecondary}>Falar com um consultor</Button>
            </Section>
            <Text style={closingLinks}>
              <Link href={p.siteUrl} style={inlineLink}>bewild.com.br</Link>
              {'   ·   '}
              <Link href={p.instagramUrl} style={inlineLink}>Instagram @bewild.oficial</Link>
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Bewild · reforma completa de studios e apartamentos em São Paulo, do projeto à entrega.
            </Text>
            <Text style={footerText}>
              Você recebe este email porque pediu um orçamento à Bewild. Se não quiser mais receber estes conteúdos, é só responder este email.
            </Text>
            <Text style={footerText}>Bewild · São Paulo, SP · CNPJ 47.350.338/0001-37</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, unknown>) =>
    typeof d.subject === 'string' && d.subject.trim() ? d.subject.trim() : 'Conteúdos da Bewild',
  displayName: 'Conteúdo do blog para leads qualificados',
  previewData: {
    subject: 'Quanto tempo leva a obra do seu studio',
    preheader: 'O prazo real por escopo, o que fica fora da contagem e o que precisa estar no contrato.',
    firstName: 'Carla',
    intro:
      'Se você ainda está avaliando a sua proposta, separamos a leitura que responde à pergunta que mais ouvimos nessa fase: quanto tempo a obra leva e o que pode mudar esse prazo.',
    postUrl: 'https://bewild.com.br/conteudos/quanto-tempo-demora-reforma-apartamento',
    coverUrl:
      'https://aamlnkmqvjcowixdgqii.supabase.co/storage/v1/object/public/project-images/bewild/lc-today-faria-lima/1787829246463-ligia-com-integracao-1.png',
    categoryLabel: 'Reforma',
    readingTime: 7,
    postTitle: 'Quanto tempo demora uma reforma de apartamento: o prazo real por escopo',
    byline: 'Por Thiago Dantas, arquiteto e urbanista, responsável técnico da Bewild',
    excerpt:
      'Cerca de 60 dias úteis do início da obra à entrega, definidos em contrato. A tabela de prazos por escopo, o que entra e o que fica fora da contagem, as quatro causas reais de atraso e o que precisa estar escrito para o prazo valer.',
    sections: [
      'Quanto tempo leva cada tipo de reforma',
      'O que entra e o que não entra na contagem',
      'As quatro causas reais de atraso',
      'O que precisa estar no contrato para o prazo valer',
    ],
    morePosts: [
      {
        title: 'O anti-checklist da reforma: 4 itens que não compensa mexer num studio novo',
        url: 'https://bewild.com.br/conteudos/o-que-nao-reformar-no-studio-short-stay',
      },
    ],
    siteUrl: 'https://bewild.com.br',
    instagramUrl: 'https://instagram.com/bewild.oficial',
    whatsappUrl: 'https://wa.me/5511911906183',
  },
} satisfies TemplateEntry

const main = { backgroundColor: BONE, fontFamily: SANS, margin: '0', padding: '28px 0' }
const container = { margin: '0 auto', maxWidth: '600px', padding: '0 12px' }
const topbar = { padding: '0 8px 14px' }
const brand = { color: NAVY, fontSize: '22px', fontWeight: 'bold' as const, letterSpacing: '-0.3px', margin: '0', fontFamily: SANS }
const card = { backgroundColor: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: '6px', padding: '30px 30px' }
const paragraph = { color: INK, fontSize: '15px', lineHeight: '25px', margin: '0 0 14px', fontFamily: SANS }
const paragraphLast = { ...paragraph, margin: '0 0 24px' }
const coverLink = { display: 'block', textDecoration: 'none' }
const cover = { display: 'block', width: '100%', maxWidth: '520px', height: 'auto', borderRadius: '4px', border: '0' }
const eyebrow = { color: BLUE, fontSize: '11px', letterSpacing: '1.6px', textTransform: 'uppercase' as const, fontWeight: 'bold' as const, margin: '22px 0 8px', fontFamily: SANS }
const title = { margin: '0 0 10px', fontFamily: SERIF, fontSize: '26px', lineHeight: '34px', fontWeight: 'bold' as const, color: NAVY }
const titleLink = { color: NAVY, textDecoration: 'none' }
const bylineStyle = { color: STEEL, fontSize: '12px', lineHeight: '18px', margin: '0 0 16px', fontFamily: SANS }
const excerptStyle = { color: INK, fontSize: '15px', lineHeight: '25px', margin: '0 0 20px', fontFamily: SANS }
const toc = { backgroundColor: BONE, borderRadius: '4px', padding: '16px 20px 8px' }
const tocLabel = { color: STEEL, fontSize: '11px', letterSpacing: '1.4px', textTransform: 'uppercase' as const, fontWeight: 'bold' as const, margin: '0 0 8px', fontFamily: SANS }
const tocItem = { color: NAVY, fontSize: '14px', lineHeight: '21px', margin: '0 0 8px', fontFamily: SANS }
const ctaWrap = { margin: '26px 0 0' }
const cta = { backgroundColor: BLUE, color: '#FFFFFF', fontSize: '15px', fontWeight: 'bold' as const, padding: '14px 28px', borderRadius: '4px', textDecoration: 'none', fontFamily: SANS }
const more = { padding: '28px 8px 0' }
const sectionLabel = { color: STEEL, fontSize: '11px', letterSpacing: '1.4px', textTransform: 'uppercase' as const, fontWeight: 'bold' as const, margin: '0 0 10px', fontFamily: SANS }
const moreItem = { fontSize: '14px', lineHeight: '21px', margin: '0 0 10px', fontFamily: SANS }
const moreLink = { color: NAVY, textDecoration: 'underline' }
const closing = { margin: '28px 0 0', backgroundColor: '#FFFFFF', border: `1px solid ${LINE}`, borderRadius: '6px', padding: '26px 30px' }
const closingTitle = { color: NAVY, fontFamily: SERIF, fontSize: '20px', lineHeight: '28px', fontWeight: 'bold' as const, margin: '0 0 8px' }
const closingText = { color: INK, fontSize: '14px', lineHeight: '22px', margin: '0 0 18px', fontFamily: SANS }
const closingButtons = { margin: '0 0 14px' }
const ctaSecondary = { backgroundColor: NAVY, color: '#FFFFFF', fontSize: '14px', fontWeight: 'bold' as const, padding: '12px 22px', borderRadius: '4px', textDecoration: 'none', fontFamily: SANS }
const closingLinks = { fontSize: '14px', lineHeight: '22px', color: STEEL, margin: '0', fontFamily: SANS }
const inlineLink = { color: BLUE, textDecoration: 'underline' }
const footer = { padding: '24px 8px 0' }
const footerText = { color: STEEL, fontSize: '11px', lineHeight: '18px', margin: '0 0 8px', fontFamily: SANS }
