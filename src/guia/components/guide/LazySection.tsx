import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; nome: string };

/** Barreira de erro: sem ela, um chunk que falha derruba a página inteira. */
class BarreiraDeErro extends Component<Props, { falhou: boolean }> {
  state = { falhou: false };

  static getDerivedStateFromError() {
    return { falhou: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.warn(`[guia] falha ao carregar a seção ${this.props.nome}`, error, info.componentStack);
  }

  render() {
    if (!this.state.falhou) return this.props.children;
    return (
      <div role="alert" className="py-12 text-center font-body">
        <p className="text-sm font-semibold text-foreground">Não foi possível carregar a seção “{this.props.nome}”.</p>
        <p className="text-xs text-muted-foreground mt-1">Se o site acabou de ser atualizado, recarregar a página resolve.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Recarregar a página
        </button>
      </div>
    );
  }
}

/**
 * Suspense + barreira de erro para seções carregadas sob demanda
 * (React.lazy). Se o chunk falhar — tipicamente um deploy novo apagou o
 * arquivo antigo com a aba aberta —, a seção mostra um aviso com "Recarregar"
 * em vez de derrubar a página inteira.
 */
export default function LazySection({ children, nome }: Props) {
  return (
    <BarreiraDeErro nome={nome}>
      <Suspense
        fallback={
          <div className="py-16" role="status" aria-label={`Carregando ${nome}`}>
            <div className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin mx-auto" aria-hidden="true" />
          </div>
        }
      >
        {children}
      </Suspense>
    </BarreiraDeErro>
  );
}
