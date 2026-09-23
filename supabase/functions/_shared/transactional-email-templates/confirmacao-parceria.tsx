// Modelo: resposta automática ao profissional que enviou uma indicação em /parceiros.

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
  objetivo?: string
  receivedAt?: string
}

const NAVY = '#11355B'
const CYAN = '#2F86B8'
const SAND = '#F2ECE1'
const WHATSAPP = 'https://wa.me/5511911906183'

const PASSOS = [
  'Conferimos os dados da indicação e registramos a parceria.',
  'Entramos em contato com você em até 1 dia útil para alinhar o termo.',
  'Falamos com o cliente indicado e conduzimos o projeto do início ao fim.',
  'Fechado o contrato, sua comissão é acertada conforme o termo combinado.',
]

const Email = (p: Props) => {
  const primeiroNome = (p.name || '').trim().split(/\s+/)[0]
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Recebemos sua solicitação de parceria — a Bewild responde em até 1 dia útil</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>Bewild · Parcerias e indicações</Text>
          <Heading style={h1}>
            {primeiroNome ? `${primeiroNome}, recebemos sua solicitação` : 'Recebemos sua solicitação'}
          </Heading>
          <Text style={text}>
            Obrigado pelo contato. Sua solicitação de parceria chegou à nossa equipe e será
            analisada por uma pessoa — retornamos em até <strong>1 dia útil</strong>.
          </Text>

          {p.objetivo ? (
            <Section style={card}>
              <Text style={cardTitle}>Tipo de parceria</Text>
              <Text style={cardRow}>{p.objetivo}</Text>
            </Section>
          ) : null}

          <Section style={card}>
            <Text style={cardTitle}>Como seguimos daqui</Text>
            {PASSOS.map((passo, i) => (
              <Text key={passo} style={cardRow}>
                {i + 1}. {passo}
              </Text>
            ))}
          </Section>

          <Text style={text}>
            Se preferir adiantar a conversa, fale com a gente no WhatsApp.
          </Text>

          <Button style={button} href={WHATSAPP}>
            Falar no WhatsApp
          </Button>

          <Hr style={hr} />
          <Text style={footer}>
            Bewild — arquitetura e engenharia para studios e apartamentos em São Paulo.
            <br />
            <Link style={link} href="https://bewild.com.br/parceiros">
              Rever as condições de parceria
            </Link>
            {p.receivedAt ? ` · Solicitação recebida em ${p.receivedAt}` : ''}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'Recebemos sua solicitação de parceria — Bewild',
  displayName: 'Confirmação · Solicitação de parceria',
  previewData: {
    name: 'Carlos Lima',
    objetivo: 'Parceria · Corretor de imóveis',
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
const cardRow = { color: '#333333', fontSize: '14px', lineHeight: '22px', margin: '0 0 4px' }
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
