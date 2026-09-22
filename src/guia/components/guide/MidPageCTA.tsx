import { Button } from "@/guia/components/ui/button";
import { Card, CardContent } from "@/guia/components/ui/card";

export default function MidPageCTA({ variant = "default" }: { variant?: "default" | "slim" }) {
  const isSlim = variant === "slim";
  return (
    <div className={isSlim ? "py-4" : "py-8"}>
      <Card className="bg-hero-gradient border-0">
        <CardContent
          className={`${isSlim ? "p-6" : "p-8"} flex flex-col sm:flex-row items-center justify-between gap-4`}
        >
          <div>
            <p className="font-display text-lg font-bold text-primary-foreground">
              Quer saber quanto seu studio pode render?
            </p>
            {!isSlim && (
              <p className="text-base text-primary-foreground/80 font-body mt-1">
                Compare cenários, simule receita e entenda o potencial do imóvel antes de comprar.
              </p>
            )}
            <p className="text-sm text-primary-foreground/70 font-body mt-1">
              Use o simulador desta página ou peça um orçamento de reforma à Bewild.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button asChild size="sm" className="bg-accent text-accent-foreground font-body">
              <a href="#simulador">Simular agora</a>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-body"
            >
              <a href="/orcamento">Solicitar orçamento</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
