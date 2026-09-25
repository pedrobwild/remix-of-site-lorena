// Modelo: aviso interno de novo lead/solicitação vinda do site Bewild.
// Enviado sempre para o endereço fixo da equipe (ver `to` no template).

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  /** "meta" = lead de formulário instantâneo da Meta (meta-sync). */
  channel?: string
  formLabel?: string
  name?: string
  whatsapp?: string
  email?: string
  location?: string
  area_m2?: number | null
  objetivo?: string
  chaves?: string
  planta?: string
  lives_in_sp?: boolean | null
  lead_source?: string
  message?: string
  origin?: string
  waLink?: string
  receivedAt?: string
}

const NAVY = '#11355B'
const CYAN = '#2F86B8'
const SAND = '#F2ECE1'

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  if (!s) return null
  return (
    <Text style={row}>
      <span style={rowLabel}>{label}: </span>
      {s}
    </Text>
  )
}

const Email = (p: Props) => {
  const titulo = p.formLabel || 'Novo lead no site'
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{`${titulo} — ${p.name || 'visitante'}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>Bewild</Text>
            <Heading style={h1}>{titulo}</Heading>
          </Section>

          <Section style={content}>
            <Row label="Nome" value={p.name} />
            <Row label="WhatsApp" value={p.whatsapp} />
            <Row label="E-mail" value={p.email} />
            <Row label="Local" value={p.location} />
            <Row label="Metragem (m²)" value={p.area_m2 ?? null} />
            <Row label="Objetivo" value={p.objetivo} />
            <Row label="Chaves" value={p.chaves} />
            <Row label="Planta" value={p.planta} />
            <Row
              label="Mora em SP capital"
              value={
                typeof p.lives_in_sp === 'boolean' ? (p.lives_in_sp ? 'Sim' : 'Não') : null
              }
            />
            <Row label="Como conheceu" value={p.lead_source} />

            {p.message && p.message.trim() ? (
              <>
                <Hr style={hr} />
                <Text style={messageLabel}>Mensagem</Text>
                <Text style={messageBody}>{p.message.trim()}</Text>
              </>
            ) : null}

            {p.waLink ? (
              <Section style={ctaWrap}>
                <Button style={cta} href={p.waLink}>
                  Falar no WhatsApp
                </Button>
              </Section>
            ) : null}

            {p.origin ? (
              <>
                <Hr style={hr} />
                <Text style={originLabel}>Origem</Text>
                <Text style={originBody}>{p.origin}</Text>
              </>
            ) : null}
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              {p.receivedAt
                ? `Recebido em ${p.receivedAt} (horário de São Paulo).`
                : 'Recebido pelo site bewild.com.br.'}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, unknown>) => {
    const nome = typeof d.name === 'string' && d.name.trim() ? d.name.trim() : 'visitante'
    if (d.channel === 'meta') return `Novo lead do Meta — ${nome}`
    const objetivo = typeof d.objetivo === 'string' ? d.objetivo : ''
    return objetivo.startsWith('Parceria')
      ? `Nova solicitação de parceria — ${nome}`
      : `Novo lead no site — ${nome}`
  },
  displayName: 'Aviso de novo lead do site',
  to: 'marketing@bewild.com.br',
  previewData: {
    formLabel: 'Novo lead · Pedido de orçamento',
    name: 'Maria Silva',
    whatsapp: '(11) 99999-0000',
    email: 'maria@exemplo.com.br',
    location: 'Vila Mariana, São Paulo',
    area_m2: 32,
    objetivo: 'Short Stay',
    message: 'Quero reformar meu studio para alugar.',
    waLink: 'https://wa.me/5511999990000',
    receivedAt: '23/09/2026, 08:24',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { margin: '0 auto', maxWidth: '560px' }
const header = {
  backgroundColor: NAVY,
  padding: '24px 28px',
  borderRadius: '8px 8px 0 0',
}
const brand = {
  color: SAND,
  fontSize: '13px',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}
const h1 = { color: '#ffffff', fontSize: '20px', margin: '0' }
const content = {
  padding: '24px 28px',
  border: '1px solid #e5e2da',
  borderTop: 'none',
  borderRadius: '0 0 8px 8px',
}
const row = { color: '#1a1a1a', fontSize: '14px', lineHeight: '22px', margin: '0 0 4px' }
const rowLabel = { color: '#6b7280', fontWeight: 'bold' as const }
const hr = { borderColor: '#e5e2da', margin: '16px 0' }
const messageLabel = { color: '#6b7280', fontSize: '12px', margin: '0 0 4px' }
const messageBody = {
  color: '#1a1a1a',
  fontSize: '14px',
  lineHeight: '22px',
  whiteSpace: 'pre-wrap' as const,
  margin: '0',
}
const ctaWrap = { textAlign: 'center' as const, margin: '24px 0 8px' }
const cta = {
  backgroundColor: CYAN,
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
}
const originLabel = { color: '#6b7280', fontSize: '12px', margin: '0 0 4px' }
const originBody = { color: '#6b7280', fontSize: '12px', lineHeight: '18px', margin: '0' }
const footer = { padding: '16px 28px' }
const footerText = { color: '#9ca3af', fontSize: '12px', margin: '0' }
