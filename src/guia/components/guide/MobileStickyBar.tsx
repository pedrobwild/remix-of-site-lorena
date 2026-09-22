import { Button } from "@/guia/components/ui/button";

/**
 * Barra fixa no rodapé (mobile). No app original levava a rotas de
 * ferramentas que não existem neste site; aqui aponta para o simulador da
 * própria página e para o orçamento da Bewild.
 */
export default function MobileStickyBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-lg px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] flex gap-3 min-h-[56px]">
      <Button asChild className="flex-1 bg-primary text-primary-foreground min-h-[44px]">
        <a href="#simulador">Simular agora</a>
      </Button>
      <Button asChild variant="outline" className="flex-1 min-h-[44px]">
        <a href="/orcamento">Solicitar orçamento</a>
      </Button>
    </div>
  );
}
