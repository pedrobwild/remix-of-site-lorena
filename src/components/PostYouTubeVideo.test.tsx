import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import PostYouTubeVideo from "./PostYouTubeVideo";

const props = { id: "El1Dxf7RBRk", title: "Como reformar um studio gastando menos: 4 obras que raramente se pagam", thumbnail: "https://i.ytimg.com/vi/El1Dxf7RBRk/hqdefault.jpg" };
describe("Vídeo de abertura", () => {
  it("SSR mostra miniatura e botão sem carregar iframe", () => {
    const html = renderToString(<PostYouTubeVideo {...props} />);
    expect(html).toContain(props.thumbnail);
    expect(html).not.toContain("<iframe");
  });
  it("só cria player sem cookies e autoplay depois do clique", () => {
    const { container } = render(<PostYouTubeVideo {...props} />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("img").getAttribute("alt")).toContain(props.title);
    fireEvent.click(screen.getByRole("button", { name: `Reproduzir vídeo: ${props.title}` }));
    expect(container.querySelector("iframe")).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/El1Dxf7RBRk?autoplay=1");
    expect(container.querySelector("iframe")).toHaveAttribute("title", props.title);
  });
});