// Registro de modelos de e-mails transacionais do app.
// Cada modelo exporta um `template` (TemplateEntry) e é mapeado aqui pelo
// nome kebab-case usado no `templateName` das chamadas de envio.

import type * as React from 'npm:react@18.3.1'
import { template as novoLeadSite } from './novo-lead-site.tsx'
import { template as nutricaoConteudo } from './nutricao-conteudo.tsx'

export interface TemplateEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, unknown>) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  /** Destinatário fixo — tem precedência sobre o recipientEmail da chamada. */
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'novo-lead-site': novoLeadSite,
  'nutricao-conteudo': nutricaoConteudo,
}
