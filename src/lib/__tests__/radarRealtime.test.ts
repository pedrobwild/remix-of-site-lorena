import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn(), remove: vi.fn(), callbacks: [] as Array<() => void>, subscribed: undefined as undefined | ((status: string) => void) }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.create }));
import { subscribeRadarCollections } from "@/lib/assistant/radarRealtime";
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); mocks.callbacks = []; });
it("compartilha os avisos INSERT/UPDATE, agrupa a coleta e encerra ao fechar todos os históricos", () => {
  vi.useFakeTimers();
  const channel = {
    on: vi.fn((_kind, _filter, callback) => { mocks.callbacks.push(callback); return channel; }),
    subscribe: vi.fn((callback) => { mocks.subscribed = callback; return channel; }),
  };
  mocks.create.mockReturnValue({ channel: vi.fn(() => channel), removeChannel: mocks.remove });
  const first = vi.fn(); const second = vi.fn();
  const stopFirst = subscribeRadarCollections(first); const stopSecond = subscribeRadarCollections(second);
  expect(mocks.create).toHaveBeenCalledTimes(1);
  expect(channel.on.mock.calls.map((call) => call[1])).toEqual([
    { event: "INSERT", schema: "public", table: "radar_observacoes", filter: "cidade=eq.São Paulo" },
    { event: "UPDATE", schema: "public", table: "radar_observacoes", filter: "cidade=eq.São Paulo" },
  ]);
  mocks.callbacks.forEach((callback) => callback());
  vi.advanceTimersByTime(299); expect(first).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1); expect(first).toHaveBeenCalledTimes(1); expect(second).toHaveBeenCalledTimes(1);
  mocks.subscribed?.("SUBSCRIBED"); vi.advanceTimersByTime(300);
  expect(first).toHaveBeenCalledTimes(2);
  stopFirst(); expect(mocks.remove).not.toHaveBeenCalled();
  mocks.callbacks[0]?.(); stopSecond(); vi.advanceTimersByTime(300);
  expect(second).toHaveBeenCalledTimes(2);
  expect(mocks.remove).toHaveBeenCalledWith(channel);
});
it("relê durante falha de conexão e ao voltar online, mas encerra tudo no unmount", () => {
  vi.useFakeTimers();
  const channel = { on: vi.fn(() => channel), subscribe: vi.fn((callback) => { mocks.subscribed = callback; return channel; }) };
  mocks.create.mockReturnValue({ channel: vi.fn(() => channel), removeChannel: mocks.remove });
  const listener = vi.fn();
  const stop = subscribeRadarCollections(listener);
  mocks.subscribed?.("CHANNEL_ERROR");
  vi.advanceTimersByTime(30_300);
  expect(listener).toHaveBeenCalledTimes(1);
  mocks.subscribed?.("SUBSCRIBED");
  vi.advanceTimersByTime(300);
  expect(listener).toHaveBeenCalledTimes(2);
  vi.advanceTimersByTime(30_000);
  expect(listener).toHaveBeenCalledTimes(2);
  window.dispatchEvent(new Event("online"));
  vi.advanceTimersByTime(300);
  expect(listener).toHaveBeenCalledTimes(3);
  stop();
  mocks.subscribed?.("SUBSCRIBED");
  window.dispatchEvent(new Event("online"));
  vi.advanceTimersByTime(60_000);
  expect(listener).toHaveBeenCalledTimes(3);
});