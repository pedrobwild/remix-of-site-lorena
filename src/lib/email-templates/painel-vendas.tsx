import * as React from 'react'
import { Body, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

function PainelVendas() {
  return <Html lang="pt-BR"><Head /><Preview>Links do painel Bewild e situação da segurança</Preview><Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}><Container style={{ padding: '24px' }}>
    <Heading>Painel Bewild · equipe de vendas</Heading>
    <Text>Pedro, a publicação foi solicitada; sua conclusão ainda não foi confirmada.</Text>
    <Text><Link href="https://bewild.com.br/admin/perfil-leads">Perfil dos leads</Link></Text>
    <Text><Link href="https://bewild.com.br/admin/desqualificacoes">Desqualificações</Link></Text>
    <Text><Link href="https://bewild.com.br/admin/retorno-regiao">Retorno por região</Link></Text>
    <Text>Os 13 leads desqualificados mostram “Aguardando envio”: o CRM ainda não enviou motivos reais. Nenhum motivo foi inferido.</Text>
    <Text>A verificação básica não encontrou problemas. A análise profunda de 09/10/2026 segue desatualizada: execute Segurança → Run deep scan antes de compartilhar amplamente.</Text>
    <Text>Os links exigem acesso administrativo. Após a análise profunda, confira com a equipe se cada pessoa autorizada consegue abrir as páginas. Não compartilhe senhas nem dados de clientes por e-mail.</Text>
  </Container></Body></Html>
}
export const template = { component: PainelVendas, subject: 'Painel Bewild: links para conferência e segurança pendente', displayName: 'Links do painel de vendas', previewData: {}, to: 'pedro@bewild.com.br' } satisfies TemplateEntry