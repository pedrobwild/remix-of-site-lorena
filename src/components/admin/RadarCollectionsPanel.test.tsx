import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import RadarCollectionsPanel from "./RadarCollectionsPanel";

const read = vi.hoisted(() => vi.fn());
vi.mock("@/lib/assistant/radarColetas.functions", () => ({ getRadarColetas: read }));
const realtime = vi.hoisted(() => ({ callback: undefined as (() => void) | undefined, stop: vi.fn() }));
vi.mock("@/lib/assistant/radarRealtime", () => ({ subscribeRadarCollections: (callback: () => void) => { realtime.callback = callback; return realtime.stop; } }));
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
it("relê o bairro pelo aviso e preserva ativa/substituída da fonte", async () => {
  const observation = { coletado_em: "2026-10-13", periodo_inicio: "2026-01-01", periodo_fim: "2026-09-30", fonte_nome: "GuestFavorites", amostra_n: 2424, ativo: true };
  read.mockImplementation(async ({ data }: { data: { bairro?: string } }) => ({ bairros: ["Pinheiros"], bairro: data.bairro ?? null, coletas: data.bairro ? [observation] : [] }));
  const view = render(<RadarCollectionsPanel />);
  await waitFor(() => expect(screen.getByRole("combobox")).not.toBeDisabled());
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "Pinheiros" } });
  await screen.findByText(/13\/10\/2026/);
  read.mockResolvedValue({ bairros: ["Pinheiros"], bairro: "Pinheiros", coletas: [{ ...observation, coletado_em: "2026-10-17" }, { ...observation, ativo: false }] });
  act(() => realtime.callback?.());
  expect(await screen.findByText(/17\/10\/2026/)).toHaveTextContent("Status: ativa");
  expect(screen.getByText(/13\/10\/2026/)).toHaveTextContent("Status: substituída");
  view.unmount();
  expect(realtime.stop).toHaveBeenCalled();
});