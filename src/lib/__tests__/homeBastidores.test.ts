/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  let play: ReturnType<typeof vi.spyOn>;
  let pause: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    document.body.innerHTML = "";
    play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("tem 6 cards na ordem esperada, com vídeos preparados sem carregar o arquivo", () => {
    const root = mountHome();
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-bst-card]"));

    expect(cards.map((card) => card.dataset.bstPost)).toEqual(EXPECTED_CODES);
    cards.forEach((card, index) => {
      const video = card.querySelector<HTMLVideoElement>("video");
      expect(video).not.toBeNull();
      expect(video?.muted).toBe(true);
      expect(video?.loop).toBe(true);
      expect(video?.hasAttribute("playsinline")).toBe(true);
      expect(video?.preload).toBe("none");
      expect(video?.dataset.src).toBe(`/videos/bastidores/${EXPECTED_CODES[index]}.mp4`);
      expect(video?.hasAttribute("src")).toBe(false);
    });
  });

  it("preserva os 3 posts de depoimentos e não cria iframe", () => {
    const root = mountHome();

    expect(root.querySelectorAll("[data-ig-post]")).toHaveLength(3);
    expect(root.querySelector("[data-bastidores] iframe")).toBeNull();
  });

  it("liga o som de um vídeo e silencia o anterior ao trocar de card", () => {
    const root = mountHome();
    const cleanup = installBastidores(root);
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-bst-card]"));
    const secondVideo = cards[1].querySelector<HTMLVideoElement>("video");
    const thirdVideo = cards[2].querySelector<HTMLVideoElement>("video");
    const secondButton = cards[1].querySelector<HTMLButtonElement>("[data-bst-sound]");
    const thirdButton = cards[2].querySelector<HTMLButtonElement>("[data-bst-sound]");

    secondButton?.click();
    expect(secondVideo?.muted).toBe(false);
    expect(secondButton).toHaveAttribute("aria-pressed", "true");

    thirdButton?.click();
    expect(secondVideo?.muted).toBe(true);
    expect(secondButton).toHaveAttribute("aria-pressed", "false");
    expect(thirdVideo?.muted).toBe(false);
    expect(thirdButton).toHaveAttribute("aria-pressed", "true");

    cleanup();
  });

  it("o cleanup pausa os vídeos e remove os listeners", () => {
    const root = mountHome();
    const cleanup = installBastidores(root);
    const secondCard = root.querySelectorAll<HTMLElement>("[data-bst-card]")[1];
    const secondVideo = secondCard.querySelector<HTMLVideoElement>("video");
    const secondButton = secondCard.querySelector<HTMLButtonElement>("[data-bst-sound]");

    cleanup();
    expect(pause).toHaveBeenCalledTimes(6);

    secondButton?.click();
    expect(secondVideo?.muted).toBe(true);
    expect(secondButton).toHaveAttribute("aria-pressed", "false");
    expect(play).not.toHaveBeenCalled();
  });
});
