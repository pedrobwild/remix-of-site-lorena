# Scripts legados de edição da home

Três scripts Python de uso único, escritos para aplicar substituições pontuais
de texto em `src/pages/home-bwa-body.ts` (a home é uma string HTML — decisão
registrada em CODE-02). Estavam na raiz do repositório até 22/09/2026 (A-21) e
foram movidos para cá sem qualquer alteração de conteúdo.

**Não rode nada daqui sem ler antes.** Eles fazem `open(..., 'w')` direto sobre
o arquivo da home, com substituições literais que só faziam sentido no estado
do arquivo naquele dia. Hoje as substituições muito provavelmente não casam
mais — e um `replace` que não casa passa silenciosamente, reescrevendo o
arquivo sem avisar que não fez nada.

Foram mantidos por serem o registro de como a home foi editada nessas rodadas.
Apagá-los é uma decisão do Pedro, não desta auditoria.
