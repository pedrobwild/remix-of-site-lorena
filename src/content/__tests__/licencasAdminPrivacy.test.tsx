import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LicencasAdminPage from "@/pages/admin/LicencasAdminPage";

const mocks = vi.hoisted(() => ({ update: vi.fn(), getUser: vi.fn() }));
vi.mock("@/components/admin/AdminLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    from: () => ({
      select: async () => ({ data: [{ slug: "cc-by-4-0", title: "Licença", intro: "Abertura", body: "Texto", updated_at: "2026-10-16T00:00:00Z" }], error: null }),
      update: mocks.update,
    }),
  },
}));

describe("privacidade da edição de licença", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockReturnValue({ eq: async () => ({ error: null }) });
  });

  it("salva apenas os textos, sem buscar ou registrar o e-mail do editor", async () => {
    render(<LicencasAdminPage />);
    await waitFor(() => expect(screen.getByLabelText("Título")).toHaveValue("Licença"));
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Licença revisada" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ title: "Licença revisada", intro: "Abertura", body: "Texto", citation_model: expect.any(String) }));
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("a página de citações salva a licença e o modelo no mesmo registro, sem e-mail", async () => {
    render(<LicencasAdminPage citations />);
    await waitFor(() => expect(screen.getByLabelText("Título")).toHaveValue("Licença"));
    fireEvent.change(screen.getByLabelText(/Texto da licença/), { target: { value: "Licença revisada" } });
    fireEvent.change(screen.getByLabelText(/Modelo de citação/), { target: { value: "Fonte: Bewild. Licença CC BY 4.0." } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ title: "Licença", intro: "Abertura", body: "Licença revisada", citation_model: "Fonte: Bewild. Licença CC BY 4.0." }));
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
});