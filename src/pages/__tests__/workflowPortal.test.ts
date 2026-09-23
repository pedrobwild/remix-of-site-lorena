import { afterEach, describe, expect, it } from "vitest";
import { installWorkflowPortal } from "../HomePage";

function mountPortal() {
  document.body.innerHTML = `
    <div id="home">
      <div data-workflow-portal>
        <div role="tablist">
          <button role="tab" aria-selected="true" tabindex="0" data-workflow-tab="curva">Curva S</button>
          <button role="tab" aria-selected="false" tabindex="-1" data-workflow-tab="relatorios">Relatórios</button>
          <button role="tab" aria-selected="false" tabindex="-1" data-workflow-tab="cronograma">Cronograma</button>
        </div>
        <section role="tabpanel" data-workflow-panel="curva"></section>
        <section role="tabpanel" data-workflow-panel="relatorios" hidden></section>
        <section role="tabpanel" data-workflow-panel="cronograma" hidden></section>
      </div>
    </div>`;
  return document.getElementById("home") as HTMLElement;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("abas do Bwild Workflow", () => {
  it("abre o painel escolhido por clique", () => {
    const root = mountPortal();
    const cleanup = installWorkflowPortal(root);
    const reports = root.querySelector<HTMLButtonElement>('[data-workflow-tab="relatorios"]');
    reports?.click();

    expect(reports?.getAttribute("aria-selected")).toBe("true");
    expect(root.querySelector<HTMLElement>('[data-workflow-panel="relatorios"]')?.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-workflow-panel="curva"]')?.hidden).toBe(true);
    cleanup();
  });

  it("usa setas e move o foco entre as abas em loop", () => {
    const root = mountPortal();
    const cleanup = installWorkflowPortal(root);
    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-workflow-tab]"));
    tabs[0]?.focus();
    tabs[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));

    expect(document.activeElement).toBe(tabs[2]);
    expect(tabs[2]?.getAttribute("aria-selected")).toBe("true");
    expect(root.querySelector<HTMLElement>('[data-workflow-panel="cronograma"]')?.hidden).toBe(false);
    cleanup();
  });
});