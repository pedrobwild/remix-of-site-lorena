/**
 * Tipagem mínima do jsdom para os scripts de build (o pacote não traz tipos
 * e @types/jsdom não está instalado). Só o que os scripts usam: criar um
 * window para o DOMPurify sanitizar HTML em Node.
 */
declare module "jsdom" {
  export class JSDOM {
    constructor(html?: string, options?: Record<string, unknown>);
    readonly window: Window & typeof globalThis;
  }
}
