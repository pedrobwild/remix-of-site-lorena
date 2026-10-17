import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import RadarCollectionsPanel from "./RadarCollectionsPanel";

const read = vi.hoisted(() => vi.fn());
vi.mock("@/lib/assistant/radarColetas.functions", () => ({ getRadarColetas: read }));
vi.mock("@/hooks/useRadarCollectionsUpdates", () => ({ useRadarCollectionsUpdates: () => 0 }));
beforeEach(() => { read.mockReset(); });
it("requests the selected neighborhood again on manual refresh without writing to the Radar", async () => {
  read.mockImplementation(async ({ data }: { data: { bairro?: string } }) => ({ bairros: ["Pinheiros"], bairro: data.bairro ?? null, coletas: [] }));
  render(<RadarCollectionsPanel />);
  await waitFor(() => expect(screen.getByRole("combobox")).not.toBeDisabled());
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "Pinheiros" } });
  await waitFor(() => expect(read).toHaveBeenCalledWith({ data: { bairro: "Pinheiros" } }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Atualizar do Radar" })).not.toBeDisabled());
  const count = read.mock.calls.length;
  fireEvent.click(screen.getByRole("button", { name: "Atualizar do Radar" }));
  await waitFor(() => expect(read).toHaveBeenCalledTimes(count + 1));
  expect(read.mock.calls.at(-1)).toEqual([{ data: { bairro: "Pinheiros" } }]);
});