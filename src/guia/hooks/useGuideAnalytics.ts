/**
 * Stub de analytics do guia.
 *
 * O app original gravava eventos no banco próprio. Aqui a página é
 * puramente editorial: mantemos a API para as seções portadas não
 * precisarem mudar, sem enviar nada.
 */

export type TrackFn = (event: string, data?: Record<string, unknown>) => void;

export function trackGlobal(_event: string, _data?: Record<string, unknown>): void {
  /* no-op */
}

export function setGlobalTrack(_fn: TrackFn | null): void {
  /* no-op */
}

export function setGlobalSessionId(_id: string | null): void {
  /* no-op */
}

const NOOP_TRACK: TrackFn = () => {};

export function useGuideAnalytics() {
  return { trackEvent: NOOP_TRACK, sessionId: "" };
}
