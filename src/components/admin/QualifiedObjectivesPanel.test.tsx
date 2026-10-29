import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import QualifiedObjectivesPanel from "./QualifiedObjectivesPanel";

vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("./GoogleAdsDeliveryStatus", () => ({ default: () => null }));
vi.mock("@/lib/qualifiedObjectives.functions", () => ({ getQualifiedObjectives: vi.fn(async ({ data }: { data: { from: string } }) => ({ groups: [{ objective: "Short stay", count: 3 }], total: data.from === "2026-10-01" ? 3 : 1, exportCount: 1, csv: "Conversion Name\r\nLead qualificado investidor" })) }));

describe("período do painel de qualificados", () => {
  it("consulta novamente quando o período de criação muda", async () => {
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><QualifiedObjectivesPanel /></QueryClientProvider>);
    fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-10-01" } });
    fireEvent.change(screen.getByLabelText("Até"), { target: { value: "2026-10-29" } });
    expect(await screen.findByText("3", { selector: "dd" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-10-20" } });
    expect(await screen.findAllByText("1", { selector: "dd" })).toHaveLength(2);
  });
});