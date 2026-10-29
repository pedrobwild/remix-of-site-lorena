# Envio automático de pedidos e qualificações ao Google Ads

## Resultado
- Pedido de investidor confirmado e qualificação de investidor serão dois resultados distintos nas conversões já existentes do Google Ads.
- O pedido continuará sendo medido pela tag; acrescentar envio pelo servidor como recuperação, com o mesmo identificador para impedir duplicação.
- Qualificações do painel e do Engine serão enviadas automaticamente, sem depender de baixar CSV.
- Preservar objetivos elegíveis, valores atuais, data real do resultado, demais medições e limites de envio.

## Consentimento e duplicidade
- O código atual preenche `consent_marketing` a partir do aceite do aviso de cookies; não existe evidência de uma caixa independente de aceite no formulário. Não tratar a regra offline anterior como autorização para enviar visitantes que recusaram.
- Reutilizar o aceite publicitário existente e verificar sua situação atual antes de cada envio. Não alterar o aviso nem enviar eventos anteriormente bloqueados.
- A importação agendada de “Lead qualificado investidor” precisa ser desativada ou separar os eventos já enviados automaticamente antes de ativar o envio direto. Não enviar as mesmas qualificações por dois canais independentes.
- Não reenviar automaticamente os leads históricos de outubro.

## Implementação técnica
- Reutilizar as ações verificadas: “Lead - Formulário site (2)” (WEBPAGE) e “Lead qualificado investidor” (UPLOAD_CLICKS), com Data Manager e credenciais somente no servidor.
- Fila durável transacional para cada resultado, com identificador estável, tentativas, horário original e confirmação de processamento separada de atribuição.
- Disparo por confirmação do pedido e por histórico de qualificação; confirmar suporte a webhook de banco antes de escolhê-lo. Não adicionar uma consulta recorrente permanente para detectar mudanças.
- Revalidar objetivo, autorização atual e evento confirmado no servidor; não confiar em valores ou horários enviados pelo navegador.
- Manter o pedido com o mesmo transaction_id do navegador; qualificações com identidade e horário canônicos, respeitando a deduplicação por pessoa já aprovada.
- Mostrar pendências e erros no painel sem dados pessoais nos registros técnicos.

## Validação e publicação
- Testes de dois eventos distintos, duplicidade, reenvio, consentimento negado/retirado, objetivos e preservação de horários e valores.
- Conferir pedido e qualificação de ponta a ponta com acesso administrativo e teste autorizado, sem alterar um cliente real para testar.
- Publicar somente após resolver a coexistência com a importação e validar o envio. Recebimento pelo Google não garante atribuição a campanha.

## Dependências antes da ativação
- Confirmar ou interromper a importação agendada da qualificação no Data Manager; não há confirmação atual de seu estado.
- A conferência autenticada requer entrar na prévia: a criação automática de sessão para Pedro não encontrou uma conta correspondente.