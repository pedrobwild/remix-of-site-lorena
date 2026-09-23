// Modelo: resposta automática ao visitante que pediu um orçamento em /orcamento.

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  location?: string
  area_m2?: number | null
  objetivo?: string
  receivedAt?: string
}

const NAVY = '#11355B'
const CYAN = '#2F86B8'
const SAND = '#F2ECE1'
const WHATSAPP = 'https://wa.me/5511911906183'

const Email = (p: Props) => {
  const primeiroNome = (p.name || '').trim().split(/\s+/)[0]
  const resumo = [
    p.location ? `Local: ${p.location}` : null,
    typeof p.area_m2 === 'number' ? `Metragem: ${p.area_m2} m²` : null,
    p.objetivo ? `Objetivo: ${p.objetivo}` : null,
  ].filter(Boolean) as string[]

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Recebemos seu pedido de orçamento — a Bewild responde em até 1 dia útil</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>Bewild · Arquitetura e Engenharia</Text>
          <Heading style={h1}>
            {primeiroNome ? `${primeiroNome}, recebemos seu pedido` : 'Recebemos seu pedido'}
          </Heading>
          <Text style={text}>
            Obrigado por falar com a Bewild. Nossa equipe já está analisando as informações
            que você enviou e retorna em até <strong>1 dia útil</strong> com os próximos passos.
          </Text>

          {resumo.length > 0 && (
            <Section style={card}>
              <Text style={cardTitle}>O que recebemos</Text>
              {resumo.map((linha) => (
                <Text key={linha} style={cardRow}>
                  {linha}
                </Text>
              ))}
            </Section>
          )}

          <Text style={text}>
            Quer adiantar? Fale direto com a gente no WhatsApp — é o caminho mais rápido
            para tirar dúvidas e combinar a visita técnica.
          </Text>

          <Button style={button} href={WHATSAPP}>
            Falar no WhatsApp
          </Button>

          <Hr style={hr} />
          <Text style={footer}>
            Bewild — reforma de studios e apartamentos em São Paulo.
            <br />
            <Link style={link} href="https://bewild.com.br/portfolio">
              Ver projetos entregues
            </Link>
            {p.receivedAt ? ` · Pedido recebido em ${p.receivedAt}` : ''}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Recebemos seu pedido de orçamento — Bewild',
  displayName: 'Confirmação · Pedido de orçamento',
  previewData: {
    name: 'Ana Souza',
    location: 'Pinheiros, São Paulo',
    area_m2: 28,
    objetivo: 'Short Stay',
    receivedAt: '23/09/2026 08:40',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = {
  color: CYAN,
  fontSize: '12px',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}
const h1 = { color: NAVY, fontSize: '24px', lineHeight: '32px', margin: '0 0 16px' }
const text = { color: '#333333', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' }
const card = { backgroundColor: SAND, borderRadius: '10px', padding: '16px 18px', margin: '0 0 20px' }
const cardTitle = { color: NAVY, fontSize: '13px', fontWeight: 'bold' as const, margin: '0 0 8px' }
const cardRow = { color: '#333333', fontSize: '14px', lineHeight: '22px', margin: '0' }
const button = {
  backgroundColor: NAVY,
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  padding: '13px 24px',
  textDecoration: 'none',
}
const hr = { borderColor: '#e6e6e6', margin: '28px 0 16px' }
const footer = { color: '#777777', fontSize: '12px', lineHeight: '20px', margin: '0' }
const link = { color: CYAN }
