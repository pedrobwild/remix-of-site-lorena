/**
 * Aviso de privacidade no ponto de coleta (LGPD art. 9º): o texto dos
 * formulários precisa bater com o que src/lib/conversions.ts envia —
 * cliente → Meta e Google; cadastros e indicação → só Meta.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import FormPrivacyNote from "@/components/FormPrivacyNote";

afterEach(() => cleanup());

describe("FormPrivacyNote", () => {
  it("formulário de cliente: Meta e Google, com o link da política", () => {
    const { container } = render(
      <FormPrivacyNote platforms="meta-google">Usamos seus dados para responder ao seu contato.</FormPrivacyNote>,
    );
    const p = container.querySelector("p")!;
    expect(p.textContent).toBe(
      "Usamos seus dados para responder ao seu contato. Se você aceitou os cookies, nome, e-mail e telefone " +
        "também seguem criptografados para a Meta e o Google medirem e direcionarem nossos anúncios. " +
        "Política de privacidade.",
    );
    expect(p.querySelector("a")!.getAttribute("href")).toBe("/privacidade");
  });

  it("indicação: só a Meta, e nunca os dados do indicado", () => {
    const { container } = render(
      <FormPrivacyNote platforms="meta" contact="o seu nome, e-mail e telefone (nunca os do indicado)">
        Seus dados e os do indicado são usados para atender a indicação, conforme a LGPD.
      </FormPrivacyNote>,
    );
    const text = container.querySelector("p")!.textContent ?? "";
    expect(text).toContain("o seu nome, e-mail e telefone (nunca os do indicado) também seguem criptografados");
    expect(text).toContain("para a Meta medir e direcionar nossos anúncios.");
    expect(text).not.toContain("Google");
  });
});
