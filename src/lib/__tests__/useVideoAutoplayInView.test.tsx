import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render } from "@testing-library/react";
import { useVideoAutoplayInView } from "../useVideoAutoplayInView";

type Listener = () => void;
let reduce = false;
let listeners: Listener[] = [];
let observed: Element[] = [];
const originalMatchMedia = window.matchMedia;

function Video() {
  const ref = useVideoAutoplayInView();
  return <video ref={ref} data-testid="v" muted loop playsInline />;
}

beforeEach(() => {
  reduce = false;
  listeners = [];
  observed = [];
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query.includes("prefers-reduced-motion") ? reduce : false;
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, l: Listener) => listeners.push(l),
    removeEventListener: (_: string, l: Listener) => {
      listeners = listeners.filter((x) => x !== l);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
  vi.spyOn(IntersectionObserver.prototype, "observe").mockImplementation(function (el: Element) {
    observed.push(el);
  });
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

describe("useVideoAutoplayInView — prefers-reduced-motion (PUB-14)", () => {
  it("sem preferência: observa para autoplay e mantém o vídeo sem controles", () => {
    const { getByTestId } = render(<Video />);
    const v = getByTestId("v") as HTMLVideoElement;
    expect(observed).toContain(v);
    expect(v.controls).toBe(false);
    expect(v.loop).toBe(true);
  });

  it("com reduce: não observa, pausa, mostra controles e tira o loop", () => {
    reduce = true;
    const { getByTestId } = render(<Video />);
    const v = getByTestId("v") as HTMLVideoElement;
    expect(observed).not.toContain(v);
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(v.controls).toBe(true);
    expect(v.loop).toBe(false);
  });

  it("acompanha a mudança da preferência sem recarregar", () => {
    const { getByTestId } = render(<Video />);
    const v = getByTestId("v") as HTMLVideoElement;
    reduce = true;
    act(() => listeners.forEach((l) => l()));
    expect(v.controls).toBe(true);
    reduce = false;
    act(() => listeners.forEach((l) => l()));
    expect(v.controls).toBe(false);
    expect(v.loop).toBe(true);
  });
});
