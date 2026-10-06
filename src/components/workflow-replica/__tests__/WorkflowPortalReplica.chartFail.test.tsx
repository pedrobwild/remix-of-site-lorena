import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

/**
 * O gráfico da aba "Evolução de Obra" vem num arquivo à parte, baixado ao
 * abrir a aba. Se esse download falha (rede caiu, publicação nova trocou os
 * arquivos), a aba abre com a moldura vazia — o erro não pode subir até a
 * tela de erro do site, que recarrega a página inteira.
 *
 * Arquivo separado do teste principal: aqui o módulo do gráfico é trocado por
 * um que falha ao carregar.
 */
vi.mock("../WorkflowCurveChart", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

afterEach(() => cleanup());

describe("WorkflowPortalReplica — download do gráfico falhou", () => {
  it("a aba abre com a moldura vazia e o resto do painel no lugar", async () => {
    const onError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { default: WorkflowPortalReplica } = await import("../WorkflowPortalReplica");
      render(<WorkflowPortalReplica />);

      await act(async () => {
        fireEvent.click(screen.getByRole("tab", { name: /Evolução/ }));
        // Deixa o import rejeitar e o React trocar o Suspense pelo substituto.
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      const frame = document.querySelector(".wf-chart-frame");
      expect(frame).not.toBeNull();
      expect(frame?.childElementCount).toBe(0);
      expect(screen.getByRole("heading", { name: "Cronograma Previsto x Realizado" })).toBeInTheDocument();
      // Nenhum erro chegou ao React (nada de error boundary acionado).
      expect(onError).not.toHaveBeenCalled();
    } finally {
      onError.mockRestore();
    }
  });
});
