/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HOME_BWA_HTML } from "../../pages/home-bwa-body";
import { installBastidores } from "../homeBastidores";

const EXPECTED_CODES = [
  "DY27SVWvqoM",
  "DdKezjDRK8h",
  "DczVRdmxaoU",
  "Dcj1_8wRuta",
  "DchdJiqRhOT",
  "Ddm4dnNtNPI",
];

function mountHome(): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = HOME_BWA_HTML;
  document.body.appendChild(root);
  return root;
}

describe("seção Bastidores da home", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
  });
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("a home tem exatamente 6 [data-bst-post], na ordem esperada, e [data-ig-post] continua com 3", () => {
    const root = mountHome();
    const codes = Array.from(root.querySelectorAll<HTMLElement>("[data-bst-post]")).map(
      (el) => el.dataset.bstPost,
    );
    expect(codes).toEqual(EXPECTED_CODES);
    expect(root.querySelectorAll("[data-ig-post]")).toHaveLength(3);
  });

  it('sem consentimento, o clique abre o lightbox com "Carregar vídeo aqui" e nenhum iframe; o botão monta o embed', () => {
    const root = mountHome();
    const cleanup = installBastidores(root);

    root.querySelector<HTMLElement>('[data-bst-post="DY27SVWvqoM"]')!.click();

    const lb = document.body.querySelector<HTMLElement>(".bwa-bst-lb");
    expect(lb).not.toBeNull();
    expect(lb!.hasAttribute("data-open")).toBe(true);
    expect(lb!.querySelector("iframe")).toBeNull();

    const load = lb!.querySelector<HTMLButtonElement>(".bwa-bst-lb-load");
    expect(load?.textContent).toBe("Carregar vídeo aqui");

    load!.click();
    const iframe = lb!.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute("src")).toBe("https://www.instagram.com/p/DY27SVWvqoM/embed/");

    cleanup();
  });

  it("Escape fecha e o cleanup remove o lightbox do body", () => {
    const root = mountHome();
    const cleanup = installBastidores(root);

    root.querySelector<HTMLElement>('[data-bst-post="DY27SVWvqoM"]')!.click();
    expect(document.body.querySelector(".bwa-bst-lb")).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    const lb = document.body.querySelector<HTMLElement>(".bwa-bst-lb");
    expect(lb!.hasAttribute("data-open")).toBe(false);

    cleanup();
    expect(document.body.querySelector(".bwa-bst-lb")).toBeNull();
  });
});
