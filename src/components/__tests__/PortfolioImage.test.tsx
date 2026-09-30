import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PortfolioImage from "@/components/PortfolioImage";

afterEach(cleanup);

describe("PortfolioImage", () => {
  it("recupera a imagem original quando uma derivada falha e reinicia ao trocar de foto", () => {
    const src = "https://example.supabase.co/storage/v1/object/public/project-images/a.jpg";
    const { rerender } = render(<PortfolioImage src={src} alt="Cozinha" />);
    const img = screen.getByAltText("Cozinha");
    expect(img.getAttribute("src")).toContain("/render/image/public/");
    fireEvent.error(img);
    expect(img.getAttribute("src")).toBe(src);
    expect(img).not.toHaveAttribute("srcset");
    rerender(<PortfolioImage src={src.replace("a.jpg", "b.jpg")} alt="Cozinha" />);
    expect(img.getAttribute("src")).toContain("/render/image/public/");
    expect(img).toHaveAttribute("srcset");
  });
});
